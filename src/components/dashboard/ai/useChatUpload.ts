import { useCallback, useState } from 'react';
import { tokenStore } from '@/lib/api';
import type { AiAttachment } from '@/lib/aiChat';
import { useAppUploadThing } from '@/lib/uploadthing';

/**
 * Uploads chat images through the same UploadThing endpoint used by question
 * attachments. Returns the public URL the agent can pass to its OMR tool or
 * read as an image input.
 */
export function useChatUpload(onError?: (message: string) => void) {
  const [busy, setBusy] = useState(false);
  const { startUpload, isUploading } = useAppUploadThing('assignmentUploader' as any, {
    headers: () => {
      const token = tokenStore.get();
      return token ? { Authorization: `Bearer ${token}` } : {};
    },
    onUploadError: (error: any) => onError?.(error?.message ?? 'Image upload failed'),
  } as any);

  const uploadFiles = useCallback(
    async (files: File[]): Promise<AiAttachment[]> => {
      const images = files.filter((file) => file.type.startsWith('image/')).slice(0, 4);
      if (!images.length) return [];
      setBusy(true);
      try {
        const uploaded = await startUpload(images);
        return (uploaded ?? []).map((file: any, index: number) => ({
          id: crypto.randomUUID(),
          url: file?.ufsUrl ?? file?.url ?? '',
          name: file?.name ?? images[index]?.name,
          mimeType: images[index]?.type,
          size: images[index]?.size,
        })).filter((attachment: AiAttachment) => /^https?:\/\//i.test(attachment.url));
      } catch (error: any) {
        onError?.(error?.message ?? 'Image upload failed');
        return [];
      } finally {
        setBusy(false);
      }
    },
    [onError, startUpload],
  );

  return { uploadFiles, uploading: busy || isUploading };
}
