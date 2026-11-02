import { apiRequest } from '../lib/api/client';

export interface DepartmentOption {
  id: string;
  name: string;
}

export interface FacultyOption {
  id: string;
  name: string;
  departments: DepartmentOption[];
}

export interface InstitutionOption {
  id: string;
  name: string;
  country?: string;
  city?: string;
  faculties?: FacultyOption[];
}

export interface CourseOption {
  id: string;
  title: string;
  code?: string;
  description?: string;
  level?: string;
  institutionId?: string;
}

export interface CompleteOnboardingPayload {
  institution: string;
  faculty: string;
  department: string;
  programme?: string;
  studyLevel?: string;
  coursesTaught?: string[];
  bio?: string;
  academicHandle?: string;
  socialHandle?: string;
}

export const academicApi = {
  institutions: () => apiRequest<InstitutionOption[]>('/institutions'),
  courses: (institutionId: string) =>
    apiRequest<CourseOption[]>(`/courses?institutionId=${encodeURIComponent(institutionId)}`),
  completeOnboarding: (payload: CompleteOnboardingPayload) =>
    apiRequest<{ user: import('../types').User }>('/auth/onboarding', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
