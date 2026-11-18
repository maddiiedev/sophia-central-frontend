import { Link, Navigate, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { lazy, Suspense, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from './context/AuthContext';
import { apiRequest } from './lib/api/client';
import { ThemeProvider } from './context/ThemeContext';
import { AppShell } from './components/layout/AppShell';
import { BrandLogo } from './components/brand/BrandLogo';
import { BrandedPageLoaderFallback, BrandedPageLoaderProvider } from './components/brand/BrandedPageLoader';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';

import { PasswordInput } from './components/PasswordInput';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { loginSchema, type LoginValues } from './lib/validation';
import { SupportRequestsPanel } from './components/moderation/SupportRequestsPanel';
import { CookieConsentBanner, CookieSettingsPage } from './components/CookieConsent';
import { readPreAccountSession } from './lib/registration-session';

const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then((module) => ({ default: module.NotificationsPage })));
const OpenSourceResourcePage = lazy(() => import('./pages/OpenSourceResourcePage').then((module) => ({ default: module.OpenSourceResourcePage })));
const PublicResourcePage = lazy(() => import('./pages/PublicResourcePage').then((module) => ({ default: module.PublicResourcePage })));
const SavedResourcesPage = lazy(() => import('./pages/SavedResourcesPage').then((module) => ({ default: module.SavedResourcesPage })));
const UploadPage = lazy(() => import('./pages/UploadPage').then((module) => ({ default: module.UploadPage })));
const LecturerUploadPage = lazy(() => import('./pages/LecturerUploadPage').then((module) => ({ default: module.LecturerUploadPage })));
const WalletPage = lazy(() => import('./pages/WalletPage').then((module) => ({ default: module.WalletPage })));
const ModerationPage = lazy(() => import('./pages/ModerationPage').then((module) => ({ default: module.ModerationPage })));
const ReviewerDashboardPage = lazy(() => import('./pages/ReviewerDashboardPage').then((module) => ({ default: module.ReviewerDashboardPage })));
const ReviewerApplicationPage = lazy(() => import('./pages/ReviewerApplicationPage').then((module) => ({ default: module.ReviewerApplicationPage })));
const BecomeReviewerPage = lazy(() => import('./pages/BecomeReviewerPage').then((module) => ({ default: module.BecomeReviewerPage })));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage').then((module) => ({ default: module.AdminUsersPage })));
const WorkspaceSelectorPage = lazy(() => import('./pages/WorkspaceSelectorPage').then((module) => ({ default: module.WorkspaceSelectorPage })));
const ExternalReviewerTransitionPage = lazy(() => import('./pages/ExternalReviewerTransitionPage').then((module) => ({ default: module.ExternalReviewerTransitionPage })));
const LecturerDashboardPage = lazy(() => import('./pages/LecturerDashboardPage').then((module) => ({ default: module.LecturerDashboardPage })));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage').then((module) => ({ default: module.OnboardingPage })));
const ProfileOnboardingPage = lazy(() => import('./pages/ProfileOnboardingPage').then((module) => ({ default: module.ProfileOnboardingPage })));
const ProfileSettingsPage = lazy(() => import('./pages/ProfileSettingsPage').then((module) => ({ default: module.ProfileSettingsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((module) => ({ default: module.SettingsPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then((module) => ({ default: module.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then((module) => ({ default: module.ResetPasswordPage })));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage').then((module) => ({ default: module.VerifyEmailPage })));
const SupportPage = lazy(() => import('./pages/SupportPage').then((module) => ({ default: module.SupportPage })));
const AnalyticsWorkspacePage = lazy(() => import('./pages/AnalyticsWorkspacePage').then((module) => ({ default: module.AnalyticsWorkspacePage })));
const ModerationManagementPage = lazy(() => import('./pages/ModerationManagementPage').then((module) => ({ default: module.ModerationManagementPage })));
const WisdomPointsManagementPage = lazy(() => import('./pages/WisdomPointsManagementPage').then((module) => ({ default: module.WisdomPointsManagementPage })));
const LegalPage = lazy(() => import('./pages/LegalPage').then((module) => ({ default: module.LegalPage })));
const RefundPolicyPage = lazy(() => import('./pages/RefundPolicyPage').then((module) => ({ default: module.RefundPolicyPage })));
const CookiePolicyPage = lazy(() => import('./pages/CookiePolicyPage').then((module) => ({ default: module.CookiePolicyPage })));
const MyReportsPage = lazy(() => import('./pages/MyReportsPage').then((module) => ({ default: module.MyReportsPage })));
const ContactUsPage = lazy(() => import('./pages/ContactUsPage').then((module) => ({ default: module.ContactUsPage })));
const CareersPage = lazy(() => import('./pages/CareersPage').then((module) => ({ default: module.CareersPage })));
const CommunityPage = lazy(() => import('./pages/CommunityPage').then((module) => ({ default: module.CommunityPage })));
const HomePage = lazy(() => import('./pages/HomePage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const ModeratorDashboardPage = lazy(() => import('./pages/ModeratorDashboardPage').then((module) => ({ default: module.ModeratorDashboardPage })));
const LibraryPage = lazy(() => import('./pages/LibraryPage').then((module) => ({ default: module.LibraryPage })));
const OpenSourceLibraryPage = lazy(() => import('./pages/OpenSourceLibraryPage').then((module) => ({ default: module.OpenSourceLibraryPage })));
const AITutorPage = lazy(() => import('./pages/AITutorPage').then((module) => ({ default: module.AITutorPage })));
const ResourceReaderPage = lazy(() => import('./pages/ResourceReaderPage').then((module) => ({ default: module.ResourceReaderPage })));
const ChatPage = lazy(() => import('./pages/ChatPage').then((module) => ({ default: module.ChatPage })));


const PUBLIC_PAGE_SEO: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Sophis Central | AI-Powered Academic Learning Platform',
    description: 'Find course materials, past questions, research papers and projects. Connect with students and lecturers and get AI-powered study support on Sophis Central.',
  },
  '/library': {
    title: 'Academic Library | Sophis Central',
    description: 'Explore learning materials contributed by students and lecturers on Sophis Central.',
  },
  '/open-source-library': {
    title: 'Open Source Library | Sophis Central',
    description: 'Explore centrally imported open-access research publications on Sophis Central.',
  },
  '/community': {
    title: 'Sophis Central Community | Connect Beyond Campus',
    description: 'Connect with the wider Sophis Central community, follow official channels and get in touch from anywhere.',
  },
  '/contact': {
    title: 'Contact Sophis Central | Student and Lecturer Support',
    description: 'Get in touch with Sophis Central for platform questions, academic partnerships, support and general enquiries.',
  },
  '/careers': {
    title: 'Careers | Build the Future of Academic Learning with Sophis Central',
    description: 'Explore opportunities to contribute to an AI-powered academic learning and collaboration platform.',
  },
  '/terms': {
    title: 'Terms of Use | Sophis Central',
    description: 'Read the terms governing access to and use of the Sophis Central academic platform.',
  },
  '/privacy': {
    title: 'Privacy Policy | Sophis Central',
    description: 'Learn how Sophis Central handles account information, academic activity and personal data.',
  },
  '/cookie-policy': {
    title: 'Cookie Policy | Sophis Central',
    description: 'Understand the cookies and similar browser technologies used by Sophis Central and how to manage your choices.',
  },
  '/cookie-settings': {
    title: 'Cookie Settings | Sophis Central',
    description: 'Review and update your optional cookie and browser technology preferences on Sophis Central.',
  },
  '/financial-policy': {
    title: 'Financial Policy | Sophis Central',
    description: 'Understand how Sophis Central handles payments, Wisdom Points, lecturer revenue sharing, project payments and payouts.',
  },
  '/refund-policy': {
    title: 'Refund Policy | Sophis Central',
    description: 'Learn when Sophis Central purchases may qualify for a refund, how to submit a request and how refunds are processed.',
  },
};

function setMetaTag(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
}

function RouteSeo() {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname.replace(/\/+$/, '') || '/';
    const isPublicResource = pathname.startsWith('/open-resource/');
    const page = PUBLIC_PAGE_SEO[pathname] || (isPublicResource
      ? {
          title: 'Academic Learning Resource | Sophis Central',
          description: 'Explore an academic learning resource shared with the Sophis Central community.',
        }
      : null);
    const indexable = Boolean(page) && !isPublicResource;
    const title = page?.title || 'Your Academic Workspace | Sophis Central';
    const description = page?.description || 'Sign in to access your Sophis Central academic account and learning tools.';
    const configuredOrigin = import.meta.env.VITE_SITE_URL?.trim();
    const origin = (configuredOrigin || window.location.origin).replace(/\/+$/, '');
    const canonicalUrl = new URL(pathname, `${origin}/`).toString();
    const imageUrl = new URL('/sophia-central-logo.png', `${origin}/`).toString();

    document.title = title;
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'robots', indexable
      ? 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'
      : 'noindex,nofollow');
    setMetaTag('name', 'googlebot', indexable ? 'index,follow' : 'noindex,nofollow');
    setMetaTag('property', 'og:type', 'website');
    setMetaTag('property', 'og:site_name', 'Sophis Central');
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:image', imageUrl);
    setMetaTag('property', 'og:image:alt', 'Sophis Central logo');
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', imageUrl);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    let structuredData = document.getElementById('sophis-central-structured-data');
    if (!structuredData) {
      structuredData = document.createElement('script');
      structuredData.id = 'sophis-central-structured-data';
      structuredData.setAttribute('type', 'application/ld+json');
      document.head.appendChild(structuredData);
    }
    structuredData.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          name: 'Sophis Central',
          url: origin,
          logo: imageUrl,
        },
        {
          '@type': 'WebSite',
          name: 'Sophis Central',
          url: origin,
          inLanguage: 'en',
        },
        {
          '@type': 'SoftwareApplication',
          name: 'Sophis Central',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Web',
          description: 'An AI-powered higher-education platform for academic resources, study support and student-lecturer collaboration.',
          url: origin,
          image: imageUrl,
        },
        ...(indexable ? [{
          '@type': 'WebPage',
          name: title,
          description,
          url: canonicalUrl,
          isPartOf: { '@type': 'WebSite', name: 'Sophis Central', url: origin },
          inLanguage: 'en',
        }] : []),
      ],
    });
  }, [location.pathname]);

  return null;
}

function destinationForUser(user?: { role?: string; isProfileComplete?: boolean; hasReviewerAccess?: boolean } | null) {
  if (user?.role === 'student' || user?.role === 'lecturer') {
    if (user.isProfileComplete === false) return user.role === 'lecturer' ? '/lecturer/onboarding/profile' : '/student/onboarding/profile';
    if (user.hasReviewerAccess === true) {
      try {
        const preferred = window.localStorage.getItem('sophis-central-preferred-workspace');
        if (preferred === 'reviewer') return '/reviewer/dashboard';
        if (preferred === 'academic') return user.role === 'lecturer' ? '/lecturer/dashboard' : '/student/dashboard';
      } catch { /* A workspace preference is optional. */ }
      return '/workspace';
    }
  }
  if (user?.role === 'moderator') return '/moderation';
  if (user?.role === 'admin') return '/admin';
  if (user?.role === 'reviewer') return user.hasReviewerAccess === true ? '/reviewer/dashboard' : '/reviewer-application';
  if (user?.role === 'lecturer') return '/lecturer/dashboard';
  return '/student/dashboard';
}

function resolveRegistrationIntent(user: { role?: string; hasReviewerAccess?: boolean; academicAccountType?: string | null; isProfileComplete?: boolean } | null | undefined, intent?: string | null) {
  if (!user || !intent || !['student', 'lecturer', 'reviewer'].includes(intent)) return { path: destinationForUser(user) };
  if (user.role === 'student') {
    if (intent === 'lecturer') return { path: '/student/dashboard', error: 'This account is registered as a Student. Student and Lecturer identities cannot be combined or switched.' };
    if (intent === 'reviewer') return { path: user.hasReviewerAccess === true ? '/workspace' : '/student/dashboard' };
    return { path: '/student/dashboard' };
  }
  if (user.role === 'lecturer') {
    if (intent === 'student') return { path: '/lecturer/dashboard', error: 'This account is registered as a Lecturer. Lecturer and Student identities cannot be combined or switched.' };
    if (intent === 'reviewer') return { path: user.hasReviewerAccess === true ? '/workspace' : '/lecturer/dashboard' };
    return { path: '/lecturer/dashboard' };
  }
  if (user.role === 'reviewer') {
    if (intent === 'reviewer') return { path: user.hasReviewerAccess === true ? '/reviewer/dashboard' : '/reviewer-application' };
    if (user.academicAccountType !== 'external_reviewer') {
      return { path: user.hasReviewerAccess === true ? '/reviewer/dashboard' : '/reviewer-application', error: 'This account cannot add another academic identity through self-service.' };
    }
    return { path: user.hasReviewerAccess === true ? `/reviewer-account-transition?target=${intent}` : '/reviewer-application' };
  }
  return { path: destinationForUser(user), error: 'This account type cannot register as a Student, Lecturer or External Reviewer.' };
}

function RegistrationIntentRedirect({ user }: { user: { role?: string; hasReviewerAccess?: boolean; academicAccountType?: string | null; isProfileComplete?: boolean } | null }) {
  const [params] = useSearchParams();
  const result = resolveRegistrationIntent(user, params.get('role') || params.get('type') || params.get('intent'));
  if (!result.error) return <Navigate to={result.path} replace />;
  return <main className="flex min-h-screen items-center justify-center bg-[#F3F6FC] px-4 py-8"><section className="w-full max-w-xl rounded-2xl border border-[#DCE4EF] bg-white p-6 shadow-sm sm:p-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6121D0]">Account identity</p><h1 className="mt-2 text-2xl font-bold text-[#091F5B]">This account type cannot be changed</h1><p className="mt-3 text-sm leading-6 text-[#52627B]">{result.error}</p><Link to={destinationForUser(user)} className="mt-6 inline-flex rounded-xl bg-[#6121D0] px-5 py-3 text-sm font-semibold text-white">Return to your workspace</Link></section></main>;
}

function ReviewerEntryRedirect() {
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const governanceTabs = ['applications', 'reviewers', 'conflicts'];
  const destination = requestedTab && governanceTabs.includes(requestedTab)
    ? `/reviewer/governance?tab=${encodeURIComponent(requestedTab)}`
    : '/reviewer/dashboard';
  return <Navigate to={destination} replace />;
}

function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const accountNotice = searchParams.get('account');
  const registrationIntent = searchParams.get('intent');
  const [submitError, setSubmitError] = useState('');
  const [showDeletionCancellation, setShowDeletionCancellation] = useState(false);
  const [cancelEmail, setCancelEmail] = useState('');
  const [cancelPassword, setCancelPassword] = useState('');
  const [cancelAnswer, setCancelAnswer] = useState('');
  const [cancelMessage, setCancelMessage] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [cancellingDeletion, setCancellingDeletion] = useState(false);
  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { identifier: searchParams.get('identifier') || '', password: '' } });
  const onSubmit = async (values: LoginValues) => {
    setSubmitError('');
    try {
      const result = await login(values.identifier.trim(), values.password);
      if (result.requiresOnboarding) {
        const pendingRole = readPreAccountSession()?.role;
        const onboardingPath = pendingRole === 'lecturer' ? '/lecturer/onboarding/profile' : pendingRole === 'reviewer' ? '/reviewer/onboarding/profile' : '/student/onboarding/profile';
        navigate(registrationIntent ? `${onboardingPath}?intent=${encodeURIComponent(registrationIntent)}` : onboardingPath, { replace: true });
      } else if (registrationIntent) {
        navigate(`/login?intent=${encodeURIComponent(registrationIntent)}`, { replace: true });
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Sign in failed. Check your email or username and password, then try again.');
    }
  };
  const cancelDeletion = async () => {
    setCancellingDeletion(true); setCancelError(''); setCancelMessage('');
    try {
      await apiRequest('/auth/account-deletion/cancel', {
        method: 'POST',
        body: JSON.stringify({ email: cancelEmail.trim(), password: cancelPassword, securityAnswer: cancelAnswer }),
      });
      setCancelMessage('Your deletion request has been cancelled. Signing you in…');
      await login(cancelEmail.trim(), cancelPassword);
    } catch (error) {
      setCancelError(error instanceof Error ? error.message : 'Unable to cancel the deletion request.');
    } finally { setCancellingDeletion(false); }
  };
  if (isAuthenticated && user) return <Navigate to={destinationForUser(user)} replace />;
  return (
    <main className="min-h-screen bg-[#F3F6FC] px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto grid min-h-[680px] w-full max-w-6xl overflow-hidden rounded-[28px] border border-[#DCE4EF] bg-white shadow-[0_24px_70px_rgba(7,30,84,0.10)] lg:grid-cols-[0.92fr_1.08fr]">
        <aside className="relative isolate flex min-h-[300px] flex-col justify-between overflow-hidden bg-[#091F5B] p-7 text-white sm:p-10 lg:min-h-full lg:p-12">
          <div className="absolute inset-0 -z-20 bg-cover bg-center opacity-35" style={{ backgroundImage: "url('/images/students-collaborating.webp')" }} />
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#091F5B]/95 via-[#1736A2]/90 to-[#6121D0]/85" />
          <BrandLogo variant="full" tone="dark" className="rounded-lg bg-white/95 px-3 py-2" />
          <div className="relative mt-12 max-w-lg lg:mt-20">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">Welcome back</p>
            <h1 className="mt-4 text-3xl font-semibold leading-tight text-white sm:text-4xl">Good to have you back.</h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-blue-50/95 sm:text-base">Sign in to pick up where you left off, find your learning resources, and stay connected with your academic community.</p>
          </div>
          <div className="relative mt-10 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 p-3.5 text-sm text-white backdrop-blur-sm"><span aria-hidden="true" className="text-[#D9C6FF]">✓</span><span>Keep your studies organised</span></div>
            <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 p-3.5 text-sm text-white backdrop-blur-sm"><span aria-hidden="true" className="text-[#D9C6FF]">✓</span><span>Stay close to your community</span></div>
          </div>
        </aside>

        <section className="flex items-center justify-center px-5 py-9 sm:px-10 sm:py-12 lg:px-14">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#6121D0]">Your account</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#091F5B] sm:text-4xl">Sign in</h2>
              <p className="mt-3 text-sm leading-6 text-[#64748B]">Enter your account details to continue.</p>
            </div>

            {accountNotice === 'deletion-scheduled' && <div role="status" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">Your deletion request has been scheduled. Your account is inaccessible now, and permanent cleanup is due after 30 days. You can cancel during the grace period using your registered email, password and security answer.</div>}
            {accountNotice === 'deactivated' && <div role="status" className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">Your account has been deactivated. Sign in again with your password when you are ready to reactivate it.</div>}

            <form onSubmit={handleSubmit(onSubmit)} autoComplete="on" className="space-y-5" noValidate>
              {submitError && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{submitError}</div>}
              {submitError.toLowerCase().includes('pending deletion') && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm leading-6 text-amber-950">You can cancel the request during the 30-day grace period by verifying your account details.</p>
                  <button type="button" onClick={() => { setShowDeletionCancellation((value) => !value); setCancelEmail(getValues('identifier').includes('@') ? getValues('identifier') : ''); setCancelPassword(getValues('password')); setCancelError(''); }} className="mt-2 text-sm font-semibold text-[#6121D0]">{showDeletionCancellation ? 'Hide cancellation form' : 'Cancel deletion request'}</button>
                  {showDeletionCancellation && <div className="mt-3 space-y-3"><input value={cancelEmail} onChange={(event) => setCancelEmail(event.target.value)} type="email" autoComplete="email" placeholder="Registered email address" className="brand-input" /><PasswordInput value={cancelPassword} onChange={(event) => setCancelPassword(event.target.value)} autoComplete="current-password" placeholder="Current password" className="brand-input pr-11" /><input value={cancelAnswer} onChange={(event) => setCancelAnswer(event.target.value)} type="text" autoComplete="off" placeholder="Security answer" className="brand-input" />{cancelError && <p role="alert" className="text-sm text-rose-700">{cancelError}</p>}{cancelMessage && <p role="status" className="text-sm text-emerald-800">{cancelMessage}</p>}<button type="button" onClick={() => void cancelDeletion()} disabled={cancellingDeletion || !cancelEmail.trim() || !cancelPassword || !cancelAnswer.trim()} className="w-full rounded-xl bg-[#6121D0] px-4 py-3 font-semibold text-white disabled:opacity-60">{cancellingDeletion ? 'Restoring account…' : 'Cancel deletion and sign in'}</button></div>}
                </div>
              )}
              {submitError.toLowerCase().includes('verify') && <p className="text-center text-sm"><Link to="/verify-email" className="font-semibold text-[#004BEC]">Resend activation email</Link></p>}

              <div>
                <label htmlFor="login-identifier" className="mb-2 block text-sm font-medium text-[#091F5B]">Email, username or Institution ID</label>
                <input id="login-identifier" {...register('identifier')} type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="Email, @username or SC-… Institution ID" aria-invalid={Boolean(errors.identifier)} className="brand-input" />
                {errors.identifier && <p className="mt-1 text-sm text-rose-600">{errors.identifier.message}</p>}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="login-password" className="block text-sm font-medium text-[#091F5B]">Password</label>
                  <Link to="/forgot-password" className="text-xs font-semibold text-[#004BEC] hover:text-[#6121D0]">Forgot password?</Link>
                </div>
                <PasswordInput id="login-password" {...register('password')} autoComplete="current-password" placeholder="Enter your password" aria-invalid={Boolean(errors.password)} className="brand-input pr-11" />
                {errors.password && <p className="mt-1 text-sm text-rose-600">{errors.password.message}</p>}
              </div>

              <button type="submit" disabled={isSubmitting} className="brand-button flex w-full items-center justify-center px-4 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? 'Signing in...' : 'Sign in'}</button>
              <p className="text-center text-sm text-[#5C6982]">New to Sophis Central? <Link to="/onboarding" className="font-semibold text-[#004BEC] hover:text-[#6121D0]">Create an account</Link></p>
            </form>

            <div className="mt-8 border-t border-[#E4EAF5] pt-5 text-center">
              <p className="text-xs text-[#71809A]">Sophis Central · Your academic journey, organised.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function App() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();
  return <ThemeProvider><RouteSeo /><BrandedPageLoaderProvider><RouteErrorBoundary key={location.pathname}><Suspense fallback={<BrandedPageLoaderFallback />}><Routes><Route path="/" element={<HomePage />} /><Route path="/become-reviewer" element={<BecomeReviewerPage />} /><Route path="/community" element={<CommunityPage />} /><Route path="/contact" element={<ContactUsPage />} /><Route path="/careers" element={<CareersPage />} /><Route path="/terms" element={<LegalPage />} /><Route path="/privacy" element={<LegalPage />} /><Route path="/cookie-policy" element={<CookiePolicyPage />} /><Route path="/cookie-settings" element={<CookieSettingsPage />} /><Route path="/financial-policy" element={<LegalPage />} /><Route path="/refund-policy" element={<RefundPolicyPage />} /><Route path="/login" element={isAuthenticated ? <RegistrationIntentRedirect user={user} /> : <LoginPage />} /><Route path="/forgot-password" element={<ForgotPasswordPage />} /><Route path="/reset-password" element={<ResetPasswordPage />} /><Route path="/verify-email" element={<VerifyEmailPage />} /><Route path="/onboarding" element={isAuthenticated ? <RegistrationIntentRedirect user={user} /> : <OnboardingPage />} /><Route path="/reviewer/onboarding/profile" element={isLoading ? <div className="p-6 text-slate-500">Preparing your profile…</div> : isAuthenticated ? <Navigate to={user?.hasReviewerAccess === true ? '/reviewer/dashboard' : '/reviewer-application'} replace /> : <ProfileOnboardingPage />} /><Route path="/student/onboarding/profile" element={isLoading ? <div className="p-6 text-slate-500">Preparing your profile…</div> : isAuthenticated ? <ProtectedRoute allowedRoles={['student']}><ProfileOnboardingPage /></ProtectedRoute> : <ProfileOnboardingPage />} /><Route path="/lecturer/onboarding/profile" element={isLoading ? <div className="p-6 text-slate-500">Preparing your profile…</div> : isAuthenticated ? <ProtectedRoute allowedRoles={['lecturer']}><ProfileOnboardingPage /></ProtectedRoute> : <ProfileOnboardingPage />} /><Route path="/onboarding/profile" element={<Navigate to={isAuthenticated ? user?.role === 'lecturer' ? '/lecturer/onboarding/profile' : user?.role === 'reviewer' ? '/reviewer/onboarding/profile' : '/student/onboarding/profile' : '/onboarding'} replace />} /><Route path="/student" element={<Navigate to="/student/dashboard" replace />} /><Route path="/lecturer" element={<Navigate to="/lecturer/dashboard" replace />} /><Route path="/reviewer" element={<ProtectedRoute allowedRoles={['student', 'lecturer', 'reviewer']} requiresReviewerAccess><ReviewerEntryRedirect /></ProtectedRoute>} /><Route path="/reviewer/dashboard" element={<ProtectedRoute allowedRoles={['student', 'lecturer', 'reviewer']} requiresReviewerAccess><AppShell title="Academic Reviewer Dashboard"><ReviewerDashboardPage /></AppShell></ProtectedRoute>} /><Route path="/reviewer/governance" element={<ProtectedRoute allowedRoles={['student', 'lecturer', 'reviewer']} requiresReviewerAccess><AppShell title="Reviewer Management"><ModerationPage /></AppShell></ProtectedRoute>} /><Route path="/reviewer/notifications" element={<ProtectedRoute allowedRoles={['student', 'lecturer', 'reviewer']} requiresReviewerAccess><AppShell title="Reviewer Notifications"><NotificationsPage reviewerOnly /></AppShell></ProtectedRoute>} /><Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AppShell title="Administration"><AdminUsersPage /></AppShell></ProtectedRoute>} /><Route path="/admin/reviewers" element={<ProtectedRoute allowedRoles={['admin']}><AppShell title="Reviewer Governance"><ModerationPage /></AppShell></ProtectedRoute>} /><Route path="/support" element={<ProtectedRoute allowedRoles={['moderator', 'admin']}><AppShell title="Platform Support"><SupportRequestsPanel /></AppShell></ProtectedRoute>} /><Route path="/student/support" element={<ProtectedRoute allowedRoles={['student']}><AppShell title="Contact support"><SupportPage /></AppShell></ProtectedRoute>} /><Route path="/profile" element={<ProtectedRoute allowedRoles={['student', 'lecturer', 'reviewer', 'moderator', 'admin']}><AppShell title="My Profile"><ProfileSettingsPage /></AppShell></ProtectedRoute>} /><Route path="/settings" element={<ProtectedRoute allowedRoles={['student', 'lecturer', 'reviewer', 'moderator', 'admin']}><AppShell title="Settings"><SettingsPage /></AppShell></ProtectedRoute>} /><Route path="/reports" element={<ProtectedRoute allowedRoles={['student', 'lecturer']}><AppShell title="My reports"><MyReportsPage /></AppShell></ProtectedRoute>} /><Route path="/notifications" element={<ProtectedRoute allowedRoles={['student', 'lecturer', 'reviewer', 'moderator', 'admin']}><AppShell title="Notifications"><NotificationsPage /></AppShell></ProtectedRoute>} /><Route path="/lecturer/support" element={<ProtectedRoute allowedRoles={['lecturer']}><AppShell title="Contact support"><SupportPage /></AppShell></ProtectedRoute>} /><Route path="/chat/group" element={<ProtectedRoute allowedRoles={['student']}><AppShell title="Group Chat"><ChatPage /></AppShell></ProtectedRoute>} /><Route path="/messages" element={<ProtectedRoute allowedRoles={['student', 'lecturer']}><AppShell title="Messages"><ChatPage /></AppShell></ProtectedRoute>} /><Route path="/dashboard" element={<Navigate to={destinationForUser(user)} replace />} /><Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={['student']}><AppShell title="Student Dashboard"><DashboardPage /></AppShell></ProtectedRoute>} /><Route path="/lecturer/dashboard" element={<ProtectedRoute allowedRoles={['lecturer']}><AppShell title="Lecturer Dashboard"><LecturerDashboardPage /></AppShell></ProtectedRoute>} /><Route path="/moderator/dashboard" element={<Navigate to="/moderation" replace />} /><Route path="/lecturer/analytics" element={<ProtectedRoute allowedRoles={['lecturer']}><AppShell title="My Analytics"><AnalyticsWorkspacePage /></AppShell></ProtectedRoute>} /><Route path="/library" element={<AppShell title="Academic Library"><LibraryPage /></AppShell>} /><Route path="/open-source-library" element={<AppShell title="Open Source Library"><OpenSourceLibraryPage /></AppShell>} /><Route path="/open-source-resource/:id" element={<AppShell title="Open Source Research"><OpenSourceResourcePage /></AppShell>} /><Route path="/open-resource/:id" element={<AppShell title="Public Resource"><PublicResourcePage /></AppShell>} /><Route path="/my-resources" element={<ProtectedRoute allowedRoles={['student', 'lecturer', 'reviewer', 'moderator', 'admin']}><AppShell title="My resources"><SavedResourcesPage /></AppShell></ProtectedRoute>} /><Route path="/saved" element={<Navigate to="/my-resources" replace />} /><Route path="/resource/:id" element={<ProtectedRoute allowedRoles={['student', 'lecturer', 'reviewer', 'moderator', 'admin']}><AppShell title="Resource Reader"><ResourceReaderPage /></AppShell></ProtectedRoute>} /><Route path="/upload" element={<ProtectedRoute allowedRoles={['student']}><AppShell title="Upload Student Resource"><UploadPage /></AppShell></ProtectedRoute>} /><Route path="/lecturer/upload" element={<ProtectedRoute allowedRoles={['lecturer']}><AppShell title="Upload Resource"><LecturerUploadPage /></AppShell></ProtectedRoute>} /><Route path="/ai" element={<ProtectedRoute allowedRoles={['student']}><AppShell title="AI Tutor"><AITutorPage /></AppShell></ProtectedRoute>} /><Route path="/wallet" element={<ProtectedRoute allowedRoles={['student']}><AppShell title="Wallet"><WalletPage /></AppShell></ProtectedRoute>} /><Route path="/reviewer-application" element={<ProtectedRoute allowedRoles={['student', 'lecturer', 'reviewer']}><AppShell title="Academic Reviewer Application"><ReviewerApplicationPage /></AppShell></ProtectedRoute>} /><Route path="/workspace" element={<ProtectedRoute allowedRoles={['student', 'lecturer']}><AppShell title="Choose workspace"><WorkspaceSelectorPage /></AppShell></ProtectedRoute>} /><Route path="/reviewer-account-transition" element={<ProtectedRoute allowedRoles={['reviewer']}><AppShell title="Become a Student or Lecturer"><ExternalReviewerTransitionPage /></AppShell></ProtectedRoute>} /><Route path="/moderation" element={<ProtectedRoute allowedRoles={['moderator']}><AppShell title="Platform Moderation"><ModeratorDashboardPage /></AppShell></ProtectedRoute>} /><Route path="/moderation/reports" element={<ProtectedRoute allowedRoles={['moderator']}><AppShell title="Platform Reports"><ModerationPage /></AppShell></ProtectedRoute>} /><Route path="/moderation/analytics" element={<ProtectedRoute allowedRoles={['moderator']}><AppShell title="Analytics"><AnalyticsWorkspacePage /></AppShell></ProtectedRoute>} /><Route path="/moderation/management" element={<ProtectedRoute allowedRoles={['moderator']}><AppShell title="Management"><ModerationManagementPage /></AppShell></ProtectedRoute>} /><Route path="/moderation/management/wisdom-points" element={<ProtectedRoute allowedRoles={['moderator']}><AppShell title="Manage Wisdom Points"><WisdomPointsManagementPage /></AppShell></ProtectedRoute>} /><Route path="/moderation/management/wisdom-points/:userId" element={<ProtectedRoute allowedRoles={['moderator']}><AppShell title="Account Wallet Review"><WisdomPointsManagementPage /></AppShell></ProtectedRoute>} /><Route path="/moderation/support" element={<Navigate to="/support" replace />} /><Route path="/admin/users" element={<Navigate to="/admin" replace />} /><Route path="/analytics" element={<ProtectedRoute allowedRoles={['admin']}><AppShell title="Analytics"><AnalyticsWorkspacePage /></AppShell></ProtectedRoute>} /><Route path="*" element={<Navigate to={isAuthenticated ? destinationForUser(user) : '/login'} replace />} /></Routes></Suspense></RouteErrorBoundary><CookieConsentBanner /></BrandedPageLoaderProvider></ThemeProvider>;
}
