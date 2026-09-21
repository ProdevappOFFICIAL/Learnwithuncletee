import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';

export const Footer = () => (
  <footer className="bg-slate-950 text-slate-300">
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
      <div>
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500 text-lg font-bold text-white">U</span>
          <span className="text-lg font-extrabold text-white">LearnwithUncleTee</span>
        </div>
        <p className="text-sm leading-relaxed text-slate-400">
          Simplifying learning, empowering educators, and guiding parents for primary & secondary success.
        </p>
      </div>
      <div>
        <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-white">Portals</h4>
        <ul className="space-y-2 text-sm">
          <li><Link className="hover:text-white" to={ROUTES.students}>Students</Link></li>
          <li><Link className="hover:text-white" to={ROUTES.parents}>Parents</Link></li>
          <li><Link className="hover:text-white" to={ROUTES.teachers}>Teachers</Link></li>
          <li><Link className="hover:text-white" to={ROUTES.resources}>Resource Hub</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-white">Resources</h4>
        <ul className="space-y-2 text-sm">
          <li>Worksheets</li>
          <li>Lecture Notes</li>
          <li>Past Papers</li>
          <li>Study Guides</li>
        </ul>
      </div>
      <div>
        <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-white">Stay updated</h4>
        <p className="mb-3 text-sm text-slate-400">Weekly study tips & free downloads.</p>
        <form className="flex overflow-hidden rounded-full bg-white/10 p-1" onSubmit={(e) => e.preventDefault()}>
          <input placeholder="Email address" className="w-full bg-transparent px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none" />
          <button className="rounded-full bg-amber-400 px-4 py-2 text-sm font-bold text-slate-900 hover:bg-amber-300">Join</button>
        </form>
      </div>
    </div>
    <div className="border-t border-white/10 py-5 text-center text-xs text-slate-500">
      © {new Date().getFullYear()} LearnwithUncleTee. All rights reserved.
    </div>
  </footer>
);
