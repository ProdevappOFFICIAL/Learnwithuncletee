import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Card,
  CardHead,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  PageHeader,
  TableWrap,
  Td,
  Th,
} from '@/components/dashboard/DashboardUI';
import { useResource } from '@/context/AuthContext';
import { apiPatch } from '@/lib/api';
import { MapPin } from 'lucide-react';

interface AttendanceRow {
  id: string;
  date: string;
  checkInAt: string;
  latitude: number;
  longitude: number;
  distanceM: number;
  withinRange: boolean;
  user: { user_name: string; user_email: string };
}

const dayString = (d: Date, tz = 'Africa/Lagos') =>
  d.toLocaleDateString('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });

type Preset = 'today' | 'yesterday' | 'custom';

export const AdminAttendancePage = () => {
  const todayStr = dayString(new Date());
  const yesterdayStr = dayString(new Date(Date.now() - 24 * 60 * 60 * 1000));

  const [preset, setPreset] = useState<Preset>('today');
  const [date, setDate] = useState(todayStr);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [inRange, setInRange] = useState('');
  const [page, setPage] = useState(1);

  // Location settings (stored as school settings keys).
  const settings = useResource<Record<string, string>>('/settings');
  const [loc, setLoc] = useState({ latitude: '', longitude: '', radiusM: '' });
  const [locLoaded, setLocLoaded] = useState(false);
  const [locBusy, setLocBusy] = useState(false);
  const [locMsg, setLocMsg] = useState<string | null>(null);

  const settingsData = settings.data;
  useEffect(() => {
    if (!settings.loading && !settings.error && settingsData && !locLoaded) {
      setLoc({
        latitude: settingsData['attendance.latitude'] ?? '',
        longitude: settingsData['attendance.longitude'] ?? '',
        radiusM: settingsData['attendance.radiusM'] ?? '150',
      });
      setLocLoaded(true);
    }
  }, [settings.loading, settings.error, settingsData, locLoaded]);

  const { data, meta, loading, error, reload } = useResource<AttendanceRow[]>('/attendance', {
    date,
    search: query || undefined,
    inRange: inRange || undefined,
    page,
    limit: 20,
  });
  const total: number = meta?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  const pickPreset = (p: Preset) => {
    setPreset(p);
    setPage(1);
    if (p === 'today') setDate(todayStr);
    if (p === 'yesterday') setDate(yesterdayStr);
  };

  const saveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocBusy(true);
    setLocMsg(null);
    try {
      const lat = Number(loc.latitude);
      const lng = Number(loc.longitude);
      const radius = Number(loc.radiusM);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(radius) || radius <= 0) {
        setLocMsg('Enter a valid latitude, longitude and a positive radius in metres.');
        return;
      }
      await apiPatch<Record<string, string>>('/settings', {
        'attendance.latitude': String(lat),
        'attendance.longitude': String(lng),
        'attendance.radiusM': String(radius),
      });
      setLocMsg('School location saved. Check-ins are now judged against this point.');
      settings.reload();
      setLocLoaded(false);
    } catch (err: any) {
      setLocMsg(err?.message ?? 'Save failed');
    } finally {
      setLocBusy(false);
    }
  };

  const siteUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/attendance/checkin?site=school`
      : '/attendance/checkin?site=school';

  const inputClass = 'mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Members"
        title="Attendance"
        text="Teacher check-ins verified by QR scan plus GPS. Pick a day, search a teacher, or review who was in range."
      />

      <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-700">School location</p>
          <h3 className="mt-2 font-display text-lg font-extrabold">Where check-ins count</h3>
          <p className="mt-1 text-sm text-muted">Teachers must be within this radius when they scan, or the check-in is rejected.</p>
          {settings.loading ? (
            <div className="mt-4"><LoadingSkeleton rows={3} /></div>
          ) : settings.error || !settings.data ? (
            <div className="mt-4"><ErrorState message={settings.error ?? 'No data'} onRetry={settings.reload} /></div>
          ) : (
            <form onSubmit={saveLocation} className="mt-4 grid gap-3 sm:grid-cols-3">
              <label className="block text-sm font-semibold">Latitude
                <input required value={loc.latitude} onChange={(e) => setLoc({ ...loc, latitude: e.target.value })} placeholder="e.g. 6.5244" inputMode="decimal" className={inputClass} />
              </label>
              <label className="block text-sm font-semibold">Longitude
                <input required value={loc.longitude} onChange={(e) => setLoc({ ...loc, longitude: e.target.value })} placeholder="e.g. 3.3792" inputMode="decimal" className={inputClass} />
              </label>
              <label className="block text-sm font-semibold">Radius (m)
                <input required value={loc.radiusM} onChange={(e) => setLoc({ ...loc, radiusM: e.target.value })} placeholder="150" inputMode="numeric" className={inputClass} />
              </label>
              <div className="sm:col-span-3">
                <button type="submit" disabled={locBusy} className="inline-flex min-h-11 items-center rounded bg-brand-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
                  <MapPin size={15} aria-hidden="true" className="mr-2" /> {locBusy ? 'Saving…' : 'Save location'}
                </button>
              </div>
            </form>
          )}
          {locMsg && <p role="status" className="mt-4 border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{locMsg}</p>}
        </Card>

        <Card className="p-5 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Check-in QR</p>
          <h3 className="mt-2 font-display text-lg font-extrabold">Print & post at the entrance</h3>
          <div className="mx-auto mt-4 w-fit border border-line bg-white p-4">
            <QRCodeSVG value={siteUrl} size={180} aria-label="Teacher check-in QR code" />
          </div>
          <p className="mt-3 break-all font-mono text-[11px] text-muted">{siteUrl}</p>
          <p className="mt-1 text-xs text-muted">The server matches the embedded site and the teacher's GPS — photos of this code won't work off-site.</p>
        </Card>
      </div>

      <Card>
        <CardHead title="Check-in records" sub={total ? `${total} entr${total === 1 ? 'y' : 'ies'} found` : undefined} />
        <form
          className="flex flex-wrap items-end gap-2 border-b border-line px-5 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(search);
            setPage(1);
          }}
        >
          <div className="flex gap-1 rounded border border-line p-1" role="group" aria-label="Date preset">
            {(['today', 'yesterday', 'custom'] as Preset[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => pickPreset(p)}
                aria-pressed={preset === p}
                className={`min-h-10 rounded px-3 py-1.5 text-xs font-bold capitalize ${preset === p ? 'bg-brand-900 text-white' : 'text-muted hover:text-ink'}`}
              >
                {p === 'custom' ? 'Pick date' : p}
              </button>
            ))}
          </div>
          <label className="block text-xs font-bold text-muted">
            Date
            <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setPreset('custom'); setPage(1); }} className="mt-1 block min-h-11 rounded border border-line bg-white px-3 text-sm font-semibold" />
          </label>
          <label className="block text-xs font-bold text-muted">
            Teacher
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name…" className="mt-1 block min-h-11 w-full min-w-44 rounded border border-line px-3 text-sm font-semibold outline-none focus:border-brand-500" />
          </label>
          <label className="block text-xs font-bold text-muted">
            Range
            <select value={inRange} onChange={(e) => setInRange(e.target.value)} className="mt-1 block min-h-11 rounded border border-line bg-white px-3 text-sm font-semibold">
              <option value="">All</option>
              <option value="true">In range</option>
              <option value="false">Out of range</option>
            </select>
          </label>
          <button type="submit" className="min-h-11 rounded bg-brand-900 px-4 text-sm font-bold text-white hover:bg-brand-700">Apply</button>
        </form>

        {loading ? (
          <div className="px-5 py-5"><LoadingSkeleton rows={5} /></div>
        ) : error || !data ? (
          <div className="px-5 py-5"><ErrorState message={error ?? 'No data'} onRetry={reload} /></div>
        ) : data.length === 0 ? (
          <div className="px-5 py-5"><EmptyState message="No check-ins match these filters." /></div>
        ) : (
          <>
            <TableWrap>
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr>
                    <Th>Teacher</Th>
                    <Th>Date</Th>
                    <Th>Checked in</Th>
                    <Th>Location</Th>
                    <Th>Distance</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((r) => (
                    <tr key={r.id}>
                      <Td className="font-bold">{r.user.user_name}</Td>
                      <Td className="text-muted">{r.date}</Td>
                      <Td className="font-semibold">
                        {new Date(r.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Td>
                      <Td className="font-mono text-xs text-muted">
                        {r.latitude.toFixed(5)}, {r.longitude.toFixed(5)}
                      </Td>
                      <Td className="font-semibold">{Math.round(r.distanceM)} m</Td>
                      <Td>
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${r.withinRange ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {r.withinRange ? 'In range' : 'Out of range'}
                        </span>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
            <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4">
              <p className="text-xs text-muted">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="min-h-10 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink disabled:opacity-40">
                  Previous
                </button>
                <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="min-h-10 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink disabled:opacity-40">
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};
