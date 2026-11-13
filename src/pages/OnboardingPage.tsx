import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../context/AuthContext';
import { registerSchema, type RegisterValues } from '../lib/validation';
import { saveRegistrationDraft } from '../lib/registration-session';

export function OnboardingPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { register: registerUser } = useAuth();
  const role: 'student' | 'lecturer' = params.get('role') === 'lecturer' ? 'lecturer' : 'student';
  const [submitError, setSubmitError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema), defaultValues: { firstName: '', lastName: '', email: '', referralCode: role === 'student' ? params.get('ref') || '' : '', handle: '' } });
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
      setSubmitError(message.toLowerCase().includes('academic handle') || message.toLowerCase().includes('username') ? 'That academic handle is already in use. Please choose another username.' : message.toLowerCase().includes('already exists') || message.toLowerCase().includes('conflict') ? 'An account already exists for this email. Sign in instead, or use Forgot password if you cannot access it.' : message || 'Unable to create your account. Please try again.');
    }
  };
  return <div className="flex min-h-screen items-center justify-center bg-white px-6 py-10"><div className="grid w-full max-w-6xl overflow-hidden rounded-[28px] border border-[#DCE4EF] bg-white shadow-[0_24px_70px_rgba(7,30,84,0.12)] lg:grid-cols-[1.1fr_0.9fr]"><div className="brand-purple-section relative flex flex-col justify-center gap-10 p-8 text-white lg:min-h-full lg:justify-start lg:gap-0 lg:p-10"><div className={`mb-8 -mt-4 flex w-full justify-center -translate-y-0 lg:absolute lg:left-10 lg:right-10 lg:top-24 lg:z-10 lg:mb-0 lg:mt-0 lg:translate-y-0`}><div className="whitespace-nowrap rounded-full border border-white/25 bg-white/10 px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-white sm:px-6 sm:text-sm sm:tracking-[0.22em]">{role === 'lecturer' ? 'Lecturer onboarding' : 'Student onboarding'}</div></div><div className="translate-y-2 lg:relative lg:flex-1 lg:translate-y-0"><div className="lg:absolute lg:left-0 lg:right-0 lg:top-[130px]"><h1 className={`mt-6 max-w-md text-4xl font-semibold text-white lg:mt-0 lg:text-5xl translate-y-2`}>{role === 'lecturer' ? 'Build your lecturer workspace.' : 'Build your academic hub.'}</h1><p className="mt-5 max-w-lg translate-y-2 text-white/90">{role === 'lecturer' ? 'Verify your institution, add your faculty, department and courses, then submit resources for review.' : 'Discover verified learning resources, organise your studies, and learn with Sophis Central.'}</p></div><div className="mt-10 space-y-4 text-sm text-white/90 lg:absolute lg:left-0 lg:right-0 lg:top-[384px] lg:mt-0"><div className="rounded-2xl border border-white/15 bg-white/10 p-4">Institution-aware academic onboarding</div><div className="rounded-2xl border border-white/15 bg-white/10 p-4">Role-specific dashboard and tools</div><div className="rounded-2xl border border-white/15 bg-white/10 p-4">Your profile remains editable from Account & Settings</div></div></div></div><div className="flex items-center justify-center p-6 lg:p-8"><div className="w-full max-w-md"><div className="mb-6"><p className="text-[10px] uppercase tracking-[0.22em] text-[#2C36D9]">Create account</p><h2 className="mt-2 text-3xl font-semibold text-[#091F5B]">Get started</h2></div><form onSubmit={handleSubmit(onSubmit)} autoComplete="on" className="space-y-4" noValidate><div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="firstName" className="mb-2 block text-sm text-[#091F5B]">First name</label><input id="firstName" {...register('firstName')} autoComplete="given-name" className="brand-input" />{errors.firstName && <p className="mt-1 text-sm text-rose-600">{errors.firstName.message}</p>}</div><div><label htmlFor="lastName" className="mb-2 block text-sm text-[#091F5B]">Last name</label><input id="lastName" {...register('lastName')} autoComplete="family-name" className="brand-input" />{errors.lastName && <p className="mt-1 text-sm text-rose-600">{errors.lastName.message}</p>}</div></div><div><label htmlFor="email" className="mb-2 block text-sm text-[#091F5B]">Email</label><input id="email" type="email" {...register('email')} autoComplete="email" autoCapitalize="none" spellCheck={false} className="brand-input" />{errors.email && <p className="mt-1 text-sm text-rose-600">{errors.email.message}</p>}</div><p className="rounded-xl border border-[#DCE4EF] bg-[#F8FAFD] p-3 text-xs leading-5 text-[#5C6982]">You will create your password after verifying your email. Your account and permanent ID are created only after you complete your academic profile.</p><div><label htmlFor="handle" className="mb-2 block text-sm text-[#091F5B]">Academic handle</label><input id="handle" {...register('handle', { onChange: (event) => { event.target.value = event.target.value.replace(/^@+/, '').toLowerCase(); } })} required autoCapitalize="none" autoComplete="username" spellCheck={false} minLength={3} maxLength={30} placeholder="username" className="brand-input" />{errors.handle && <p className="mt-1 text-sm text-rose-600">{errors.handle.message}</p>}<p className="mt-1 text-xs text-[#71809A]">Your username must be unique. Use 3–30 lowercase letters, numbers, periods, or underscores.</p></div>{role === 'student' && <div><label htmlFor="referralCode" className="mb-2 block text-sm text-[#091F5B]">Student referral code <span className="text-[#71809A]">(optional)</span></label><input id="referralCode" {...register('referralCode')} autoCapitalize="characters" autoComplete="off" spellCheck={false} maxLength={32} placeholder="Enter a student referral code" className="brand-input" />{errors.referralCode && <p className="mt-1 text-sm text-rose-600">{errors.referralCode.message}</p>}<p className="mt-1 text-xs text-[#71809A]">Have a code from another Sophis Central student? Enter it here to support their referral reward.</p></div>}{submitError && <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700">{submitError}</div>}<button type="submit" disabled={isSubmitting} className="brand-button w-full px-4 py-3 font-semibold disabled:opacity-60">{isSubmitting ? 'Sending verification link...' : 'Continue to email verification'}</button></form><p className="mt-5 text-center text-sm text-[#5C6982]">{role === 'student' ? <Link to="/onboarding?role=lecturer" className="font-semibold text-[#2C36D9]">Join as a lecturer instead</Link> : <Link to="/onboarding" className="font-semibold text-[#2C36D9]">Join as a student instead</Link>}</p><p className="mt-3 text-center text-sm text-[#5C6982]">I already have an account? <Link to="/login" className="font-semibold text-[#2C36D9] hover:text-[#6121D0]">Sign in</Link></p></div></div></div></div>;
}
