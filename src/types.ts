export type SpreadType = 'single' | 'trinity' | 'celtic';

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

export interface ReadingCard {
  cardId: string;
  position: string;
  isReversed: boolean;
}

export interface Reading {
  id: string;
  date: string;
  question: string;
  spread: SpreadType;
  cards: {
    card: TarotCard;
    isReversed: boolean;
    position: string;
  }[];
  interpretation: string;
}

export interface ReadingRecord {
  id: string;
  userId: string;
  question: string;
  spreadType: SpreadType;
  cards: ReadingCard[];
  interpretationText: string;
  createdAt: string;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  date: string;
  readingId?: string;
  tags: string[];
}

export interface UserSettings {
  userId: string;
  reverseEnabled: boolean;
  defaultSpread: SpreadType;
  interpretationStyle: 'brief' | 'detailed';
  themeStyle: 'dark' | 'fresh';
}

export type RitualState = 'STATE_IDLE' | 'STATE_INTENT' | 'STATE_SHUFFLE' | 'STATE_SELECT' | 'STATE_REVEAL';
