/*
  StudentIDCard — React + Vite + TypeScript + Tailwind

  REQUIRED (one-time): add these fonts to your index.html <head>:

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Lilita+One&family=Open+Sans:wght@500;600;700;800&display=swap"
    rel="stylesheet"
  />
*/

const SANS_FONT = "'Open Sans', ui-sans-serif, system-ui, sans-serif";
const SERIF_FONT = "Georgia, 'Times New Roman', Times, serif";
const DISPLAY_FONT = "'Lilita One', 'Arial Black', Impact, sans-serif";

export interface StudentIDCardProps {
    /** URL / path / data-URI of the school logo (round badge, top-left) */
    schoolLogo: string;
    /** URL / path / data-URI of the student's passport photograph */
    studentImage: string;
    /** Student's surname */
    surname: string;
    /** Student's other names */
    otherNames: string;
    /** Class, e.g. "SENIOR SECONDARY SCHOOL 1" */
    studentClass: string;
    /** Admission number, e.g. "UTSS/25/113" */
    admissionNumber: string;
    /** Text on the vertical green strip. Defaults to "DAY STUDENT" */
    studentType?: string;
    /** Alt text overrides */
    schoolLogoAlt?: string;
    studentImageAlt?: string;
    /** Extra classes for the outer wrapper (e.g. "w-[600px]") */
    className?: string;
}

/* ------------------------------------------------------------------ */
/*  "UNCLE TEE" 3D wordmark (static brand element, drawn in SVG)      */
/* ------------------------------------------------------------------ */

interface Word3DProps {
    text: string;
    x: number;
    y: number;
    fontSize: number;
    length: number;
    fillId: string;
    edge: string;
    side: string;
}

function Word3D({ text, x, y, fontSize, length, fillId, edge, side }: Word3DProps) {
    const common = {
        x,
        y,
        fontSize,
        textLength: length,
        lengthAdjust: "spacingAndGlyphs" as const,
        fontFamily: DISPLAY_FONT,
        strokeLinejoin: "round" as const,
    };

    return (
        <g>
            {/* extrusion / depth */}
            {[6, 5, 4, 3, 2, 1].map((d) => (
                <text
                    key={d}
                    {...common}
                    transform={`translate(0 ${d})`}
                    fill={side}
                    stroke={side}
                    strokeWidth={5}
                >
                    {text}
                </text>
            ))}
            {/* outline */}
            <text {...common} fill={`url(#${fillId})`} stroke={edge} strokeWidth={4}>
                {text}
            </text>
            {/* face */}
            <text {...common} fill={`url(#${fillId})`}>
                {text}
            </text>
        </g>
    );
}

function UncleTeeWordmark({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 215 150"
            className={className}
            aria-label="Uncle Tee"
            role="img"
            overflow="visible"
        >
            <defs>
                <linearGradient id="utt-green" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#62d24b" />
                    <stop offset="0.55" stopColor="#25a331" />
                    <stop offset="1" stopColor="#168a26" />
                </linearGradient>
                <linearGradient id="utt-gold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#fff36b" />
                    <stop offset="0.55" stopColor="#f0cc22" />
                    <stop offset="1" stopColor="#dca313" />
                </linearGradient>
            </defs>

            <Word3D
                text="UNCLE"
                x={8}
                y={73}
                fontSize={94}
                length={199}
                fillId="utt-green"
                edge="#0f6a1e"
                side="#0d5a1a"
            />
            <Word3D
                text="TEE"
                x={38}
                y={136}
                fontSize={86}
                length={130}
                fillId="utt-gold"
                edge="#9a7508"
                side="#a67c0c"
            />
        </svg>
    );
}

/* ------------------------------------------------------------------ */
/*  Card                                                              */
/* ------------------------------------------------------------------ */

