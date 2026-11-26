import {
  Bell,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  Database,
  FileQuestion,
  GraduationCap,
  Layers,
  ListChecks,
  Pencil,
  Play,
  Rocket,
  School,
  Settings,
  ShieldCheck,
  Sparkles,
  Square,
  Trash2,
  Upload,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { AiStep } from '@/lib/aiChat';

const LABELS: Record<string, string> = {
  get_school_overview: 'Reading school overview',
  get_academic_settings: 'Reading academic settings',
  update_academic_settings: 'Updating academic settings',
  get_my_statuses: 'Reading your statuses',

  list_classes: 'Reading classes',
  get_class: 'Opening class',
  create_class: 'Creating class',
  update_class: 'Updating class',
  delete_class: 'Deleting class',

  list_subjects: 'Reading subjects',
  get_subject: 'Opening subject',
  create_subject: 'Creating subject',
  update_subject: 'Updating subject',
  delete_subject: 'Deleting subject',

  list_exams: 'Reading exams',
  get_exam: 'Opening exam',
  create_exam: 'Creating exam',
  create_exam_with_questions: 'Creating exam + questions',
  update_exam: 'Updating exam',
  delete_exam: 'Deleting exam',

  list_questions: 'Reading questions',
  get_question: 'Opening question',
  create_question: 'Adding question',
  bulk_create_questions: 'Adding questions',
  update_question: 'Editing question',
  delete_question: 'Deleting question',
  get_question_bank: 'Reading question bank',

  list_pupils: 'Reading pupils',
  get_pupil: 'Opening pupil',
  create_pupil: 'Adding pupil',
  update_pupil: 'Updating pupil',
  list_staff: 'Reading staff',
  create_teacher: 'Adding teacher',
  update_teacher: 'Updating teacher',
  list_combinations: 'Reading combinations',
  create_combination: 'Creating combination',
  update_combination: 'Updating combination',

  list_online_results: 'Reading online results',
  list_offline_results: 'Reading offline results',
  get_result_summary: 'Opening result',
  list_grade_entries: 'Reading grade entries',
  enter_grade_entries: 'Saving grade entries',
  publish_results: 'Publishing results',
  get_pupil_report_card: 'Opening report card',
  list_report_cards: 'Reading report cards',
  save_report_card: 'Saving report card',
  get_attendance_summary: 'Reading attendance summary',

  get_attendance_register: 'Reading attendance register',
  mark_attendance: 'Marking attendance',

  list_deployments: 'Reading deployments',
  create_deployment: 'Creating deployment',
  start_deployment: 'Starting deployment',
  end_deployment: 'Ending deployment',
  update_deployment_scope: 'Updating deployment scope',
  delete_deployment: 'Deleting deployment',
  list_security_profiles: 'Reading security profiles',
  create_security_profile: 'Creating security profile',

  list_exam_databases: 'Reading exam databases',
  get_exam_database: 'Opening exam database',
  create_exam_database: 'Creating exam database',
  export_class_to_database: 'Exporting class',
  import_exam_database: 'Importing exam database',
  delete_exam_database: 'Deleting exam database',

  list_notices: 'Reading notices',
  create_notice: 'Publishing notice',
  list_materials: 'Reading materials',
  create_material: 'Adding material',
  list_assignments: 'Reading assignments',
  create_assignment: 'Creating assignment',
  list_fee_invoices: 'Reading fee invoices',
  create_fee_invoice: 'Raising invoice',
  record_fee_payment: 'Recording payment',
};

export const toolLabel = (name: string) =>
  LABELS[name] ?? name.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export const toolIcon = (name: string): LucideIcon => {
  if (name.includes('class')) return School;
  if (name.includes('subject')) return BookOpen;
  if (name.includes('question')) return FileQuestion;
  if (name.includes('exam_database')) return Database;
  if (name.includes('exam')) return ClipboardList;
  if (name.includes('pupil')) return GraduationCap;
  if (name.includes('teacher') || name.includes('staff')) return Users;
  if (name.includes('result') || name.includes('grade')) return ListChecks;
  if (name.includes('attendance')) return CalendarCheck;
  if (name.includes('deployment')) return Rocket;
  if (name.includes('security')) return ShieldCheck;
  if (name.includes('notice')) return Bell;
  if (name.includes('material')) return Upload;
  if (name.includes('assignment')) return ClipboardList;
  if (name.includes('fee') || name.includes('invoice') || name.includes('payment')) return Wallet;
  if (name.includes('combination')) return Layers;
  if (name.includes('setting')) return Settings;
  if (name.startsWith('delete_')) return Trash2;
  if (name.startsWith('start_')) return Play;
  if (name.startsWith('end_')) return Square;
  if (name.startsWith('update_') || name.startsWith('edit_')) return Pencil;
  if (name.startsWith('get_') || name.startsWith('list_')) return Sparkles;
  return Wrench;
};

export const inputSummary = (input: unknown): string => {
  if (!input || typeof input !== 'object') return '';
  const record = input as Record<string, unknown>;
  const preferred = [
    'examName',
    'className',
    'subjectName',
    'name',
    'title',
    'studentName',
    'staffName',
    'searchTerm',
    'search',
    'mode',
    'status',
    'action',
    'term',
    'session',
  ];
  for (const key of preferred) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return `${key.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${value.trim()}`;
  }
  if (Array.isArray(record.entries)) return `${record.entries.length} entries`;
  if (Array.isArray(record.questions)) return `${record.questions.length} questions`;
  if (Array.isArray(record.subjects)) return `${record.subjects.length} subjects`;
  if (record.deploymentCode) return `code: ${record.deploymentCode}`;
  if (record.databaseId) return `database: ${String(record.databaseId).slice(0, 8)}…`;
  return '';
};

