import 'dotenv/config';
import express from 'express';
import { randomUUID } from 'crypto';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { query } from './db';
import { connectRedis, redis } from './redis';
import { ensureSchema } from './schema';
import { env } from './env';
import { SpreadType, UserSettings } from '../src/types';
import { TAROT_CARD_IDS, TAROT_CARD_MAP } from '../src/data/tarotCatalog';
import { spreadSlotNames } from '../src/config/spreads';
import { createSeededRandom, fisherYates } from './random';
import { generateInterpretationStream } from './ai';

type SessionDraft = {
  sessionId: string;
  userId: string;
  state: 'STATE_INTENT' | 'STATE_SHUFFLE' | 'STATE_SELECT' | 'STATE_REVEAL';
  question: string;
  spreadType: SpreadType;
  deck: string[];
  selected: Array<{ cardId: string; position: string; isReversed: boolean }>;
  reversals: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
  lastSelectionAt?: number;
};

type SettingsRow = RowDataPacket & {
  user_id: string;
  reverse_enabled: number | boolean;
  default_spread: SpreadType;
  interpretation_style: 'brief' | 'detailed';
  theme_style: 'dark' | 'fresh' | null;
};

type RecordRow = RowDataPacket & {
  id: string;
  user_id: string;
  question: string;
  spread_type: SpreadType;
  cards_json: unknown;
  interpretation_text: string;
  created_at: Date | string;
};

type NoteRow = RowDataPacket & {
  id: string;
  user_id: string;
  reading_id: string | null;
  title: string;
  content: string;
  tags_json: unknown;
  created_at: Date | string;
};

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});

function parseJsonValue<T>(value: unknown, fallback: T): T {
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

function toBoolean(v: number | boolean): boolean {
  return typeof v === 'boolean' ? v : v === 1;
}

function sessionKey(userId: string, sessionId: string): string {
  return `session:${userId}:${sessionId}`;
}

function userDraftsKey(userId: string): string {
  return `drafts:${userId}`;
}

async function getOrCreateSettings(userId: string): Promise<UserSettings> {
  const rows = await query<SettingsRow[]>(
    `SELECT user_id, reverse_enabled, default_spread, interpretation_style, theme_style
     FROM user_settings
     WHERE user_id = ?`,
    [userId],
  );

  if (rows[0]) {
    return {
      userId: rows[0].user_id,
      reverseEnabled: toBoolean(rows[0].reverse_enabled),
      defaultSpread: rows[0].default_spread,
      interpretationStyle: rows[0].interpretation_style,
      themeStyle: rows[0].theme_style || 'dark',
    };
  }

  await query<ResultSetHeader>(
    `INSERT INTO user_settings(user_id, reverse_enabled, default_spread, interpretation_style, theme_style)
     VALUES (?, TRUE, 'trinity', 'detailed', 'dark')`,
    [userId],
  );

  return {
    userId,
    reverseEnabled: true,
    defaultSpread: 'trinity',
    interpretationStyle: 'detailed',
    themeStyle: 'dark',
  };
}

async function saveSession(session: SessionDraft, ttlSec: number): Promise<void> {
  await redis.set(sessionKey(session.userId, session.sessionId), JSON.stringify(session), { EX: ttlSec });
}

async function loadSession(userId: string, sessionId: string): Promise<SessionDraft> {
  const raw = await redis.get(sessionKey(userId, sessionId));
  if (!raw) throw new Error('会话不存在或已过期');
  const parsed = JSON.parse(String(raw)) as SessionDraft;
  parsed.updatedAt = new Date().toISOString();
  await saveSession(parsed, 2 * 60 * 60);
  return parsed;
}

async function enforceDraftLimit(userId: string): Promise<void> {
  const key = userDraftsKey(userId);
  while (Number(await redis.zCard(key)) > 5) {
    const oldest = await redis.zRange(key, 0, 0);
    if (!oldest[0]) break;
    const removeSessionId = String(oldest[0]);
    await redis.zRem(key, removeSessionId);
    await redis.del(sessionKey(userId, removeSessionId));
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/settings', async (req, res) => {
  try {
    const userId = String(req.query.userId || '');
    if (!userId) return res.status(400).send('Missing userId');
    const settings = await getOrCreateSettings(userId);
    return res.json(settings);
  } catch (e) {
    return res.status(500).send((e as Error).message);
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const body = req.body as UserSettings;
    if (!body?.userId) return res.status(400).send('Missing userId');

    await query<ResultSetHeader>(
      `INSERT INTO user_settings(user_id, reverse_enabled, default_spread, interpretation_style, theme_style)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         reverse_enabled = VALUES(reverse_enabled),
         default_spread = VALUES(default_spread),
         interpretation_style = VALUES(interpretation_style),
         theme_style = VALUES(theme_style),
         updated_at = CURRENT_TIMESTAMP`,
      [body.userId, body.reverseEnabled, body.defaultSpread, body.interpretationStyle, body.themeStyle || 'dark'],
    );

    const settings = await getOrCreateSettings(body.userId);
    return res.json(settings);
  } catch (e) {
    return res.status(500).send((e as Error).message);
  }
});

app.get('/api/history', async (req, res) => {
  try {
    const userId = String(req.query.userId || '');
    if (!userId) return res.status(400).send('Missing userId');
    const rows = await query<RecordRow[]>(
      `SELECT id, user_id, question, spread_type, cards_json, interpretation_text, created_at
       FROM tarot_records
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 30`,
      [userId],
    );

    return res.json(
      rows.map((r) => ({
        id: r.id,
        userId: r.user_id,
        question: r.question,
        spreadType: r.spread_type,
        cards: parseJsonValue(r.cards_json, []),
        interpretationText: r.interpretation_text,
        createdAt: new Date(r.created_at).toISOString(),
      })),
    );
  } catch (e) {
    return res.status(500).send((e as Error).message);
  }
});

app.delete('/api/history', async (req, res) => {
  try {
    const userId = String(req.query.userId || '');
    if (!userId) return res.status(400).send('Missing userId');
    await query<ResultSetHeader>(`DELETE FROM tarot_records WHERE user_id = ?`, [userId]);
    await query<ResultSetHeader>(`DELETE FROM tarot_notes WHERE user_id = ?`, [userId]);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).send((e as Error).message);
  }
});

