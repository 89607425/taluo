import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID, scryptSync, timingSafeEqual } from 'crypto';
import jwt from 'jsonwebtoken';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { connectRedis } from './redis';
import { ensureSchema } from './schema';
import { env } from './env';
import { query } from './db';
import { createProvider } from './providers/DivinationProviderFactory';
import { SessionManager } from './session/SessionManager';
import { spreadSlotNames } from '../src/config/spreads';
import { TAROT_CARD_IDS } from '../src/data/tarotCatalog';
import { createSeededRandom, fisherYates } from './random';
import { AIService } from './services/AIService';

type HistoryRow = RowDataPacket & {
  id: string;
  user_id: string;
  type: 'liuyao' | 'tarot';
  question: string;
  input_params: unknown;
  raw_data: unknown;
  interpretation: string | null;
  is_starred: number | boolean;
  created_at: string | Date;
};

type UserRow = RowDataPacket & {
  id: string;
  email: string;
  password_hash: string;
  nickname: string;
};

type TarotSettingsRow = RowDataPacket & {
  user_id: string;
  reverse_enabled: number | boolean;
};

const app = express();
const sessions = new SessionManager(24 * 60 * 60);
const aiService = new AIService();

app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,PATCH,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');
const indexHtmlPath = path.join(distDir, 'index.html');

type AuthRequest = Request & { user?: { id: string; email: string } };

function parseJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

function sendSSEChunk(res: Response, chunk: string) {
  res.write(`event: chunk\ndata: ${chunk.replace(/\n/g, '\\n')}\n\n`);
}

function hashPassword(password: string): string {
  const salt = randomUUID();
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hashHex] = stored.split(':');
  if (!salt || !hashHex) return false;
  const calc = scryptSync(password, salt, 64);
  const given = Buffer.from(hashHex, 'hex');
  if (given.length !== calc.length) return false;
  return timingSafeEqual(calc, given);
}

function createToken(payload: { id: string; email: string }): string {
  return jwt.sign({ sub: payload.id, email: payload.email }, env.jwtSecret, { expiresIn: '7d' });
}

function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = String(req.headers.authorization || '');
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return res.status(401).send('Unauthorized');

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as { sub: string; email: string };
    req.user = { id: decoded.sub, email: decoded.email };
    return next();
  } catch {
    return res.status(401).send('Unauthorized');
  }
}

async function getTarotSettings(userId: string): Promise<{ reverseEnabled: boolean }> {
  const rows = await query<TarotSettingsRow[]>(
    `SELECT user_id, reverse_enabled FROM user_settings WHERE user_id = ? LIMIT 1`,
    [userId],
  );

  if (!rows[0]) {
    await query<ResultSetHeader>(
      `INSERT INTO user_settings(user_id, reverse_enabled) VALUES (?, 1)
       ON DUPLICATE KEY UPDATE reverse_enabled = reverse_enabled`,
      [userId],
    );
    return { reverseEnabled: true };
  }

  return {
    reverseEnabled: typeof rows[0].reverse_enabled === 'boolean' ? rows[0].reverse_enabled : rows[0].reverse_enabled === 1,
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const body = req.body as { email: string; password: string; nickname?: string };
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const nickname = String(body.nickname || '').trim() || `用户${Math.floor(Math.random() * 9000 + 1000)}`;

    if (!email || !email.includes('@')) return res.status(400).send('邮箱格式不正确');
    if (password.length < 6) return res.status(400).send('密码至少 6 位');

    const existed = await query<UserRow[]>(`SELECT id, email, password_hash, nickname FROM users WHERE email = ? LIMIT 1`, [email]);
    if (existed[0]) return res.status(409).send('邮箱已注册');

    const userId = randomUUID();
    await query<ResultSetHeader>(
      `INSERT INTO users(id, email, password_hash, nickname) VALUES (?, ?, ?, ?)`,
      [userId, email, hashPassword(password), nickname],
    );

    await query<ResultSetHeader>(
      `INSERT INTO user_settings(user_id, reverse_enabled) VALUES (?, 1)
       ON DUPLICATE KEY UPDATE reverse_enabled = reverse_enabled`,
      [userId],
    );

    const token = createToken({ id: userId, email });
    return res.json({
      token,
      user: { id: userId, email, nickname },
    });
  } catch (e) {
    return res.status(500).send((e as Error).message);
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const body = req.body as { email: string; password: string };
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    const rows = await query<UserRow[]>(
      `SELECT id, email, password_hash, nickname FROM users WHERE email = ? LIMIT 1`,
      [email],
    );
    const user = rows[0];
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).send('邮箱或密码错误');
    }

    const token = createToken({ id: user.id, email: user.email });
    return res.json({
      token,
      user: { id: user.id, email: user.email, nickname: user.nickname },
    });
  } catch (e) {
    return res.status(500).send((e as Error).message);
  }
});

