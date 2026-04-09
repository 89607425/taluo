import { SpreadType } from '../types';

export interface SpreadSlot {
  id: number;
  name: string;
  coord: [number, number];
}

export interface SpreadSchema {
  spreadId: SpreadType;
  name: string;
  slots: SpreadSlot[];
}

export const SPREAD_SCHEMAS: Record<SpreadType, SpreadSchema> = {
  single: {
    spreadId: 'single',
    name: '单牌指引',
    slots: [{ id: 1, name: '指引', coord: [0.5, 0.5] }],
  },
  trinity: {
    spreadId: 'trinity',
    name: '圣三角',
    slots: [
      { id: 1, name: '过去', coord: [0.2, 0.5] },
      { id: 2, name: '现在', coord: [0.5, 0.5] },
      { id: 3, name: '未来', coord: [0.8, 0.5] },
    ],
  },
  celtic: {
    spreadId: 'celtic',
    name: '凯尔特十字',
    slots: [
      { id: 1, name: '现状', coord: [0.45, 0.45] },
      { id: 2, name: '障碍', coord: [0.45, 0.45] },
      { id: 3, name: '远因', coord: [0.25, 0.45] },
      { id: 4, name: '近因', coord: [0.65, 0.45] },
      { id: 5, name: '目标', coord: [0.45, 0.2] },
      { id: 6, name: '未来', coord: [0.45, 0.72] },
      { id: 7, name: '自我', coord: [0.82, 0.15] },
      { id: 8, name: '环境', coord: [0.82, 0.35] },
      { id: 9, name: '希望/恐惧', coord: [0.82, 0.55] },
      { id: 10, name: '结果', coord: [0.82, 0.75] },
    ],
  },
};

export function spreadSlotNames(spread: SpreadType): string[] {
  return SPREAD_SCHEMAS[spread].slots.map((slot) => slot.name);
}
