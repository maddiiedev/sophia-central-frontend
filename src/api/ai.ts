import { apiRequest } from './client';

export interface AiChatRequest {
  question: string;
  sessionId?: string;
  resourceId?: string;
}

export interface AiChatResponse {
  sessionId: string;
  userMessage: string;
  assistantMessage: string;
  pointsUsed: number;
  balanceRemaining: number;
  error?: string;
  required?: number;
  balance?: number;
}

export const aiApi = {
  ask: async (payload: AiChatRequest, token?: string | null) => {
    return apiRequest<AiChatResponse>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token ?? null);
  },
};