app.get('/api/auth/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const rows = await query<UserRow[]>(
      `SELECT id, email, password_hash, nickname FROM users WHERE id = ? LIMIT 1`,
      [userId],
    );

    if (!rows[0]) return res.status(404).send('User not found');
    return res.json({
      user: {
        id: rows[0].id,
        email: rows[0].email,
        nickname: rows[0].nickname,
      },
    });
  } catch (e) {
    return res.status(500).send((e as Error).message);
  }
});

app.get('/api/settings/tarot', requireAuth, async (req: AuthRequest, res) => {
  try {
    const settings = await getTarotSettings(req.user!.id);
    return res.json(settings);
  } catch (e) {
    return res.status(500).send((e as Error).message);
  }
});

app.post('/api/settings/tarot', requireAuth, async (req: AuthRequest, res) => {
  try {
    const body = req.body as { reverseEnabled: boolean };
    await query<ResultSetHeader>(
      `INSERT INTO user_settings(user_id, reverse_enabled) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE reverse_enabled = VALUES(reverse_enabled)`,
      [req.user!.id, body.reverseEnabled ? 1 : 0],
    );

    return res.json({ reverseEnabled: Boolean(body.reverseEnabled) });
  } catch (e) {
    return res.status(500).send((e as Error).message);
  }
});

app.get('/api/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const rows = await query<Array<RowDataPacket & { type: 'liuyao' | 'tarot'; count: number }>>(
      `SELECT type, COUNT(*) as count
       FROM divination_records
       WHERE user_id = ?
       GROUP BY type`,
      [userId],
    );

    const liuyaoCount = Number(rows.find((r) => r.type === 'liuyao')?.count || 0);
    const tarotCount = Number(rows.find((r) => r.type === 'tarot')?.count || 0);
    return res.json({
      userId,
      liuyaoCount,
      tarotCount,
      totalCount: liuyaoCount + tarotCount,
    });
  } catch (e) {
    return res.status(500).send((e as Error).message);
  }
});

app.post('/api/liuyao/sessions/start', requireAuth, async (req: AuthRequest, res) => {
  try {
    const body = req.body as { question: string; category?: string };
    if (!body?.question?.trim()) return res.status(400).send('Missing question');
    if (body.question.trim().length > 100) return res.status(400).send('Question too long');

    const session = await sessions.create({
      userId: req.user!.id,
      type: 'liuyao',
      state: 'STATE_INTENT',
      question: body.question.trim(),
      inputParams: { category: body.category || '综合', method: 'manual' },
    });

    return res.json({ sessionId: session.sessionId });
  } catch (e) {
    return res.status(500).send((e as Error).message);
  }
});

app.post('/api/liuyao/sessions/:sessionId/cast', requireAuth, async (req: AuthRequest, res) => {
  try {
    const sessionId = String(req.params.sessionId || '');
    if (!sessionId) return res.status(400).send('Missing sessionId');

    const session = await sessions.get(req.user!.id, sessionId);
    if (session.type !== 'liuyao') return res.status(400).send('Session type mismatch');
    if (session.state !== 'STATE_INTENT') return res.status(400).send('Invalid session state');

    const provider = createProvider('liuyao');
    const lines = Array.isArray((req.body as { lines?: number[] })?.lines)
      ? ((req.body as { lines?: number[] }).lines as number[])
      : undefined;

    const castResult = await provider.cast({ lines });
    const next = await sessions.patch(req.user!.id, sessionId, {
      castResult,
      state: 'STATE_INTERACT',
    });

    return res.json({ castResult: next.castResult });
  } catch (e) {
    return res.status(400).send((e as Error).message);
  }
});

