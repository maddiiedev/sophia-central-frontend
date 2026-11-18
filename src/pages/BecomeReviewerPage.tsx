import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { BrandLogo } from '../components/brand/BrandLogo';
import { authApi } from '../api/auth';
import { setCsrfToken } from '../lib/api/client';

export function BecomeReviewerPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [academicHandle, setAcademicHandle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [comingSoon, setComingSoon] = useState(false);
  const recruitmentOpen = import.meta.env.VITE_REVIEWER_RECRUITMENT_OPEN === 'true';
  const testAccountEmail = (import.meta.env.VITE_REVIEWER_TEST_ACCOUNT_EMAIL || '').trim().toLowerCase();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const submittedEmail = email.trim().toLowerCase();
    if (!recruitmentOpen && (!testAccountEmail || submittedEmail !== testAccountEmail)) {
      setComingSoon(true);
      return;
    }
    setComingSoon(false);
    setBusy(true);
    try {
      const csrf = await authApi.csrf();
      setCsrfToken(csrf.csrfToken);
      const result = await authApi.checkReviewerRegistrationIntent({
        email: email.trim().toLowerCase(),
        academicHandle: academicHandle.trim().replace(/^@+/, '').toLowerCase(),
      });
      if (result.requiresSignIn) {
        const identifier = result.signInIdentifier || email.trim().toLowerCase();
        navigate(`/login?intent=reviewer&identifier=${encodeURIComponent(identifier)}`, { replace: true });
        return;
      }
      navigate(`/onboarding?role=reviewer&email=${encodeURIComponent(email.trim().toLowerCase())}&handle=${encodeURIComponent(academicHandle.trim().replace(/^@+/, '').toLowerCase())}`, { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'We could not check these details right now. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F3F6FC] px-4 py-8 sm:px-6">
      <section className="w-full max-w-xl rounded-3xl border border-[#DCE4EF] bg-white p-6 shadow-[0_24px_70px_rgba(7,30,84,0.10)] sm:p-9">
        <Link to="/" aria-label="Sophis Central homepage" className="inline-flex rounded-lg bg-white p-2"><BrandLogo variant="full" tone="light" /></Link>
        <div className="mt-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0EBFF] text-[#6121D0]"><ShieldCheck size={24} /></div>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-[#6121D0]">Academic reviewing</p>
        <h1 className="mt-2 text-3xl font-bold text-[#091F5B]">Become a Reviewer</h1>
        <p className="mt-3 text-sm leading-6 text-[#52627B]">Enter your email and academic handle. We’ll check whether they are already linked to a Sophis Central account so you can continue with the right account instead of creating a duplicate.</p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block text-sm font-semibold text-[#091F5B]">Email address
            <input required type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" className="brand-input mt-2" />
          </label>
          <label className="block text-sm font-semibold text-[#091F5B]">Academic handle
            <input required minLength={3} maxLength={30} autoCapitalize="none" autoComplete="username" spellCheck={false} value={academicHandle} onChange={event => setAcademicHandle(event.target.value.replace(/^@+/, '').toLowerCase())} placeholder="yourhandle" className="brand-input mt-2" />
          </label>
          {comingSoon && <div role="status" className="mt-6 rounded-2xl border border-[#E4DDF8] bg-[#F7F4FF] p-5 text-center"><p className="text-lg font-bold text-[#091F5B]">Applications are currently closed</p><p className="mt-2 text-sm leading-6 text-[#52627B]">Academic Reviewer applications are not currently being accepted. Please check back for an announcement when applications reopen.</p></div>}
          {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
          <button type="submit" disabled={busy || !email.trim() || !academicHandle.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#6121D0] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#5120B0] disabled:cursor-not-allowed disabled:opacity-60">
            {busy ? 'Checking details…' : 'Continue'} {!busy && <ArrowRight size={17} />}
          </button>
        </form>
        <p className="mt-5 text-center text-xs leading-5 text-[#64748B]">If these details are linked to an existing account, sign in and apply from your Student or Lecturer dashboard. If they are not, you can continue with an External Reviewer registration.</p>
        <p className="mt-5 text-center text-sm text-[#52627B]">Already know your account details? <Link to="/login?intent=reviewer" className="font-semibold text-[#6121D0] underline underline-offset-4">Sign in</Link></p>
      </section>
    </main>
  );
}
