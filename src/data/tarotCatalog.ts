import { TarotCard } from '../types';
import { RIDER_WAITE_IMAGE_BY_KEY } from './tarotImageMap';

const MAJOR_ARCANA = [
  'The Fool',
  'The Magician',
  'The High Priestess',
  'The Empress',
  'The Emperor',
  'The Hierophant',
  'The Lovers',
  'The Chariot',
  'Strength',
  'The Hermit',
  'Wheel of Fortune',
  'Justice',
  'The Hanged Man',
  'Death',
  'Temperance',
  'The Devil',
  'The Tower',
  'The Star',
  'The Moon',
  'The Sun',
  'Judgement',
  'The World',
];

const SUITS = ['Wands', 'Cups', 'Swords', 'Pentacles'] as const;
const RANKS = [
  'Ace',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Page',
  'Knight',
  'Queen',
  'King',
] as const;

const PLACEHOLDER_IMAGES = [
  '/cards/tarot-1.svg',
  '/cards/tarot-2.svg',
  '/cards/tarot-3.svg',
  '/cards/tarot-4.svg',
];

function normalizeKey(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function imageForCardName(name: string, index: number): string {
  const normalized = normalizeKey(name);
  const direct = RIDER_WAITE_IMAGE_BY_KEY[normalized];
  if (direct) return direct;

  const prefixed = RIDER_WAITE_IMAGE_BY_KEY[`the${normalized}`];
  if (prefixed) return prefixed;

  if (normalized.startsWith('the')) {
    const noThe = RIDER_WAITE_IMAGE_BY_KEY[normalized.slice(3)];
    if (noThe) return noThe;
  }

  return PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length];
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function majorCard(name: string, index: number): TarotCard {
  return {
    id: slugify(name),
    name,
    image: imageForCardName(name, index),
    description: `Major arcana archetype: ${name}.`,
    keywords: ['Archetype', 'Destiny', 'Transformation'],
    element: 'Spirit',
    arcana: 'Major',
  };
}

function minorCard(suit: (typeof SUITS)[number], rank: (typeof RANKS)[number], index: number): TarotCard {
  const name = `${rank} of ${suit}`;
  const suitKeywords: Record<(typeof SUITS)[number], string[]> = {
    Wands: ['Passion', 'Initiative', 'Action'],
    Cups: ['Emotion', 'Connection', 'Intuition'],
    Swords: ['Mind', 'Truth', 'Conflict'],
    Pentacles: ['Material', 'Work', 'Stability'],
  };

  return {
    id: slugify(name),
    name,
    image: imageForCardName(name, index),
    description: `Minor arcana: ${name}.`,
    keywords: suitKeywords[suit],
    element: suit,
    arcana: 'Minor',
  };
}

const majorArcana = MAJOR_ARCANA.map(majorCard);
const minorArcana: TarotCard[] = [];
SUITS.forEach((suit) => {
  RANKS.forEach((rank, index) => {
    minorArcana.push(minorCard(suit, rank, index));
  });
});

export const TAROT_CARDS: TarotCard[] = [...majorArcana, ...minorArcana];
export const TAROT_CARD_IDS = TAROT_CARDS.map((card) => card.id);
export const TAROT_CARD_MAP = new Map(TAROT_CARDS.map((card) => [card.id, card]));
