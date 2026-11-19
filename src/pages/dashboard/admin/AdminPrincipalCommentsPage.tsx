import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, MessageSquareText, Search } from 'lucide-react';
import {
  Card,
  CardHead,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  Modal,
  PageHeader,
  Pill,
  Td,
  Th,
} from '@/components/dashboard/DashboardUI';
import { apiGet, apiPost } from '@/lib/api';
import { useAcademicSettings } from '@/lib/academic';
import { TERM_OPTIONS, sessionOptions, type ClassItem } from '@/data/dashboard';
import { initialsOf, VARIANT_SHORT } from './result-generator/helpers';
import type { PrincipalStudentList, PrincipalStudentRow } from './result-generator/types';

type CommentKind = 'principal' | 'class-teacher';

const CONFIG = {
  principal: {
    eyebrow: 'Reports',
    title: 'Principal Comments',
    description:
      'Review every pupil in the selected term and write the principal’s comment that prints on their result-notification sheet.',
    listEndpoint: '/report-cards/principal',
    saveEndpoint: '/report-cards/principal-comment',
    field: 'principalComment' as const,
    columnTitle: 'Principal comment',
    modalTitle: 'Principal comment',
    emptyComment: 'Not written yet',
    addLabel: 'Add comment',
    editLabel: 'Edit comment',
    inputLabel: 'Principal’s comment',
    placeholder: 'Write the comment that will print in the PRINCIPALS COMMENT row.',
    error:
      'Could not load principal comments. This page is available to the principal and school administrators.',
  },
  'class-teacher': {
    eyebrow: 'Reports',
    title: 'Class Teacher Remarks',
    description:
      'Review the pupils in your assigned class and write the class teacher’s remark for their result-notification sheet.',
    listEndpoint: '/report-cards/class-teacher',
    saveEndpoint: '/report-cards/class-teacher-comment',
    field: 'classTeacherRemark' as const,
    columnTitle: 'Class teacher remark',
    modalTitle: 'Class teacher remark',
    emptyComment: 'Not written yet',
    addLabel: 'Add remark',
    editLabel: 'Edit remark',
    inputLabel: 'Class teacher’s remark',
    placeholder: 'Write the remark that will print in the CLASS TEACHER REMARK row.',
    error:
      'Could not load class-teacher remarks. This page is available to a class teacher assigned to a class.',
  },
};

