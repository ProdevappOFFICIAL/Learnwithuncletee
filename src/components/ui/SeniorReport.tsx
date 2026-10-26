import type { ReactNode } from "react";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface SubjectRow {
    code: string;
    units: number;
    cbt1?: number; // /20
    cbt2?: number; // /20
    exam?: number; // /60
    lastCum?: number; // /100
    overall?: number; // /100
    tUnit?: number;
}

export interface SeniorReportSheetProps {
    term?: string; // "SECOND"
    session?: string; // "2025/2026"
    studentName?: string;
    studentId?: string;
    photoUrl?: string;
    gpa?: { first?: string; second?: string; third?: string };
    subjects?: SubjectRow[];
    affective?: { puntuality?: string; respect?: string };
    cgpa?: string;
    principalName?: string;
    principalComment?: string;
    nextTermBegins?: string;
}

/* -------------------------------------------------------------------------- */
/*  Defaults (matches the screenshot)                                         */
/* -------------------------------------------------------------------------- */

const DEFAULT_SUBJECTS: SubjectRow[] = [
    { code: "ENG 101", units: 3 },
    { code: "MTH 101", units: 3 },
    { code: "BIO 101", units: 2 },
    { code: "AGR 101", units: 1 },
    { code: "GEO 101", units: 1 },
    { code: "PHY 101", units: 2 },
    { code: "DPC 101", units: 1 },
    { code: "CHM 101", units: 2 },
    { code: "CHS 101", units: 1 },
];

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

// every cell shares the same 1px black border (borders are collapsed)
const td = "border border-black align-top";

const fmt = (v?: number) => (v === undefined || Number.isNaN(v) ? "" : String(v));

const cTotalOf = (s: SubjectRow) =>
    s.cbt1 !== undefined && s.cbt2 !== undefined ? s.cbt1 + s.cbt2 : undefined;

const totalOf = (s: SubjectRow) => {
    const c = cTotalOf(s);
    return c !== undefined && s.exam !== undefined ? c + s.exam : undefined;
};

/** Fixed-layout table, exact pixel column widths (sheet content width = 675px) */
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
        <table className={`w-[675px] table-fixed border-collapse ${className}`}>
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

