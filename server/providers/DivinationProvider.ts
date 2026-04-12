export type ProviderType = 'liuyao' | 'tarot';

export interface CastResult {
  [key: string]: unknown;
}

export interface DivinationProvider {
  cast(payload: Record<string, unknown>): Promise<CastResult>;
  getPrompt(params: { question: string; castResult: CastResult; inputParams: Record<string, unknown> }): string;
  getOfflineInterpretation(params: {
    question: string;
    castResult: CastResult;
    inputParams: Record<string, unknown>;
  }): string;
}