app.get('/api/liuyao/sessions/:sessionId/reveal-stream', requireAuth, async (req: AuthRequest, res) => {
  const sessionId = String(req.params.sessionId || '');
  if (!sessionId) return res.status(400).send('Missing sessionId');

  try {
    const session = await sessions.get(req.user!.id, sessionId);
    if (session.type !== 'liuyao') return res.status(400).send('Session type mismatch');
    if (!session.castResult) return res.status(400).send('No cast result');

    await sessions.patch(req.user!.id, sessionId, { state: 'STATE_REVEAL' });

    const provider = createProvider('liuyao');
    const prompt = provider.getPrompt({
      question: session.question,
      castResult: session.castResult,
      inputParams: session.inputParams,
    });
    const offline = provider.getOfflineInterpretation({
      question: session.question,
      castResult: session.castResult,
      inputParams: session.inputParams,
    });

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    let interpretation = '';
    try {
      for await (const chunk of aiService.generateStream(prompt)) {
        interpretation += chunk;
        sendSSEChunk(res, chunk);
      }
    } catch {
      interpretation = offline;
      sendSSEChunk(res, offline);
    }

    if (!interpretation.trim()) {
      interpretation = offline;
      sendSSEChunk(res, offline);
    }

    const recordId = randomUUID();
    await query<ResultSetHeader>(
      `INSERT INTO divination_records(id, user_id, type, question, input_params, raw_data, interpretation)
       VALUES (?, ?, 'liuyao', ?, ?, ?, ?)`,
      [recordId, req.user!.id, session.question, JSON.stringify(session.inputParams), JSON.stringify(session.castResult), interpretation],
    );

    await sessions.delete(req.user!.id, sessionId);

    const donePayload = {
      id: recordId,
      userId: req.user!.id,
      type: 'liuyao',
      question: session.question,
      inputParams: session.inputParams,
      rawData: session.castResult,
      interpretation,
      isStarred: false,
      createdAt: new Date().toISOString(),
    };

    res.write(`event: done\ndata: ${JSON.stringify(donePayload)}\n\n`);
    res.end();
  } catch (e) {
    res.write(`event: error\ndata: ${(e as Error).message}\n\n`);
    res.end();
  }
});

app.post('/api/tarot/sessions/start', requireAuth, async (req: AuthRequest, res) => {
  try {
    const body = req.body as { question: string; spreadType: 'single' | 'trinity' | 'celtic'; reverseEnabled?: boolean };
    if (!body?.question?.trim()) return res.status(400).send('Missing question');
    if (!body?.spreadType) return res.status(400).send('Missing spreadType');
    if (body.question.trim().length > 100) return res.status(400).send('Question too long');

    const settings = await getTarotSettings(req.user!.id);
    const session = await sessions.create({
      userId: req.user!.id,
      type: 'tarot',
      state: 'STATE_INTENT',
      question: body.question.trim(),
      inputParams: {
        spreadType: body.spreadType,
        reverseEnabled: typeof body.reverseEnabled === 'boolean' ? body.reverseEnabled : settings.reverseEnabled,
      },
    });

    return res.json({ sessionId: session.sessionId });
  } catch (e) {
    return res.status(500).send((e as Error).message);
  }
});

app.post('/api/tarot/sessions/:sessionId/shuffle', requireAuth, async (req: AuthRequest, res) => {
  try {
    const sessionId = String(req.params.sessionId || '');
    if (!sessionId) return res.status(400).send('Missing sessionId');

    const session = await sessions.get(req.user!.id, sessionId);
    if (session.type !== 'tarot') return res.status(400).send('Session type mismatch');

    const random = createSeededRandom(Date.now());
    const deck = fisherYates(TAROT_CARD_IDS, random);
    const reverseEnabled = Boolean(session.inputParams.reverseEnabled);
    const reversals: Record<string, boolean> = {};
    for (const cardId of deck) {
      reversals[cardId] = reverseEnabled ? random() > 0.5 : false;
    }

    const castResult = {
      spreadType: session.inputParams.spreadType,
      deck,
      reversals,
      selected: [] as Array<{ cardId: string; position: string; isReversed: boolean }>,
    };

    await sessions.patch(req.user!.id, sessionId, { state: 'STATE_INTERACT', castResult });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(400).send((e as Error).message);
  }
});

