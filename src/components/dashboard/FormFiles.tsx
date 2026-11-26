import { ExternalLink, FileQuestion, FileText } from 'lucide-react';

// ─── Shared file-answer display (admin Responses + public form recap) ───────
// Answers store files as { name, url } (new) or bare URL strings (legacy).

export interface FileRef {
  name: string;
  url: string;
}

export const toFileRefs = (v: any): FileRef[] => {
  const list = Array.isArray(v) ? v : [v];
  return list
    .map((item) => {
      if (typeof item === 'string' && /^https?:\/\//.test(item)) {
        const name = decodeURIComponent(item.split('?')[0].split('/').pop() || 'file');
        return { name, url: item };
      }
      if (item && typeof item === 'object' && typeof item.url === 'string') {
        return { name: String(item.name || 'file'), url: item.url };
      }
      return null;
    })
    .filter(Boolean) as FileRef[];
};

export const extOf = (name: string) => (name.split('.').pop() || '').toLowerCase();

export const isImageExt = (ext: string) => ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext);

/** Image → thumbnail; PDF/DOC → typed chip; anything else → unknown chip. */
export const FileBadge = ({ file }: { file: FileRef }) => {
  const ext = extOf(file.name);
  if (isImageExt(ext)) {
    return (
      <a href={file.url} target="_blank" rel="noreferrer" title={file.name} className="group block w-24 shrink-0">
        <img src={file.url} alt={file.name} loading="lazy" className="h-20 w-24 rounded border border-line object-cover group-hover:border-brand-500" />
        <span className="mt-1 block truncate text-[11px] font-bold text-brand-700">{file.name}</span>
      </a>
    );
  }
  if (ext === 'pdf') {
    return (
      <a href={file.url} target="_blank" rel="noreferrer" title={file.name} className="flex w-40 shrink-0 items-center gap-2 rounded border border-line bg-rose-50/50 px-3 py-2 hover:border-brand-500">
        <FileText aria-hidden="true" size={18} className="shrink-0 text-rose-700" />
        <span className="min-w-0">
          <span className="block truncate text-xs font-bold">{file.name}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-rose-700">PDF · open</span>
        </span>
      </a>
    );
  }
  if (['doc', 'docx'].includes(ext)) {
    return (
      <a href={file.url} target="_blank" rel="noreferrer" title={file.name} className="flex w-40 shrink-0 items-center gap-2 rounded border border-line bg-brand-50/60 px-3 py-2 hover:border-brand-500">
        <FileText aria-hidden="true" size={18} className="shrink-0 text-brand-700" />
        <span className="min-w-0">
          <span className="block truncate text-xs font-bold">{file.name}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-700">{ext} · open</span>
        </span>
      </a>
    );
  }
  return (
    <a href={file.url} target="_blank" rel="noreferrer" title={file.name} className="flex w-40 shrink-0 items-center gap-2 rounded border border-line px-3 py-2 hover:border-brand-500">
      <FileQuestion aria-hidden="true" size={18} className="shrink-0 text-muted" />
      <span className="min-w-0">
        <span className="block truncate text-xs font-bold">{file.name}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Unknown · open</span>
      </span>
    </a>
  );
};

/** Full answer cell: file arrays → badges; links → open-link; else text. */
export const AnswerValue = ({ value }: { value: any }) => {
  if (value === undefined || value === null || value === '') return <span className="text-muted">—</span>;
  const files = toFileRefs(value);
  const looksLikeFiles = Array.isArray(value)
    ? value.length > 0 && files.length === value.length
    : files.length === 1;
  if (looksLikeFiles && files.length > 0) {
    return (
      <span className="flex flex-wrap gap-2">
        {files.map((f) => <FileBadge key={f.url} file={f} />)}
      </span>
    );
  }
  if (Array.isArray(value)) return <span>{value.map(String).join(', ')}</span>;
  if (typeof value === 'object') return <span className="font-mono text-xs">{JSON.stringify(value)}</span>;
  const s = String(value);
  if (/^https?:\/\//.test(s)) {
    return <a href={s} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-brand-700 hover:underline"><ExternalLink aria-hidden="true" size={12} /> Open link</a>;
  }
  return <span>{s}</span>;
};
