import { spreadSlotNames } from '../../src/config/spreads';
import { TAROT_CARD_IDS, TAROT_CARD_MAP } from '../../src/data/tarotCatalog';
import { fisherYates, createSeededRandom } from '../random';
import { DivinationProvider } from './DivinationProvider';

export class TarotProvider implements DivinationProvider {
  async cast(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    const spreadType = String(payload.spreadType || 'trinity');
    const reverseEnabled = Boolean(payload.reverseEnabled ?? true);
    const slots = spreadSlotNames(spreadType as 'single' | 'trinity' | 'celtic');
    const random = createSeededRandom(Date.now());
    const deck = fisherYates(TAROT_CARD_IDS, random);
    const selected = slots.map((position) => {
      const cardId = deck.pop() as string;
      return {
        cardId,
        position,
        isReversed: reverseEnabled ? random() > 0.5 : false,
      };
    });

    return {
      spreadType,
      selected,
    };
  }

  getPrompt(params: { question: string; castResult: Record<string, unknown> }): string {
    const cast = params.castResult as {
      spreadType: string;
      selected: Array<{ cardId: string; position: string; isReversed: boolean }>;
    };

    const rows = cast.selected
      .map((card) => {
        const cardName = TAROT_CARD_MAP.get(card.cardId)?.name || card.cardId;
        return `- ${card.position}: ${cardName} (${card.isReversed ? '逆位' : '正位'})`;
      })
      .join('\n');

    return [
      `用户问题：${params.question}`,
      `牌阵：${cast.spreadType}`,
      '牌面：',
      rows,
      '',
      '请输出中文解读：先逐牌位解释，再给出综合建议（含可执行动作）。不要恐吓。',
    ].join('\n');
  }

  getOfflineInterpretation(params: { question: string; castResult: Record<string, unknown> }): string {
    const cast = params.castResult as {
      selected: Array<{ cardId: string; position: string; isReversed: boolean }>;
    };

    const cardLines = cast.selected.map((card) => {
      const cardName = TAROT_CARD_MAP.get(card.cardId)?.name || card.cardId;
      return `- ${card.position}：${cardName}${card.isReversed ? '（逆位）' : '（正位）'}`;
    });

    return [
      `你问的是「${params.question}」。当前可先从以下牌位切入：`,
      ...cardLines,
      '',
      '建议：优先处理最紧急的一步，再做中期安排。',
      '避坑：避免一次性做过多决定，先验证再扩展。',
    ].join('\n');
  }
}
