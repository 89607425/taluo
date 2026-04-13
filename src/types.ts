export type SpreadType = 'single' | 'trinity' | 'celtic';
export type DivinationType = 'liuyao' | 'tarot';

export interface User {
  id: string;
  email: string;
  nickname: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface TarotSettings {
  reverseEnabled: boolean;
}

export interface HexagramData {
  number: number;
  name: string;
  judgment: string;
  fortune: '大吉' | '小吉' | '平' | '忧' | '大忧';
  summary: string;
  lines: number[];
}

export interface LiuyaoCastResult {
  lines: number[];
  movingLines: number[];
  primary: HexagramData;
  changed: HexagramData;
}

export interface TarotCard {
  id: string;
  name: string;
  image: string;
  description: string;
  keywords: string[];
  element: string;
  arcana: 'Major' | 'Minor';
  planet?: string;
  entity?: string;
}

export interface TarotSelection {
  cardId: string;
  position: string;
  isReversed: boolean;
}

export interface DivinationRecord {
  id: string;
  userId: string;
  type: DivinationType;
  question: string;
  inputParams: Record<string, unknown>;
  rawData: Record<string, unknown>;
  interpretation: string;
  isStarred: boolean;
  createdAt: string;
}

export interface ProfileStats {
  userId: string;
  liuyaoCount: number;
  tarotCount: number;
  totalCount: number;
}

export interface AdminAuthResponse {
  token: string;
}

export interface AdminUserSummary {
  id: string;
  email: string;
  nickname: string;
  isBanned: boolean;
  createdAt: string;
  liuyaoCount: number;
  tarotCount: number;
  totalCount: number;
}

export interface AdminRecordSummary {
  id: string;
  userId: string;
  email: string;
  nickname: string;
  type: 'liuyao' | 'tarot';
  question: string;
  interpretation: string;
  createdAt: string;
}
