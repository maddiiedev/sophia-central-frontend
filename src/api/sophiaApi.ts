import { apiRequest } from '../lib/api/client';
import { resourcesApi } from './resources';
import { moderationApi } from './moderation';

type AiChatResponse = {
  sessionId?: string;
  userMessageId?: string;
  assistantMessage?: string;
  pointsUsed?: number;
  balanceRemaining?: number;
  error?: string;
  required?: number;
  balance?: number;
  messages?: Array<{ id: string; role: 'user' | 'assistant' | 'system'; content: string; createdAt?: string }>;
  title?: string;
  resourceId?: string | null;
};

export const aiService = {
  async ask(payload: {
    question: string;
    resourceId?: string | null;
    sessionId?: string;
  }) {
    // AI requests must always reach the authenticated backend. Never substitute a canned mock answer.
    const response = await apiRequest<AiChatResponse>(
      '/ai/chat',
      {
        method: 'POST',
        body: JSON.stringify(payload),
        // Allow Gemini to finish while staying below Vercel's 120-second proxy ceiling.
        timeoutMs: 110_000,
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
      userMessageId: response.userMessageId,
      pointsUsed: response.pointsUsed,
      balanceRemaining: response.balanceRemaining,
    };
  },

  async getSession(sessionId: string) {
    const response = await apiRequest<AiChatResponse & { id?: string; title?: string; resourceId?: string }>(
      `/ai/sessions/${encodeURIComponent(sessionId)}`,
      { method: 'GET' },
    );
    if (response.error) throw new Error(response.error);
    return {
      sessionId: response.id ?? response.sessionId ?? sessionId,
      title: response.title,
      resourceId: response.resourceId,
      messages: (response.messages ?? [])
        .filter((message) => message.role === 'user' || message.role === 'assistant')
        .sort((left, right) => {
          const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
          const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
          return leftTime - rightTime;
        })
        .map((message) => ({ id: message.id, role: message.role as 'user' | 'assistant', content: message.content })),
    };
  },

  async editMessage(payload: { sessionId: string; messageId: string; question: string }) {
    const response = await apiRequest<AiChatResponse>(
      `/ai/sessions/${encodeURIComponent(payload.sessionId)}/messages/${encodeURIComponent(payload.messageId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ question: payload.question }),
        timeoutMs: 110_000,
      },
    );

    if (response.error) {
      throw new Error(
        response.error === 'Insufficient Wisdom Points'
          ? `You need ${response.required ?? 2} Wisdom Points to regenerate this answer. Your current balance is ${response.balance ?? 0}.`
          : response.error,
      );
    }
    if (!response.assistantMessage) throw new Error('Sophis AI returned an empty response.');
    return {
      answer: response.assistantMessage,
      sessionId: response.sessionId,
      userMessageId: response.userMessageId,
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