app.post('/api/tarot/sessions/:sessionId/select', requireAuth, async (req: AuthRequest, res) => {
  try {
    const sessionId = String(req.params.sessionId || '');
    if (!sessionId) return res.status(400).send('Missing sessionId');

    const session = await sessions.get(req.user!.id, sessionId);
    if (session.type !== 'tarot') return res.status(400).send('Session type mismatch');

    const castResult = session.castResult as {
      spreadType: 'single' | 'trinity' | 'celtic';
      deck: string[];
      reversals: Record<string, boolean>;
      selected: Array<{ cardId: string; position: string; isReversed: boolean }>;
    };
    if (!castResult) return res.status(400).send('No shuffled deck');

    const slots = spreadSlotNames(castResult.spreadType);
    if (castResult.selected.length >= slots.length) return res.status(400).send('Selection complete');

    const rawDeckIndex = Number((req.body as { deckIndex?: number })?.deckIndex);
    const requestedDeckIndex = Number.isInteger(rawDeckIndex) ? rawDeckIndex : 0;
    const deckIndex = Math.max(0, Math.min(requestedDeckIndex, castResult.deck.length - 1));

    const [cardId] = castResult.deck.splice(deckIndex, 1);
    if (!cardId) return res.status(400).send('Deck empty');

    const picked = {
      cardId,
      position: slots[castResult.selected.length],
      isReversed: Boolean(castResult.reversals[cardId]),
    };
    castResult.selected.push(picked);

    await sessions.patch(req.user!.id, sessionId, { castResult });

    return res.json({
      ...picked,
      selectedCount: castResult.selected.length,
      totalCount: slots.length,
      complete: castResult.selected.length === slots.length,
    });
  } catch (e) {
    return res.status(400).send((e as Error).message);
  }
});

app.get('/api/tarot/sessions/:sessionId/reveal-stream', requireAuth, async (req: AuthRequest, res) => {
  const sessionId = String(req.params.sessionId || '');
  if (!sessionId) return res.status(400).send('Missing sessionId');

  try {
    const session = await sessions.get(req.user!.id, sessionId);
    if (session.type !== 'tarot') return res.status(400).send('Session type mismatch');

    const castResult = session.castResult as {
      spreadType: 'single' | 'trinity' | 'celtic';
      selected: Array<{ cardId: string; position: string; isReversed: boolean }>;
    };

    const slots = spreadSlotNames(castResult.spreadType);
    if (castResult.selected.length !== slots.length) {
      return res.status(400).send('当前牌阵未选满，无法解读');
    }

    await sessions.patch(req.user!.id, sessionId, { state: 'STATE_REVEAL' });

    const provider = createProvider('tarot');
    const prompt = provider.getPrompt({
      question: session.question,
      castResult,
      inputParams: session.inputParams,
    });
    const offline = provider.getOfflineInterpretation({
      question: session.question,
      castResult,
      inputParams: session.inputParams,
    });

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    let interpretation = '';
    try {
      for await (const chunk of aiService.generateStream(prompt)) {
        interpretation += chunk;
        sendSSEChunk(res, chunk);
      }
    } catch {
      interpretation = offline;
      sendSSEChunk(res, offline);
    }

    if (!interpretation.trim()) {
      interpretation = offline;
      sendSSEChunk(res, offline);
    }

    const recordId = randomUUID();
    await query<ResultSetHeader>(
      `INSERT INTO divination_records(id, user_id, type, question, input_params, raw_data, interpretation)
       VALUES (?, ?, 'tarot', ?, ?, ?, ?)`,
      [recordId, req.user!.id, session.question, JSON.stringify(session.inputParams), JSON.stringify(castResult), interpretation],
    );

    await sessions.delete(req.user!.id, sessionId);

    const donePayload = {
      id: recordId,
      userId: req.user!.id,
      type: 'tarot',
      question: session.question,
      inputParams: session.inputParams,
      rawData: castResult,
      interpretation,
      isStarred: false,
      createdAt: new Date().toISOString(),
    };

    res.write(`event: done\ndata: ${JSON.stringify(donePayload)}\n\n`);
    res.end();
  } catch (e) {
    res.write(`event: error\ndata: ${(e as Error).message}\n\n`);
    res.end();
  }
});

