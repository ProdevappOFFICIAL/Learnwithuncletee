import { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, RefreshCw, ShieldCheck, UploadCloud, XCircle } from 'lucide-react';
import { apiPost } from '@/lib/api';
import { useAppUploadThing } from '@/lib/uploadthing';

type GatePhase = 'ready' | 'live' | 'review' | 'uploading' | 'done' | 'error';

/**
 * Web-sitting identity gate. The questions are not released until the server
 * has stored this snapshot on the pupil's OnlineSession.
 */
export const ProctorPhotoGate = ({
  sessionId,
  examName,
  onComplete,
  onCancel,
}: {
  sessionId: string;
  examName: string;
  onComplete: () => void;
  onCancel?: () => void;
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [phase, setPhase] = useState<GatePhase>('ready');
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const { startUpload } = useAppUploadThing('proctorPhotoUploader' as any, {
    onClientUploadComplete: () => {},
    onUploadError: (uploadError: any) => {
      setError(uploadError?.message ?? 'Upload failed');
      setPhase('review');
    },
  } as any);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraReady(false);
  };

  useEffect(() => () => stopCamera(), []);

  const openCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setPhase('live');
      setCameraReady(true);
    } catch (reason: any) {
      setError(
        reason?.name === 'NotAllowedError'
          ? 'Camera permission was denied. Allow camera access to sit this examination.'
          : 'No camera was found. Connect a camera and try again.',
      );
      setPhase('error');
    }
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const maxWidth = 960;
    const scale = Math.min(1, maxWidth / video.videoWidth);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const context = canvas.getContext('2d');
    if (!context) return;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    setPhoto(canvas.toDataURL('image/jpeg', 0.84));
    stopCamera();
    setPhase('review');
  };

  const upload = async () => {
    if (!photo) return;
    setPhase('uploading');
    setError(null);
    try {
      const blob = await (await fetch(photo)).blob();
      const file = new File([blob], `proctor-${sessionId}.jpg`, { type: 'image/jpeg' });
      const uploaded = (await startUpload([file])) as any[] | undefined;
      const fileInfo = uploaded?.[0];
      if (!fileInfo?.ufsUrl) throw new Error('The photo upload did not return a file URL.');
      await apiPost(`/exam-sessions/online/${sessionId}/photo`, {
        url: fileInfo.ufsUrl,
        key: fileInfo.key ?? null,
        source: 'WEBCAM',
      });
      setPhase('done');
      window.setTimeout(onComplete, 500);
    } catch (reason: any) {
      setError(reason?.message ?? 'Could not save your photo. Try again.');
      setPhase('review');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_75%_10%,rgba(183,227,107,.2),transparent_45%),linear-gradient(120deg,#043a21,#0b6b3a_60%,#16a05d)] px-4 py-10">
      <div className="w-full max-w-2xl overflow-hidden rounded border border-white/15 bg-white shadow-2xl">
        <div className="bg-brand-900 px-6 py-5 text-white">
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.22em] text-lime-accent">
            <ShieldCheck size={14} /> Identity check
          </p>
          <h1 className="mt-2 font-display text-2xl font-extrabold">{examName}</h1>
          <p className="mt-1 text-sm text-white/75">
            Take a clear webcam photo before the questions begin. This photo is visible to school
            administrators only.
          </p>
        </div>

        <div className="space-y-4 p-6">
          <div className="relative overflow-hidden rounded border border-line bg-brand-950/95" style={{ minHeight: 260 }}>
            <video
              ref={videoRef}
              muted
              playsInline
              className={`h-[280px] w-full object-cover ${phase === 'live' ? 'block' : 'hidden'}`}
              aria-label="Camera preview"
            />
            {phase !== 'live' && (
              <div className="flex h-[280px] flex-col items-center justify-center gap-3 px-6 text-center text-white/80">
                {photo ? (
                  <img src={photo} alt="Your captured examination photo" className="h-full w-full object-cover" />
                ) : (
                  <>
                    <Camera size={36} className="text-lime-accent" />
                    <p className="max-w-sm text-sm">
                      Your photograph verifies who is sitting this examination. Face the camera in a
                      well-lit room.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {error && (
            <p role="alert" className="flex items-start gap-2 rounded border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              <XCircle size={16} className="mt-0.5 shrink-0" /> {error}
            </p>
          )}

          {phase === 'done' && (
            <p className="flex items-center gap-2 rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
              <CheckCircle2 size={17} /> Photo saved. Opening your questions…
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            {onCancel && phase !== 'uploading' && phase !== 'done' && (
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  onCancel();
                }}
                className="rounded border border-line px-4 py-2.5 text-sm font-bold text-muted hover:bg-cream"
              >
                Cancel
              </button>
            )}
            {(phase === 'ready' || phase === 'error') && (
              <button
                type="button"
                onClick={openCamera}
                className="inline-flex items-center gap-2 rounded bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
              >
                <Camera size={16} /> Open camera
              </button>
            )}
            {phase === 'live' && (
              <button
                type="button"
                onClick={capture}
                disabled={!cameraReady}
                className="inline-flex items-center gap-2 rounded bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                <Camera size={16} /> Take photo
              </button>
            )}
            {phase === 'review' && (
              <>
                <button
                  type="button"
                  onClick={openCamera}
                  className="inline-flex items-center gap-2 rounded border border-line px-4 py-2.5 text-sm font-bold text-brand-800 hover:bg-brand-50"
                >
                  <RefreshCw size={15} /> Retake
                </button>
                <button
                  type="button"
                  onClick={upload}
                  className="inline-flex items-center gap-2 rounded bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
                >
                  <UploadCloud size={16} /> Use this photo
                </button>
              </>
            )}
            {phase === 'uploading' && (
              <span className="inline-flex items-center gap-2 rounded bg-brand-100 px-5 py-2.5 text-sm font-bold text-brand-800">
                Uploading photo…
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
