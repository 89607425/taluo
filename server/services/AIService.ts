import { env } from '../env';

type Message = { role: 'system' | 'user'; content: string };

async function* streamFromOpenAICompatible(config: {
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
    const errorText = await response.text();
    throw new Error(`AI HTTP ${response.status}: ${errorText}`);
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
      if (!trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (!data || data === '[DONE]') continue;
      try {
        const json = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
        const content = json.choices?.[0]?.delta?.content;
        if (content) yield content;
      } catch {
        // Ignore malformed stream line.
      }
    }
  }
}

export class AIService {
  async *generateStream(prompt: string): AsyncGenerator<string> {
    const messages: Message[] = [
      {
        role: 'system',
        content:
          '你是专业且克制的占卜解读助手，注重同理、可执行建议与风险提示，不制造恐慌，不做医疗法律财务诊断。',
      },
      { role: 'user', content: prompt },
    ];

    if (env.siliconflowApiKey) {
      try {
        yield* streamFromOpenAICompatible({
          endpoint: 'https://api.siliconflow.cn/v1/chat/completions',
          apiKey: env.siliconflowApiKey,
          model: env.siliconflowModel,
          messages,
        });
        return;
      } catch {
        // continue to openai fallback
      }
    }

    if (env.openaiApiKey) {
      yield* streamFromOpenAICompatible({
        endpoint: 'https://api.openai.com/v1/chat/completions',
        apiKey: env.openaiApiKey,
        model: env.openaiModel,
        messages,
      });
      return;
    }

    // no provider configured
    yield 'AI 服务当前未配置，已返回离线基础解读。';
  }
}
