import { useRef, useState } from 'react';
import { generateReactHelpers } from '@uploadthing/react';
import { API_BASE, tokenStore } from '@/lib/api';

/**
 * UploadThing client wired to OUR Express backend (not uploadthing.com).
 * Auth: the JWT is attached per-request via `headers()` so the server
 * FileRouter gate (`uploads.use` permission) can verify the caller.
 *
 * FileRoutes (see api/src/modules/upload/upload.router.ts):
 * avatarUploader | assignmentUploader | lessonMaterialUploader | galleryUploader
 * | formResponseUploader (public — gated by x-form-id, see `formId` prop)
 */

// Intentionally `any`: the canonical router type lives server-side and must
// never be imported into the web bundle (it would drag express/prisma in).
// Endpoint names are validated at runtime by the /api/uploadthing handler.
const { useUploadThing } = generateReactHelpers<any>({ url: `${API_BASE}/uploadthing` });

export type UploadEndpoint =
  | 'avatarUploader'
  | 'assignmentUploader'
  | 'lessonMaterialUploader'
  | 'galleryUploader'
  | 'formResponseUploader';

interface UploadButtonProps {
  endpoint: UploadEndpoint;
  onClientUploadComplete?: (res: Array<{ ufsUrl: string; name: string }>) => void;
  onUploadError?: (error: Error) => void;
  label?: string;
  /** Public form uploads: sent as x-form-id so the server can gate by form. */
  formId?: string;
  /** File picker filter, e.g. ".pdf,.docx,image/png,image/jpeg". Omit = all files. */
  accept?: string;
}

/** Brand-styled file picker backed by UploadThing. Same API as UT's UploadButton. */
export const UploadButton = ({ endpoint, onClientUploadComplete, onUploadError, label = 'Choose file & upload', formId, accept }: UploadButtonProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const { startUpload } = useUploadThing(endpoint as any, {
    headers: () => {
      const token = tokenStore.get();
      return {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(formId ? { 'x-form-id': formId } : {}),
      };
    },
    onClientUploadComplete: (res: any) => onClientUploadComplete?.(res),
    onUploadError: (e: any) => onUploadError?.(e instanceof Error ? e : new Error(e?.message ?? 'Upload failed')),
    onUploadBegin: () => setBusy(true),
  } as any);

  return (
    <span className="inline-flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        aria-label={label}
        accept={accept}
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          if (!files.length) return;
          try {
            await startUpload(files);
          } catch (err: any) {
            onUploadError?.(err instanceof Error ? err : new Error('Upload failed'));
          } finally {
            setBusy(false);
            e.target.value = '';
          }
        }}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="inline-flex min-h-11 items-center rounded border border-line bg-white px-5 py-2.5 text-sm font-bold text-ink hover:border-brand-500 hover:text-brand-700 disabled:opacity-60"
      >
        {busy ? 'Uploading…' : label}
      </button>
    </span>
  );
};

export const UploadDropzone = UploadButton;
