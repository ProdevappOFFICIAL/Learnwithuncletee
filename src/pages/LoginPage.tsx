import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import { siteInfo } from '@/data/content';
import { PageMetadata } from '@/components/ui/PageMetadata';
import { ChevronLeft } from 'lucide-react';

const inputClass = 'mt-2 min-h-12 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

export const LoginPage = () => {
  const [mode, setMode] = useState<'login' | 'recovery'>('login');
  const [notice, setNotice] = useState(false);

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_.95fr]">
      <PageMetadata title="Portal Login" description="Sign-in access for students, parents, teachers and staff at Learnwithuncletee." />
      <section className="relative isolate flex min-h-[340px] items-end overflow-hidden bg-brand-900 p-7 text-white sm:p-12 lg:min-h-screen lg:p-16" style={{ backgroundImage: 'linear-gradient(0deg,rgba(4,46,26,.92),rgba(4,58,33,.25)),url(/school.JPG)', backgroundPosition: 'center', backgroundSize: 'cover' }}>
        <div className="relative max-w-xl"><Link to={ROUTES.home} className="mb-10 inline-flex items-center gap-3"><img src="/logo.png" alt="" className="h-12 w-12 rounded-full object-cover" /><span className="font-extrabold">{siteInfo.name}</span></Link><p className="text-xs font-bold uppercase tracking-[.18em] text-lime-accent">School portal</p><h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">Your school day, connected.</h1><p className="mt-4 max-w-lg leading-relaxed text-white/80">Access the school portal for student, parent, teacher and staff accounts.</p><p className="mt-5 text-xs text-white/60">Sample background image. Replace with an approved school photograph.</p></div>
      </section>
      <section className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <Link to={ROUTES.home} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-500"><ChevronLeft aria-hidden="true" size={16} />Back to website</Link>
          <p className="mt-10 text-xs font-bold uppercase tracking-widest text-brand-700">{mode === 'login' ? 'Secure access' : 'Account recovery'}</p>
          <h2 className="mt-3 text-3xl font-extrabold">{mode === 'login' ? 'Portal Login' : 'Forgot your password?'}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{mode === 'login' ? 'Sign in with the credentials provided by your school.' : 'Enter your account email or ID and contact the school office to complete recovery.'}</p>
          <form className="mt-8 space-y-5" onSubmit={(event) => { event.preventDefault(); setNotice(true); }}>
            {mode === 'login' && <label className="block text-sm font-semibold">Choose portal<select className={inputClass} defaultValue="parent" name="role"><option value="student">Student</option><option value="parent">Parent / Guardian</option><option value="teacher">Teacher / Staff</option><option value="admin">Administrator</option></select></label>}
            <label className="block text-sm font-semibold">{mode === 'login' ? 'ID number or email' : 'ID number or email'}<input className={inputClass} name="identity" autoComplete="username" required /></label>
            {mode === 'login' && <label className="block text-sm font-semibold">Password<input className={inputClass} name="password" type="password" autoComplete="current-password" required /></label>}
            <button type="submit" className="min-h-12 w-full rounded bg-brand-500 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700">{mode === 'login' ? 'Sign in' : 'Request recovery'}</button>
          </form>
          {notice && <p role="status" className="mt-4 border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">Authentication is not connected yet. No sign-in or recovery request was sent.</p>}
          <button type="button" className="mt-5 text-sm font-semibold text-brand-700 underline underline-offset-4" onClick={() => { setNotice(false); setMode(mode === 'login' ? 'recovery' : 'login'); }}>{mode === 'login' ? 'Forgot password?' : 'Return to login'}</button>
          <p className="mt-10 border-t border-line pt-5 text-xs leading-relaxed text-muted">Your account role and permissions must be verified by the school. Role selection alone does not grant access.</p>
        </div>
      </section>
    </main>
  );
};