export const formatDuration = (ms?: number) => {
  if (ms === undefined || ms === null) return '';
  if (ms < 1000) return `${Math.max(0, Math.round(ms))} ms`;
  return `${(ms / 1000).toFixed(ms < 10_000 ? 1 : 0)} s`;
};

export interface ChatArtifact {
  type: string;
  id: string;
  label: string;
  extra?: Record<string, string>;
}

const asArtifact = (value: unknown): ChatArtifact | null => {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if (typeof record.type !== 'string' || typeof record.id !== 'string') return null;
  if (!['class', 'subject', 'exam', 'question', 'pupil', 'staff', 'report-card', 'deployment', 'exam-database', 'result', 'omr'].includes(record.type)) {
    return null;
  }
  return {
    type: record.type,
    id: record.id,
    label: typeof record.label === 'string' ? record.label : record.id,
    extra: (record.extra as Record<string, string> | undefined) ?? undefined,
  };
};

export const artifactsFromSteps = (steps: AiStep[]): ChatArtifact[] => {
  const found = new Map<string, ChatArtifact>();
  for (const step of steps) {
    for (const call of step.toolCalls) {
      const output = call.output as any;
      const candidate = asArtifact(output?.data?.entity) ?? asArtifact(output?.entity);
      if (candidate) found.set(`${candidate.type}:${candidate.id}`, candidate);
    }
  }
  return [...found.values()];
};

export const artifactHref = (artifact: ChatArtifact): string | null => {
  const extra = artifact.extra ?? {};
  if (artifact.type === 'class') return `/dashboard/admin/exams/${artifact.id}`;
  if (artifact.type === 'exam') return extra.classId ? `/dashboard/admin/exams/${extra.classId}/${artifact.id}` : '/dashboard/admin/exams/all';
  if (artifact.type === 'question')
    return extra.classId && extra.examId && extra.subjectId
      ? `/dashboard/admin/exams/${extra.classId}/${extra.examId}/${extra.subjectId}`
      : '/dashboard/admin/exams/questions';
  if (artifact.type === 'pupil') return '/dashboard/admin/students';
  if (artifact.type === 'staff') return '/dashboard/admin/teachers';
  if (artifact.type === 'report-card') return '/dashboard/admin/result-generator';
  if (artifact.type === 'deployment') return '/dashboard/admin/exams/deployments';
  if (artifact.type === 'exam-database') return `/dashboard/admin/database/${artifact.id}`;
  if (artifact.type === 'omr') return '/dashboard/admin/ppt-marker';
  if (artifact.type === 'result') return '/dashboard/admin/exams/results';
  return null;
};
