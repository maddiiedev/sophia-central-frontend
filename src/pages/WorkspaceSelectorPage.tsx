import { Navigate, useNavigate } from 'react-router-dom';
import { BookOpen, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export function WorkspaceSelectorPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const dark = theme === 'dark';
  if (!user || !['student', 'lecturer'].includes(user.role) || user.hasReviewerAccess !== true) {
    return <Navigate to={user?.role === 'lecturer' ? '/lecturer/dashboard' : '/student/dashboard'} replace />;
  }

  const primaryLabel = user.role === 'lecturer' ? 'Lecturer workspace' : 'Student workspace';
  const primaryPath = user.role === 'lecturer' ? '/lecturer/dashboard' : '/student/dashboard';
  const choose = (workspace: 'academic' | 'reviewer', path: string) => {
    try { window.localStorage.setItem('sophis-central-preferred-workspace', workspace); } catch { /* Storage is optional; server authorization remains authoritative. */ }
    navigate(path, { replace: true });
  };

  const card = dark
    ? 'border-slate-700 bg-slate-900 text-white hover:border-[#8B5CF6]'
    : 'border-[#DCE4EF] bg-white text-[#091F5B] hover:border-[#A78BFA]';
  const description = dark ? 'text-slate-300' : 'text-[#52627B]';

  return <div className="mx-auto w-full max-w-4xl space-y-6">
    <section className={`rounded-2xl border p-5 sm:p-7 ${dark ? 'border-[#40365A] bg-[#211A34]' : 'border-[#E4DDF8] bg-[#F7F4FF]'}`}>
      <p className={`text-xs font-bold uppercase tracking-[0.18em] ${dark ? 'text-[#C4A7FF]' : 'text-[#6121D0]'}`}>Your Sophis Central account</p>
      <h2 className={`mt-2 text-2xl font-bold ${dark ? 'text-white' : 'text-[#091F5B]'}`}>Choose a workspace</h2>
      <p className={`mt-2 max-w-2xl text-sm leading-6 ${description}`}>Your academic identity stays the same. Choose the workspace you want to use, and switch between the workspaces available to your account whenever you need.</p>
    </section>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <button type="button" onClick={() => choose('academic', primaryPath)} className={`group min-w-0 rounded-2xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#6121D0] sm:p-6 ${card}`}>
        <span className="inline-flex rounded-xl bg-[#EEF2FF] p-3 text-[#2C36D9] dark:bg-[#26315C] dark:text-[#B8C5FF]"><BookOpen size={22}/></span>
        <span className="mt-5 block text-lg font-bold">{primaryLabel}</span>
        <span className={`mt-2 block text-sm leading-6 ${description}`}>Continue with your existing academic dashboard, learning tools and account features.</span>
        <span className="mt-5 inline-flex text-sm font-semibold text-[#6121D0] dark:text-[#C4A7FF]">Open workspace <span aria-hidden="true" className="ml-1">→</span></span>
      </button>
      <button type="button" onClick={() => choose('reviewer', '/moderation')} className={`group min-w-0 rounded-2xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#6121D0] sm:p-6 ${card}`}>
        <span className="inline-flex rounded-xl bg-[#F0EBFF] p-3 text-[#6121D0] dark:bg-[#35264F] dark:text-[#D8C6FF]"><ShieldCheck size={22}/></span>
        <span className="mt-5 block text-lg font-bold">Academic Reviewer workspace</span>
        <span className={`mt-2 block text-sm leading-6 ${description}`}>Open your assigned academic review queue and reviewer tools, subject to current approval and assignment permissions.</span>
        <span className="mt-5 inline-flex text-sm font-semibold text-[#6121D0] dark:text-[#C4A7FF]">Open workspace <span aria-hidden="true" className="ml-1">→</span></span>
      </button>
    </div>
  </div>;
}
