import type { GradeData } from '@/data/dashboard';
import { siteInfo } from '@/data/content';

export interface ReportCardInput {
  pupilName: string;
  studentCode?: string;
  className: string;
  session: string;
  term: string;
  grades: GradeData[];
}

/**
 * Opens a print-ready report card in a new window. The user picks
 * "Save as PDF" in the print dialog — no server PDF pipeline needed.
 */
export function printReportCard(input: ReportCardInput) {
  const { pupilName, studentCode, className, session, term, grades } = input;
  const avg = grades.length ? grades.reduce((s, g) => s + g.total, 0) / grades.length : 0;
  const rows = grades
    .map(
      (g, i) => `<tr>
        <td>${i + 1}</td><td style="text-align:left">${g.subject}</td>
        <td>${g.ca}</td><td>${g.exam}</td><td><b>${g.total}</b></td>
        <td><b>${g.grade}</b></td><td>${g.remark ?? ''}</td>
      </tr>`,
    )
    .join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8" />
    <title>Report Card — ${pupilName} — ${term} ${session}</title>
    <style>
      * { box-sizing: border-box; font-family: Arial, Helvetica, sans-serif; }
      body { margin: 32px; color: #15221a; }
      .head { display: flex; align-items: center; gap: 16px; border-bottom: 3px solid #0b6b3a; padding-bottom: 12px; }
      .head img { height: 64px; width: 64px; border-radius: 50%; object-fit: cover; }
      .head h1 { margin: 0; font-size: 22px; color: #064a2a; }
      .head p { margin: 2px 0 0; font-size: 12px; color: #637067; }
      .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; margin: 16px 0; font-size: 13px; }
      .meta b { color: #064a2a; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      th { background: #eaf7ef; color: #064a2a; text-transform: uppercase; font-size: 11px; letter-spacing: .08em; }
      th, td { border: 1px solid #dde9e1; padding: 8px; text-align: center; }
      .avg { margin-top: 12px; font-size: 14px; }
      .sign { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-top: 48px; font-size: 12px; }
      .sign div { border-top: 1px solid #15221a; padding-top: 6px; }
      @media print { body { margin: 0; } }
    </style></head><body>
    <div class="head">
      <img src="${window.location.origin}/logo.png" alt="" />
      <div><h1>${siteInfo.name}</h1><p>Academic Report Card · ${className} · ${term}, ${session} session</p></div>
    </div>
    <div class="meta">
      <div><b>Pupil:</b> ${pupilName}</div>
      <div><b>Student ID:</b> ${studentCode ?? '—'}</div>
      <div><b>Class:</b> ${className}</div>
      <div><b>Average:</b> ${avg.toFixed(1)}%</div>
    </div>
    <table><thead><tr>
      <th>#</th><th style="text-align:left">Subject</th><th>CA / 30</th><th>Exam / 70</th>
      <th>Total / 100</th><th>Grade</th><th>Remark</th>
    </tr></thead><tbody>${rows || '<tr><td colspan="7">No subjects recorded.</td></tr>'}</tbody></table>
    <p class="avg"><b>Term average: ${avg.toFixed(1)}%</b> across ${grades.length} subject(s).</p>
    <div class="sign"><div>Class teacher's signature & date</div><div>Principal's signature & date</div></div>
    <script>window.onload = () => { window.print(); };</script>
  </body></html>`;

  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) throw new Error('Popup blocked — allow popups to download the report card.');
  win.document.write(html);
  win.document.close();
}
