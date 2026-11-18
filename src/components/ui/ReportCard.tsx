import type { ReactNode } from "react";

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
}: ReportCardProps) {
    const preset = REPORT_CARD_VARIANTS.find((item) => item.id === variant) ?? REPORT_CARD_VARIANTS[0];
    const rows = subjects ?? preset.subjects;
    const compact = rows.length > 11;
    const resolvedSectionTitle = sectionTitle ?? preset.sectionTitle;
    const resolvedHeaderSrc = headerSrc ?? preset.headerSrc;
    const recreation = psychomotor.recreation ?? psychomotor.sports;
    const termLabel = term ? term.replace(/\s*term\s*$/i, "").toUpperCase() : "_____________";

    /** Click-to-edit affordance only; all printed dimensions stay untouched. */
    const cellProps = (field: string) => {
        if (!onFieldClick) return {};
        return {
            onClick: () => onFieldClick(field),
            role: "button",
            tabIndex: 0,
            onKeyDown: (event: { key: string; preventDefault: () => void }) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onFieldClick(field);
                }
            },
            "aria-label": `Edit ${field.replace(/\./g, " ")}`,
        };
    };

    const cellClass = (field: string) => {
        if (!onFieldClick) return "";
        const active = activeField === field;
        return `cursor-pointer transition-colors hover:bg-brand-50/60 ${active ? "outline outline-2 -outline-offset-2 outline-brand-500" : ""
            }`;
    };

    return (
        <div
            className="mx-auto box-border w-[794px] bg-white p-[11px] text-black print:m-0"
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
                                {fmtDash(overallOf(s))}
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
        </div>
    );
}
