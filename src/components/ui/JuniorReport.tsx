import type { ReactNode } from "react";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface JuniorSubject {
    /** Label lines exactly as printed, e.g. ["1. ENGLISH LANGUAGE", "(EGS)"] */
    lines: string[];
    cbt1?: number; // /20
    cbt2?: number; // /20
    exam?: number; // /60
    lastCum?: number; // /100
    overall?: number; // /100
}

export interface JuniorReportSheetProps {
    /** Leave empty to print the blank line ("FOR ____ TERM"), or pass e.g. "SECOND" */
    term?: string;
    session?: string; // "2025/2026"
    studentName?: string;
    admissionNumber?: string;
    className?: string; // value shown after "CLASS:"
    photoUrl?: string;
    subjects?: JuniorSubject[];
    affective?: { puntuality?: string; respect?: string };
    psychomotor?: { handwriting?: string; sports?: string };
    principalComment?: string;
    nextTermBegins?: string;
}

/* -------------------------------------------------------------------------- */
/*  Defaults (exactly as printed on the sheet, typos included)                */
/* -------------------------------------------------------------------------- */

const DEFAULT_SUBJECTS: JuniorSubject[] = [
    { lines: ["1. ENGLISH LANGUAGE", "(EGS)"] },
    { lines: ["2. GENERAL MATHEMATICS", "(MAT)"] },
    { lines: ["3. INTERMEDIATE SCIENCE", "(ITS)"] },
    { lines: ["4. DIGITAL TECHNOLOGIES", "(DIT)"] },
    { lines: ["5. BUSINESS STUDIES", "(BUS)"] },
    { lines: ["6. CULTURAL AND", "CREATIVE ARTS (CCA)"] },
    { lines: ["7. CHRISTAIN RELIGIOUS", "STUDIES (CRS)"] },
    { lines: ["8. HISTORY", "(HIS)"] },
    { lines: ["9. PHYSICAL AND HEALTH", "EDUCATION (PHE)"] },
    { lines: ["10. SOCIAL AND", "CITIZENSHIP STUDIES", "(SCS)"] },
    { lines: ["11. YORUBA", "(YOR)"] },
];

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const td = "border border-black px-[7px] align-middle";

const fmt = (v?: number) => (v === undefined || Number.isNaN(v) ? "" : String(v));

const cTotalOf = (s: JuniorSubject) =>
    s.cbt1 !== undefined && s.cbt2 !== undefined ? s.cbt1 + s.cbt2 : undefined;

const totalOf = (s: JuniorSubject) => {
    const c = cTotalOf(s);
    return c !== undefined && s.exam !== undefined ? c + s.exam : undefined;
};

