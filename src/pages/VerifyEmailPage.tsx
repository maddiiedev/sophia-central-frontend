import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/auth';

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const location = useLocation();
  const registrationNotice = location.state as { emailSent?: boolean; message?: string } | null;
  const token = params.get('token') || '';
  const [email, setEmail] = useState(params.get('email') || '');
  const [verificationState, setVerificationState] = useState<'idle' | 'loading' | 'success' | 'error'>(token ? 'loading' : 'idle');
  const [verificationMessage, setVerificationMessage] = useState(
    token ? 'Confirming your email address…' : registrationNotice?.message || 'Check your inbox and spam folder for your activation link.',
  );
  const [resendMessage, setResendMessage] = useState('');
  const [resendError, setResendError] = useState('');
  const [isResending, setIsResending] = useState(false);
  const verificationRequest = useRef<Promise<{ message: string }> | null>(null);

  useEffect(() => {
    if (!token) return;
    let active = true;
    setVerificationState('loading');
    const request = verificationRequest.current ?? (verificationRequest.current = authApi.confirmEmailVerification(token));
    request.then((response) => {
        if (!active) return;
        setVerificationState('success');
        setVerificationMessage(response.message);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setVerificationState('error');
        setVerificationMessage(error instanceof Error ? error.message : 'This activation link is invalid or has expired.');
      });
    return () => { active = false; };
  }, [token]);

  const resend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResendMessage('');
    setResendError('');
    if (!email.trim()) {
      setResendError('Enter the email address you used to create your account.');
      return;
    }
    setIsResending(true);
    try {
      const response = await authApi.resendEmailVerification(email.trim());
      setResendMessage(response.message);
    } catch (error) {
      setResendError(error instanceof Error ? error.message : 'Unable to request a new activation email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F8FC] px-4 py-10">
      <section className="w-full max-w-lg rounded-3xl border border-[#DCE4EF] bg-white p-7 shadow-[0_20px_60px_rgba(7,30,84,0.10)] sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2C36D9]">Sophis Central</p>
        <h1 className="mt-3 text-3xl font-bold text-[#091F5B]">Verify your email</h1>
        {verificationState === 'success' ? (
          <div role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{verificationMessage}</div>
        ) : (
          <div role={verificationState === 'error' || registrationNotice?.emailSent === false ? 'alert' : 'status'} className="mt-5 rounded-xl border border-[#DCE4EF] bg-[#F7F8FC] px-4 py-3 text-sm text-[#40516E]">{verificationMessage}</div>
        )}
        {verificationState !== 'success' && (
          <>
            <p className="mt-5 text-sm leading-6 text-[#5C6982]">
              Before you can sign in, confirm that you own the email address used to create your account. The activation link expires after 24 hours.
            </p>
            <form onSubmit={resend} className="mt-6 space-y-3">
              <label htmlFor="verification-email" className="block text-sm font-medium text-[#091F5B]">Account email</label>
              <input
                id="verification-email"
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="brand-input"
              />
              {resendError && <p role="alert" className="text-sm text-rose-700">{resendError}</p>}
              {resendMessage && <p role="status" className="text-sm text-emerald-700">{resendMessage}</p>}
              <button type="submit" disabled={isResending} className="brand-button w-full px-4 py-3 font-semibold disabled:opacity-60">
                {isResending ? 'Sending…' : 'Resend activation email'}
              </button>
            </form>
          </>
        )}
        <p className="mt-7 text-center text-sm text-[#5C6982]">
          <Link to="/login" className="font-semibold text-[#2C36D9] hover:text-[#6121D0]">Return to sign in</Link>
        </p>
      </section>
    </main>
  );
}
