import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, BookOpen, Users } from 'lucide-react';
import { BrandLogo } from '../components/brand/BrandLogo';
import { useAuth } from '../context/AuthContext';
import { registerSchema, type RegisterValues } from '../lib/validation';
import { saveRegistrationDraft } from '../lib/registration-session';

export function OnboardingPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { register: registerUser } = useAuth();
  const role: 'student' | 'lecturer' = params.get('role') === 'lecturer' ? 'lecturer' : 'student';
  const [submitError, setSubmitError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      referralCode: role === 'student' ? params.get('ref') || '' : '',
      handle: '',
      termsAccepted: false,
    },
  });

  const onSubmit = async (values: RegisterValues) => {
    setSubmitError('');
    try {
      const draft = {
        email: values.email.trim().toLowerCase(),
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        academicHandle: values.handle.trim().replace(/^@+/, '').toLowerCase(),
        role,
        referralCode: role === 'student' ? values.referralCode?.trim() || undefined : undefined,
      };
      const registration = await registerUser({
        firstName: draft.firstName,
        lastName: draft.lastName,
        email: draft.email,
        handle: draft.academicHandle,
        role,
        referralCode: draft.referralCode,
      });
      saveRegistrationDraft(draft);
      navigate(`/verify-email?email=${encodeURIComponent(draft.email)}`, { replace: true, state: registration });
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      setSubmitError(message.toLowerCase().includes('academic handle') || message.toLowerCase().includes('username')
        ? 'That academic handle is already in use. Please choose another username.'
        : message.toLowerCase().includes('already exists') || message.toLowerCase().includes('conflict')
          ? 'An account already exists for this email. Sign in instead, or use Forgot password if you cannot access it.'
          : message || 'Unable to create your account. Please try again.');
    }
  };

  return (
    <main className="min-h-screen bg-[#F3F6FC] px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto grid min-h-[720px] w-full max-w-6xl overflow-hidden rounded-[28px] border border-[#DCE4EF] bg-white shadow-[0_24px_70px_rgba(7,30,84,0.10)] lg:grid-cols-[0.92fr_1.08fr]">
        <aside className="relative isolate flex min-h-[300px] flex-col justify-between overflow-hidden bg-[#091F5B] p-7 text-white sm:p-10 lg:min-h-full lg:p-12">
          <div className="absolute inset-0 -z-20 bg-cover bg-center opacity-35" style={{ backgroundImage: "url('/images/students-collaborating.webp')" }} />
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#091F5B]/95 via-[#1736A2]/90 to-[#6121D0]/85" />
          <BrandLogo variant="full" tone="dark" className="rounded-lg bg-white/95 px-3 py-2" />
          <div className="relative mt-12 max-w-lg lg:mt-20">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">{role === 'lecturer' ? 'Lecturer account' : 'Student account'}</p>
            <h1 className="mt-4 text-3xl font-semibold leading-tight text-white sm:text-4xl">A more connected way to learn and share knowledge.</h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-blue-50/95 sm:text-base">
              {role === 'lecturer'
                ? 'Create your account to connect with your academic community and make useful learning resources available to students.'
                : 'Create your account to discover learning resources, organise your studies, and connect with your academic community.'}
            </p>
          </div>
          <div className="relative mt-10 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 p-3.5 text-sm text-white backdrop-blur-sm">
              <BookOpen size={19} className="shrink-0 text-[#D9C6FF]" />
              <span>Academic resources in one place</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 p-3.5 text-sm text-white backdrop-blur-sm">
              <Users size={19} className="shrink-0 text-[#D9C6FF]" />
              <span>Learn with your community</span>
            </div>
          </div>
        </aside>

        <section className="flex items-center justify-center px-5 py-9 sm:px-10 sm:py-12 lg:px-14">
          <div className="w-full max-w-md">
            <div className="mb-7">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#6121D0]">Create account</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#091F5B]">Get started</h2>
              <p className="mt-2 text-sm leading-6 text-[#64748B]">Enter your details to begin your Sophis Central journey.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} autoComplete="on" className="space-y-4" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="mb-2 block text-sm font-medium text-[#091F5B]">First name</label>
                  <input id="firstName" {...register('firstName')} autoComplete="given-name" className="brand-input" />
                  {errors.firstName && <p className="mt-1 text-sm text-rose-600">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label htmlFor="lastName" className="mb-2 block text-sm font-medium text-[#091F5B]">Last name</label>
                  <input id="lastName" {...register('lastName')} autoComplete="family-name" className="brand-input" />
                  {errors.lastName && <p className="mt-1 text-sm text-rose-600">{errors.lastName.message}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-[#091F5B]">Email address</label>
                <input id="email" type="email" {...register('email')} autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="you@example.com" className="brand-input" />
                {errors.email && <p className="mt-1 text-sm text-rose-600">{errors.email.message}</p>}
              </div>

              <div>
                <label htmlFor="handle" className="mb-2 block text-sm font-medium text-[#091F5B]">Academic handle</label>
                <input id="handle" {...register('handle', { onChange: (event) => { event.target.value = event.target.value.replace(/^@+/, '').toLowerCase(); } })} required autoCapitalize="none" autoComplete="username" spellCheck={false} minLength={3} maxLength={30} placeholder="username" className="brand-input" />
                {errors.handle && <p className="mt-1 text-sm text-rose-600">{errors.handle.message}</p>}
                <p className="mt-1 text-xs leading-5 text-[#71809A]">Use 3–30 lowercase letters, numbers, periods, or underscores.</p>
              </div>

              {role === 'student' && (
                <div>
                  <label htmlFor="referralCode" className="mb-2 block text-sm font-medium text-[#091F5B]">Student referral code <span className="font-normal text-[#71809A]">(optional)</span></label>
                  <input id="referralCode" {...register('referralCode')} autoCapitalize="characters" autoComplete="off" spellCheck={false} maxLength={32} placeholder="Enter a student referral code" className="brand-input" />
                  {errors.referralCode && <p className="mt-1 text-sm text-rose-600">{errors.referralCode.message}</p>}
                  <p className="mt-1 text-xs leading-5 text-[#71809A]">Have a code from another Sophis Central student? Enter it here.</p>
                </div>
              )}

              <div className="rounded-xl border border-[#E4EAF5] bg-[#F8FAFE] p-3.5">
                <label htmlFor="termsAccepted" className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-[#52627B]">
                  <input
                    id="termsAccepted"
                    type="checkbox"
                    {...register('termsAccepted')}
                    aria-invalid={Boolean(errors.termsAccepted)}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-[#B8C5D8] accent-[#004BEC] focus:ring-2 focus:ring-[#004BEC]/20"
                  />
                  <span>
                    I agree to the <Link to="/terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#004BEC] underline decoration-[#004BEC]/40 underline-offset-2 hover:text-[#6121D0]">Terms of Use</Link> and acknowledge the <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#004BEC] underline decoration-[#004BEC]/40 underline-offset-2 hover:text-[#6121D0]">Privacy Policy</Link>.
                  </span>
                </label>
                {errors.termsAccepted && <p role="alert" className="mt-2 pl-7 text-xs font-medium text-rose-600">{errors.termsAccepted.message}</p>}
              </div>

              {submitError && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{submitError}</div>}

              <button type="submit" disabled={isSubmitting} className="brand-button flex w-full items-center justify-center gap-2 px-4 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? 'Sending verification link...' : <>Continue to email verification <ArrowRight size={17} /></>}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-[#5C6982]">
              {role === 'student'
                ? <Link to="/onboarding?role=lecturer" className="font-semibold text-[#004BEC] hover:text-[#6121D0]">Join as a lecturer instead</Link>
                : <Link to="/onboarding" className="font-semibold text-[#004BEC] hover:text-[#6121D0]">Join as a student instead</Link>}
            </p>
            <p className="mt-3 text-center text-sm text-[#5C6982]">Already have an account? <Link to="/login" className="font-semibold text-[#004BEC] hover:text-[#6121D0]">Sign in</Link></p>
          </div>
        </section>
      </div>
    </main>
  );
}
