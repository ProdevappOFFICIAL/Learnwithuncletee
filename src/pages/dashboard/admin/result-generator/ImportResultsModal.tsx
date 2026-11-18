import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, FileSpreadsheet, Upload } from 'lucide-react';
import { Modal } from '@/components/dashboard/DashboardUI';
import { apiPost } from '@/lib/api';
import type { ReportCardImportDetail } from './types';

interface ImportResultsModalProps {
  open: boolean;
  onClose: () => void;
  onImported: (detail: ReportCardImportDetail) => void;
}

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Could not read the selected file'));
    reader.readAsDataURL(file);
  });

export const ImportResultsModal = ({ open, onClose, onImported }: ImportResultsModalProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReportCardImportDetail | null>(null);

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setBusy(false);
    setError(null);
    setResult(null);
  }, [open]);

  const runImport = async () => {
    if (!file) {
      setError('Choose an .xlsx file first.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const fileBase64 = await readAsDataUrl(file);
      const response = await apiPost<ReportCardImportDetail>('/report-cards/imports', {
        fileName: file.name,
        fileBase64,
      });
      setResult(response.data);
    } catch (err: any) {
      setError(err?.message ?? 'Import failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={() => (busy ? undefined : onClose())} title="Import results from Excel" size="lg">
      {result ? (
        <div className="space-y-4">
          <div className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3">
            <p className="flex items-center gap-2 font-display text-base font-extrabold text-brand-900">
              <FileSpreadsheet size={18} aria-hidden="true" /> Workbook imported
            </p>
            <p className="mt-1 text-sm text-brand-800">
              {result.studentCount} pupil row(s) and {result.rowCount} source row(s) read from {result.fileName}.
              Select it in the left panel, then map the score boxes you need.
            </p>
          </div>

          {result.warnings.length > 0 && (
            <div className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="flex items-center gap-2 font-bold">
                <AlertTriangle size={15} aria-hidden="true" /> Imported with warnings
              </p>
              <ul className="mt-2 max-h-40 list-disc space-y-1 overflow-y-auto pl-5 text-xs">
                {result.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="scroll-db max-h-48 overflow-y-auto border border-line">
            <table className="w-full min-w-[420px] text-left text-xs">
              <thead className="bg-cream">
                <tr>
                  <th className="px-3 py-2 font-bold">Imported row</th>
                  <th className="px-3 py-2 font-bold">Pupil</th>
                  <th className="px-3 py-2 font-bold">Subjects</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.slice(0, 25).map((row) => (
                  <tr key={row.key} className="border-t border-line">
                    <td className="px-3 py-2 font-semibold">
                      {row.userName || row.userEmail || row.userId || 'Unnamed'}
                    </td>
                    <td className="px-3 py-2 text-muted">
                      {row.matchedStudentName ? (
                        <span className="font-bold text-emerald-800">Matched · {row.matchedStudentName}</span>
                      ) : (
                        <span className="text-amber-800">No pupil match</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-muted">{row.subjects.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setResult(null)}
              className="min-h-11 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink"
            >
              Import another
            </button>
            <button
              type="button"
              onClick={() => onImported(result)}
              className="min-h-11 rounded bg-brand-500 px-5 text-sm font-bold text-white hover:bg-brand-700"
            >
              Use this import
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="border border-line bg-cream px-4 py-3 text-sm text-muted">
            <p className="font-bold text-ink">Use the Excel file exported from Online or Offline Results</p>
            <p className="mt-1 text-xs leading-5">
              The importer reads the <b>Results</b> and <b>Subject Breakdown</b> sheets, matches pupils by User ID (or email), and keeps the workbook so you can reopen it later.
            </p>
          </div>

          <label className="block cursor-pointer border-2 border-dashed border-line bg-white px-5 py-8 text-center hover:border-brand-400">
            <Upload size={24} className="mx-auto text-brand-700" aria-hidden="true" />
            <span className="mt-2 block text-sm font-bold text-ink">
              {file ? file.name : 'Choose an .xlsx workbook'}
            </span>
            <span className="mt-1 block text-xs text-muted">
              {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Exported results or a generic subject-score sheet'}
            </span>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xlsm"
              className="sr-only"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setError(null);
              }}
            />
          </label>

          {error && (
            <p role="alert" className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="min-h-11 flex-1 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={runImport}
              disabled={busy || !file}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded bg-brand-500 px-4 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              <Upload size={14} aria-hidden="true" /> {busy ? 'Reading workbook...' : 'Import workbook'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
