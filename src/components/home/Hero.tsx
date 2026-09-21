import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { HandwrittenBadge } from '@/components/ui/Badge';
import { ROUTES } from '@/routes/paths';

export const Hero = () => {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-white">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-2 lg:pt-20">
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            <HandwrittenBadge>trusted by 25k+ families ✏️</HandwrittenBadge>
          </div>
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Simplify learning.
            <span className="block text-indigo-600">Empower everyone.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-600">
            LearnwithUncleTee is your all-in-one portal for structured curriculum resources,
            downloadable materials and persona-driven guidance for primary & secondary success.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button to={ROUTES.resources} variant="primary">Explore Courses →</Button>
            <Button variant="outline" onClick={() => setShowVideo(true)}>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs text-white">▶</span>
              Watch How It Works
            </Button>
          </div>
          <div className="mt-8 flex items-center gap-4">
            <div className="flex -space-x-2">
              {['AO', 'MB', 'DE', '+'].map((t, i) => (
                <span key={i} className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white ${i === 3 ? 'bg-slate-900' : 'bg-indigo-400'}`}>
                  {t}
                </span>
              ))}
            </div>
            <div className="text-sm">
              <div className="font-bold text-slate-900">★★★★★ 4.9/5</div>
              <div className="text-slate-500">from 3,200+ verified reviews</div>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="relative overflow-hidden rounded-3xl bg-slate-900 shadow-2xl">
            <div className="aspect-[4/3] bg-gradient-to-br from-indigo-600 via-violet-600 to-amber-400 p-8 flex flex-col justify-end">
              <div className="rounded-2xl bg-white/95 p-5 backdrop-blur">
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">● LIVE CLASS</span>
                  <span className="text-xs text-slate-500">JSS3 • Mathematics</span>
                </div>
                <p className="font-bold text-slate-900">Fractions made simple — visual walkthrough</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-2/3 rounded-full bg-indigo-600" />
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowVideo(true)}
              className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-xl shadow-xl transition-transform hover:scale-110"
              aria-label="Play video"
            >
              ▶
            </button>
          </div>
          <div className="absolute -bottom-5 -left-4 rotate-[-3deg] rounded-2xl bg-amber-300 px-4 py-3 shadow-lg">
            <p className="font-[cursive] text-sm font-bold text-slate-900">“Aha! I finally get it!” 💡</p>
          </div>
          <div className="absolute -top-4 -right-2 rotate-[3deg] rounded-2xl bg-white px-4 py-2 shadow-lg border">
            <p className="text-xs font-bold text-slate-900">📥 12k downloads this week</p>
          </div>
        </div>
      </div>

      {showVideo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4" onClick={() => setShowVideo(false)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold">Welcome to LearnwithUncleTee 🎬</h3>
              <button onClick={() => setShowVideo(false)} className="rounded-full bg-slate-100 px-3 py-1 hover:bg-slate-200">✕</button>
            </div>
            <div className="flex aspect-video items-center justify-center rounded-xl bg-slate-900 text-white">
              <p className="text-sm text-slate-300">Video showcase placeholder — embed your YouTube/Vimeo here.</p>
            </div>
            <p className="mt-3 text-sm text-slate-600">See how students, parents and teachers use the portal daily.</p>
          </div>
        </div>
      )}
    </section>
  );
};
