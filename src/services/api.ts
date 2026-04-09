import { Note, ReadingRecord, SpreadType, UserSettings } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export function getClientUserId(): string {
  const key = 'taluo:user_id';
  const existing = localStorage.getItem(key);
  if (existing) return existing;

  const id = crypto.randomUUID();
  localStorage.setItem(key, id);
  return id;
}

async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

type ServerSettings = Partial<UserSettings> & {
  user_id?: string;
  reverse_enabled?: boolean | number;
  default_spread?: SpreadType;
  interpretation_style?: 'brief' | 'detailed';
  theme_style?: 'dark' | 'fresh';
};

function normalizeSettings(raw: ServerSettings, fallbackUserId = ''): UserSettings {
  const defaultSpread: SpreadType =
    raw.defaultSpread === 'single' || raw.defaultSpread === 'trinity' || raw.defaultSpread === 'celtic'
      ? raw.defaultSpread
      : raw.default_spread === 'single' || raw.default_spread === 'trinity' || raw.default_spread === 'celtic'
        ? raw.default_spread
        : 'trinity';

  const interpretationStyle: 'brief' | 'detailed' =
    raw.interpretationStyle === 'brief' || raw.interpretationStyle === 'detailed'
      ? raw.interpretationStyle
      : raw.interpretation_style === 'brief' || raw.interpretation_style === 'detailed'
        ? raw.interpretation_style
        : 'detailed';

  const themeStyle: 'dark' | 'fresh' =
    raw.themeStyle === 'dark' || raw.themeStyle === 'fresh'
      ? raw.themeStyle
      : raw.theme_style === 'dark' || raw.theme_style === 'fresh'
        ? raw.theme_style
        : 'dark';

  return {
    userId: raw.userId || raw.user_id || fallbackUserId,
    reverseEnabled:
      typeof raw.reverseEnabled === 'boolean'
        ? raw.reverseEnabled
        : typeof raw.reverse_enabled === 'number'
          ? raw.reverse_enabled === 1
          : typeof raw.reverse_enabled === 'boolean'
            ? raw.reverse_enabled
            : true,
    defaultSpread,
    interpretationStyle,
    themeStyle,
  };
}

export interface SessionStartResponse {
  sessionId: string;
}

export interface SelectCardResponse {
  cardId: string;
  position: string;
  isReversed: boolean;
  selectedCount: number;
  totalCount: number;
  complete: boolean;
}

export async function fetchSettings(userId: string): Promise<UserSettings> {
  const res = await fetch(`${API_BASE}/settings?userId=${encodeURIComponent(userId)}`);
  const raw = await parseResponse<ServerSettings>(res);
  return normalizeSettings(raw, userId);
}

export async function saveSettings(settings: UserSettings): Promise<UserSettings> {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  const raw = await parseResponse<ServerSettings>(res);
  return normalizeSettings(raw, settings.userId);
}

export async function startSession(params: {
  userId: string;
  question: string;
  spreadType: SpreadType;
}): Promise<SessionStartResponse> {
  const res = await fetch(`${API_BASE}/sessions/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return parseResponse(res);
}

export async function shuffleSession(params: { userId: string; sessionId: string }): Promise<void> {
  const res = await fetch(`${API_BASE}/sessions/${params.sessionId}/shuffle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: params.userId }),
  });
  await parseResponse<{ ok: true }>(res);
}

export async function selectCard(params: { userId: string; sessionId: string; deckIndex?: number }): Promise<SelectCardResponse> {
  const res = await fetch(`${API_BASE}/sessions/${params.sessionId}/select`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: params.userId, deckIndex: params.deckIndex }),
  });
  return parseResponse(res);
}

export async function streamReveal(params: {
  userId: string;
  sessionId: string;
  onChunk: (chunk: string) => void;
  onDone: (record: ReadingRecord) => void;
}): Promise<void> {
  const url = `${API_BASE}/sessions/${params.sessionId}/reveal-stream?userId=${encodeURIComponent(params.userId)}`;
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error('解读流式请求失败');

  const decoder = new TextDecoder();
  const reader = res.body.getReader();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';

    for (const event of events) {
      const lines = event.split('\n');
      const eventType = lines.find((line) => line.startsWith('event:'))?.slice(6).trim();
      const data = lines.find((line) => line.startsWith('data:'))?.slice(5).trim() ?? '';

      if (eventType === 'chunk') params.onChunk(data);
      if (eventType === 'done') params.onDone(JSON.parse(data) as ReadingRecord);
      if (eventType === 'error') throw new Error(data || 'AI解读失败');
    }
  }
}

export async function fetchHistory(userId: string): Promise<ReadingRecord[]> {
  const res = await fetch(`${API_BASE}/history?userId=${encodeURIComponent(userId)}`);
  return parseResponse(res);
}

export async function clearHistory(userId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/history?userId=${encodeURIComponent(userId)}`, { method: 'DELETE' });
  await parseResponse<{ ok: true }>(res);
}

export async function saveNote(note: Omit<Note, 'id' | 'date'>): Promise<Note> {
  const res = await fetch(`${API_BASE}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note),
  });
  return parseResponse(res);
}

export async function fetchNotes(userId: string): Promise<Note[]> {
  const res = await fetch(`${API_BASE}/notes?userId=${encodeURIComponent(userId)}`);
  return parseResponse(res);
}