export default function StudentIDCard({
    schoolLogo,
    studentImage,
    surname,
    otherNames,
    studentClass,
    admissionNumber,
    studentType = "DAY STUDENT",
    schoolLogoAlt = "School logo",
    studentImageAlt = "Student photograph",
    className = "",
}: StudentIDCardProps) {
    const fields = [
        { label: "Surname:", value: surname, labelTop: "41.4%", valueTop: "47.5%" },
        { label: "Other Names:", value: otherNames, labelTop: "55.3%", valueTop: "61.8%" },
        { label: "Class:", value: studentClass, labelTop: "70.2%", valueTop: "76.4%" },
        {
            label: "Admission Number:",
            value: admissionNumber,
            labelTop: "84.2%",
            valueTop: "91%",
        },
    ];

    return (
        /*
          The outer wrapper is a size container: every dimension inside the card
          is expressed in `cqw` (1% of the card width), so the whole card scales
          perfectly with whatever width you give it.
        */
        <div className={`w-full [container-type:inline-size] ${className}`}>
            <div
                className="relative aspect-[1355/812] w-full overflow-hidden rounded-[3.4cqw] bg-[#a9d921] text-[#0b0b0b] shadow-[0_0.8cqw_1.6cqw_rgba(0,0,0,0.18)]"
                style={{
                    fontFamily: SANS_FONT,
                    backgroundImage:
                        "linear-gradient(100deg, #b0dc22 0%, #a7d820 55%, #a4d61f 100%)",
                }}
            >
                {/* ---------- Yellow contact band ---------- */}
                <div className="absolute inset-x-0 top-[26.7%] h-[12.1%] bg-[#e7f43c]" />

                {/* ---------- Dark green header ---------- */}
                <div className="absolute inset-x-0 top-0 h-[26.8%] bg-[#1d8a2e]" />

                {/* ---------- Right green strip ---------- */}
                <div className="absolute bottom-0 right-0 top-[26.7%] w-[6.1%] bg-[#38a53b]" />

                {/* ---------- Header text ---------- */}
                <h1 className="absolute left-[20.1%] top-[8.9%] -translate-y-1/2 whitespace-nowrap font-bold leading-none text-white text-[length:3.7cqw]">
                    UNCLE TEE SCHOOLS AND COLLEGES LTD.
                </h1>

                <p className="absolute left-[20.1%] top-[16.3%] -translate-y-1/2 whitespace-nowrap font-semibold leading-none text-white text-[length:2.12cqw]">
                    UNCLE TEE SECONDARY SCHOOL ONDO, OLASOJI ICHMON STREET ONDO CITY
                </p>

                <p
                    className="absolute left-[30.8%] top-[23%] -translate-y-1/2 whitespace-nowrap font-bold italic leading-none text-white text-[length:2.5cqw]"
                    style={{ fontFamily: SERIF_FONT }}
                >
                    Motto: Lubricating the wheel of education
                </p>

                {/* ---------- Contact lines ---------- */}
                <div className="absolute left-[18.2%] top-[28.3%] whitespace-nowrap font-medium leading-[2.88cqw] text-[#111] text-[length:2cqw]">
                    <div>Facebook: UNCLE TEE Secondary school || YouTube: LearnWithUncletee</div>
                    <div>Gmail: uncleteesecondaryschoolondo@gmail.com || Tel: 07039131494</div>
                </div>

                {/* ---------- School logo badge ---------- */}
                <div className="absolute left-[2.8%] top-[5.5%] z-10 aspect-square w-[15.6%] rounded-full bg-white shadow-[0_0_0_0.3cqw_#ffffff,0_0.3cqw_0.8cqw_rgba(0,0,0,0.2)]">
                    <div className="absolute inset-0 rounded-full border-[0.4cqw] border-[#e9f33b]" />
                    {schoolLogo ? (
                        <img
                            src={schoolLogo}
                            alt={schoolLogoAlt}
                            className="absolute inset-[0.6cqw] h-[calc(100%-1.2cqw)] w-[calc(100%-1.2cqw)] rounded-full object-contain"
                        />
                    ) : null}
                </div>

                {/* ---------- UNCLE TEE wordmark ---------- */}
                <UncleTeeWordmark className="absolute left-[43.5%] top-[45.8%] w-[15.9%]" />

                {/* ---------- Student details ---------- */}
                {fields.map(({ label, value, labelTop, valueTop }) => (
                    <div key={label}>
                        <span
                            className="absolute left-[3.6%] -translate-y-1/2 whitespace-nowrap font-medium leading-none text-[length:2.44cqw]"
                            style={{ top: labelTop }}
                        >
                            {label}
                        </span>
                        <span
                            className="absolute left-[3.6%] max-w-[58%] -translate-y-1/2 truncate font-extrabold leading-none text-[length:3.76cqw]"
                            style={{ top: valueTop }}
                        >
                            {value}
                        </span>
                    </div>
                ))}

                {/* ---------- Student photo ---------- */}
                <div className="absolute left-[62.4%] top-[39.9%] h-[58%] w-[30.4%] bg-white p-[0.35cqw] shadow-[0_0.2cqw_0.6cqw_rgba(0,0,0,0.25)]">
                    <div className="h-full w-full overflow-hidden bg-[#e8ebf3]">
                        {studentImage ? (
                            <img
                                src={studentImage}
                                alt={studentImageAlt}
                                className="h-full w-full object-cover object-top"
                            />
                        ) : null}
                    </div>
                </div>

                {/* ---------- Vertical strip label ---------- */}
                <span className="absolute left-[96.8%] top-[64.9%] -translate-x-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap font-extrabold uppercase leading-none text-[#0b0b0b] text-[length:4.2cqw]">
                    {studentType}
                </span>

                {/* ---------- Card edge (silver rim + faint gloss) ---------- */}
                <div className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] shadow-[inset_0_0_0_0.3cqw_rgba(205,211,214,0.95),inset_0_-0.25cqw_0.5cqw_rgba(255,255,255,0.7)]" />
            </div>
        </div>
    );
}