export default function SeniorReportSheet({
    term = "SECOND",
    session = "2025/2026",
    studentName = "",
    studentId = "",
    photoUrl,
    gpa = {},
    subjects = DEFAULT_SUBJECTS,
    affective = {},
    cgpa = "",
    principalName = "(MR. ROTIMI AKINTEMI)",
    principalComment = "",
    nextTermBegins = "",
}: SeniorReportSheetProps) {
    const totalUnits = subjects.reduce((sum, s) => sum + s.units, 0);

    return (
        <div
            className="mx-auto box-border w-[794px] bg-white p-[11px] text-black print:m-0"
            style={{ fontFamily: '"Times New Roman", Times, "Liberation Serif", serif' }}
        >
            {/* page border */}
            <div className="flex min-h-[1016px] w-full flex-col border border-black pl-[67px] pr-[28px] pt-[23px]">
                {/* ------------------------------------------------------------ */}
                {/* HEADER  (the crossed-out area in the screenshot -> /Sheader.jpg) */}
                {/* ------------------------------------------------------------ */}
                <img
                    src="/Sheader.png"
                    alt="Uncle Tee Secondary School"
                    className="ml-[7px] block w-full object-cover"
                />

                {/* Vision / Mission */}
                <div className="mt-[16px] w-[675px] whitespace-nowrap text-[13.33px] leading-[15.5px]">
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
                <Tbl cols={[171, 168, 186, 149]} className="relative text-[16px] leading-[20px]">
                    <tr className="h-[25px]">
                        <td className={`${td} px-[6px] align-middle`}>STUDENT NAME:</td>
                        <td className={`${td} px-[6px] align-middle`} colSpan={2}>
                            {studentName}
                        </td>
                        <td className={td} rowSpan={3}>
                            {photoUrl && (
                                <img src={photoUrl} alt="Student" className="block h-full w-full object-cover" />
                            )}
                        </td>
                    </tr>
                    <tr className="h-[44px]">
                        <td className={`${td} px-[6px]`}>STUDENT ID:</td>
                        <td className={`${td} px-[6px]`}>{studentId}</td>
                        <td className={td} />
                    </tr>
                    <tr className="h-[45px]">
                        <td className={`${td} px-[6px] pt-[3px]`}>
                            1<sup className="text-[0.62em] leading-[0]">ST</sup> TERM GPA: {gpa.first}
                        </td>
                        <td className={`${td} px-[6px] pt-[3px]`}>
                            2<sup className="text-[0.62em] leading-[0]">ND</sup> TERM GPA: {gpa.second}
                        </td>
                        <td className={`${td} px-[6px] pt-[3px]`}>
                            3<sup className="text-[0.62em] leading-[0]">RD</sup> TERM GPA: {gpa.third}
                        </td>
                    </tr>
                </Tbl>

                {/* Title */}
                <p className="mb-[16px] mt-[2px] w-[675px] whitespace-pre text-[16px] leading-[20px]">
                    {`RESULT NOTIFICATION  FOR ${term.toUpperCase()} TERM ${session} ACADEMIC SESSION`}
                </p>

                {/* ------------------------------------------------------------ */}
                {/* RESULTS TABLE                                                 */}
                {/* ------------------------------------------------------------ */}
                <Tbl cols={[42, 82, 66, 64, 56, 62, 40, 59, 75, 59, 70]} className="text-[12px]">
                    <tr className="h-[73px] leading-[24px]">
                        <td className={`${td} whitespace-nowrap px-[6px] font-bold`}>S/N</td>
                        <td className={`${td} whitespace-nowrap px-[4px] font-bold`}>
                            SUBJECT
                            <br />
                            CODE
                        </td>
                        <td className={`${td} whitespace-nowrap px-[4px] font-bold`}>UNIT(S)</td>
                        <td className={`${td} whitespace-nowrap px-[3px] font-bold`}>
                            CBT 1
                            <br />
                            20/20
                        </td>
                        <td className={`${td} whitespace-nowrap px-[3px] font-bold`}>
                            CBT 2
                            <br />
                            20/20
                        </td>
                        <td className={`${td} whitespace-nowrap px-[3px]`}>
                            CTotal
                            <br />
                            <b>40/40</b>
                        </td>
                        <td className={`${td} whitespace-nowrap px-[2px] font-bold`}>
                            EXAM
                            <br />
                            60/60
                        </td>
                        <td className={`${td} whitespace-nowrap px-[3px] font-bold`}>
                            Total
                            <br />
                            100/100
                        </td>
                        <td className={`${td} whitespace-nowrap px-[3px]`}>
                            Last
                            <br />
                            Cum.
                            <br />
                            <b>100/100</b>
                        </td>
                        <td className={`${td} whitespace-nowrap px-[3px]`}>
                            Overall
                            <br />
                            Total
                            <br />
                            <b>100A</b>
                        </td>
                        <td className={`${td} whitespace-nowrap px-[4px]`}>T(UNIT)</td>
                    </tr>

                    {subjects.map((s, i) => (
                        <tr key={s.code} className="h-[24.5px] leading-none">
                            <td className={`${td} px-[6px] align-middle`}>{i + 1}</td>
                            <td className={`${td} whitespace-nowrap px-[4px] align-middle`}>{s.code}</td>
                            <td className={`${td} px-[4px] align-middle`}>{s.units}</td>
                            <td className={`${td} px-[3px] align-middle`}>{fmt(s.cbt1)}</td>
                            <td className={`${td} px-[3px] align-middle`}>{fmt(s.cbt2)}</td>
                            <td className={`${td} px-[3px] align-middle`}>{fmt(cTotalOf(s))}</td>
                            <td className={`${td} px-[3px] align-middle`}>{fmt(s.exam)}</td>
                            <td className={`${td} px-[3px] align-middle`}>{fmt(totalOf(s))}</td>
                            <td className={`${td} px-[3px] align-middle`}>{fmt(s.lastCum)}</td>
                            <td className={`${td} px-[3px] align-middle`}>{fmt(s.overall)}</td>
                            <td className={`${td} px-[3px] align-middle`}>{fmt(s.tUnit)}</td>
                        </tr>
                    ))}
                </Tbl>

                {/* TOTAL + grading scale */}
                <Tbl cols={[125, 66, 484]} className="-mt-px text-[13.33px] leading-[19px]">
                    <tr className="h-[47px]">
                        <td className={`${td} pr-[8px] text-right`}>TOTAL</td>
                        <td className={`${td} whitespace-nowrap px-[5px]`}>
                            {totalUnits} ({totalUnits * 5})
                        </td>
                        <td className={`${td} whitespace-nowrap px-[7px]`}>
                            A – 5points, B- 4points, C- 3points, D- 2points, F = 0point
                            <br />
                            (0 – 39): F, (40 – 49): D, (50 – 59): C, (60 – 69): B, (70 – 100): A
                        </td>
                    </tr>
                </Tbl>

                {/* Affective traits */}
                <Tbl cols={[125, 123, 56, 237, 64, 70]} className="-mt-px text-[13.33px] leading-[19px]">
                    <tr className="h-[49px]">
                        <td className={`${td} px-[6px] font-bold`}>
                            AFFECTIVE
                            <br />
                            TRAITS
                        </td>
                        <td className={`${td} whitespace-nowrap px-[4px]`}>PUNTUALITY</td>
                        <td className={`${td} px-[4px]`}>{affective.puntuality}</td>
                        <td className={`${td} whitespace-nowrap px-[4px]`}>RESPECT FOR AUTHORITY</td>
                        <td className={`${td} px-[4px]`}>{affective.respect}</td>
                        <td className={`${td} whitespace-nowrap px-[4px]`}>CGPA: {cgpa}</td>
                    </tr>
                </Tbl>

                {/* Principal's comment */}
                <Tbl cols={[189, 486]} className="-mt-px text-[13.33px] leading-[19px]">
                    <tr className="h-[48px]">
                        <td className={`${td} whitespace-nowrap px-[6px]`}>
                            <div className="font-bold">PRINCIPALS COMMENT:</div>
                            <div>{principalName}</div>
                        </td>
                        <td className={`${td} px-[6px]`}>{principalComment}</td>
                    </tr>
                </Tbl>

                {/* Next term / promotion criteria */}
                <Tbl cols={[123, 316, 236]} className="-mt-px text-[13.33px] leading-[19px]">
                    <tr className="h-[49px]">
                        <td className={`${td} px-[6px]`}>
                            NEXT TERM
                            <br />
                            BEGINS:
                        </td>
                        <td className={`${td} px-[6px]`}>{nextTermBegins}</td>
                        <td className={`${td} whitespace-nowrap px-[4px] pt-[3px] leading-[15px]`}>
                            Criteria for Promotion: Minimum CGPA
                            <br />
                            of 2.5 with a minimum pass grade (D)
                            <br />
                            in English and Mathematics
                        </td>
                    </tr>
                </Tbl>

                {/* ------------------------------------------------------------ */}
                {/* FOOTER                                                        */}
                {/* ------------------------------------------------------------ */}
                <footer
                    className="mt-auto mb-[14px] flex w-[675px] items-center justify-between text-black"
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