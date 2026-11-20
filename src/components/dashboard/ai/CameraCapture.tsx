import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Camera, LoaderCircle, RefreshCw, X } from 'lucide-react';

export const CameraCapture = ({
  open,
  busy,
  onClose,
  onCapture,
}: {
  open: boolean;
  busy?: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const fallbackRef = useRef<HTMLInputElement>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setReady(false);
  }, []);

  useEffect(() => {
    if (!open) {
      stop();
      setError(null);
      return;
    }
    let cancelled = false;
    const start = async () => {
      setError(null);
      setReady(false);
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('This browser cannot open a camera. Choose a photo instead.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1600 }, height: { ideal: 1200 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setReady(true);
      } catch (err: any) {
        setError(
          err?.name === 'NotAllowedError'
            ? 'Camera permission was denied. Allow it or choose a photo instead.'
            : err?.message || 'Could not open the camera. Choose a photo instead.',
        );
      }
    };
    void start();
    return () => {
      cancelled = true;
      stop();
    };
  }, [open, facing, stop]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onCapture(new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' }));
      },
      'image/jpeg',
      0.9,
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-brand-900/80 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Camera">
      <div className="flex w-full max-w-lg flex-col overflow-hidden rounded border border-line bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div>
            <p className="font-display text-sm font-extrabold text-ink">Snap a photo</p>
            <p className="text-[11px] text-muted">Use the camera to capture an OMR sheet, question paper or diagram.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close camera"
            className="flex h-9 w-9 items-center justify-center rounded border border-line text-muted hover:bg-rose-50 hover:text-rose-700"
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>

        <div className="relative aspect-[4/3] w-full bg-brand-900">
          <video
            ref={videoRef}
            playsInline
            muted
            className={`h-full w-full object-cover ${facing === 'user' ? 'scale-x-[-1]' : ''}`}
          />
          {!ready && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/70">
              <LoaderCircle size={22} className="animate-spin" aria-hidden="true" />
              <p className="text-xs font-semibold">Opening camera…</p>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white">
              <p className="text-xs leading-5 text-white/80">{error}</p>
              <button
                type="button"
                onClick={() => fallbackRef.current?.click()}
                className="rounded bg-lime-accent px-4 py-2 text-xs font-extrabold text-brand-900 hover:bg-white"
              >
                Choose a photo
              </button>
              <input
                ref={fallbackRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onCapture(file);
                  event.target.value = '';
                }}
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
          <button
            type="button"
            onClick={() => setFacing((value) => (value === 'environment' ? 'user' : 'environment'))}
            className="inline-flex min-h-10 items-center gap-1.5 rounded border border-line bg-white px-3 text-xs font-bold text-brand-800 hover:border-brand-500"
          >
            <RefreshCw size={13} aria-hidden="true" /> Switch camera
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-10 rounded border border-line px-4 text-xs font-bold text-muted hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={capture}
              disabled={!ready || busy}
              className="inline-flex min-h-10 items-center gap-1.5 rounded bg-brand-900 px-4 text-xs font-extrabold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {busy ? <LoaderCircle size={14} className="animate-spin" aria-hidden="true" /> : <Camera size={14} aria-hidden="true" />}
              {busy ? 'Uploading…' : 'Capture'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
