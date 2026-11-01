import { apiRequest } from './client';

export type ChatContact = { id: string; academicHandle: string; role: 'student' | 'lecturer'; institution?: string; faculty?: string; department?: string };
export type ChatMessage = { id: string; kind: 'group' | 'direct'; senderId: string; senderHandle: string; contentType: 'text' | 'voice'; text: string | null; voiceUrl: string | null; isDeleted: boolean; editedAt: string | null; createdAt: string; isOwn: boolean };
export type ChatPage = { items: ChatMessage[]; hasMore: boolean; nextBefore: string | null };

export const chatApi = {
  contacts: () => apiRequest<ChatContact[]>('/chat/contacts'),
  groupHistory: (limit = 40, before?: string) => apiRequest<ChatPage>(`/chat/group/messages?limit=${limit}${before ? `&before=${encodeURIComponent(before)}` : ''}`),
  directHistory: (userId: string, limit = 40, before?: string) => apiRequest<ChatPage>(`/chat/direct/${encodeURIComponent(userId)}/messages?limit=${limit}${before ? `&before=${encodeURIComponent(before)}` : ''}`),
  sendText: (kind: 'group' | 'direct', text: string, recipientId?: string) => apiRequest<ChatMessage>('/chat/messages', { method: 'POST', body: JSON.stringify({ kind, text, ...(recipientId ? { recipientId } : {}) }) }),
  edit: (id: string, text: string) => apiRequest<ChatMessage>(`/chat/messages/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ text }) }),
  remove: (id: string) => apiRequest<{ success: boolean }>(`/chat/messages/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  voiceUpload: (mimetype: string, size: number) => apiRequest<{ uploadUrl: string; key: string; contentType: string }>('/chat/voice-upload', { method: 'POST', body: JSON.stringify({ mimetype, size }) }),
  sendVoice: (kind: 'group' | 'direct', voiceKey: string, recipientId?: string) => apiRequest<ChatMessage>('/chat/messages', { method: 'POST', body: JSON.stringify({ kind, voiceKey, ...(recipientId ? { recipientId } : {}) }) }),
};