const CommentReviewPage = ({ kind }: { kind: CommentKind }) => {
  const config = CONFIG[kind];
  const queryClient = useQueryClient();
  const academic = useAcademicSettings();
  // Start on the current period from Settings, but keep the controls so a
  // principal can review another term without leaving the page.
  const [session, setSession] = useState('');
  const [term, setTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<PrincipalStudentRow | null>(null);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ text: string; tone: 'ok' | 'error' } | null>(null);

  useEffect(() => {
    const settings = academic.data?.data;
    if (!settings) return;
    setSession((previous) => previous || settings.session);
    setTerm((previous) => previous || settings.term);
  }, [academic.data]);

  const classesQuery = useQuery({
    queryKey: ['comment-classes'],
    queryFn: async () => (await apiGet<ClassItem[]>('/classes', { limit: 200 })).data,
    staleTime: 60_000,
    enabled: kind === 'principal',
  });
  const listQuery = useQuery({
    queryKey: ['comment-review', kind, session, term, classFilter, query],
    queryFn: async () =>
      (
        await apiGet<PrincipalStudentList>(config.listEndpoint, {
          session,
          term,
          classId: classFilter || undefined,
          search: query || undefined,
        })
      ).data,
    staleTime: 30_000,
    enabled: Boolean(session && term),
  });

  const rows = listQuery.data?.rows ?? [];
  const classOptions =
    kind === 'principal' ? classesQuery.data ?? [] : listQuery.data?.classes ?? [];
  const effectiveClass =
    classFilter || (kind === 'class-teacher' ? listQuery.data?.classId ?? '' : '');
  const commentOf = (row: PrincipalStudentRow) =>
    kind === 'principal'
      ? row.card?.principalComment ?? ''
      : row.card?.classTeacherRemark ?? '';
  const commented = useMemo(
    () => rows.filter((row) => commentOf(row).trim()).length,
    [rows, kind],
  );

  const openEditor = (row: PrincipalStudentRow) => {
    setEditing(row);
    setComment(commentOf(row));
    setNotice(null);
  };

  const saveComment = async () => {
    if (!editing) return;
    setSaving(true);
    setNotice(null);
    try {
      const body: Record<string, unknown> = {
        studentId: editing.studentId,
        session,
        term,
        [config.field]: comment.trim(),
      };
      await apiPost(config.saveEndpoint, body);
      setNotice({ text: `${config.modalTitle} saved for ${editing.user_name}.`, tone: 'ok' });
      setEditing(null);
      void queryClient.invalidateQueries({ queryKey: ['comment-review', kind] });
    } catch (error: any) {
      setNotice({ text: error?.message ?? `Could not save the ${config.modalTitle.toLowerCase()}.`, tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={config.eyebrow} title={config.title} text={config.description} />

      {notice && (
        <p
          role="status"
          className={`border-l-2 px-4 py-3 text-sm ${
            notice.tone === 'error'
              ? 'border-rose-400 bg-rose-50 text-rose-800'
              : 'border-lime-accent bg-brand-50 text-brand-800'
          }`}
        >
          {notice.text}
        </p>
      )}

      <Card>
        <CardHead
          title={kind === 'principal' ? 'Pupil comments' : 'Pupil remarks'}
          sub={`${rows.length} pupil(s) · ${commented} with a comment · ${session} ${term}`}
        />
        <div className="flex flex-wrap items-end gap-2 border-b border-line px-5 py-4">
          <label className="block text-xs font-bold text-muted">
            Session
            <select
              value={session}
              onChange={(event) => setSession(event.target.value)}
              className="mt-1 block min-h-11 rounded border border-line bg-white px-3 text-sm font-semibold"
            >
              {sessionOptions().map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-bold text-muted">
            Term
            <select
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              className="mt-1 block min-h-11 rounded border border-line bg-white px-3 text-sm font-semibold"
            >
              {TERM_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-bold text-muted">
            Class
            <select
              value={effectiveClass}
              onChange={(event) => setClassFilter(event.target.value)}
              className="mt-1 block min-h-11 rounded border border-line bg-white px-3 text-sm font-semibold"
              disabled={kind === 'class-teacher' && classOptions.length <= 1}
            >
              {kind === 'principal' && <option value="">All classes</option>}
              {classOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <form
            className="flex flex-1 flex-wrap items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              setQuery(search.trim());
            }}
          >
            <label className="block min-w-48 flex-1 text-xs font-bold text-muted">
              Search pupil
              <span className="relative mt-1 block">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                  size={14}
                  aria-hidden="true"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Name or email..."
                  className="min-h-11 w-full rounded border border-line bg-white pl-9 pr-3 text-sm outline-none focus:border-brand-500"
                />
              </span>
            </label>
            <button
              type="submit"
              className="min-h-11 rounded bg-brand-900 px-4 text-sm font-bold text-white hover:bg-brand-700"
            >
              Search
            </button>
            {(query || classFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setQuery('');
                  setClassFilter('');
                }}
                className="min-h-11 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink"
              >
                Reset
              </button>
            )}
          </form>
        </div>

        {listQuery.isPending ? (
          <div className="px-5 py-5">
            <LoadingSkeleton rows={6} />
          </div>
        ) : listQuery.isError ? (
          <div className="px-5 py-5">
            <ErrorState message={config.error} onRetry={() => listQuery.refetch()} />
          </div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-5">
            <EmptyState message="No pupils match this selection." />
          </div>
        ) : (
          <div className="scroll-db max-h-[38rem] overflow-auto">
            <table className="w-full min-w-[840px] text-left text-sm">
              <thead>
                <tr>
                  <Th>Pupil</Th>
                  <Th>Class</Th>
                  <Th>Section</Th>
                  <Th>{config.columnTitle}</Th>
                  <Th>Updated</Th>
                  <Th>
                    <span className="sr-only">Action</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const text = commentOf(row);
                  return (
                    <tr key={row.studentId}>
                      <Td>
                        <span className="flex items-center gap-2.5">
                          {row.photoUrl ? (
                            <img
                              src={row.photoUrl}
                              alt=""
                              className="h-9 w-9 shrink-0 rounded-full border border-line object-cover"
                            />
                          ) : (
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-900 text-[10px] font-extrabold text-lime-accent">
                              {initialsOf(row.user_name)}
                            </span>
                          )}
                          <span>
                            <span className="block font-bold">{row.user_name}</span>
                            <span className="block text-xs text-muted">
                              {row.admissionNumber || row.user_email}
                            </span>
                          </span>
                        </span>
                      </Td>
                      <Td className="text-muted">{row.className || '-'}</Td>
                      <Td>
                        <Pill tone={row.variant === 'junior' ? 'emerald' : 'violet'}>
                          {VARIANT_SHORT[row.variant]}
                        </Pill>
                      </Td>
                      <Td className="max-w-md">
                        {text ? (
                          <span className="line-clamp-2 text-xs text-ink">{text}</span>
                        ) : (
                          <span className="text-xs text-muted">{config.emptyComment}</span>
                        )}
                      </Td>
                      <Td className="text-xs text-muted">
                        {row.card?.updatedAt
                          ? new Date(row.card.updatedAt).toLocaleDateString()
                          : '-'}
                      </Td>
                      <Td>
                        <button
                          type="button"
                          onClick={() => openEditor(row)}
                          className="inline-flex items-center gap-1 rounded border border-line px-3 py-1.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700"
                        >
                          <MessageSquareText size={13} aria-hidden="true" />
                          {text ? config.editLabel : config.addLabel}
                        </button>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={Boolean(editing)}
        onClose={() => (saving ? undefined : setEditing(null))}
        title={editing ? `${config.modalTitle} · ${editing.user_name}` : config.modalTitle}
        size="lg"
      >
        {editing && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 border border-line bg-cream px-4 py-3">
              {editing.photoUrl ? (
                <img
                  src={editing.photoUrl}
                  alt=""
                  className="h-12 w-12 rounded-full border border-line object-cover"
                />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-900 text-sm font-extrabold text-lime-accent">
                  {initialsOf(editing.user_name)}
                </span>
              )}
              <div>
                <p className="font-bold text-ink">{editing.user_name}</p>
                <p className="text-xs text-muted">
                  {editing.className || 'No class'} ·{' '}
                  {editing.combinationName || 'No combination'} · {session} {term}
                </p>
              </div>
              <Pill tone="violet">{VARIANT_SHORT[editing.variant]}</Pill>
            </div>

            <label className="block text-sm font-semibold">
              {config.inputLabel}
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={6}
                maxLength={1200}
                placeholder={config.placeholder}
                className="mt-2 w-full rounded border border-line bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-brand-500"
              />
            </label>
            <p className="text-xs text-muted">
              Leave blank to keep the printed row empty. This does not overwrite the other remarks.
            </p>

            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <button
                type="button"
                onClick={() => setEditing(null)}
                disabled={saving}
                className="min-h-11 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveComment}
                disabled={saving}
                className="inline-flex min-h-11 items-center gap-2 rounded bg-brand-500 px-5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                <BadgeCheck size={16} aria-hidden="true" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export const AdminPrincipalCommentsPage = () => <CommentReviewPage kind="principal" />;
export const TeacherClassTeacherCommentsPage = () => <CommentReviewPage kind="class-teacher" />;