app.get('/api/history', requireAuth, async (req: AuthRequest, res) => {
  try {
    const type = String(req.query.type || 'all');
    const keyword = String(req.query.q || '').trim();

    const where: string[] = ['user_id = ?'];
    const params: Array<string> = [req.user!.id];

    if (type === 'liuyao' || type === 'tarot') {
      where.push('type = ?');
      params.push(type);
    }

    if (keyword) {
      where.push('question LIKE ?');
      params.push(`%${keyword}%`);
    }

    const rows = await query<HistoryRow[]>(
      `SELECT id, user_id, type, question, input_params, raw_data, interpretation, is_starred, created_at
       FROM divination_records
       WHERE ${where.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT 100`,
      params,
    );

    return res.json(
      rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        type: row.type,
        question: row.question,
        inputParams: parseJson(row.input_params, {}),
        rawData: parseJson(row.raw_data, {}),
        interpretation: row.interpretation || '',
        isStarred: typeof row.is_starred === 'boolean' ? row.is_starred : row.is_starred === 1,
        createdAt: new Date(row.created_at).toISOString(),
      })),
    );
  } catch (e) {
    return res.status(500).send((e as Error).message);
  }
});

app.get('/api/history/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = String(req.params.id || '');
    if (!id) return res.status(400).send('Missing id');

    const rows = await query<HistoryRow[]>(
      `SELECT id, user_id, type, question, input_params, raw_data, interpretation, is_starred, created_at
       FROM divination_records
       WHERE id = ? AND user_id = ?
       LIMIT 1`,
      [id, req.user!.id],
    );

    if (!rows[0]) return res.status(404).send('Not found');

    const row = rows[0];
    return res.json({
      id: row.id,
      userId: row.user_id,
      type: row.type,
      question: row.question,
      inputParams: parseJson(row.input_params, {}),
      rawData: parseJson(row.raw_data, {}),
      interpretation: row.interpretation || '',
      isStarred: typeof row.is_starred === 'boolean' ? row.is_starred : row.is_starred === 1,
      createdAt: new Date(row.created_at).toISOString(),
    });
  } catch (e) {
    return res.status(500).send((e as Error).message);
  }
});

app.delete('/api/history/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = String(req.params.id || '');
    if (!id) return res.status(400).send('Missing id');

    await query<ResultSetHeader>(
      `DELETE FROM divination_records
       WHERE id = ? AND user_id = ?`,
      [id, req.user!.id],
    );

    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).send((e as Error).message);
  }
});

app.post('/api/divination/followup', requireAuth, async (req: AuthRequest, res) => {
  try {
    const body = req.body as { recordId: string; question: string };
    if (!body?.recordId || !body.question?.trim()) {
      return res.status(400).send('Missing recordId/question');
    }

    const rows = await query<HistoryRow[]>(
      `SELECT id, user_id, type, question, input_params, raw_data, interpretation, is_starred, created_at
       FROM divination_records
       WHERE id = ? AND user_id = ?
       LIMIT 1`,
      [body.recordId, req.user!.id],
    );

    if (!rows[0]) return res.status(404).send('Record not found');
    const row = rows[0];

    const followupPrompt = [
      `这是一次${row.type === 'liuyao' ? '六爻' : '塔罗'}历史记录。`,
      `原始问题：${row.question}`,
      `原始解读：${row.interpretation || ''}`,
      `用户追问：${body.question.trim()}`,
      '请用中文给出简洁且可执行的补充建议，控制在 6 句内。',
    ].join('\n');

    let text = '';
    for await (const chunk of aiService.generateStream(followupPrompt)) {
      text += chunk;
    }
    if (!text.trim()) {
      text = '建议回到原问题主线，优先做一件可执行的小动作，再观察反馈。';
    }

    return res.json({ text });
  } catch (e) {
    return res.status(500).send((e as Error).message);
  }
});

if (existsSync(indexHtmlPath)) {
  app.use(express.static(distDir));
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.sendFile(indexHtmlPath);
  });
} else {
  app.get('/', (_req, res) => {
    res.status(200).send('Chunfeng API is running. Frontend bundle not found (dist/index.html).');
  });
}

async function bootstrap() {
  await connectRedis();
  await ensureSchema();
  app.listen(env.port, () => {
    console.log(`API listening on :${env.port}`);
  });
}

bootstrap().catch((e) => {
  console.error(e);
  process.exit(1);
});
