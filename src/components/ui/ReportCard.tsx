import { useRef, useState, type ReactNode } from "react";
import { LoaderCircle, Redo2, Sparkles, Undo2 } from "lucide-react";
import { gradeBandFor, type GradingScale } from "@/lib/academic";
import { apiPost } from "@/lib/api";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface ReportSubject {
    /** Label lines exactly as printed, e.g. ["1. ENGLISH"] */
    lines: string[];
    cbt1?: number; // /20
    cbt2?: number; // /20
    exam?: number; // /60
    lastCum?: number; // /100
    overall?: number; // /100
}

/** Kept for callers that used the original junior-only name. */
export type JuniorSubject = ReportSubject;

export type ReportCardVariant = "junior" | "senior-science" | "senior-commerce" | "senior-art";

export interface ReportCardVariantPreset {
    id: ReportCardVariant;
    /** Full label used in the preview tabs. */
    label: string;
    /** Short label used where space is tight. */
    shortLabel: string;
    sectionTitle: string;
    headerSrc: string;
    subjects: ReportSubject[];
}

export interface ReportCardProps {
    /** Field currently being inspected in the generator. */
    activeField?: string | null;
    /** Enables click-to-edit without changing the printed sheet layout. */
    onFieldClick?: (field: string) => void;
    /** Commits an inline edit made directly on a printed box. */
    onFieldCommit?: (field: string, value: string) => void;
    /** When supplied, fields outside the allowed set stay read-only. */
    canEditField?: (field: string) => boolean;
    onLockedFieldClick?: (field: string) => void;
    /** Fields to mark with the teacher's yellow dotted “assigned score” style. */
    highlightFields?: Set<string>;
    /** Selects the default subject set, header and section title. */
    variant?: ReportCardVariant;
    /** Leave empty to print the blank line, or pass e.g. "SECOND" */
    term?: string;
    session?: string; // "2026/2027"
    studentName?: string;
    admissionNumber?: string;
    className?: string; // value shown after "CLASS:"
    photoUrl?: string;
    subjects?: ReportSubject[];
    /** Override the preset section title. */
    sectionTitle?: string;
    /** Override the preset school header image. */
    headerSrc?: string;
    present?: number;
    absent?: number;
    totalSchoolDays?: number;
    affective?: { puntuality?: string; respect?: string };
    psychomotor?: { handwriting?: string; recreation?: string; sports?: string };
    classTeacherRemark?: string;
    principalComment?: string;
    newsLetter?: string;
    nextTermBegins?: string;
    /** Settings grading bands used for the Overall Total letter suffix. */
    grading?: GradingScale;
}

/* -------------------------------------------------------------------------- */
/*  Presets (subject lists copied from the printed templates)                 */
/* -------------------------------------------------------------------------- */

const JUNIOR_SUBJECTS: ReportSubject[] = [
    { lines: ["1. ENGLISH"] },
    { lines: ["2. MATHEMATICS"] },
    { lines: ["3. INTERMEDIATE SCIENCE"] },
    { lines: ["4. CULTURAL AND CREATIVE."] },
    { lines: ["5. BUSINESS STUDIES"] },
    { lines: ["6. DIGITAL TECHNOLOGIES"] },
    { lines: ["7. CHRISTAIN RELIGIOUS ST."] },
    { lines: ["8. HISTORY"] },
    { lines: ["9. PHYSICAL AND HEALTH."] },
    { lines: ["10. SOCIAL AND CITIZENSHI."] },
    { lines: ["11. YORUBA LANGUAGE"] },
    { lines: ["12. FRENCH LANGUAGE"] },
    { lines: ["13. TRADE"] },
];

const SENIOR_SCIENCE_SUBJECTS: ReportSubject[] = [
    { lines: ["1. ENGLISH"] },
    { lines: ["2. MATHEMATICS & F/MATHS"] },
    { lines: ["3. PHYSICS"] },
    { lines: ["4. CHEMISTRY"] },
    { lines: ["5. BIOLOGY"] },
    { lines: ["6. CIVIC EDUCATION"] },
    { lines: ["7. DIGITAL TECHNOLOGIES"] },
    { lines: ["8. GEOGRAPHY"] },
    { lines: ["9. AGRICULTURE"] },
    { lines: ["10. ECONOMICS"] },
    { lines: ["11. TRADE SUBJECT"] },
];

