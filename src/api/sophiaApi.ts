import { apiRequest } from '../lib/api/client';
import { resourcesApi } from './resources';
import { moderationApi } from './moderation';

type AiChatResponse = {
  sessionId?: string;
  assistantMessage?: string;
  pointsUsed?: number;
  balanceRemaining?: number;
  error?: string;
  required?: number;
  balance?: number;
};

export const aiService = {
  async ask(payload: {
    question: string;
    resourceId?: string;
    sessionId?: string;
  }) {
    // AI requests must always reach the authenticated backend. Never substitute a canned mock answer.
    const response = await apiRequest<AiChatResponse>(
      '/ai/chat',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );

    if (response.error) {
      throw new Error(
        response.error === 'Insufficient Wisdom Points'
          ? `You need ${response.required ?? 2} Wisdom Points to use Sophis AI. Your current balance is ${response.balance ?? 0}.`
          : response.error,
      );
    }

    if (!response.assistantMessage) {
      throw new Error('Sophis AI returned an empty response.');
    }

    return {
      answer: response.assistantMessage,
      sessionId: response.sessionId,
      pointsUsed: response.pointsUsed,
      balanceRemaining: response.balanceRemaining,
    };
  },
};

export const sophiaApi = {
  ai: aiService,
  resources: resourcesApi,
  moderation: {
    list: moderationApi.queue,
    history: moderationApi.history,
    review: moderationApi.review,
  },
};
