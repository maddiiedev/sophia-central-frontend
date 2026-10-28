import { apiRequest } from '../lib/api/client';
import { appConfig } from '../config/env';
import { roleUsers, mockResources, moderationQueue } from '../lib/mock-data';
import type { Resource, User, UserRole } from '../types';

const authTokenKey = 'sophia-auth-token';
const authUserKey = 'sophia-user';

function getStoredUser(): User | null {
  try {
    const stored = localStorage.getItem(authUserKey);
    return stored ? (JSON.parse(stored) as User) : null;
  } catch {
    return null;
  }
}

function buildUserFromEmail(email: string, role: UserRole): User {
  const fallback = roleUsers[role] ?? roleUsers.student;
  return {
    ...fallback,
    email,
    name: email.split('@')[0]?.replace('.', ' ') || fallback.name,
    role,
  };
}

export const authService = {
  getStoredUser,

  async login(email: string, password: string, role: UserRole = 'student') {
    if (!email || !password) {
      throw new Error('Email and password are required.');
    }

    if (appConfig.useMockData) {
      const user = buildUserFromEmail(email, role);
      const token = 'demo-token';
      localStorage.setItem(authTokenKey, token);
      localStorage.setItem(authUserKey, JSON.stringify(user));
      return { accessToken: token, user };
    }

    return apiRequest<{ accessToken: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
  },

  async register(payload: Partial<User> & { email: string; password: string; firstName?: string; lastName?: string; role?: UserRole }) {
    const role = payload.role ?? 'student';

    if (appConfig.useMockData) {
      const user = {
        ...roleUsers[role],
        ...payload,
        id: String(Date.now()),
        name: `${payload.firstName || roleUsers[role].name.split(' ')[0] || 'Sophis'} ${payload.lastName || roleUsers[role].name.split(' ')[1] || 'Student'}`,
        role,
        avatar: (payload.firstName || 'S').slice(0, 2).toUpperCase(),
      } as User;

      const token = 'demo-token';
      localStorage.setItem(authTokenKey, token);
      localStorage.setItem(authUserKey, JSON.stringify(user));
      return { accessToken: token, user };
    }

    return apiRequest<{ accessToken: string; user: User }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  logout() {
    localStorage.removeItem(authTokenKey);
    localStorage.removeItem(authUserKey);
  },
};

export const resourceService = {
  async list(): Promise<Resource[]> {
    if (appConfig.useMockData) {
      return mockResources;
    }

    return apiRequest<Resource[]>('/resources', { method: 'GET' });
  },

  async byId(id: string): Promise<Resource | undefined> {
    if (appConfig.useMockData) {
      return mockResources.find((resource) => resource.id === id);
    }

    return apiRequest<Resource | undefined>(`/resources/${id}`, { method: 'GET' });
  },

  async create(payload: Record<string, unknown>) {
    if (appConfig.useMockData) {
      return { success: true, data: payload };
    }

    return apiRequest('/resources', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async listModeration() {
    if (appConfig.useMockData) {
      return moderationQueue;
    }

    return apiRequest('/moderation/queue', { method: 'GET' });
  },

  async reviewModeration(resourceId: string, status: 'approved' | 'rejected') {
    if (appConfig.useMockData) {
      return { success: true, data: { id: resourceId, status } };
    }

    return apiRequest(`/moderation/resources/${resourceId}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

export const aiService = {
  async ask(payload: { question: string; sessionId?: string; resourceId?: string }) {
    if (appConfig.useMockData) {
      return {
        sessionId: payload.sessionId ?? 'demo-session',
        userMessage: payload.question,
        assistantMessage: 'Here is a strong revision plan: review key definitions, solve 10 focused practice questions, and revisit weak topics with lecture notes before your next study block.',
        pointsUsed: 0,
        balanceRemaining: 0,
      };
    }

    return apiRequest<{
      sessionId: string;
      userMessage: string;
      assistantMessage: string;
      pointsUsed: number;
      balanceRemaining: number;
      error?: string;
      required?: number;
      balance?: number;
    }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
