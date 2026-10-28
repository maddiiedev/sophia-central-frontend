import { NotificationsPage } from './pages/NotificationsPage';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppShell } from './components/layout/AppShell';
import { BrandLogo } from './components/brand/BrandLogo';
import HomePage from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { LibraryPage } from './pages/LibraryPage';
import { SavedResourcesPage } from './pages/SavedResourcesPage';
import { UploadPage } from './pages/UploadPage';
import { AITutorPage } from './pages/AITutorPage';
import { WalletPage } from './pages/WalletPage';
import { ModerationPage } from './pages/ModerationPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { LecturerDashboardPage } from './pages/LecturerDashboardPage';
import { AdminAnalyticsPage } from './pages/AdminAnalyticsPage';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { loginSchema, type LoginValues } from './lib/validation';
import { OnboardingPage } from './pages/OnboardingPage';
import { ProfileOnboardingPage } from './pages/ProfileOnboardingPage';
import { ProfileSettingsPage } from './pages/ProfileSettingsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { ResourceReaderPage } from './pages/ResourceReaderPage';

function destinationForUser(user?: { role?: string; isProfileComplete?: boolean } | null) {
  if (user?.role === 'student' || user?.role === 'lecturer') { if (user.isProfileComplete === false) return '/onboarding/profile'; }
  if (user?.role === 'moderator' || user?.role === 'admin') return '/moderation';
  if (user?.role === 'lecturer') return '/lecturer';
  return '/dashboard';
}

