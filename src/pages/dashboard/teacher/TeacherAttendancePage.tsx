import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Card, ErrorState, LoadingSkeleton, PageHeader } from '@/components/dashboard/DashboardUI';
import { useResource } from '@/context/AuthContext';
import { apiPost } from '@/lib/api';
import { Camera, CheckCircle2, LocateFixed, MapPin, QrCode } from 'lucide-react';

interface TodayRow {
  id: string;
  checkInAt: string;
  distanceM: number;
  withinRange: boolean;
}

interface GeoFix {
  latitude: number;
  longitude: number;
  accuracyM: number | null;
}

type Step = 'locating' | 'ready' | 'scanning' | 'done';
type Outcome =
  | { kind: 'success'; checkInAt: string; distanceM: number }
  | { kind: 'duplicate'; checkInAt: string }
  | { kind: 'error'; message: string };

export const TeacherAttendancePage = () => {
  const today = useResource<TodayRow | null>('/attendance/me/today');
  const [step, setStep] = useState<Step>('locating');
  const [fix, setFix] = useState<GeoFix | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [busy, setBusy] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const doneRef = useRef(false);

  // Step 1 — ask for the teacher's location up front.
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGeoError('This device or browser does not support location services.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFix({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracyM: pos.coords.accuracy ?? null,
        });
        setGeoError(null);
        setStep((s) => (s === 'locating' ? 'ready' : s));
      },
      (err) => {
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission was denied. Enable Location Services for this site, then retry.'
            : 'Could not read your location. Move somewhere with a clearer GPS signal and retry.',
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  }, []);

  // Stop the camera if the page unmounts mid-scan.
  useEffect(
    () => () => {
      scannerRef.current?.stop().catch(() => {});
      scannerRef.current = null;
    },
    [],
  );

  const retryLocation = () => {
    setGeoError(null);
    setStep('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFix({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracyM: pos.coords.accuracy ?? null,
        });
        setStep('ready');
      },
      (err) => {
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission was denied. Enable Location Services for this site, then retry.'
            : 'Could not read your location. Move somewhere with a clearer GPS signal and retry.',
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  };

  const stopScanner = async () => {
    try {
      await scannerRef.current?.stop();
    } catch {
      /* already stopped */
    }
    scannerRef.current = null;
  };

  const submitScan = async (qrPayload: string) => {
    if (doneRef.current || !fix) return;
    doneRef.current = true;
    await stopScanner();
    setBusy(true);
    try {
      const res = await apiPost<TodayRow>('/attendance/checkin', {
        latitude: fix.latitude,
        longitude: fix.longitude,
        accuracyM: fix.accuracyM ?? undefined,
        qrPayload,
      });
      setOutcome({
        kind: 'success',
        checkInAt: res.data.checkInAt,
        distanceM: res.data.distanceM,
      });
      setStep('done');
      today.reload();
    } catch (e: any) {
      doneRef.current = false;
      const message: string = e?.message ?? 'Check-in failed';
      if (/already checked in/i.test(message) && today.data) {
        setOutcome({ kind: 'duplicate', checkInAt: today.data.checkInAt });
      } else {
        setOutcome({ kind: 'error', message });
      }
      setStep('done');
    } finally {
      setBusy(false);
    }
  };

  const startScan = async () => {
    if (!fix) return;
    setOutcome(null);
    doneRef.current = false;
    setStep('scanning');
    // Wait a paint so #attendance-reader exists before Html5Qrcode binds it.
    await new Promise((r) => setTimeout(r, 50));
    try {
      const scanner = new Html5Qrcode('attendance-reader');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decoded) => {
          void submitScan(decoded);
        },
        () => {
          /* frame with no QR — ignore */
        },
      );
    } catch {
      setOutcome({ kind: 'error', message: 'Could not open the camera. Allow camera access for this site, then retry.' });
      setStep('done');
    }
  };

  const cancelScan = async () => {
    await stopScanner();
    setStep('ready');
  };

  const alreadyDone = today.data;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Attendance"
        title="Check in"
        text="Confirm your location, scan the school QR code with your camera, and your arrival time is logged."
      />

      {/* Step 1 — location */}
      <Card className="p-5">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-700">
          <LocateFixed size={14} aria-hidden="true" /> Step 1 · Your location
        </p>
        {step === 'locating' && !fix ? (
          <div className="mt-4"><LoadingSkeleton rows={2} /></div>
        ) : geoError ? (
          <div className="mt-4">
            <ErrorState message={geoError} onRetry={retryLocation} />
          </div>
        ) : fix ? (
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <MapPin size={15} aria-hidden="true" className="text-brand-700" />
              {fix.latitude.toFixed(6)}, {fix.longitude.toFixed(6)}
            </span>
            <span className="text-muted">
              Accuracy {fix.accuracyM === null ? 'unknown' : `±${Math.round(fix.accuracyM)} m`}
            </span>
            <button type="button" onClick={retryLocation} className="text-sm font-bold text-brand-700 underline underline-offset-2">
              Refresh
            </button>
          </div>
        ) : null}
      </Card>

      {/* Step 2 — scan */}
      <Card className="p-5">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-700">
          <QrCode size={14} aria-hidden="true" /> Step 2 · Scan the school QR code
        </p>
        {alreadyDone ? (
          <div className="mt-4 border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800" role="status">
            <p className="flex items-center gap-2 font-bold">
              <CheckCircle2 size={16} aria-hidden="true" /> Already checked in today
            </p>
            <p className="mt-1">
              {new Date(alreadyDone.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {typeof alreadyDone.distanceM === 'number' && ` · ${Math.round(alreadyDone.distanceM)} m from school point`}
            </p>
          </div>
        ) : step === 'scanning' ? (
          <div className="mt-4">
            <div id="attendance-reader" className="mx-auto w-full max-w-sm overflow-hidden rounded border border-line" />
            <button
              type="button"
              onClick={cancelScan}
              className="mt-3 inline-flex min-h-11 items-center rounded border border-line px-5 py-2.5 text-sm font-bold text-muted hover:text-ink"
            >
              Cancel scan
            </button>
          </div>
        ) : (
          <div className="mt-4">
            <button
              type="button"
              onClick={startScan}
              disabled={!fix || busy}
              className="inline-flex min-h-12 items-center rounded bg-brand-500 px-6 py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              <Camera size={16} aria-hidden="true" className="mr-2" />
              {busy ? 'Checking in…' : 'Scan QR code'}
            </button>
            {!fix && <p className="mt-2 text-xs text-muted">Waiting for your location first.</p>}
          </div>
        )}

        {/* Step 3 — outcome */}
        {outcome?.kind === 'success' && (
          <div className="mt-4 border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800" role="status">
            <p className="flex items-center gap-2 font-bold">
              <CheckCircle2 size={16} aria-hidden="true" /> Checked in at{' '}
              {new Date(outcome.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="mt-1">{Math.round(outcome.distanceM)} m from the school point. Have a great day.</p>
          </div>
        )}
        {outcome?.kind === 'duplicate' && (
          <div className="mt-4 border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800" role="status">
            <p className="font-bold">You already checked in today at {new Date(outcome.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.</p>
          </div>
        )}
        {outcome?.kind === 'error' && (
          <p role="alert" className="mt-4 border-l-2 border-rose-400 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {outcome.message}
          </p>
        )}
      </Card>
    </div>
  );
};
