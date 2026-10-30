export type UserRole = 'student' | 'lecturer' | 'moderator' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  institution?: string;
  faculty?: string;
  department?: string;
  programme?: string;
  coursesTaught?: string[];
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
  level?: string;
  author?: string;
  tags?: string[];
  views?: number;
  downloads?: number;
  moderationStatus?: 'pending' | 'approved' | 'rejected' | 'flagged' | string;
  isVerified?: boolean;
  uploadedBy?: string;
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
  [key: string]: unknown;
}
