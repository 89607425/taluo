import {
  AuthResponse,
  DivinationRecord,
  LiuyaoCastResult,
  ProfileStats,
  SpreadType,
  TarotSelection,
  TarotSettings,
  User,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const TOKEN_KEY = 'chunfeng:token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = getToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error((await res.text()) || `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function register(payload: { email: string; password: string; nickname: string }) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJson<AuthResponse>(res);
}

export async function login(payload: { email: string; password: string }) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJson<AuthResponse>(res);
}

export async function me() {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: authHeaders(),
  });
  return parseJson<{ user: User }>(res);
}

export async function fetchTarotSettings() {
  const res = await fetch(`${API_BASE}/settings/tarot`, {
    headers: authHeaders(),
  });
  return parseJson<TarotSettings>(res);
}

export async function saveTarotSettings(settings: TarotSettings) {
  const res = await fetch(`${API_BASE}/settings/tarot`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(settings),
  });
  return parseJson<TarotSettings>(res);
}

export async function fetchProfile(): Promise<ProfileStats> {
  const res = await fetch(`${API_BASE}/profile`, {
    headers: authHeaders(),
  });
  return parseJson<ProfileStats>(res);
}

export async function startLiuyaoSession(params: { question: string; category: string }) {
  const res = await fetch(`${API_BASE}/liuyao/sessions/start`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(params),
  });
  return parseJson<{ sessionId: string }>(res);
}

export async function castLiuyao(params: { sessionId: string; lines: number[] }) {
  const res = await fetch(`${API_BASE}/liuyao/sessions/${params.sessionId}/cast`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ lines: params.lines }),
  });
  return parseJson<{ castResult: LiuyaoCastResult }>(res);
}

export async function startTarotSession(params: { question: string; spreadType: SpreadType; reverseEnabled: boolean }) {
  const res = await fetch(`${API_BASE}/tarot/sessions/start`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(params),
  });
  return parseJson<{ sessionId: string }>(res);
}

export async function shuffleTarotSession(params: { sessionId: string }) {
  const res = await fetch(`${API_BASE}/tarot/sessions/${params.sessionId}/shuffle`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
  });
  return parseJson<{ ok: true }>(res);
}

export async function selectTarotCard(params: { sessionId: string; deckIndex?: number }) {
  const res = await fetch(`${API_BASE}/tarot/sessions/${params.sessionId}/select`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(params),
  });
  return parseJson<
    TarotSelection & {
      selectedCount: number;
      totalCount: number;
      complete: boolean;
    }
  >(res);
}

export async function fetchHistory(params: { type: 'all' | 'liuyao' | 'tarot'; q?: string }) {
  const query = new URLSearchParams({
    type: params.type,
    q: params.q || '',
  });
  const res = await fetch(`${API_BASE}/history?${query.toString()}`, {
    headers: authHeaders(),
  });
  return parseJson<DivinationRecord[]>(res);
}

export async function fetchHistoryDetail(params: { id: string }) {
  const res = await fetch(`${API_BASE}/history/${params.id}`, {
    headers: authHeaders(),
  });
  return parseJson<DivinationRecord>(res);
}

export async function deleteHistoryRecord(params: { id: string }) {
  const res = await fetch(`${API_BASE}/history/${params.id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return parseJson<{ ok: true }>(res);
}

export async function followupQuestion(params: { recordId: string; question: string }) {
  const res = await fetch(`${API_BASE}/divination/followup`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(params),
  });
  return parseJson<{ text: string }>(res);
}

export async function streamReveal(params: {
  url: string;
  onChunk: (chunk: string) => void;
  onDone: (record: DivinationRecord) => void;
}): Promise<void> {
  const res = await fetch(params.url, {
    headers: authHeaders(),
  });
  if (!res.ok || !res.body) {
    throw new Error((await res.text()) || '流式请求失败');
  }

  const decoder = new TextDecoder();
  const reader = res.body.getReader();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() || '';

    for (const event of events) {
      const lines = event.split('\n');
      const eventType = lines.find((line) => line.startsWith('event:'))?.slice(6).trim() || '';
      const data = lines.find((line) => line.startsWith('data:'))?.slice(5).trim() || '';

      if (eventType === 'chunk') params.onChunk(data.replace(/\\n/g, '\n'));
      if (eventType === 'done') params.onDone(JSON.parse(data) as DivinationRecord);
      if (eventType === 'error') throw new Error(data || '流式解读失败');
    }
  }
}
