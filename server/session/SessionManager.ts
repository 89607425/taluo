import { randomUUID } from 'crypto';
import { redis } from '../redis';

export type SessionState = 'STATE_INTENT' | 'STATE_INTERACT' | 'STATE_REVEAL';

export interface DivinationSession {
  sessionId: string;
  userId: string;
  type: 'liuyao' | 'tarot';
  state: SessionState;
  question: string;
  inputParams: Record<string, unknown>;
  castResult?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

const memoryStore = new Map<string, { expiresAt: number; session: DivinationSession }>();

function key(userId: string, sessionId: string): string {
  return `session:${userId}:${sessionId}`;
}

function now() {
  return Date.now();
}

export class SessionManager {
  constructor(private ttlSeconds = 24 * 60 * 60) {}

  async create(input: Omit<DivinationSession, 'sessionId' | 'createdAt' | 'updatedAt'>): Promise<DivinationSession> {
    const session: DivinationSession = {
      ...input,
      sessionId: randomUUID(),
      createdAt: now(),
      updatedAt: now(),
    };

    await this.set(session, this.ttlSeconds);
    return session;
  }

  async get(userId: string, sessionId: string): Promise<DivinationSession> {
    if (redis?.isOpen) {
      const raw = await redis.get(key(userId, sessionId));
      if (!raw) throw new Error('会话不存在或已过期');
      return JSON.parse(String(raw)) as DivinationSession;
    }

    const item = memoryStore.get(key(userId, sessionId));
    if (!item || item.expiresAt < now()) {
      memoryStore.delete(key(userId, sessionId));
      throw new Error('会话不存在或已过期');
    }
    return item.session;
  }

  async set(session: DivinationSession, ttlSeconds = this.ttlSeconds): Promise<void> {
    const next = { ...session, updatedAt: now() };
    if (redis?.isOpen) {
      await redis.set(key(session.userId, session.sessionId), JSON.stringify(next), { EX: ttlSeconds });
      return;
    }

    memoryStore.set(key(session.userId, session.sessionId), {
      expiresAt: now() + ttlSeconds * 1000,
      session: next,
    });
  }

  async patch(userId: string, sessionId: string, patch: Partial<DivinationSession>, ttlSeconds = this.ttlSeconds): Promise<DivinationSession> {
    const current = await this.get(userId, sessionId);
    const next = { ...current, ...patch, updatedAt: now() };
    await this.set(next, ttlSeconds);
    return next;
  }

  async delete(userId: string, sessionId: string): Promise<void> {
    if (redis?.isOpen) {
      await redis.del(key(userId, sessionId));
      return;
    }
    memoryStore.delete(key(userId, sessionId));
  }
}
