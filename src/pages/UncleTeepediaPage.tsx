import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { apiGetPublic } from '@/lib/api';
import type { PublicUncleTeepediaLiveItem } from '@/data/uncleteepedia';
import { formatLabel, modeLabel } from '@/data/uncleteepedia';
import { ArrowRight, Radio, Trophy, Users } from 'lucide-react';

export const UncleTeepediaPage = () => {
  const [live, setLive] = useState<PublicUncleTeepediaLiveItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    apiGetPublic<PublicUncleTeepediaLiveItem[]>('/public-uncleteepedia/live')
      .then((response) => {
        if (mounted) setLive(response.data);
      })
      .catch((reason) => {
        if (mounted) setError(reason?.message ?? 'Could not load live shows');
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Layout>
      <PageHero
        eyebrow="Live quiz arena"
        title="UncleTeepedia"
        text="Watch our 60 Seconds of Fame shows and multiple-choice championships live. Follow a contestant, see every answer as it lands, and celebrate the leaderboard."
        image="/school.JPG"
      />
      <Container className="py-12 sm:py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-brand-700">
              <Radio size={14} /> Live now
            </p>
            <h2 className="mt-2 font-display text-3xl font-extrabold text-ink sm:text-4xl">
              The stage is open
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              Every question, answer and leaderboard position is streamed from the host control
              room. Correct answers appear only after the quizmaster reveals them.
            </p>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded bg-brand-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
          >
            Pupil login <ArrowRight size={15} />
          </Link>
        </div>

        {error && (
          <p className="mb-6 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>
        )}

        {!live && !error && (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="h-48 animate-pulse rounded bg-brand-50" />
            ))}
          </div>
        )}

        {live && live.length === 0 && (
          <div className="rounded border border-dashed border-line bg-cream px-6 py-14 text-center">
            <Trophy className="mx-auto text-brand-400" size={40} />
            <h3 className="mt-3 font-display text-2xl font-extrabold text-ink">No live show right now</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
              Check back when the next competition starts. Pupils can join from the student portal
              with the code their host shares.
            </p>
          </div>
        )}

        {live && live.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2">
            {live.map((item) => (
              <Link
                key={item.sessionId}
                to={`/uncleteepedia/watch/${item.sessionId}`}
                className="group overflow-hidden rounded border border-line bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-lg"
              >
                <div
                  className="relative flex h-44 items-end bg-brand-900 p-5 text-white"
                  style={
                    item.competition.coverUrl
                      ? {
                          backgroundImage: `linear-gradient(180deg, rgba(4,58,33,.15), rgba(4,58,33,.92)), url(${item.competition.coverUrl})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }
                      : undefined
                  }
                >
                  <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-white">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Live
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[.2em] text-lime-accent">
                      {formatLabel(item.competition.format)}
                    </p>
                    <h3 className="mt-1 font-display text-2xl font-extrabold">{item.competition.title}</h3>
                    <p className="mt-1 text-xs text-white/75">{modeLabel(item.competition.gameplayMode)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between px-5 py-4 text-sm">
                  <span className="inline-flex items-center gap-2 font-bold text-brand-700">
                    <Users size={15} /> {item.participants} contestant(s)
                  </span>
                  <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-700 group-hover:text-brand-500">
                    Watch live <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </Layout>
  );
};
