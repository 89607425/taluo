import { HEXAGRAMS_BY_BINARY } from '../../src/data/hexagrams';
import { DivinationProvider } from './DivinationProvider';

function lineToYinYang(line: number): 0 | 1 {
  return line === 1 || line === 3 ? 1 : 0;
}

function lineToChanged(line: number): 0 | 1 {
  if (line === 2) return 1;
  if (line === 3) return 0;
  return lineToYinYang(line);
}

function toIndex(lines: number[]): number {
  return lines.reduce((acc, bit, idx) => acc | (bit << idx), 0);
}

function castLineByThreeCoins() {
  const coins = Array.from({ length: 3 }, () => (Math.random() < 0.5 ? 2 : 3));
  const sum = coins.reduce((acc, n) => acc + n, 0);
  const line = sum === 6 ? 2 : sum === 7 ? 1 : sum === 8 ? 0 : 3;
  return { coins, sum, line };
}

export class LiuyaoProvider implements DivinationProvider {
  async cast(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    const payloadLines = Array.isArray(payload.lines) ? (payload.lines as number[]) : null;
    const lines =
      payloadLines && payloadLines.length === 6
        ? payloadLines
        : Array.from({ length: 6 }, () => castLineByThreeCoins().line);
    const baseLines = lines.map(lineToYinYang);
    const changedLines = lines.map(lineToChanged);
    const movingLines = lines.flatMap((line, idx) => (line === 2 || line === 3 ? idx + 1 : []));

    const primary = HEXAGRAMS_BY_BINARY[toIndex(baseLines)];
    const changed = HEXAGRAMS_BY_BINARY[toIndex(changedLines)];

    return {
      lines,
      movingLines,
      primary,
      changed,
    };
  }

  getPrompt(params: { question: string; castResult: Record<string, unknown>; inputParams: Record<string, unknown> }): string {
    const cast = params.castResult as {
      movingLines: number[];
      primary: { name: string; judgment: string; summary: string };
      changed: { name: string; judgment: string; summary: string };
    };
    const category = String(params.inputParams.category || '综合');

    return [
      `用户问题：${params.question}`,
      `问题分类：${category}`,
      `本卦：${cast.primary.name}`,
      `本卦卦辞：${cast.primary.judgment}`,
      `本卦摘要：${cast.primary.summary}`,
      `变卦：${cast.changed.name}`,
      `变卦卦辞：${cast.changed.judgment}`,
      `变卦摘要：${cast.changed.summary}`,
      `动爻：${cast.movingLines.length ? cast.movingLines.join('、') : '无'}`,
      '',
      '请输出中文，分三段：',
      '1) 建议',
      '2) 避坑',
      '3) 时机',
      '每段 2-3 句，不要恐吓，不要绝对化判断。',
    ].join('\n');
  }

  getOfflineInterpretation(params: {
    question: string;
    castResult: Record<string, unknown>;
    inputParams: Record<string, unknown>;
  }): string {
    const cast = params.castResult as {
      movingLines: number[];
      primary: { name: string; summary: string };
      changed: { name: string; summary: string };
    };

    return [
      '## 建议',
      `你问的是「${params.question}」，当前主线可先按「${cast.primary.name}」的结构推进。${cast.primary.summary}`,
      '',
      '## 避坑',
      cast.movingLines.length
        ? `动爻在第 ${cast.movingLines.join('、')} 爻，说明变量仍在变化，避免情绪化加码与频繁换轨。`
        : '当前无动爻，局势相对稳定，重点是持续执行，不要因为短期波动而偏航。',
      '',
      '## 时机',
      `后续趋势可参考「${cast.changed.name}」：${cast.changed.summary}`,
    ].join('\n');
  }
}