/** Row heights (px) copied from the sheet. Row 10 has 3 lines, row 11 is tighter. */
const rowHeight = (i: number, lineCount: number) => {
    if (lineCount >= 3) return 56;
    if (i === 10) return 33;
    return 37;
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

export default function JuniorReportSheet({
    term = "",
    session = "2025/2026",
    studentName = "",
    admissionNumber = "",
    className = "",
    photoUrl,
    subjects = DEFAULT_SUBJECTS,
    affective = {},
    psychomotor = {},
    principalComment = "",
    nextTermBegins = "",
}: JuniorReportSheetProps) {
    return (
        <div
            className="mx-auto box-border w-[794px] bg-white p-[11px] text-black print:m-0"
            style={{ fontFamily: '"Times New Roman", Times, "Liberation Serif", serif' }}
        >
            {/* page border */}
            <div className="flex min-h-[1016px] flex-col border border-black pl-[59px] pr-[70px] pt-[14px]">
                {/* ------------------------------------------------------------ */}
                {/* HEADER  (the crossed-out area in the screenshot -> /Jheader.jpg) */}
                {/* ------------------------------------------------------------ */}
                <img
                    src="/Jheader.jpg"
                    alt="Uncle Tee Secondary School – Result Notification"
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
                            value – based teachers.
                        </span>
                    </p>
                </div>

                {/* ------------------------------------------------------------ */}
                {/* STUDENT INFO                                                  */}
                {/* ------------------------------------------------------------ */}
                <Tbl cols={[190, 181, 155, 115]} className="mt-[2px] text-[16px] leading-[20px]">
                    <tr className="h-[29px]">
                        <td className={`${td} px-[6px]`}>STUDENT NAME:</td>
                        <td className={`${td} px-[6px]`} colSpan={2}>
                            {studentName}
                        </td>
                        <td className="border border-black align-top" rowSpan={2}>
                            {photoUrl && (
                                <img src={photoUrl} alt="Student" className="block h-full w-full object-cover" />
                            )}
                        </td>
                    </tr>
                    <tr className="h-[60px]">
                        <td className={`${td} px-[6px] align-top`}>ADMISSION NUMBER:</td>
                        <td className={`${td} px-[6px] align-top`}>{admissionNumber}</td>
                        <td className={`${td} px-[6px] align-top`}>CLASS: {className}</td>
                    </tr>
                </Tbl>

                {/* Title */}
                <p className="mb-[19px] w-[641px] whitespace-pre pl-[7px] text-[16px] leading-[20px]">
                    {"RESULT NOTIFICATION  FOR "}
                    {term ? (
                        <span className="inline-block w-[104px] text-center underline">{term.toUpperCase()}</span>
                    ) : (
                        "_____________"
                    )}
                    {` TERM  ${session} ACADEMIC SESSION`}
                </p>

                {/* ------------------------------------------------------------ */}
                {/* RESULTS TABLE                                                 */}
                {/* ------------------------------------------------------------ */}
                <Tbl
                    cols={[194, 57, 56, 55, 57, 59, 74, 89]}
                    className="whitespace-nowrap text-[13.33px] leading-[15.5px]"
                >
                    <tr className="h-[38px]">
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

                    {subjects.map((s, i) => (
                        <tr key={s.lines[0]} style={{ height: rowHeight(i, s.lines.length) }}>
                            <td className={td}>
                                {s.lines.map((line, k) => (
                                    <div key={k}>{line}</div>
                                ))}
                            </td>
                            <td className={td}>{fmt(s.cbt1)}</td>
                            <td className={td}>{fmt(s.cbt2)}</td>
                            <td className={td}>{fmt(cTotalOf(s))}</td>
                            <td className={td}>{fmt(s.exam)}</td>
                            <td className={td}>{fmt(totalOf(s))}</td>
                            <td className={td}>{fmt(s.lastCum)}</td>
                            <td className={td}>{fmt(s.overall)}</td>
                        </tr>
                    ))}

                    {/* Affective traits */}
                    <tr className="h-[19.5px]">
                        <td className={`${td} font-bold`}>AFFECTIVE TRAITS</td>
                        <td className={td} colSpan={2}>
                            PUNTUALITY
                        </td>
                        <td className={td}>{affective.puntuality}</td>
                        <td className={td} colSpan={3}>
                            RESPECT FOR AUTHORITY
                        </td>
                        <td className={td}>{affective.respect}</td>
                    </tr>

                    {/* Psychomotor skills */}
                    <tr className="h-[19.5px]">
                        <td className={`${td} font-bold`}>PSYCHOMOTOR SKILLS</td>
                        <td className={td} colSpan={2}>
                            HANDWRITING
                        </td>
                        <td className={td}>{psychomotor.handwriting}</td>
                        <td className={td} colSpan={3}>
                            SPORTS/GAMES
                        </td>
                        <td className={td}>{psychomotor.sports}</td>
                    </tr>

                    {/* Principal's comment */}
                    <tr className="h-[19.5px]">
                        <td className={`${td} font-bold`}>PRINCIPALS COMMENT:</td>
                        <td className={`${td} whitespace-normal`} colSpan={7}>
                            {principalComment}
                        </td>
                    </tr>

                    {/* Next term */}
                    <tr className="h-[19.5px]">
                        <td className={td}>NEXT TERM BEGINS:</td>
                        <td className={td} colSpan={7}>
                            {nextTermBegins}
                        </td>
                    </tr>
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