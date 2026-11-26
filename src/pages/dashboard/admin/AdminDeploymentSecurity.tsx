import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardHead,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  Modal,
  PageHeader,
  Pill,
} from '@/components/dashboard/DashboardUI';
import { useResource } from '@/context/AuthContext';
import { ROUTES } from '@/routes/paths';
import { apiDelete, apiPatch, apiPost } from '@/lib/api';
import type { ExamDeploymentItem } from '@/data/dashboard';
import {
  SECURITY_CHECK_GROUPS,
  SECURITY_NUMBERS,
  SECURITY_OFFLINE_RADIO,
  SECURITY_OFFLINE_SWITCHES,
  SECURITY_RADIOS,
  SECURITY_SWITCH_GROUPS,
  cloneDefaultSecuritySettings,
  enabledSecurityCount,
  mergeSecuritySettings,
  policyLabel,
  type BooleanSecurityKey,
  type DeploymentSecurityMode,
  type DeploymentSecurityProfileItem,
  type DeploymentSecuritySettings,
  type MultiSecurityKey,
  type NumberSecurityKey,
  type PolicySecurityKey,
} from '@/data/deploymentSecurity';
import {
  CheckCircle2,
  Cloud,
  CloudOff,
  MonitorPlay,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
} from 'lucide-react';

const MODE_META: Record<DeploymentSecurityMode, { label: string; blurb: string; icon: typeof Cloud }> = {
  ONLINE: {
    label: 'Online',
    blurb: 'Applied to web exam deployments at /examination/:code.',
    icon: Cloud,
  },
  OFFLINE: {
    label: 'Offline',
    blurb: 'Applied to bundles downloaded by the desktop host app.',
    icon: CloudOff,
  },
};

// ─── Small form primitives ───────────────────────────────────────────────────