app.get('/api/notes', async (req, res) => {
  try {
    const userId = String(req.query.userId || '');
    if (!userId) return res.status(400).send('Missing userId');
    const rows = await query<NoteRow[]>(
      `SELECT id, user_id, reading_id, title, content, tags_json, created_at
       FROM tarot_notes
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId],
    );

    return res.json(
      rows.map((r) => ({
        id: r.id,
        userId: r.user_id,
        readingId: r.reading_id || undefined,
        title: r.title,
        content: r.content,
        tags: parseJsonValue<string[]>(r.tags_json, []),
        date: new Date(r.created_at).toISOString(),
      })),
    );
  } catch (e) {
    return res.status(500).send((e as Error).message);
  }
});

app.post('/api/notes', async (req, res) => {
  try {
    const body = req.body as { userId: string; readingId?: string; title: string; content: string; tags?: string[] };
    if (!body?.userId) return res.status(400).send('Missing userId');
    if (!body.title?.trim() || !body.content?.trim()) {
      return res.status(400).send('标题和内容不能为空');
    }
    const noteId = randomUUID();
    await query<ResultSetHeader>(
      `INSERT INTO tarot_notes(id, user_id, reading_id, title, content, tags_json)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [noteId, body.userId, body.readingId || null, body.title.trim(), body.content.trim(), JSON.stringify(body.tags || [])],
    );
    return res.json({
      id: noteId,
      userId: body.userId,
      readingId: body.readingId,
      title: body.title.trim(),
      content: body.content.trim(),
      tags: body.tags || [],
      date: new Date().toISOString(),
    });
  } catch (e) {
    return res.status(500).send((e as Error).message);
  }
});

