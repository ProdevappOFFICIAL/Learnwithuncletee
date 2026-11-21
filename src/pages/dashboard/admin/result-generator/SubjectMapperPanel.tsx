import { useEffect, useMemo, useState } from 'react';
import { Save, Search, X } from 'lucide-react';
import {
  normalizeSubjectAlias,
  templateSubjectNames,
  type SubjectAliasMap,
} from './helpers';

interface SubjectMapperPanelProps {
  aliases: SubjectAliasMap;
  onSave: (next: SubjectAliasMap) => Promise<void>;
}

const cloneAliases = (value: SubjectAliasMap): SubjectAliasMap =>
  Object.fromEntries(Object.entries(value ?? {}).map(([key, list]) => [key, [...(list ?? [])]]));

const lower = (value: string) => normalizeSubjectAlias(value).toLowerCase();

export const SubjectMapperPanel = ({ aliases, onSave }: SubjectMapperPanelProps) => {
  const subjects = useMemo(() => templateSubjectNames(), []);
  const [draft, setDraft] = useState<SubjectAliasMap>(() => cloneAliases(aliases));
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(cloneAliases(aliases));
    setSaved(false);
  }, [aliases]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return subjects;
    return subjects.filter((name) => {
      const haystack = [name, ...(draft[name] ?? [])].join(' ').toLowerCase();
      return haystack.includes(term);
    });
  }, [draft, search, subjects]);

  const aliasOwner = (alias: string, except: string) => {
    const needle = lower(alias);
    for (const [subject, list] of Object.entries(draft)) {
      if (subject !== except && (list ?? []).some((item) => lower(item) === needle)) return subject;
    }
    return null;
  };

  const addAlias = (subject: string) => {
    const alias = normalizeSubjectAlias(inputs[subject] ?? '');
    if (!alias) {
      setError('Type an acronym or alternative name first.');
      return;
    }
    if (alias.length > 24) {
      setError('Keep each acronym under 24 characters.');
      return;
    }
    if ((draft[subject] ?? []).some((item) => lower(item) === lower(alias))) {
      setError(`“${alias}” is already mapped to ${subject}.`);
      return;
    }
    const owner = aliasOwner(alias, subject);
    if (owner) {
      setError(`“${alias}” is already mapped to ${owner}. Remove it there first.`);
      return;
    }
    setDraft((previous) => ({
      ...previous,
      [subject]: [...(previous[subject] ?? []), alias],
    }));
    setInputs((previous) => ({ ...previous, [subject]: '' }));
    setError(null);
    setSaved(false);
  };

  const removeAlias = (subject: string, alias: string) => {
    setDraft((previous) => ({
      ...previous,
      [subject]: (previous[subject] ?? []).filter((item) => item !== alias),
    }));
    setError(null);
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(draft);
      setSaved(true);
    } catch (err: any) {
      setError(err?.message ?? 'Could not save the subject mappings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs leading-5 text-muted">
        Subject names are fixed by the template. Add the acronyms or alternative names the exam
        engine uses, and auto-map will put those scores into the matching printed subject row.
        Start with an empty list and add only the codes your school uses.
      </p>

      <label className="block">
        <span className="sr-only">Search subjects</span>
        <span className="relative block">
          <Search
            size={13}
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Find a subject or acronym..."
            className="min-h-9 w-full rounded border border-line bg-white pl-8 pr-2 text-xs outline-none focus:border-brand-500"
          />
        </span>
      </label>

      <div className="scroll-db max-h-[420px] space-y-2 overflow-y-auto pr-1">
        {visible.length === 0 ? (
          <p className="border border-dashed border-line bg-cream px-3 py-3 text-xs text-muted">
            No subject matches “{search}”.
          </p>
        ) : (
          visible.map((subject) => (
            <div key={subject} className="rounded border border-line bg-cream p-2.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-extrabold leading-4 text-ink">{subject}</p>
                <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide text-muted">
                  Fixed
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {(draft[subject] ?? []).map((alias) => (
                  <span
                    key={alias}
                    className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-800"
                  >
                    {alias}
                    <button
                      type="button"
                      onClick={() => removeAlias(subject, alias)}
                      aria-label={`Remove ${alias} from ${subject}`}
                      className="text-brand-700 hover:text-rose-700"
                    >
                      <X size={10} aria-hidden="true" />
                    </button>
                  </span>
                ))}
                {(draft[subject] ?? []).length === 0 && (
                  <span className="text-[10px] italic text-muted">No extra acronyms yet.</span>
                )}
              </div>
              <div className="mt-1.5 flex gap-1">
                <input
                  value={inputs[subject] ?? ''}
                  onChange={(event) =>
                    setInputs((previous) => ({ ...previous, [subject]: event.target.value }))
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addAlias(subject);
                    }
                  }}
                  placeholder="e.g. EGS"
                  aria-label={`Add acronym for ${subject}`}
                  className="min-h-8 min-w-0 flex-1 rounded border border-line bg-white px-2 text-[11px] outline-none focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={() => addAlias(subject)}
                  className="min-h-8 shrink-0 rounded border border-line bg-white px-2 text-[10px] font-bold text-brand-700 hover:border-brand-500 hover:bg-brand-50"
                >
                  Add
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="sticky bottom-0 space-y-1.5 border-t border-line bg-white pt-2">
        {error && (
          <p role="alert" className="border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] text-rose-800">
            {error}
          </p>
        )}
        {saved && !error && (
          <p className="border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-800">
            Subject mappings saved. They apply to every auto-map.
          </p>
        )}
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded bg-brand-900 px-3 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          <Save size={13} aria-hidden="true" /> {saving ? 'Saving...' : 'Save mappings'}
        </button>
      </div>
    </div>
  );
};