const SENIOR_COMMERCE_SUBJECTS: ReportSubject[] = [
    { lines: ["1. ENGLISH"] },
    { lines: ["2. MATHEMATICS & F/MAT"] },
    { lines: ["3. ACCOUNTING"] },
    { lines: ["4. COMMERCE"] },
    { lines: ["5. MARKETING"] },
    { lines: ["6. CIVIC EDUCATION"] },
    { lines: ["7. DIGITAL TECHNOLOGIES"] },
    { lines: ["8. AGRICULTURE"] },
    { lines: ["9. ECONOMICS"] },
    { lines: ["10. GEOGRAPHY"] },
    { lines: ["11. TRADE SUBJECT"] },
];

const SENIOR_ART_SUBJECTS: ReportSubject[] = [
    { lines: ["1. ENGLISH"] },
    { lines: ["2. MATHEMATICS & F/MATHS"] },
    { lines: ["3. LITERATURE"] },
    { lines: ["4. GOVERNMENT"] },
    { lines: ["5. CHRISTAIN RELIGIOUS ST."] },
    { lines: ["6. CIVIC EDUCATION"] },
    { lines: ["7. DIGITAL TECHNOLOGIES"] },
    { lines: ["8. YORUBA LANGUAGE"] },
    { lines: ["9. HISTORY"] },
    { lines: ["10. ECONOMICS"] },
    { lines: ["11. TRADE SUBJECT"] },
];

export const REPORT_CARD_VARIANTS: ReportCardVariantPreset[] = [
    {
        id: "junior",
        label: "Junior Section",
        shortLabel: "Junior",
        sectionTitle: "RESULT NOTIFICATION (JUNIOR SECTION)",
        headerSrc: "/Jheader.jpg",
        subjects: JUNIOR_SUBJECTS,
    },
    {
        id: "senior-science",
        label: "Senior Science Section",
        shortLabel: "Science",
        sectionTitle: "RESULT NOTIFICATION (SENIOR SCIENCE SECTION)",
        headerSrc: "/Jheader.jpg",
        subjects: SENIOR_SCIENCE_SUBJECTS,
    },
    {
        id: "senior-commerce",
        label: "Senior Commercial Section",
        shortLabel: "Commercial",
        sectionTitle: "RESULT NOTIFICATION (SENIOR COMMERCIAL SECTION)",
        headerSrc: "/Jheader.jpg",
        subjects: SENIOR_COMMERCE_SUBJECTS,
    },
    {
        id: "senior-art",
        label: "Senior Art Section",
        shortLabel: "Art",
        sectionTitle: "RESULT NOTIFICATION (SENIOR ART SECTION)",
        headerSrc: "/Jheader.jpg",
        subjects: SENIOR_ART_SUBJECTS,
    },
];

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const td = "border border-black px-[7px] align-middle";

const DEFAULT_GRADING: GradingScale = { a: 75, b: 65, c: 55, d: 45, f: 0 };

/** Long-form comment boxes that offer the AI grammar chip. */
const AI_CORRECT_FIELDS = new Set([
    "classTeacherRemark",
    "principalComment",
    "newsLetter",
]);

const fmt = (v?: number) => (v === undefined || Number.isNaN(v) ? "" : String(v));

const fmtDash = (v?: number) => (v === undefined || v === null || Number.isNaN(v) ? "—" : String(v));

const fmtAttendance = (v?: number) => (v === undefined || Number.isNaN(v) ? "____" : String(v));

const cTotalOf = (s: ReportSubject) =>
    s.cbt1 !== undefined && s.cbt2 !== undefined ? s.cbt1 + s.cbt2 : undefined;

const totalOf = (s: ReportSubject) => {
    const c = cTotalOf(s);
    return c !== undefined && s.exam !== undefined ? c + s.exam : undefined;
};

/** First term has no previous cumulative, so Overall Total equals Total. */
const overallOf = (s: ReportSubject) => {
    const total = totalOf(s);
    if (total === undefined) return undefined;
    return s.lastCum === undefined ? total : Math.round((total + s.lastCum) / 2);
};

/** Compact row heights let the 13-subject junior sheet and the 11-subject
 *  senior sheets both fit inside the same one-page border. */
const rowHeight = (lineCount: number, compact: boolean) => {
    if (lineCount >= 3) return compact ? 36 : 44;
    if (lineCount === 2) return compact ? 30 : 34;
    return compact ? 26 : 28;
};

