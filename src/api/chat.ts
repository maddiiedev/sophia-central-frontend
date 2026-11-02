import { apiRequest } from './client';
import { appConfig } from '../config/env';

export type ChatContact = { id: string; academicHandle: string; role: 'student' | 'lecturer'; institution?: string; faculty?: string; department?: string; isDeleted?: boolean };
export type ChatMessage = { id: string; kind: 'group' | 'direct'; senderId: string | null; senderHandle: string; contentType: 'text' | 'voice' | 'sticker'; text: string | null; voiceUrl: string | null; stickerId?: string | null; isDeleted: boolean; editedAt: string | null; createdAt: string; isOwn: boolean };
export type ChatPage = { items: ChatMessage[]; hasMore: boolean; nextBefore: string | null };

export const chatApi = {
  subscribe: (onRefresh: () => void) => {
    const baseUrl = appConfig.apiBaseUrl.endsWith('/') ? appConfig.apiBaseUrl.slice(0, -1) : appConfig.apiBaseUrl;
    const source = new EventSource(`${baseUrl}/chat/events`, { withCredentials: true });
    source.onmessage = () => onRefresh();
    return () => source.close();
  },
  contacts: (search = '') => apiRequest<ChatContact[]>(`/chat/contacts${search.trim() ? `?search=${encodeURIComponent(search.trim().replace(/^@+/, ''))}` : ''}`),
  blocks: () => apiRequest<Array<{ userId: string; academicHandle: string | null }>>('/chat/blocks'),
  block: (userId: string) => apiRequest<{ success: boolean }>(`/chat/blocks/${encodeURIComponent(userId)}`, { method: 'POST' }),
  unblock: (userId: string) => apiRequest<{ success: boolean }>(`/chat/blocks/${encodeURIComponent(userId)}`, { method: 'DELETE' }),
  presence: () => apiRequest<Array<{ id: string; online: boolean }>>('/chat/presence'),
  heartbeat: () => apiRequest<{ success: boolean }>('/chat/presence/heartbeat'),
  groupHistory: (limit = 40, before?: string) => apiRequest<ChatPage>(`/chat/group/messages?limit=${limit}${before ? `&before=${encodeURIComponent(before)}` : ''}`),
  directHistory: (userId: string, limit = 40, before?: string) => apiRequest<ChatPage>(`/chat/direct/${encodeURIComponent(userId)}/messages?limit=${limit}${before ? `&before=${encodeURIComponent(before)}` : ''}`),
  sendText: (kind: 'group' | 'direct', text: string, recipientId?: string) => apiRequest<ChatMessage>('/chat/messages', { method: 'POST', body: JSON.stringify({ kind, text, ...(recipientId ? { recipientId } : {}) }) }),
  edit: (id: string, text: string) => apiRequest<ChatMessage>(`/chat/messages/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ text }) }),
  remove: (id: string) => apiRequest<{ success: boolean }>(`/chat/messages/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  voiceUpload: (mimetype: string, size: number) => apiRequest<{ uploadUrl: string; key: string; contentType: string }>('/chat/voice-upload', { method: 'POST', body: JSON.stringify({ mimetype, size }) }),
  sendVoice: (kind: 'group' | 'direct', voiceKey: string, recipientId?: string) => apiRequest<ChatMessage>('/chat/messages', { method: 'POST', body: JSON.stringify({ kind, voiceKey, ...(recipientId ? { recipientId } : {}) }) }),
  sendSticker: (kind: 'group' | 'direct', stickerId: string, recipientId?: string) => apiRequest<ChatMessage>('/chat/messages', { method: 'POST', body: JSON.stringify({ kind, stickerId, ...(recipientId ? { recipientId } : {}) }) }),
};
