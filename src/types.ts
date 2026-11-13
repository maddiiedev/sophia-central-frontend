export type UserRole = 'student' | 'lecturer' | 'reviewer' | 'moderator' | 'admin';

export interface User {
  id: string;
  uniqueId?: string;
  institutionId?: string | null;
  name: string;
  email: string;
  role: UserRole;
  institution?: string;
  faculty?: string;
  department?: string;
  programme?: string;
  coursesTaught?: string[];
  teachingAssignments?: Array<{ courseName: string; courseCode?: string; levels: string[] }>;
  studyLevel?: string;
  bio?: string;
  isProfileComplete?: boolean;
  avatar?: string;
  profileImage?: string;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  firstName?: string;
  lastName?: string;
  handle?: string;
  academicHandle?: string;
  socialHandle?: string;
  authProvider?: 'email' | 'google' | 'apple' | 'github' | 'linkedin' | 'instagram' | 'twitter';
  socialLinks?: { linkedin?: string; instagram?: string; twitter?: string };
}

export interface Resource {
  id: string;
  title: string;
  description?: string;
  type: string;
  course?: string;
  topic?: string;
  institution?: string;
  faculty?: string;
  department?: string;
  origin?: 'community_upload' | 'open_source';
  level?: string;
  author?: string;
  tags?: string[];
  views?: number;
  downloads?: number;
  moderationStatus?: 'pending' | 'approved' | 'rejected' | 'flagged' | string;
  isVerified?: boolean;
  uploadedBy?: string;
  uploaderId?: string | null;
  createdAt?: string;
  [key: string]: unknown;
}

export interface ModerationItem {
  id: string;
  title: string;
  type?: string;
  course?: string;
  institution?: string;
  uploadedBy?: string;
  summary?: string;
  status?: string;
  fileUrl?: string;
  level?: string;
  topic?: string;
  tags?: string[];
  createdAt?: string;
  isVerified?: boolean;
  assignedReviewerId?: string | null;
  [key: string]: unknown;
}
