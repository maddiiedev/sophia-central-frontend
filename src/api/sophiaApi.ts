
import { appConfig } from '../config/env';
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
    if (appConfig.useMockData) {
      return {
        answer:
          'Here is a strong revision plan: review key definitions, solve 10 focused practice questions, and revisit weak topics with lecture notes before your next study block.',
      };
    }

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