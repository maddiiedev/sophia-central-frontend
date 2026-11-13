export type RegistrationDraft = {
  email: string;
  firstName: string;
  lastName: string;
  academicHandle: string;
  role: 'student' | 'lecturer';
  referralCode?: string;
};

export type PreAccountSession = RegistrationDraft & {
  onboardingToken: string;
};

const REGISTRATION_DRAFT_KEY = 'sophis-central-registration-draft';
const PRE_ACCOUNT_KEY = 'sophis-central-pre-account';

export function saveRegistrationDraft(value: RegistrationDraft): void {
  try { window.sessionStorage.setItem(REGISTRATION_DRAFT_KEY, JSON.stringify(value)); } catch { /* Session storage is optional. */ }
}
export function readRegistrationDraft(): RegistrationDraft | null {
  try {
    const value = window.sessionStorage.getItem(REGISTRATION_DRAFT_KEY);
    if (!value) return null;
    const parsed = JSON.parse(value) as RegistrationDraft;
    return parsed?.email && parsed?.firstName && parsed?.lastName && parsed?.academicHandle && parsed?.role ? parsed : null;
  } catch { return null; }
}
export function clearRegistrationDraft(): void {
  try { window.sessionStorage.removeItem(REGISTRATION_DRAFT_KEY); } catch { /* Session storage is optional. */ }
}
export function savePreAccountSession(value: PreAccountSession): void {
  try { window.sessionStorage.setItem(PRE_ACCOUNT_KEY, JSON.stringify(value)); } catch { /* Session storage is optional. */ }
}
export function readPreAccountSession(): PreAccountSession | null {
  try {
    const value = window.sessionStorage.getItem(PRE_ACCOUNT_KEY);
    if (!value) return null;
    const parsed = JSON.parse(value) as PreAccountSession;
    return parsed?.onboardingToken && parsed?.email && parsed?.role ? parsed : null;
  } catch { return null; }
}
export function clearPreAccountSession(): void {
  try { window.sessionStorage.removeItem(PRE_ACCOUNT_KEY); } catch { /* Session storage is optional. */ }
}
