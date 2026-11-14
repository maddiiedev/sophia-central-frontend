import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/auth';
import { PasswordInput } from '../components/PasswordInput';
import { clearRegistrationDraft, readRegistrationDraft, savePreAccountSession } from '../lib/registration-session';

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const registrationNotice = location.state as { emailSent?: boolean; message?: string } | null;
  const token = params.get('token') || '';
  const [email, setEmail] = useState(params.get('email') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationState, setVerificationState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [verificationMessage, setVerificationMessage] = useState(
    token ? 'Your email link is ready. Set your password below to verify your email.' : registrationNotice?.message || 'Check your inbox and spam folder for your activation link.',
  );
  const [resendMessage, setResendMessage] = useState('');
  const [resendError, setResendError] = useState('');
  const [isResending, setIsResending] = useState(false);

  const confirm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password.length < 8) {
      setVerificationState('error');
      setVerificationMessage('Your password must contain at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setVerificationState('error');
      setVerificationMessage('The passwords do not match.');
      return;
    }
    setVerificationState('loading');
    setVerificationMessage('Verifying your email and preparing your onboarding session…');
    try {
      const response = await authApi.confirmEmailVerification(token, password);
      if (response.onboardingToken && response.preAccount) {
        savePreAccountSession({ ...response.preAccount, onboardingToken: response.onboardingToken });
        clearRegistrationDraft();
        setVerificationState('success');
        setVerificationMessage(response.message);
        navigate('/onboarding/profile', { replace: true });
        return;
      }
      clearRegistrationDraft();
      setVerificationState('success');
      setVerificationMessage(response.message);
    } catch (error) {
      setVerificationState('error');
      setVerificationMessage(error instanceof Error ? error.message : 'This activation link is invalid or has expired.');
    }
  };

  const resend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResendMessage('');
    setResendError('');
    if (!email.trim()) {
      setResendError('Enter the email address you used to register.');
      return;
    }
    setIsResending(true);
    try {
      const draft = readRegistrationDraft();
      if (!draft || draft.email.toLowerCase() !== email.trim().toLowerCase()) {
        throw new Error('For security, this registration can only be resent from the browser where it was started. Return to account creation and enter your details again if you no longer have that session.');
      }
      const response = await authApi.resendEmailVerification(draft);
      setResendMessage(response.message);
    } catch (error) {
      setResendError(error instanceof Error ? error.message : 'Unable to request a new verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F3F6FC] px-4 py-8 sm:px-6">
      <section className="w-full max-w-lg rounded-2xl border border-[#DCE4EF] bg-white p-6 shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2C36D9]">Sophis Central</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#091F5B]">Verify your email</h1>
        <div role={verificationState === 'error' || registrationNotice?.emailSent === false ? 'alert' : 'status'} className="mt-5 rounded-xl border border-[#DCE4EF] bg-[#F7F8FC] px-4 py-3 text-sm text-[#40516E]">{verificationMessage}</div>
        {token && verificationState !== 'success' && (
          <>
            <p className="mt-5 text-sm leading-6 text-[#5C6982]">For security, Sophis Central does not create an account or store your password in the database at this stage. Choose your password now. After email verification, you will complete your academic profile before your account and permanent ID are created. The verification link expires after 24 hours.</p>
            <form onSubmit={confirm} className="mt-6 space-y-3">
              <label htmlFor="verified-password" className="block text-sm font-medium text-[#091F5B]">Create password</label>
              <PasswordInput id="verified-password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className="brand-input pr-11" />
              <label htmlFor="verified-password-confirm" className="block text-sm font-medium text-[#091F5B]">Confirm password</label>
              <PasswordInput id="verified-password-confirm" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="brand-input pr-11" />
              <button type="submit" disabled={verificationState === 'loading'} className="brand-button w-full px-4 py-3 font-semibold disabled:opacity-60">{verificationState === 'loading' ? 'Verifying email…' : 'Verify email and continue'}</button>
            </form>
          </>
        )}
        {(!token || verificationState === 'error') && (
          <>
            <p className="mt-5 text-sm leading-6 text-[#5C6982]">Confirm that you own the email address used to register. After verification, you will complete your academic profile before your account is created. The verification link expires after 24 hours.</p>
            <form onSubmit={resend} className="mt-6 space-y-3">
              <label htmlFor="verification-email" className="block text-sm font-medium text-[#091F5B]">Account email</label>
              <input id="verification-email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="brand-input" />
              {resendError && <p role="alert" className="text-sm text-rose-700">{resendError}</p>}
              {resendMessage && <p role="status" className="text-sm text-emerald-700">{resendMessage}</p>}
              <button type="submit" disabled={isResending} className="brand-button w-full px-4 py-3 font-semibold disabled:opacity-60">{isResending ? 'Sending…' : 'Resend verification email'}</button>
            </form>
          </>
        )}
        <p className="mt-7 text-center text-sm text-[#5C6982]"><Link to="/login" className="font-semibold text-[#2C36D9] hover:text-[#6121D0]">Return to sign in</Link></p>
      </section>
    </main>
  );
}
