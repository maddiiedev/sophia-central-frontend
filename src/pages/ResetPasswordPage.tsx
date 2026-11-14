import { useState, type FormEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { BrandLogo } from '../components/brand/BrandLogo';
import { authApi } from '../api/auth';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);

  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
  const canSubmit = Boolean(token) && password.length >= 8 && passwordsMatch && !isSubmitting && !complete;

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

  return <main className="flex min-h-screen items-center justify-center bg-[#F3F6FC] px-4 py-8 sm:px-6"><section className="w-full max-w-lg rounded-2xl border border-[#DCE4EF] bg-white p-6 shadow-sm sm:p-9">
    <div className="mb-8 inline-flex w-fit items-center justify-center rounded-full bg-white px-1 py-1"><BrandLogo variant="full" linked={false} className="w-fit" /></div>
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2C36D9]">Account security</p>
    <h1 className="mt-3 text-3xl font-semibold text-[#091F5B]">Set a new password</h1>
    <p className="mt-4 text-sm leading-6 text-[#5C6982]">Choose a new password with at least 8 characters. Reset links can only be used once and expire after 30 minutes.</p>
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="new-password" className="mb-2 block text-sm font-medium text-[#091F5B]">New password</label>
        <div className="relative">
          <input id="new-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required minLength={8} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} className="brand-input pr-12" disabled={complete} />
          <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#5C6982] transition hover:bg-[#F3F6FC] focus:outline-none focus:ring-2 focus:ring-[#6121D0]" aria-label={showPassword ? 'Hide new password' : 'Show new password'} aria-pressed={showPassword} disabled={complete}>
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
      <div>
        <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium text-[#091F5B]">Confirm new password</label>
        <div className="relative">
          <input id="confirm-password" type={showConfirmPassword ? 'text' : 'password'} autoComplete="new-password" required minLength={8} maxLength={128} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="brand-input pr-12" disabled={complete} aria-invalid={Boolean(confirmPassword) && !passwordsMatch} />
          <button type="button" onClick={() => setShowConfirmPassword((visible) => !visible)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#5C6982] transition hover:bg-[#F3F6FC] focus:outline-none focus:ring-2 focus:ring-[#6121D0]" aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'} aria-pressed={showConfirmPassword} disabled={complete}>
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {confirmPassword && !passwordsMatch && <p className="mt-1 text-sm text-rose-600">Passwords do not match.</p>}
        {passwordsMatch && <p className="mt-1 text-sm text-emerald-700">Passwords match.</p>}
      </div>
      {message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">{message}</p>}
      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-900">{error}</p>}
      {!complete && <button type="submit" disabled={!canSubmit} className="brand-button w-full px-4 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? 'Updating password…' : 'Reset password'}</button>}
    </form>
    <Link to="/login" className="mt-4 inline-flex w-full justify-center rounded-xl border border-[#DCE4EF] px-4 py-3 font-semibold text-[#2C36D9]">Back to sign in</Link>
    {error && <Link to="/forgot-password" className="mt-3 inline-flex w-full justify-center text-sm font-semibold text-[#2C36D9]">Request a new reset link</Link>}
  </section></main>;
}
