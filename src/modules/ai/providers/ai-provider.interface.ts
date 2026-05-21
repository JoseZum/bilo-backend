export interface AIAskInput {
  scope: 'property' | 'lease';
  scopeId: string;
  question: string;
  contextText: string;
}

export interface AIAskOutput {
  answer: string;
  usedContext: boolean;
}

export interface AIProvider {
  ask(input: AIAskInput): Promise<AIAskOutput>;
}

export const AI_PROVIDER = 'AI_PROVIDER';
