import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../components/brand/BrandLogo';
import { authApi } from '../api/auth';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setError('');
    setIsSubmitting(true);
    try {
      const response = await authApi.requestPasswordReset(email.trim());
      setMessage(response.message || 'If an account exists for that email, password reset instructions will be sent.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to request a reset link right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return <main className="flex min-h-screen items-center justify-center bg-white px-4 py-10"><section className="w-full max-w-lg rounded-3xl border border-[#DCE4EF] bg-white p-7 shadow-xl sm:p-10">
    <div className="mb-8 inline-flex w-fit items-center justify-center rounded-full bg-white px-1 py-1"><BrandLogo variant="full" linked={false} className="w-fit" /></div>
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2C36D9]">Account recovery</p>
    <h1 className="mt-3 text-3xl font-bold text-[#091F5B]">Forgot your password?</h1>
    <p className="mt-4 text-sm leading-6 text-[#5C6982]">Enter the email address associated with your account. If it exists, we'll send a secure reset link that expires in 30 minutes.</p>
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div><label htmlFor="recovery-email" className="mb-2 block text-sm font-medium text-[#091F5B]">Email address</label><input id="recovery-email" type="email" autoComplete="email" required maxLength={320} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="brand-input" /></div>
      {message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">{message}</p>}
      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-900">{error}</p>}
      <button type="submit" disabled={isSubmitting} className="brand-button w-full px-4 py-3 font-semibold disabled:opacity-60">{isSubmitting ? 'Sending request…' : 'Send reset link'}</button>
    </form>
    <Link to="/login" className="mt-4 inline-flex w-full justify-center rounded-xl border border-[#DCE4EF] px-4 py-3 font-semibold text-[#2C36D9]">Back to sign in</Link>
  </section></main>;
}