const Switch = ({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className={`inline-flex h-6 w-11 shrink-0 items-center rounded-full px-1 transition-colors ${checked ? 'bg-brand-500' : 'bg-line'}`}
  >
    <span className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : ''}`} />
  </button>
);

const SwitchRow = ({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) => (
  <div className="flex items-start justify-between gap-3 border border-line bg-white px-3 py-2.5">
    <div className="min-w-0">
      <p className="text-sm font-semibold leading-snug">{label}</p>
      {hint && <p className="mt-0.5 text-xs leading-relaxed text-muted">{hint}</p>}
    </div>
    <Switch checked={checked} onChange={onChange} label={label} />
  </div>
);

const RadioGroup = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string; hint?: string }>;
  onChange: (next: string) => void;
}) => (
  <fieldset className="border border-line bg-white p-3">
    <legend className="px-1 text-[11px] font-bold uppercase tracking-widest text-brand-700">{label}</legend>
    <div className="mt-1 grid gap-1">
      {options.map((option) => (
        <label
          key={option.value}
          className={`flex cursor-pointer items-start gap-2 rounded px-2 py-1.5 text-sm transition-colors ${value === option.value ? 'bg-brand-50 text-brand-800' : 'hover:bg-cream'}`}
        >
          <input
            type="radio"
            name={label}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="mt-0.5 h-4 w-4 accent-brand-700"
          />
          <span>
            <span className="font-semibold">{option.label}</span>
            {option.hint && <span className="block text-xs text-muted">{option.hint}</span>}
          </span>
        </label>
      ))}
    </div>
  </fieldset>
);

const CheckGroup = ({
  title,
  text,
  options,
  selected,
  onToggle,
}: {
  title: string;
  text: string;
  options: Array<{ value: string; label: string }>;
  selected: string[];
  onToggle: (value: string) => void;
}) => (
  <fieldset className="border border-line bg-white p-3">
    <legend className="px-1 text-[11px] font-bold uppercase tracking-widest text-brand-700">{title}</legend>
    <p className="mb-2 text-xs leading-relaxed text-muted">{text}</p>
    <div className="grid gap-1 sm:grid-cols-2">
      {options.map((option) => (
        <label
          key={option.value}
          className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1.5 text-sm hover:bg-brand-50"
        >
          <input
            type="checkbox"
            checked={selected.includes(option.value)}
            onChange={() => onToggle(option.value)}
            className="h-4 w-4 rounded accent-brand-700"
          />
          <span className="font-semibold">{option.label}</span>
        </label>
      ))}
    </div>
  </fieldset>
);

const SectionHeading = ({ title, text }: { title: string; text: string }) => (
  <div>
    <h4 className="font-display text-sm font-extrabold text-ink">{title}</h4>
    <p className="mt-0.5 text-xs leading-relaxed text-muted">{text}</p>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export const AdminDeploymentSecurity = () => {
  const [mode, setMode] = useState<DeploymentSecurityMode>('ONLINE');
  const [notice, setNotice] = useState<string | null>(null);

  const profileQuery = useMemo(() => ({ mode }), [mode]);
  const deploymentQuery = useMemo(() => ({ mode, limit: 100 }), [mode]);

  const profiles = useResource<DeploymentSecurityProfileItem[]>('/deployment-security', profileQuery);
  const deployments = useResource<ExamDeploymentItem[]>('/exam-deployments', deploymentQuery);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DeploymentSecurityProfileItem | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [settings, setSettings] = useState<DeploymentSecuritySettings>(cloneDefaultSecuritySettings);
  const [isDefault, setIsDefault] = useState(false);
  const [assigned, setAssigned] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const rows = useMemo(() => profiles.data ?? [], [profiles.data]);
  const deploymentRows = useMemo(() => deployments.data ?? [], [deployments.data]);

  const setBool = (key: BooleanSecurityKey, value: boolean) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const setNumber = (key: NumberSecurityKey, value: number) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const setPolicy = (key: PolicySecurityKey, value: string) =>
    setSettings((prev) => ({ ...prev, [key]: value } as DeploymentSecuritySettings));

  const toggleList = (key: MultiSecurityKey, value: string) =>
    setSettings((prev) => {
      const current = prev[key] as string[];
      const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
      return { ...prev, [key]: next } as DeploymentSecuritySettings;
    });

  const openCreate = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setSettings(cloneDefaultSecuritySettings());
    setIsDefault(false);
    setAssigned([]);
    setFormError(null);
    setNotice(null);
    setModalOpen(true);
  };

  const openEdit = (profile: DeploymentSecurityProfileItem) => {
    setEditing(profile);
    setName(profile.name);
    setDescription(profile.description ?? '');
    setSettings(mergeSecuritySettings(profile.settings));
    setIsDefault(profile.isDefault);
    setAssigned((profile.deployments ?? []).map((deployment) => deployment.id));
    setFormError(null);
    setNotice(null);
    setModalOpen(true);
  };

  const save = async () => {
    if (!name.trim()) {
      setFormError('Give the profile a name first.');
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      const body = {
        name: name.trim(),
        description: description.trim() || null,
        mode: editing?.mode ?? mode,
        settings,
        isDefault,
        deploymentIds: assigned,
      };
      if (editing) {
        await apiPatch(`/deployment-security/${editing.id}`, body);
        setNotice(`Security profile "${name.trim()}" updated.`);
      } else {
        await apiPost('/deployment-security', body);
        setNotice(`Security profile "${name.trim()}" created.`);
      }
      setModalOpen(false);
      setEditing(null);
      profiles.reload();
      deployments.reload();
    } catch (error: any) {
      setFormError(error?.message ?? 'Could not save the security profile');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (profile: DeploymentSecurityProfileItem) => {
    if (!confirm(`Delete security profile "${profile.name}"? Deployments using it keep running with default protections.`)) return;
    setBusy(true);
    try {
      await apiDelete(`/deployment-security/${profile.id}`);
      setNotice(`Security profile "${profile.name}" deleted.`);
      profiles.reload();
      deployments.reload();
    } catch (error: any) {
      setNotice(error?.message ?? 'Delete failed');
    } finally {
      setBusy(false);
    }
  };

  const activeMode = editing?.mode ?? mode;
  const ModeIcon = MODE_META[mode].icon;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Exam & Test"
        title="Deployment Security"
        text="Build named security profiles for online deployments and offline bundles, then attach each profile to the deployments that need it."
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex min-h-11 items-center rounded bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
          >
            <Plus aria-hidden="true" size={16} className="mr-2" /> New profile
          </button>
        }
      />
      {notice && !modalOpen && (
        <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">
          {notice}
        </p>
      )}

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Deployment security mode">
        {(Object.keys(MODE_META) as DeploymentSecurityMode[]).map((value) => {
          const Icon = MODE_META[value].icon;
          const selected = mode === value;
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => { setMode(value); setNotice(null); }}
              className={`inline-flex min-h-11 items-center gap-2 rounded px-4 py-2 text-sm font-bold ${
                selected
                  ? 'bg-brand-900 text-white'
                  : 'border border-line bg-white text-muted hover:border-brand-500 hover:text-brand-700'
              }`}
            >
              <Icon size={16} aria-hidden="true" />
              {MODE_META[value].label}
            </button>
          );
        })}
      </div>

      <p className="flex items-start gap-2 border border-line bg-white px-4 py-3 text-xs leading-relaxed text-muted">
        <ModeIcon size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-brand-700" />
        {MODE_META[mode].blurb} A deployment can hold one profile at a time; assign it here or from the Deployments page.
      </p>

      <Card>
        <CardHead
          title={`${MODE_META[mode].label} security profiles`}
          sub={`${rows.length} profile(s) · switch, radio and checkbox protections`}
        />
        {profiles.loading ? (
          <div className="px-5 py-5"><LoadingSkeleton rows={4} /></div>
        ) : profiles.error ? (
          <div className="px-5 py-5"><ErrorState message={profiles.error} onRetry={profiles.reload} /></div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-5">
            <EmptyState message={`No ${MODE_META[mode].label.toLowerCase()} security profiles yet — create one to bundle protections for your deployments.`} />
          </div>
        ) : (
          <div className="grid gap-4 p-5 md:grid-cols-2">
            {rows.map((profile) => {
              const merged = mergeSecuritySettings(profile.settings);
              const assignedRows = profile.deployments ?? [];
              const strict = merged.tabSwitchPolicy !== 'WARN' || merged.lockOnViolation || merged.autoSubmitOnLeave;
              return (
                <article key={profile.id} className="flex flex-col border border-line bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 font-display text-base font-extrabold">
                        <ShieldCheck size={17} aria-hidden="true" className="text-brand-700" />
                        {profile.name}
                        {profile.isDefault && <Pill tone="emerald">Default</Pill>}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-muted">
                        {profile.description || 'No description — open Edit to add one.'}
                      </p>
                    </div>
                    <span className="flex shrink-0 gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit(profile)}
                        aria-label={`Edit ${profile.name}`}
                        title="Edit profile"
                        className="rounded border border-line px-2.5 py-1.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700"
                      >
                        <Pencil size={14} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(profile)}
                        disabled={busy}
                        aria-label={`Delete ${profile.name}`}
                        title="Delete profile"
                        className="rounded border border-line px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:border-rose-300 disabled:opacity-60"
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Pill tone="sky">{enabledSecurityCount(merged)} protections on</Pill>
                    <Pill tone={strict ? 'rose' : 'amber'}>{policyLabel('tabSwitchPolicy', merged.tabSwitchPolicy)}</Pill>
                    <Pill tone="violet">{policyLabel('calculatorPolicy', merged.calculatorPolicy)}</Pill>
                    <Pill tone="ink">{merged.maxViolations} violation{merged.maxViolations === 1 ? '' : 's'}</Pill>
                  </div>

                  <div className="mt-3 border-t border-line pt-3">
                    <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-muted">
                      <MonitorPlay size={12} aria-hidden="true" /> Assignments
                    </p>
                    {assignedRows.length === 0 ? (
                      <p className="mt-1.5 text-xs text-muted">No deployments assigned yet.</p>
                    ) : (
                      <ul className="mt-1.5 flex flex-wrap gap-1.5">
                        {assignedRows.map((deployment) => (
                          <li key={deployment.id}>
                            <span className="inline-flex items-center gap-1 rounded border border-line bg-cream px-2 py-1 text-[11px] font-bold">
                              <span className="font-mono">{deployment.code}</span>
                              <span className="text-muted">{deployment.status}</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Card>

      <Card>
        <CardHead
          title="How profiles work"
          sub="One profile can protect many deployments of the same mode"
        />
        <div className="grid gap-4 p-5 text-sm leading-relaxed text-muted md:grid-cols-3">
          <p><b className="text-ink">1 · Build a profile.</b> Pick switches for delivery behaviour, integrity detection, session limits and device restrictions.</p>
          <p><b className="text-ink">2 · Assign deployments.</b> Tick any online or offline deployments in the editor — or use the shield button on the Deployments page.</p>
          <p><b className="text-ink">3 · Keep modes separate.</b> Online profiles only attach to web deployments; offline profiles only attach to desktop bundles.</p>
        </div>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit security profile — ${editing.name}` : `New ${MODE_META[mode].label.toLowerCase()} security profile`}
        size="xl"
      >
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold">
              Profile name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Strict online invigilation"
                className="mt-1.5 min-h-11 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500"
              />
            </label>
            <label className="block text-sm font-semibold">
              Description
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="When should staff use this profile?"
                className="mt-1.5 min-h-11 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3 border border-line bg-cream px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm font-bold">
                <Pill tone={activeMode === 'ONLINE' ? 'sky' : 'amber'}>{MODE_META[activeMode].label}</Pill>
                Default profile for this mode
              </p>
              <p className="mt-1 text-xs text-muted">New deployments of this mode can pick it quickly; only one default per mode.</p>
            </div>
            <Switch checked={isDefault} onChange={setIsDefault} label="Default profile for this mode" />
          </div>

          {SECURITY_SWITCH_GROUPS.map((group) => (
            <section key={group.title} className="space-y-2">
              <SectionHeading title={group.title} text={group.text} />
              <div className="grid gap-2 sm:grid-cols-2">
                {group.options.map((option) => (
                  <SwitchRow
                    key={option.key}
                    label={option.label}
                    hint={option.hint}
                    checked={settings[option.key]}
                    onChange={(next) => setBool(option.key, next)}
                  />
                ))}
              </div>
            </section>
          ))}

          <section className="space-y-2">
            <SectionHeading title="Policies" text="Radio choices for how ambiguous situations are handled." />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {SECURITY_RADIOS.map((radio) => (
                <RadioGroup
                  key={radio.key}
                  label={radio.label}
                  value={settings[radio.key]}
                  options={radio.options}
                  onChange={(value) => setPolicy(radio.key, value)}
                />
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <SectionHeading title="Session limits" text="Numeric guardrails used by the exam room and host app." />
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {SECURITY_NUMBERS.map((number) => (
                <label key={number.key} className="block border border-line bg-white px-3 py-2.5 text-sm font-semibold">
                  {number.label}
                  <span className="mt-0.5 block text-xs font-normal leading-relaxed text-muted">{number.hint}</span>
                  <span className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={settings[number.key]}
                      onChange={(event) => setNumber(number.key, Number(event.target.value) || 0)}
                      className="min-h-10 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500"
                    />
                    {number.suffix && <span className="text-xs text-muted">{number.suffix}</span>}
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <SectionHeading title="Blocked shortcuts, monitored events & restrictions" text="Tick everything this profile should intercept or log." />
            {SECURITY_CHECK_GROUPS.map((group) => (
              <CheckGroup
                key={group.key}
                title={group.title}
                text={group.text}
                options={group.options}
                selected={settings[group.key] as string[]}
                onToggle={(value) => toggleList(group.key, value)}
              />
            ))}
          </section>

          {activeMode === 'OFFLINE' && (
            <section className="space-y-2">
              <SectionHeading title="Desktop host behaviour" text="Only applied when the offline bundle runs in the desktop host app." />
              <div className="grid gap-2 sm:grid-cols-2">
                {SECURITY_OFFLINE_SWITCHES.map((option) => (
                  <SwitchRow
                    key={option.key}
                    label={option.label}
                    hint={option.hint}
                    checked={settings[option.key]}
                    onChange={(next) => setBool(option.key, next)}
                  />
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <RadioGroup
                  label={SECURITY_OFFLINE_RADIO.label}
                  value={settings[SECURITY_OFFLINE_RADIO.key]}
                  options={SECURITY_OFFLINE_RADIO.options}
                  onChange={(value) => setPolicy(SECURITY_OFFLINE_RADIO.key, value)}
                />
              </div>
            </section>
          )}

          <section className="space-y-2">
            <SectionHeading
              title="Assign deployments"
              text={`Tick ${MODE_META[activeMode].label.toLowerCase()} deployments that should use this profile.`}
            />
            {deployments.loading ? (
              <LoadingSkeleton rows={2} />
            ) : deploymentRows.length === 0 ? (
              <p className="border border-dashed border-line bg-cream px-4 py-4 text-sm text-muted">
                No {MODE_META[activeMode].label.toLowerCase()} deployments yet.{' '}
                <Link to={ROUTES.adminDeployments} className="font-bold text-brand-700 underline hover:text-brand-900">
                  Create one on the Deployments page
                </Link>{' '}
                first.
              </p>
            ) : (
              <div className="grid max-h-56 gap-1.5 overflow-y-auto border border-line p-2 sm:grid-cols-2">
                {deploymentRows.map((deployment) => (
                  <label
                    key={deployment.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-sm hover:bg-brand-50"
                  >
                    <input
                      type="checkbox"
                      checked={assigned.includes(deployment.id)}
                      onChange={() =>
                        setAssigned((prev) =>
                          prev.includes(deployment.id)
                            ? prev.filter((id) => id !== deployment.id)
                            : [...prev, deployment.id],
                        )
                      }
                      className="h-4 w-4 rounded accent-brand-700"
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-bold">
                        {deployment.mode === 'OFFLINE' ? 'Offline bundle' : deployment.exam?.exam_name ?? 'Online exam'}
                      </span>
                      <span className="block font-mono text-[11px] text-muted">
                        {deployment.code} · {deployment.status}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </section>

          {formError && (
            <p role="alert" className="border-l-2 border-rose-400 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {formError}
            </p>
          )}

          <div className="flex flex-wrap gap-3 border-t border-line pt-4">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="min-h-11 flex-1 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={busy || !name.trim()}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded bg-brand-500 px-4 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {busy ? 'Saving…' : editing ? 'Save changes' : 'Create profile'}
            </button>
          </div>

          <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
            <CheckCircle2 size={14} aria-hidden="true" className="mt-0.5 shrink-0 text-brand-700" />
            Assigning this profile in the editor also detaches deployments you untick. A deployment has at most one security profile.
          </p>
        </div>
      </Modal>
    </div>
  );
};
