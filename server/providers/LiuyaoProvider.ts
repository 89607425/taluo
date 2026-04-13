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
      primary: { name: string; judgment: string; summary: string; fortune: string };
      changed: { name: string; judgment: string; summary: string; fortune: string };
    };
    const category = String(params.inputParams.category || '综合');

    return `你是一位博学温婉的易经民俗顾问。
用户信息如下：
- 所求事项：${category || '未填写'}
- 具体问题：${params.question || '未填写'}
- 本卦：${cast.primary.name || '未知'}
- 变卦：${cast.changed.name || '未知'}
- 动爻：${cast.movingLines.length ? cast.movingLines.join('、') : '无'}
- 离线卦辞：${cast.primary.judgment || '无'}
- 离线一句话大意：${cast.primary.summary || '无'}
- 离线吉凶等级：${cast.primary.fortune || '无'}
- 变卦卦辞：${cast.changed.judgment || '无'}
- 变卦一句话大意：${cast.changed.summary || '无'}
- 变卦吉凶等级：${cast.changed.fortune || '无'}

请你必须结合“用户具体问题 + 本卦/变卦/动爻”做针对性解读，避免空泛套话。
如果有动爻，请把“本卦”视为现状，把“变卦”视为发展后的主趋势。
请严格按照以下三段输出：
【当下现状】
【姐姐建议】
【避坑指南】

要求：
1. 语气柔和、理性，侧重心理疏导与国学智慧。
2. 严禁恐吓、迷信绝对化预言、确定性吉凶断语。
3. 总字数 250-400 字。`;
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
    const category = String(params.inputParams.category || '当前事项');
    const movingText = cast.movingLines.length ? `动爻在第 ${cast.movingLines.join('、')} 爻。` : '当前无动爻。';

    return [
      '【当下现状】',
      `你当前更需要的不是“立刻得到标准答案”，而是先把问题拆成可执行的小步骤。${movingText}此卦显示你已具备推进条件，但节奏上仍需稳住，不宜被外界噪音牵引。`,
      '',
      '【姐姐建议】',
      `围绕“${category}”先做一件最小可验证动作，并在 3-7 天内复盘结果。若“${params.question || '当前问题'}”涉及多人协作，先统一预期再行动，能显著降低内耗。`,
      '',
      '【避坑指南】',
      `避免情绪化加码、避免一次性押注、避免把短期波动当成长期结论。可先以「${cast.primary.name}」为现状参考，再观察是否向「${cast.changed.name}」所示趋势推进。`,
    ].join('\n');
  }
}
