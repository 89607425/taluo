import { SpreadType } from '../src/types';

type Message = {
  role: 'system' | 'user';
  content: string;
};

function buildPrompt(params: {
  question: string;
  spreadType: SpreadType;
  cards: { position: string; cardName: string; isReversed: boolean }[];
  style: 'brief' | 'detailed';
}) {
  const cardRows = params.cards
    .map((card) => `- ${card.position}: ${card.cardName} (${card.isReversed ? '逆位' : '正位'})`)
    .join('\n');

  const styleHint = params.style === 'brief' ? '简洁，偏结论导向' : '详细，兼顾情绪支持与行动建议';

  const userPrompt = [
    `用户问题：${params.question}`,
    `牌阵：${params.spreadType}`,
    '牌面：',
    cardRows,
    '',
    '请输出中文解读，保留牌名英文。',
    '结构要求：',
    '1) 每张牌按牌位解释（每段尽量控制在200 token以内）',
    '2) 最后输出综合结论（尽量控制在300 token以内）',
    `3) 文风：${styleHint}`,
    '4) 逆位解释强调内化/阻滞，不要制造恐慌',
    '5) 返回 markdown 正文，不要 JSON，不要代码块',
  ].join('\n');

  const messages: Message[] = [
    {
      role: 'system',
      content:
        '你是专业塔罗咨询师，注重共情、清晰和可执行建议。你遵循结构化输出，不夸张、不恐吓、不做医疗法律财务诊断。',
    },
    { role: 'user', content: userPrompt },
  ];

  return messages;
}

async function* streamFromOpenAICompatibleAPI(config: {
  endpoint: string;
  apiKey: string;
  model: string;
  messages: Message[];
}): AsyncGenerator<string> {
  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages: config.messages,
      stream: true,
      temperature: 0.7,
    }),
  });

  if (!response.ok || !response.body) {
    const errText = await response.text();
    throw new Error(`AI HTTP ${response.status}: ${errText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (data === '[DONE]') return;
      try {
        const json = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
        const content = json.choices?.[0]?.delta?.content;
        if (content) yield content;
      } catch {
        // Ignore malformed stream chunk.
      }
    }
  }
}

async function collectStream(stream: AsyncGenerator<string>): Promise<string> {
  let out = '';
  for await (const chunk of stream) out += chunk;
  return out;
}

export async function* generateInterpretationStream(params: {
  siliconflowApiKey: string;
  siliconflowModel: string;
  fallbackOpenAiApiKey?: string;
  fallbackOpenAiModel?: string;
  question: string;
  spreadType: SpreadType;
  cards: { position: string; cardName: string; isReversed: boolean }[];
  style: 'brief' | 'detailed';
}): AsyncGenerator<string> {
  const messages = buildPrompt({
    question: params.question,
    spreadType: params.spreadType,
    cards: params.cards,
    style: params.style,
  });

  try {
    yield* streamFromOpenAICompatibleAPI({
      endpoint: 'https://api.siliconflow.cn/v1/chat/completions',
      apiKey: params.siliconflowApiKey,
      model: params.siliconflowModel,
      messages,
    });
    return;
  } catch (e) {
    if (!params.fallbackOpenAiApiKey) throw e;
  }

  yield* streamFromOpenAICompatibleAPI({
    endpoint: 'https://api.openai.com/v1/chat/completions',
    apiKey: params.fallbackOpenAiApiKey as string,
    model: params.fallbackOpenAiModel || 'gpt-3.5-turbo',
    messages,
  });
}

export async function generateInterpretation(params: {
  siliconflowApiKey: string;
  siliconflowModel: string;
  fallbackOpenAiApiKey?: string;
  fallbackOpenAiModel?: string;
  question: string;
  spreadType: SpreadType;
  cards: { position: string; cardName: string; isReversed: boolean }[];
  style: 'brief' | 'detailed';
}): Promise<string> {
  const stream = generateInterpretationStream(params);
  return collectStream(stream);
}
