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
  state?: string;
  ownership?: string;
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

export interface AcademicCatalogueSubmission { id: string; entryType: 'institution' | 'faculty' | 'department'; name: string; parentInstitutionId?: string; parentFacultyId?: string; state?: string; city?: string; ownership?: string; status: 'pending' | 'approved' | 'rejected'; submittedBy: string; createdAt: string; reviewNote?: string; }

export interface AcademicCatalogueSubmissionPayload {
  entryType: 'institution' | 'faculty' | 'department';
  name: string;
  parentInstitutionId?: string;
  parentFacultyId?: string;
  state?: string;
  city?: string;
  ownership?: 'Federal' | 'State' | 'Private';
}

export const academicApi = {
  institutions: () => apiRequest<InstitutionOption[]>('/institutions'),
  submitCatalogueEntry: (payload: AcademicCatalogueSubmissionPayload) => apiRequest('/institutions/submissions', { method: 'POST', body: JSON.stringify(payload) }),
  catalogueSubmissions: () => apiRequest<AcademicCatalogueSubmission[]>('/institutions/submissions'),
  reviewCatalogueSubmission: (id: string, status: 'approved' | 'rejected', reviewNote?: string) => apiRequest<AcademicCatalogueSubmission>('/institutions/submissions/' + encodeURIComponent(id) + '/review', { method: 'PATCH', body: JSON.stringify({ status, reviewNote }) }),
  courses: (institutionId: string) =>
    apiRequest<CourseOption[]>(`/courses?institutionId=${encodeURIComponent(institutionId)}`),
  completeOnboarding: (payload: CompleteOnboardingPayload) =>
    apiRequest<{ user: import('../types').User }>('/auth/onboarding', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