function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });
  const onSubmit = async (values: LoginValues) => { await login(values.email, values.password); };
  if (isAuthenticated && user) return <Navigate to={destinationForUser(user)} replace />;
  return <main className="min-h-screen bg-white px-4 py-8 sm:px-6 lg:py-12"><div className="mx-auto grid min-h-[650px] w-full max-w-6xl overflow-hidden rounded-[28px] border border-[#DCE4EF] bg-white shadow-[0_24px_70px_rgba(7,30,84,0.12)] lg:grid-cols-2"><section className="brand-purple-section relative flex flex-col justify-between overflow-hidden p-7 text-white sm:p-10 lg:p-12"><div className="relative"><div className="inline-flex rounded-lg bg-white p-1.5"><BrandLogo variant="full" linked={false} className="w-[175px]" /></div><p className="mt-8 text-xs font-semibold uppercase tracking-[0.24em] text-white/85">Study · Research · Grow</p><h1 className="mt-4 max-w-lg text-4xl font-bold leading-tight text-white sm:text-5xl">Your academic journey starts here.</h1><p className="mt-5 max-w-md text-base leading-7 text-white/90">Discover academic resources, organise your studies, and get AI-guided support throughout your learning journey.</p></div><div className="relative mt-12 space-y-3">{['Find relevant notes and past questions', 'Discover and share academic resources', 'Learn with AI-guided study support'].map((item) => <div key={item} className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 p-4 text-sm text-white"><span aria-hidden="true">✓</span><span>{item}</span></div>)}</div></section><section className="flex items-center justify-center p-6 sm:p-10 lg:p-12"><div className="w-full max-w-md"><div className="mb-8"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2C36D9]">Welcome back</p><h2 className="mt-3 text-3xl font-bold text-[#091F5B] sm:text-4xl">Sign in to Sophia</h2><p className="mt-3 text-sm leading-6 text-[#5C6982]">Continue your learning journey from where you left off.</p></div><form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate><div><label htmlFor="login-email" className="mb-2 block text-sm font-medium text-[#091F5B]">Email address</label><input id="login-email" {...register('email')} type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={Boolean(errors.email)} className="brand-input" />{errors.email && <p className="mt-1 text-sm text-rose-600">{errors.email.message}</p>}</div><div><div className="mb-2 flex items-center justify-between"><label htmlFor="login-password" className="block text-sm font-medium text-[#091F5B]">Password</label><Link to="/forgot-password" className="text-xs font-semibold text-[#2C36D9]">Forgot password?</Link></div><div className="relative"><input id="login-password" {...register('password')} type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" aria-invalid={Boolean(errors.password)} className="brand-input pr-11" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#5C6982]" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>{errors.password && <p className="mt-1 text-sm text-rose-600">{errors.password.message}</p>}</div><button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-[#6121D0] px-4 py-3 font-semibold text-white shadow-lg transition hover:bg-[#2C36D9] disabled:opacity-60">{isSubmitting ? 'Signing in...' : 'Sign in'}</button><p className="text-center text-sm text-[#5C6982]">New to Sophia Central? <Link to="/onboarding" className="font-semibold text-[#2C36D9]">Create an account</Link></p></form><div className="mt-8 border-t border-[#DCE4EF] pt-5 text-center"><p className="text-xs text-[#71809A]">Sophia Central · Your academic journey, organised.</p></div></div></section></div></main>;
}

export default function App() {
  const { isAuthenticated, user } = useAuth();
  return <ThemeProvider><Routes><Route path="/" element={<HomePage />} /><Route path="/login" element={isAuthenticated ? <Navigate to={destinationForUser(user)} replace /> : <LoginPage />} /><Route path="/forgot-password" element={<ForgotPasswordPage />} /><Route path="/reset-password" element={<ResetPasswordPage />} /><Route path="/onboarding" element={isAuthenticated ? <Navigate to={destinationForUser(user)} replace /> : <OnboardingPage />} /><Route path="/onboarding/profile" element={<ProtectedRoute allowedRoles={['student', 'lecturer']}><ProfileOnboardingPage /></ProtectedRoute>} /><Route path="/profile" element={<ProtectedRoute allowedRoles={['student', 'lecturer', 'moderator', 'admin']}><AppShell title="My Profile"><ProfileSettingsPage /></AppShell></ProtectedRoute>} /><Route path="/settings" element={<ProtectedRoute allowedRoles={['student', 'lecturer', 'moderator', 'admin']}><AppShell title="Settings"><SettingsPage /></AppShell></ProtectedRoute>} /><Route path="/notifications" element={<ProtectedRoute allowedRoles={['student', 'lecturer', 'moderator', 'admin']}><AppShell title="Notifications"><NotificationsPage /></AppShell></ProtectedRoute>} /><Route path="/dashboard" element={<ProtectedRoute allowedRoles={['student', 'lecturer', 'moderator', 'admin']}><AppShell title="Dashboard"><DashboardPage /></AppShell></ProtectedRoute>} /><Route path="/lecturer" element={<ProtectedRoute allowedRoles={['lecturer']}><AppShell title="Lecturer Dashboard"><LecturerDashboardPage /></AppShell></ProtectedRoute>} /><Route path="/library" element={<ProtectedRoute allowedRoles={['student', 'lecturer', 'moderator', 'admin']}><AppShell title="Library"><LibraryPage /></AppShell></ProtectedRoute>} /><Route path="/saved" element={<ProtectedRoute allowedRoles={['student']}><AppShell title="Saved Resources"><SavedResourcesPage /></AppShell></ProtectedRoute>} /><Route path="/resource/:id" element={<ProtectedRoute allowedRoles={['student', 'lecturer', 'moderator', 'admin']}><AppShell title="Resource Reader"><ResourceReaderPage /></AppShell></ProtectedRoute>} /><Route path="/upload" element={<ProtectedRoute allowedRoles={['lecturer']}><AppShell title="Upload"><UploadPage /></AppShell></ProtectedRoute>} /><Route path="/ai" element={<ProtectedRoute allowedRoles={['student', 'lecturer', 'moderator', 'admin']}><AppShell title="AI Tutor"><AITutorPage /></AppShell></ProtectedRoute>} /><Route path="/wallet" element={<ProtectedRoute allowedRoles={['student']}><AppShell title="Wallet"><WalletPage /></AppShell></ProtectedRoute>} /><Route path="/moderation" element={<ProtectedRoute allowedRoles={['moderator', 'admin']}><AppShell title="Moderation"><ModerationPage /></AppShell></ProtectedRoute>} /><Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AppShell title="Users"><AdminUsersPage /></AppShell></ProtectedRoute>} /><Route path="/analytics" element={<ProtectedRoute allowedRoles={['admin']}><AppShell title="Admin Analytics"><AdminAnalyticsPage /></AppShell></ProtectedRoute>} /><Route path="*" element={<Navigate to={isAuthenticated ? destinationForUser(user) : '/login'} replace />} /></Routes></ThemeProvider>;
}
