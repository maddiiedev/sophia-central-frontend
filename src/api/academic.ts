import { apiRequest } from '../lib/api/client';

export type InstitutionType = 'university' | 'polytechnic' | 'monotechnic' | 'college_of_education' | 'college_of_health_technology' | 'college_of_agriculture' | 'other_college';

export interface DepartmentOption {
  id: string;
  name: string;
}

export interface FacultyOption {
  id: string;
  name: string;
  unitType?: 'faculty' | 'school' | 'college';
  departments: DepartmentOption[];
}

export interface InstitutionOption {
  id: string;
  name: string;
  institutionCode?: string;
  country?: string;
  city?: string;
  state?: string;
  ownership?: string;
  institutionType?: InstitutionType;
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

export interface TeachingAssignmentPayload { courseName: string; courseCode?: string; levels: string[]; }

export interface CompleteOnboardingPayload {
  institutionId: string;
  institution: string;
  faculty: string;
  department: string;
  program?: string;
  studyLevel?: string;
  coursesTaught?: string[];
  teachingAssignments?: TeachingAssignmentPayload[];
  bio?: string;
  academicHandle?: string;
  socialHandle?: string;
}

export interface AcademicCatalogueSubmission { id: string; entryType: 'institution' | 'faculty' | 'department'; name: string; parentInstitutionId?: string; parentFacultyId?: string; parentFacultySubmissionId?: string; parentInstitutionName?: string; parentFacultyName?: string; state?: string; city?: string; ownership?: string; institutionType?: InstitutionType; status: 'pending' | 'approved' | 'rejected'; submittedBy: string; createdAt: string; reviewNote?: string; sourceUrl?: string; verifiedAt?: string; }

export const academicApi = {
  institutions: () => apiRequest<InstitutionOption[]>('/institutions'),
  catalogueSubmissions: () => apiRequest<AcademicCatalogueSubmission[]>('/institutions/submissions'),
  reviewCatalogueSubmission: (id: string, status: 'approved' | 'rejected', reviewNote?: string, provenance?: { sourceUrl?: string; verifiedAt?: string }) => apiRequest<AcademicCatalogueSubmission>('/institutions/submissions/' + encodeURIComponent(id) + '/review', { method: 'PATCH', body: JSON.stringify({ status, reviewNote, ...provenance }) }),
  courses: (institutionId: string) =>
    apiRequest<CourseOption[]>(`/courses?institutionId=${encodeURIComponent(institutionId)}`),
  completeOnboarding: (payload: CompleteOnboardingPayload) =>
    apiRequest<{ user: import('../types').User }>('/auth/onboarding', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
