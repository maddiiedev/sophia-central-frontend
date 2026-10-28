import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BrandLogo } from '../components/brand/BrandLogo';
import { authApi } from '../api/auth';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    if (!token) { setError('This reset link is missing its token. Request a new password reset link.'); return; }
    if (password !== confirmPassword) { setError('The passwords do not match.'); return; }
    setIsSubmitting(true);
    try {
      const response = await authApi.resetPassword(token, password);
      setMessage(response.message || 'Password reset successfully. You can now sign in.');
      setComplete(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'This reset link may have expired. Request a new one and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return <main className="flex min-h-screen items-center justify-center bg-white px-4 py-10"><section className="w-full max-w-lg rounded-3xl border border-[#DCE4EF] bg-white p-7 shadow-xl sm:p-10">
    <div className="mb-8 inline-flex w-fit items-center justify-center rounded-full bg-white px-3 py-2"><BrandLogo variant="full" linked={false} className="w-[112px]" /></div>
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2C36D9]">Account security</p>
    <h1 className="mt-3 text-3xl font-bold text-[#091F5B]">Set a new password</h1>
    <p className="mt-4 text-sm leading-6 text-[#5C6982]">Choose a new password with at least 8 characters. Reset links can only be used once and expire after 30 minutes.</p>
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div><label htmlFor="new-password" className="mb-2 block text-sm font-medium text-[#091F5B]">New password</label><input id="new-password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} className="brand-input" disabled={complete} /></div>
      <div><label htmlFor="confirm-password" className="mb-2 block text-sm font-medium text-[#091F5B]">Confirm new password</label><input id="confirm-password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="brand-input" disabled={complete} /></div>
      {message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">{message}</p>}
      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-900">{error}</p>}
      {!complete && <button type="submit" disabled={isSubmitting} className="brand-button w-full px-4 py-3 font-semibold disabled:opacity-60">{isSubmitting ? 'Updating password…' : 'Reset password'}</button>}
    </form>
    <Link to="/login" className="mt-4 inline-flex w-full justify-center rounded-xl border border-[#DCE4EF] px-4 py-3 font-semibold text-[#2C36D9]">Back to sign in</Link>
    {error && <Link to="/forgot-password" className="mt-3 inline-flex w-full justify-center text-sm font-semibold text-[#2C36D9]">Request a new reset link</Link>}
  </section></main>;
}
