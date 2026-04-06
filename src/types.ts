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

export interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
  readingId?: string;
  tags: string[];
}
