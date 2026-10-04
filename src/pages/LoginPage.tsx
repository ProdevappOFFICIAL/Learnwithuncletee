import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import { siteInfo } from '@/data/content';
import { PageMetadata } from '@/components/ui/PageMetadata';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiPost } from '@/lib/api';

const inputClass = 'mt-2 min-h-12 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

const homeForRole = (role: string) =>
  role === 'STUDENT' || role === 'PARENT'
    ? ROUTES.studentDashboard
    : role === 'TEACHER'
      ? ROUTES.teacherDashboard
      : ROUTES.adminDashboard;

type Mode = 'login' | 'signup' | 'recovery';

export const LoginPage = () => {
  const [mode, setMode] = useState<Mode>('login');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setSuccess(null);
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (mode === 'recovery') {
      setError('Account recovery is handled by the school office — call Central Admin with your ID number.');
      return;
    }
    const form = new FormData(event.currentTarget);
    const identity = String(form.get('identity') ?? '').trim();
    const password = String(form.get('password') ?? '');
    const remember = form.get('remember') === 'on';
    setBusy(true);
    try {
      const me = await login(identity, password, { remember });
      navigate(homeForRole(me.role));
    } catch (e: any) {
      setError(e?.message ?? 'Sign-in failed. Check your email and password.');
    } finally {
      setBusy(false);
    }
  };

  const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    const form = new FormData(event.currentTarget);
    const payload = {
      user_name: String(form.get('user_name') ?? '').trim(),
      user_email: String(form.get('user_email') ?? '').trim(),
      user_password: String(form.get('user_password') ?? ''),
      role: String(form.get('role') ?? 'STUDENT'),
    };
    if (payload.user_password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setBusy(true);
    try {
      const res = await apiPost('/auth/signup', payload);
      setSuccess(res.message ?? 'Account created. It is pending school approval — you can sign in once activated.');
      event.currentTarget.reset();
    } catch (e: any) {
      setError(e?.message ?? 'Could not create account.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_.95fr]">
      <PageMetadata title="Portal Login" description="Sign-in access for students, parents, teachers and staff at Learnwithuncletee." />
      <section className="relative isolate flex min-h-[340px] items-end overflow-hidden bg-brand-900 p-7 text-white sm:p-12 lg:min-h-screen lg:p-16" style={{ backgroundImage: 'linear-gradient(0deg,rgba(4,46,26,.92),rgba(4,58,33,.25)),url(/school.JPG)', backgroundPosition: 'center', backgroundSize: 'cover' }}>
        <div className="relative max-w-xl"><Link to={ROUTES.home} className="mb-10 inline-flex items-center gap-3"><img src="/logo.png" alt="" className="h-12 w-12 rounded-full object-cover" /><span className="font-extrabold">{siteInfo.name}</span></Link><p className="text-xs font-bold uppercase tracking-[.18em] text-lime-accent">School portal</p><h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">Your school day, connected.</h1><p className="mt-4 max-w-lg leading-relaxed text-white/80">Access the school portal for student, parent, teacher and staff accounts.</p><p className="mt-5 text-xs text-white/60">Sample background image. Replace with an approved school photograph.</p></div>
      </section>
      <section className="flex items-center justify-center px-5 py-12 sm:px-10">
         <div className="w-full max-w-md">
           <Link to={ROUTES.home} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-500"><ChevronLeft aria-hidden="true" size={16} />Back to website</Link>

          <div className="hidden mt-10 grid grid-cols-2 gap-1 rounded bg-cream p-1" role="tablist" aria-label="Account actions">
            {(['login', 'signup'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => switchMode(m)}
                className={`rounded px-3 py-2.5 text-sm font-bold transition-colors ${mode === m ? 'bg-brand-900 text-white' : 'text-muted hover:text-ink border border-line'}`}
              >
                {m === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>
         
             <div className="w-full max-w-md border mt-4 border-line bg-cream px-4 pb-10 rounded">
       

          <p className="mt-6 text-xs font-bold uppercase tracking-widest text-brand-700">
            {mode === 'login' ? 'Secure access' : mode === 'signup' ? 'New here' : 'Account recovery'}
          </p>
          <h2 className="mt-3 text-3xl font-extrabold">
            {mode === 'login' ? 'Portal Login' : mode === 'signup' ? 'Create account' : 'Forgot your password?'}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {mode === 'login'
              ? 'Sign in with the credentials provided by your school.'
              : mode === 'signup'
                ? 'Students and parents can self-register. Staff accounts are created by the school. New accounts need office approval before sign-in.'
                : 'Enter your account email or ID and contact the school office to complete recovery.'}
          </p>

          {mode === 'signup' ? (
            <form className="mt-8 space-y-5" onSubmit={handleSignup}>
              <label className="block text-sm font-semibold">Full name<input className={inputClass} name="user_name" autoComplete="name" required placeholder="e.g. Daniel E." /></label>
              <label className="block text-sm font-semibold">Email address<input className={inputClass} name="user_email" type="email" autoComplete="email" required placeholder="you@example.com" /></label>
              <label className="block text-sm font-semibold">I am a
                <select className={inputClass} name="role" defaultValue="STUDENT">
                  <option value="STUDENT">Student</option>
                  <option value="PARENT">Parent / Guardian</option>
                </select>
              </label>
              <label className="block text-sm font-semibold">Password (min 8 characters)<input className={inputClass} name="user_password" type="password" autoComplete="new-password" required minLength={8} /></label>
              <button type="submit" disabled={busy} className="min-h-12 w-full rounded bg-brand-500 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
                {busy ? 'Creating…' : 'Create account'}
              </button>
            </form>
          ) : (
            <form className="mt-8 space-y-5" onSubmit={handleLogin}>
              <label className="block text-sm font-semibold">Email address / Admission No<input className={inputClass} name="identity" type="text" autoComplete="username" required placeholder="you@learnwithuncletee.org" /></label>
              {mode === 'login' && <label className="block text-sm font-semibold">Password<input className={inputClass} name="password" type="password" autoComplete="current-password" required /></label>}
              {mode === 'login' && (
                <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-ink">
                  <input type="checkbox" name="remember" defaultChecked className="h-4 w-4 rounded accent-brand-700" />
                  Remember me on this device
                </label>
              )}
              <button type="submit" disabled={busy} className="min-h-12 w-full rounded bg-brand-500 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
                {busy ? 'Signing in…' : mode === 'login' ? 'Sign in' : 'Request recovery'}
              </button>
            </form>
          )}

          {error && <p role="alert" className="mt-4 border-l-2 border-rose-400 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}
          {success && <p role="status" className="mt-4 border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{success}</p>}

          {mode === 'login' && (
            <button type="button" className="mt-5 text-sm font-semibold text-brand-700 underline underline-offset-4" onClick={() => switchMode('recovery')}>Forgot password?</button>
          )}
          {mode !== 'login' && (
            <button type="button" className="mt-5 text-sm font-semibold text-brand-700 underline underline-offset-4" onClick={() => switchMode('login')}>Return to login</button>
          )}

     
          <p className="hidden mt-10 border-t border-line pt-5 text-xs leading-relaxed text-muted">Your account role and permissions must be verified by the school. Role selection alone does not grant access.</p>
        </div>
        </div>
      </section>
    </main>
  );
};