/** Fixed-layout table, exact pixel column widths (sheet content width = 641px) */
function Tbl({
    cols,
    className = "",
    children,
}: {
    cols: number[];
    className?: string;
    children: ReactNode;
}) {
    return (
        <table className={`w-[641px] table-fixed border-collapse ${className}`}>
            <colgroup>
                {cols.map((w, i) => (
                    <col key={i} style={{ width: w }} />
                ))}
            </colgroup>
            <tbody>{children}</tbody>
        </table>
    );
}

function PhoneIcon() {
    return (
        <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
            <circle cx="12" cy="12" r="12" fill="#000" />
            <path
                transform="translate(5 5) scale(0.58)"
                fill="#fff"
                d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
            />
        </svg>
    );
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export default function ReportCard({
    activeField,
    onFieldClick,
    onFieldCommit,
    canEditField,
    onLockedFieldClick,
    highlightFields,
    variant = "junior",
    term = "",
    session = "2026/2027",
    studentName = "",
    admissionNumber = "",
    className = "",
    photoUrl,
    subjects,
    sectionTitle,
    headerSrc,
    present,
    absent,
    totalSchoolDays,
    affective = {},
    psychomotor = {},
    classTeacherRemark = "",
    principalComment = "",
    newsLetter = "",
    nextTermBegins = "",
    grading = DEFAULT_GRADING,
}: ReportCardProps) {
    const preset = REPORT_CARD_VARIANTS.find((item) => item.id === variant) ?? REPORT_CARD_VARIANTS[0];
    const rows = subjects ?? preset.subjects;
    const compact = rows.length > 11;
    const resolvedSectionTitle = sectionTitle ?? preset.sectionTitle;
    const resolvedHeaderSrc = headerSrc ?? preset.headerSrc;
    const recreation = psychomotor.recreation ?? psychomotor.sports;
    const termLabel = term ? term.replace(/\s*term\s*$/i, "").toUpperCase() : "_____________";
    const overallWithGrade = (subject: ReportSubject) => {
        const overall = overallOf(subject);
        if (overall === undefined) return "—";
        return `${overall}${gradeBandFor(overall, grading).grade}`;
    };

    const sheetRef = useRef<HTMLDivElement>(null);
    const cancelInlineRef = useRef(false);
    type InlineEdit = {
        field: string;
        value: string;
        left: number;
        top: number;
        width: number;
        height: number;
        multiline: boolean;
        numeric: boolean;
        max?: number;
        /** AI grammar correction is only offered on long-form remarks. */
        aiBusy?: boolean;
        aiError?: string | null;
        aiMessage?: string | null;
        aiHistory?: string[];
        aiIndex?: number;
    };
    const [inline, setInline] = useState<InlineEdit | null>(null);

    const isInlineField = (field: string) => {
        if (
            [
                "studentName",
                "admissionNumber",
                "className",
                "classTeacherRemark",
                "principalComment",
                "newsLetter",
                "affective.puntuality",
                "affective.respect",
                "psychomotor.handwriting",
                "psychomotor.recreation",
            ].includes(field)
        ) {
            return true;
        }
        return /^subject\.\d+\.(label|cbt1|cbt2|exam|lastCum)$/.test(field);
    };

    const inlineMax = (field: string) => {
        if (/\.(cbt1|cbt2)$/.test(field)) return 20;
        if (/\.exam$/.test(field)) return 60;
        if (/\.lastCum$/.test(field)) return 100;
        return undefined;
    };

    const fieldValue = (field: string): string => {
        const textFields: Record<string, string | undefined> = {
            studentName,
            admissionNumber,
            className,
            classTeacherRemark,
            principalComment,
            newsLetter,
            "affective.puntuality": affective.puntuality,
            "affective.respect": affective.respect,
            "psychomotor.handwriting": psychomotor.handwriting,
            "psychomotor.recreation": recreation,
        };
        if (field in textFields) return String(textFields[field] ?? "");
        const match = /^subject\.(\d+)\.(label|cbt1|cbt2|exam|lastCum)$/.exec(field);
        if (!match) return "";
        const subject = rows[Number(match[1])];
        if (!subject) return "";
        const part = match[2];
        if (part === "label") return subject.lines.join("\n");
        const value = subject[part as "cbt1" | "cbt2" | "exam" | "lastCum"];
        return value === undefined || value === null ? "" : String(value);
    };

    const startInline = (field: string, element: HTMLElement) => {
        if (!onFieldCommit || !isInlineField(field)) return false;
        const root = sheetRef.current?.getBoundingClientRect();
        if (!root) return false;
        const box = element.getBoundingClientRect();
        const multiline = /\.label$|Remark|Comment|newsLetter/.test(field);
        setInline({
            field,
            value: fieldValue(field),
            left: box.left - root.left,
            top: box.top - root.top,
            width: Math.max(box.width, 44),
            height: multiline ? Math.max(box.height, 48) : Math.max(box.height, 24),
            multiline,
            numeric: /\.(cbt1|cbt2|exam|lastCum)$/.test(field),
            max: inlineMax(field),
        });
        return true;
    };

    const commitInline = (valueOverride?: string) => {
        if (!inline) return;
        const current = inline;
        setInline(null);
        onFieldCommit?.(current.field, valueOverride ?? current.value);
    };

    const isAiField = (field?: string) => Boolean(field && AI_CORRECT_FIELDS.has(field));

    /** Move back/forward through AI correction versions without closing the cell. */
    const applyAiHistory = (nextIndex: number) => {
        setInline((previous) => {
            if (!previous?.aiHistory?.length) return previous;
            const clamped = Math.max(0, Math.min(nextIndex, previous.aiHistory.length - 1));
            const nextValue = previous.aiHistory[clamped];
            if (nextValue === undefined) return previous;
            return {
                ...previous,
                value: nextValue,
                aiIndex: clamped,
                aiError: null,
                aiMessage: null,
            };
        });
    };

    const runAiCorrection = async () => {
        if (!inline || !isAiField(inline.field)) return;
        const text = inline.value.trim();
        if (!text) {
            setInline((previous) =>
                previous
                    ? {
                          ...previous,
                          aiBusy: false,
                          aiError: "Write the remark first, then let AI correct it.",
                          aiMessage: null,
                      }
                    : previous,
            );
            return;
        }
        const correctedField = inline.field;
        const before = inline.value;
        setInline((previous) =>
            previous
                ? { ...previous, aiBusy: true, aiError: null, aiMessage: null }
                : previous,
        );
        try {
            const response = await apiPost<{ corrected: string }>("/ai/agent/correct-text", {
                text: before,
            });
            const corrected = String(response.data?.corrected ?? "").trim();
            if (!corrected) throw new Error("The AI did not return corrected text.");
            setInline((previous) => {
                if (!previous || previous.field !== correctedField) return previous;
                if (corrected === previous.value.trim()) {
                    return {
                        ...previous,
                        aiBusy: false,
                        aiError: null,
                        aiMessage: "No grammar changes were needed.",
                    };
                }
                const history = previous.aiHistory ?? [before];
                const index = previous.aiIndex ?? 0;
                const base = history.slice(0, index + 1);
                // Manual edits after a correction start a new branch, so undo
                // returns to the text the editor was actually looking at.
                if (base[base.length - 1] !== previous.value) base.push(previous.value);
                const nextHistory = [...base, corrected];
                return {
                    ...previous,
                    value: corrected,
                    aiBusy: false,
                    aiError: null,
                    aiMessage: "Corrected. Use Undo/Redo, then click outside to save.",
                    aiHistory: nextHistory,
                    aiIndex: nextHistory.length - 1,
                };
            });
        } catch (error: any) {
            setInline((previous) =>
                previous
                    ? {
                          ...previous,
                          aiBusy: false,
                          aiError: error?.message ?? "AI correction failed. Try again.",
                      }
                    : previous,
            );
        }
    };

    const aiToolbar = inline && isAiField(inline.field) ? (
        <div
            className="ai-grammar-chip absolute z-40 flex max-w-[310px] flex-wrap items-center gap-1 rounded-md border border-brand-400 bg-white/95 px-1.5 py-1 shadow-lg ring-1 ring-brand-100 print:hidden"
            style={{
                left: Math.max(4, Math.min(inline.left + inline.width - 310, 794 - 310)),
                top: Math.max(2, inline.top - 42),
            }}
            onMouseDown={(event) => event.preventDefault()}
        >
            <span className="inline-flex items-center gap-1 rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-brand-800">
                <Sparkles size={11} aria-hidden="true" /> AI
            </span>
            <button
                type="button"
                onClick={() => void runAiCorrection()}
                disabled={Boolean(inline.aiBusy)}
                title="Correct spelling and grammar with AI"
                className="inline-flex min-h-7 items-center gap-1 rounded border border-brand-300 bg-brand-50 px-2 text-[10px] font-bold text-brand-800 hover:border-brand-500 hover:bg-brand-100 disabled:opacity-60"
            >
                {inline.aiBusy ? (
                    <LoaderCircle size={11} className="animate-spin" aria-hidden="true" />
                ) : (
                    <Sparkles size={11} aria-hidden="true" />
                )}
                {inline.aiBusy ? "Correcting…" : "AI auto correct"}
            </button>
            <button
                type="button"
                onClick={() => applyAiHistory((inline.aiIndex ?? 0) - 1)}
                disabled={!inline.aiHistory?.length || (inline.aiIndex ?? 0) <= 0}
                title="Undo AI correction"
                className="inline-flex min-h-7 items-center gap-1 rounded border border-line bg-white px-2 text-[10px] font-bold text-brand-800 hover:border-brand-400 disabled:opacity-40"
            >
                <Undo2 size={11} aria-hidden="true" /> Undo
            </button>
            <button
                type="button"
                onClick={() => applyAiHistory((inline.aiIndex ?? 0) + 1)}
                disabled={
                    !inline.aiHistory?.length ||
                    (inline.aiIndex ?? 0) >= inline.aiHistory.length - 1
                }
                title="Redo AI correction"
                className="inline-flex min-h-7 items-center gap-1 rounded border border-line bg-white px-2 text-[10px] font-bold text-brand-800 hover:border-brand-400 disabled:opacity-40"
            >
                <Redo2 size={11} aria-hidden="true" /> Redo
            </button>
            {inline.aiError && (
                <span className="w-full text-[10px] font-semibold text-rose-700">{inline.aiError}</span>
            )}
            {inline.aiMessage && !inline.aiError && (
                <span className="w-full text-[10px] font-semibold text-emerald-700">{inline.aiMessage}</span>
            )}
        </div>
    ) : null;

    /** Click-to-edit affordance only; all printed dimensions stay untouched. */
    const cellProps = (field: string) => {
        const editable = canEditField ? canEditField(field) : true;
        if (!editable) {
            if (!onLockedFieldClick) return {};
            return {
                onClick: (event: any) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onLockedFieldClick(field);
                },
                role: "button",
                tabIndex: 0,
                "aria-label": `Locked ${field.replace(/\./g, " ")}`,
                "aria-disabled": true,
                title: "You do not have permission to edit this field.",
            };
        }
        const canInline = Boolean(onFieldCommit) && isInlineField(field);
        if (!onFieldClick && !canInline) return {};
        return {
            onClick: (event: any) => {
                event.preventDefault();
                event.stopPropagation();
                if (!canInline || !startInline(field, event.currentTarget)) {
                    onFieldClick?.(field);
                }
            },
            role: "button",
            tabIndex: 0,
            onKeyDown: (event: any) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    if (!canInline || !startInline(field, event.currentTarget)) {
                        onFieldClick?.(field);
                    }
                }
            },
            "aria-label": `Edit ${field.replace(/\./g, " ")}`,
        };
    };

    const cellClass = (field: string) => {
        const editable = canEditField ? canEditField(field) : true;
        if (!editable) return "cursor-not-allowed";
        const canInline = Boolean(onFieldCommit) && isInlineField(field);
        if (!onFieldClick && !canInline) return "";
        const active = activeField === field;
        return `${canInline ? "cursor-text" : "cursor-pointer"} transition-colors hover:bg-brand-50/60 ${
            active ? "outline outline-2 -outline-offset-2 outline-brand-500" : ""
        } ${highlightFields?.has(field) ? "teacher-field-highlight" : ""}`;
    };

    return (
        <div
            ref={sheetRef}
            className="relative mx-auto box-border w-[794px] bg-white p-[11px] text-black print:m-0"
            style={{ fontFamily: '"Times New Roman", Times, "Liberation Serif", serif' }}
        >
            {/* page border */}
            <div className="flex min-h-[1016px] flex-col border border-black pl-[59px] pr-[70px] pt-[14px]">
                {/* ------------------------------------------------------------ */}
                {/* HEADER                                                       */}
                {/* ------------------------------------------------------------ */}
                <img
                    src={resolvedHeaderSrc}
                    alt={`Uncle Tee Secondary School - ${preset.label} Result Notification`}
                    className="ml-[7px] block h-[148px] w-[641px] max-w-none object-contain"
                />

                {/* Vision / Mission */}
                <div className="mt-[3px] w-[641px] whitespace-nowrap pl-[7px] text-[13.33px] leading-[15.5px]">
                    <p>
                        <b>Vision Statement:</b>{" "}
                        <span className="text-[#ff0000]">
                            To create individuals that will have a positive impact in every community and country
                            around the
                            <br />
                            world.
                        </span>
                    </p>
                    <p>
                        <b>Mission Statement:</b>{" "}
                        <span className="text-[#ff0000]">
                            Strengthening the education system to ensure students go through a team of committed
                            and
                            <br />
                            value - based teachers.
                        </span>
                    </p>
                </div>

                {/* ------------------------------------------------------------ */}
                {/* STUDENT INFO                                                  */}
                {/* ------------------------------------------------------------ */}
                <Tbl cols={[190, 181, 155, 115]} className="mt-[2px] text-[16px] leading-[20px]">
                    <tr className="h-[29px]">
                        <td className={`${td} px-[6px]`}>STUDENT NAME:</td>
                        <td
                            className={`${td} px-[6px] ${cellClass("studentName")}`}
                            colSpan={2}
                            {...cellProps("studentName")}
                        >
                            {studentName}
                        </td>
                        <td
                            className={`border border-black align-top ${cellClass("photo")}`}
                            rowSpan={2}
                            {...cellProps("photo")}
                        >
                            {photoUrl && (
                                <img src={photoUrl} alt="Student" className="block h-full w-full object-cover" />
                            )}
                        </td>
                    </tr>
                    <tr className="h-[60px]">
                        <td className={`${td} px-[6px] align-top`}>ADMISSION NUMBER:</td>
                        <td
                            className={`${td} px-[6px] align-top ${cellClass("admissionNumber")}`}
                            {...cellProps("admissionNumber")}
                        >
                            {admissionNumber}
                        </td>
                        <td
                            className={`${td} px-[6px] align-top ${cellClass("className")}`}
                            {...cellProps("className")}
                        >
                            CLASS: {className}
                        </td>
                    </tr>
                </Tbl>

                {/* ------------------------------------------------------------ */}
                {/* TERM / ATTENDANCE                                             */}
                {/* ------------------------------------------------------------ */}
                <div className="mt-[3px] w-[641px] pl-[7px]">
                    <div className="flex flex-wrap items-end justify-between gap-x-6 text-[13px] leading-[17px]">
                        <p>
                            <b>{termLabel} TERM</b>{" "}
                            <span>{session} ACADEMIC SESSION</span>
                        </p>
                        <p
                            className={`flex gap-[14px] text-[11.5px] leading-[15px] ${cellClass("attendance")}`}
                            {...cellProps("attendance")}
                        >
                            <span>
                                Present: <b>{fmtAttendance(present)}</b>
                            </span>
                            <span>
                                Absent: <b>{fmtAttendance(absent)}</b>
                            </span>
                        </p>
                    </div>
                    <p
                        className={`text-[11.5px] leading-[15px] ${cellClass("attendance")}`}
                        {...cellProps("attendance")}
                    >
                        Attendance Record || Total school days: <b>{fmtAttendance(totalSchoolDays)}</b>
                    </p>
                </div>

                {/* Section title */}
                <p className="mb-[3px] mt-[5px] w-[641px] pl-[7px] text-center text-[14px] font-bold uppercase leading-[17px]">
                    {resolvedSectionTitle}
                </p>

                {/* ------------------------------------------------------------ */}
                {/* RESULTS TABLE                                                 */}
                {/* ------------------------------------------------------------ */}
                <Tbl
                    cols={[194, 57, 56, 55, 57, 59, 74, 89]}
                    className="whitespace-nowrap text-[12.5px] leading-[14px]"
                >
                    <tr className="h-[34px]">
                        <td className={`${td} font-bold`}>SUBJECT</td>
                        <td className={td}>
                            <b>CBT 1</b>
                            <br />
                            20/20
                        </td>
                        <td className={td}>
                            <b>CBT 2</b>
                            <br />
                            20/20
                        </td>
                        <td className={td}>
                            CTotal
                            <br />
                            40/40
                        </td>
                        <td className={td}>
                            <b>EXAM</b>
                            <br />
                            60/60
                        </td>
                        <td className={td}>
                            <b>Total</b>
                            <br />
                            100/100
                        </td>
                        <td className={td}>
                            Last Cum.
                            <br />
                            100/100
                        </td>
                        <td className={td}>
                            Overall Total
                            <br />
                            100A
                        </td>
                    </tr>

                    {rows.map((s, index) => (
                        <tr key={`${s.lines[0]}-${index}`} style={{ height: rowHeight(s.lines.length, compact) }}>
                            <td
                                className={`${td} ${cellClass(`subject.${index}.label`)}`}
                                {...cellProps(`subject.${index}.label`)}
                            >
                                {s.lines.map((line, k) => (
                                    <div key={k}>{line}</div>
                                ))}
                            </td>
                            <td
                                className={`${td} ${cellClass(`subject.${index}.cbt1`)}`}
                                {...cellProps(`subject.${index}.cbt1`)}
                            >
                                {fmt(s.cbt1)}
                            </td>
                            <td
                                className={`${td} ${cellClass(`subject.${index}.cbt2`)}`}
                                {...cellProps(`subject.${index}.cbt2`)}
                            >
                                {fmt(s.cbt2)}
                            </td>
                            <td
                                className={`${td} ${cellClass(`subject.${index}.ctotal`)}`}
                                {...cellProps(`subject.${index}.ctotal`)}
                            >
                                {fmt(cTotalOf(s))}
                            </td>
                            <td
                                className={`${td} ${cellClass(`subject.${index}.exam`)}`}
                                {...cellProps(`subject.${index}.exam`)}
                            >
                                {fmt(s.exam)}
                            </td>
                            <td
                                className={`${td} ${cellClass(`subject.${index}.total`)}`}
                                {...cellProps(`subject.${index}.total`)}
                            >
                                {fmt(totalOf(s))}
                            </td>
                            <td
                                className={`${td} ${cellClass(`subject.${index}.lastCum`)}`}
                                {...cellProps(`subject.${index}.lastCum`)}
                            >
                                {fmtDash(s.lastCum)}
                            </td>
                            <td
                                className={`${td} ${cellClass(`subject.${index}.overall`)}`}
                                {...cellProps(`subject.${index}.overall`)}
                            >
                                {overallWithGrade(s)}
                            </td>
                        </tr>
                    ))}

                    {/* Class teacher remark */}
                    <tr>
                        <td className={`${td} py-[3px] font-bold`}>CLASS TEACHER REMARK:</td>
                        <td
                            className={`${td} whitespace-normal py-[3px] ${cellClass("classTeacherRemark")}`}
                            colSpan={7}
                            {...cellProps("classTeacherRemark")}
                        >
                            {classTeacherRemark}
                        </td>
                    </tr>

                    {/* Affective traits */}
                    <tr className="h-[21px]">
                        <td className={`${td} font-bold`}>AFFECTIVE TRAITS</td>
                        <td className={td} colSpan={2}>
                            PUNTUALITY
                        </td>
                        <td className={`${td} ${cellClass("affective.puntuality")}`} {...cellProps("affective.puntuality")}>
                            {affective.puntuality}
                        </td>
                        <td className={td} colSpan={3}>
                            RESPECT FOR AUTHORITY
                        </td>
                        <td className={`${td} ${cellClass("affective.respect")}`} {...cellProps("affective.respect")}>
                            {affective.respect}
                        </td>
                    </tr>

                    {/* Psychomotor skills */}
                    <tr className="h-[21px]">
                        <td className={`${td} font-bold`}>PSYCHOMOTOR SKILLS</td>
                        <td className={td} colSpan={2}>
                            HANDWRITING
                        </td>
                        <td
                            className={`${td} ${cellClass("psychomotor.handwriting")}`}
                            {...cellProps("psychomotor.handwriting")}
                        >
                            {psychomotor.handwriting}
                        </td>
                        <td className={td} colSpan={3}>
                            RECREATION
                        </td>
                        <td
                            className={`${td} ${cellClass("psychomotor.recreation")}`}
                            {...cellProps("psychomotor.recreation")}
                        >
                            {recreation}
                        </td>
                    </tr>

                    {/* Principal's comment */}
                    <tr>
                        <td className={`${td} py-[3px] font-bold`}>PRINCIPALS COMMENT:</td>
                        <td
                            className={`${td} whitespace-normal py-[3px] ${cellClass("principalComment")}`}
                            colSpan={7}
                            {...cellProps("principalComment")}
                        >
                            {principalComment}
                        </td>
                    </tr>

                    {/* News letter */}
                    <tr>
                        <td className={`${td} py-[3px] font-bold`}>NEWS LETTER:</td>
                        <td
                            className={`${td} whitespace-normal py-[3px] ${cellClass("newsLetter")}`}
                            colSpan={7}
                            {...cellProps("newsLetter")}
                        >
                            {newsLetter}
                        </td>
                    </tr>

                    {/* Optional next-term line for older callers */}
                    {nextTermBegins && (
                        <tr className="h-[21px]">
                            <td className={td}>NEXT TERM BEGINS:</td>
                            <td className={td} colSpan={7}>
                                {nextTermBegins}
                            </td>
                        </tr>
                    )}
                </Tbl>

                {/* ------------------------------------------------------------ */}
                {/* FOOTER                                                        */}
                {/* ------------------------------------------------------------ */}
                <footer
                    className="mt-auto mb-[14px] ml-[7px] flex w-[641px] max-w-none shrink-0 items-center justify-between text-black"
                    style={{ fontFamily: "Calibri, Carlito, Arial, Helvetica, sans-serif" }}
                >
                    {/* Left: Tel label + phone row */}
                    <div className="flex flex-col gap-[4px]">
                        <span className="text-[10px] font-bold leading-none">Tel:</span>
                        <div className="flex items-center gap-[6px] text-[10px] font-bold">
                            <PhoneIcon />
                            <span>+234 (0) 7039334594</span>
                        </div>
                    </div>

                    {/* Right: Address */}
                    <p className="whitespace-nowrap text-right text-[9.5px] font-bold leading-[16px]">
                        NO. 25 OLABISI JOHNSON STR.
                        <br />
                        VALENTINO ONDO CITY.
                    </p>
                </footer>
            </div>
            {inline &&
                (inline.multiline ? (
                    <textarea
                        autoFocus
                        value={inline.value}
                        readOnly={Boolean(inline.aiBusy)}
                        aria-label={`Edit ${inline.field.replace(/\./g, " ")}`}
                        onChange={(event) => setInline({ ...inline, value: event.target.value, aiMessage: null })}
                        onFocus={(event) => event.currentTarget.select()}
                        onBlur={() => {
                            if (cancelInlineRef.current) {
                                cancelInlineRef.current = false;
                                return;
                            }
                            commitInline();
                        }}
                        onKeyDown={(event) => {
                            if (event.key === "Escape") {
                                event.preventDefault();
                                cancelInlineRef.current = true;
                                setInline(null);
                            }
                            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                                event.preventDefault();
                                commitInline();
                            }
                        }}
                        style={{
                            left: inline.left,
                            top: inline.top,
                            width: inline.width,
                            height: inline.height,
                        }}
                        className={`absolute z-30 resize-none overflow-auto border-2 ${
                            isAiField(inline.field) ? "border-brand-400 ring-2 ring-brand-100" : "border-brand-500"
                        } bg-white px-1 py-0.5 text-[12px] leading-[15px] text-black shadow-lg outline-none print:hidden`}
                    />
                ) : (
                    <input
                        autoFocus
                        type={inline.numeric ? "number" : "text"}
                        min={inline.numeric ? 0 : undefined}
                        max={inline.max}
                        step={inline.numeric ? "any" : undefined}
                        value={inline.value}
                        aria-label={`Edit ${inline.field.replace(/\./g, " ")}`}
                        onChange={(event) => setInline({ ...inline, value: event.target.value })}
                        onFocus={(event) => event.currentTarget.select()}
                        onBlur={() => {
                            if (cancelInlineRef.current) {
                                cancelInlineRef.current = false;
                                return;
                            }
                            commitInline();
                        }}
                        onKeyDown={(event) => {
                            if (event.key === "Escape") {
                                event.preventDefault();
                                cancelInlineRef.current = true;
                                setInline(null);
                            }
                            if (event.key === "Enter") {
                                event.preventDefault();
                                commitInline();
                            }
                        }}
                        style={{
                            left: inline.left,
                            top: inline.top,
                            width: inline.width,
                            height: inline.height,
                        }}
                        className="absolute z-30 border-2 border-brand-500 bg-white px-1 text-[12px] font-semibold text-black shadow-lg outline-none print:hidden"
                    />
                ))}
            {aiToolbar}
        </div>
    );
}