app.post('/api/sessions/start', async (req, res) => {
  try {
    const body = req.body as { userId: string; question: string; spreadType: SpreadType };
    if (!body?.userId) return res.status(400).send('Missing userId');
    if (!body?.spreadType) return res.status(400).send('Missing spreadType');

    const sessionId = randomUUID();
    const session: SessionDraft = {
      sessionId,
      userId: body.userId,
      state: 'STATE_INTENT',
      question: body.question.trim(),
      spreadType: body.spreadType,
      deck: [],
      selected: [],
      reversals: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveSession(session, 24 * 60 * 60);
    await redis.zAdd(userDraftsKey(body.userId), [{ score: Date.now(), value: sessionId }]);
    await enforceDraftLimit(body.userId);
    return res.json({ sessionId });
  } catch (e) {
    return res.status(400).send((e as Error).message);
  }
});

app.post('/api/sessions/:sessionId/shuffle', async (req, res) => {
  try {
    const userId = String(req.body.userId || '');
    const sessionId = String(req.params.sessionId || '');
    if (!userId || !sessionId) return res.status(400).send('Missing userId/sessionId');

    const settings = await getOrCreateSettings(userId);
    const session = await loadSession(userId, sessionId);
    const seededRandom = createSeededRandom(Date.now());
    const deck = fisherYates(TAROT_CARD_IDS, seededRandom);
    const reversals: Record<string, boolean> = {};

    for (const cardId of deck) {
      reversals[cardId] = settings.reverseEnabled ? seededRandom() >= 0.5 : false;
    }

    session.deck = deck;
    session.reversals = reversals;
    session.state = 'STATE_SELECT';
    await saveSession(session, 2 * 60 * 60);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(400).send((e as Error).message);
  }
});

app.post('/api/sessions/:sessionId/select', async (req, res) => {
  try {
    const userId = String(req.body.userId || '');
    const sessionId = String(req.params.sessionId || '');
    if (!userId || !sessionId) return res.status(400).send('Missing userId/sessionId');

    const session = await loadSession(userId, sessionId);
    if (session.state !== 'STATE_SELECT') return res.status(400).send('当前状态不可选牌');

    const now = Date.now();
    if (session.lastSelectionAt && now - session.lastSelectionAt < 300) {
      return res.status(429).send('操作过快，请稍后再试');
    }
    session.lastSelectionAt = now;

    const slots = spreadSlotNames(session.spreadType);
    if (session.selected.length >= slots.length) return res.status(400).send('当前牌阵已选满');

    const rawDeckIndex = Number(req.body.deckIndex);
    const requestedDeckIndex = Number.isInteger(rawDeckIndex) ? rawDeckIndex : 0;
    const deckIndex = Math.max(0, Math.min(requestedDeckIndex, session.deck.length - 1));
    const [nextCardId] = session.deck.splice(deckIndex, 1);
    if (!nextCardId) return res.status(500).send('牌堆异常');
    if (session.selected.some((card) => card.cardId === nextCardId)) {
      return res.status(500).send('选牌重复，状态异常');
    }

    const picked = {
      cardId: nextCardId,
      position: slots[session.selected.length],
      isReversed: Boolean(session.reversals[nextCardId]),
    };
    session.selected.push(picked);
    await saveSession(session, 2 * 60 * 60);

    return res.json({
      ...picked,
      selectedCount: session.selected.length,
      totalCount: slots.length,
      complete: session.selected.length === slots.length,
    });
  } catch (e) {
    return res.status(400).send((e as Error).message);
  }
});

app.get('/api/sessions/:sessionId/reveal-stream', async (req, res) => {
  const userId = String(req.query.userId || '');
  const sessionId = String(req.params.sessionId || '');
  if (!userId || !sessionId) return res.status(400).send('Missing userId/sessionId');

  try {
    const session = await loadSession(userId, sessionId);
    const settings = await getOrCreateSettings(userId);
    const slots = spreadSlotNames(session.spreadType);
    if (session.selected.length !== slots.length) {
      return res.status(400).send('当前牌阵未选满，无法解读');
    }
    session.state = 'STATE_REVEAL';
    await saveSession(session, 2 * 60 * 60);

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    const aiCards = session.selected.map((picked) => ({
      position: picked.position,
      cardName: TAROT_CARD_MAP.get(picked.cardId)?.name || picked.cardId,
      isReversed: picked.isReversed,
    }));

    let interpretation = '';

    try {
      const stream = generateInterpretationStream({
        siliconflowApiKey: env.siliconflowApiKey,
        siliconflowModel: env.siliconflowModel,
        fallbackOpenAiApiKey: env.fallbackOpenAiApiKey || undefined,
        fallbackOpenAiModel: env.fallbackOpenAiModel || undefined,
        question: session.question,
        spreadType: session.spreadType,
        cards: aiCards,
        style: settings.interpretationStyle,
      });

      for await (const chunk of stream) {
        interpretation += chunk;
        res.write(`event: chunk\ndata: ${chunk.replace(/\n/g, '\\n')}\n\n`);
      }
    } catch {
      if (!interpretation.trim()) {
        interpretation = '星辰暂时被云层遮蔽。请稍后重试，或切换更简短的问题重新占卜。';
      }
      res.write(`event: chunk\ndata: ${interpretation.replace(/\n/g, '\\n')}\n\n`);
    }

    const readingId = randomUUID();
    await query<ResultSetHeader>(
      `INSERT INTO tarot_records(id, user_id, question, spread_type, cards_json, interpretation_text)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [readingId, userId, session.question, session.spreadType, JSON.stringify(session.selected), interpretation],
    );

    // 保留最近 30 条
    await query<ResultSetHeader>(
      `DELETE FROM tarot_records
       WHERE id IN (
         SELECT id FROM (
           SELECT id
           FROM tarot_records
           WHERE user_id = ?
           ORDER BY created_at DESC
           LIMIT 18446744073709551615 OFFSET 30
         ) AS to_delete
       )`,
      [userId],
    );

    await redis.del(sessionKey(userId, sessionId));
    await redis.zRem(userDraftsKey(userId), sessionId);

    const record = {
      id: readingId,
      userId,
      question: session.question,
      spreadType: session.spreadType,
      cards: session.selected,
      interpretationText: interpretation,
      createdAt: new Date().toISOString(),
    };

    res.write(`event: done\ndata: ${JSON.stringify(record)}\n\n`);
    res.end();
    return;
  } catch (e) {
    res.write(`event: error\ndata: ${(e as Error).message}\n\n`);
    res.end();
    return;
  }
});

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
