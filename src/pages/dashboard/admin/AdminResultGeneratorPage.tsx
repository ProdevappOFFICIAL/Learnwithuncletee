import { useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard/DashboardUI";
import ReportCard, {
    REPORT_CARD_VARIANTS,
    type ReportCardVariant,
    type ReportCardVariantPreset,
    type ReportSubject,
} from "@/components/ui/ReportCard";

interface DemoStudent {
    studentName: string;
    admissionNumber: string;
    className: string;
    present: number;
    absent: number;
    totalSchoolDays: number;
    affective: { puntuality: string; respect: string };
    psychomotor: { handwriting: string; recreation: string };
    classTeacherRemark: string;
    principalComment: string;
    newsLetter: string;
}

const DEMO_STUDENTS: Record<ReportCardVariant, DemoStudent> = {
    junior: {
        studentName: "Chiamaka Okafor",
        admissionNumber: "UTSS/J/024",
        className: "JSS 2A",
        present: 118,
        absent: 2,
        totalSchoolDays: 120,
        affective: { puntuality: "Excellent", respect: "Very good" },
        psychomotor: { handwriting: "Good", recreation: "Excellent" },
        classTeacherRemark: "A diligent pupil with steady improvement. Keep up the good work.",
        principalComment: "An impressive result. Keep aiming higher.",
        newsLetter:
            "Resumption for next term is Monday, 11 January 2027. Please complete all outstanding fees before resumption.",
    },
    "senior-science": {
        studentName: "Daniel Adeyemi",
        admissionNumber: "UTSS/S/118",
        className: "SSS 2 Science",
        present: 116,
        absent: 4,
        totalSchoolDays: 120,
        affective: { puntuality: "Excellent", respect: "Excellent" },
        psychomotor: { handwriting: "Very good", recreation: "Good" },
        classTeacherRemark: "Excellent analytical skills. Revise more before the next examination.",
        principalComment: "A strong science result. Stay focused and consistent.",
        newsLetter:
            "Resumption for next term is Monday, 11 January 2027. Please complete all outstanding fees before resumption.",
    },
    "senior-commerce": {
        studentName: "Blessing Eze",
        admissionNumber: "UTSS/S/131",
        className: "SSS 2 Commercial",
        present: 119,
        absent: 1,
        totalSchoolDays: 120,
        affective: { puntuality: "Very good", respect: "Very good" },
        psychomotor: { handwriting: "Good", recreation: "Very good" },
        classTeacherRemark: "Strong in accounting and commerce. Aim for distinction next term.",
        principalComment: "A commendable result with room to grow in mathematics.",
        newsLetter:
            "Resumption for next term is Monday, 11 January 2027. Please complete all outstanding fees before resumption.",
    },
    "senior-art": {
        studentName: "Tobi Balogun",
        admissionNumber: "UTSS/S/142",
        className: "SSS 2 Art",
        present: 115,
        absent: 5,
        totalSchoolDays: 120,
        affective: { puntuality: "Good", respect: "Very good" },
        psychomotor: { handwriting: "Very good", recreation: "Excellent" },
        classTeacherRemark: "Creative and expressive. Improve consistency in mathematics.",
        principalComment: "A promising result. Keep developing your creative strengths.",
        newsLetter:
            "Resumption for next term is Monday, 11 January 2027. Please complete all outstanding fees before resumption.",
    },
};

const DEMO_SEEDS: Record<ReportCardVariant, number> = {
    junior: 3,
    "senior-science": 5,
    "senior-commerce": 7,
    "senior-art": 9,
};

/** Deterministic sample scores so every variant preview looks populated. */
const withDemoScores = (subjects: ReportSubject[], seed: number): ReportSubject[] =>
    subjects.map((subject, index) => {
        const cbt1 = 14 + ((seed + index * 3) % 7);
        const cbt2 = 14 + ((seed + index * 5) % 7);
        const exam = 40 + ((seed + index * 7) % 21);
        const total = cbt1 + cbt2 + exam;
        const lastCum = Math.min(99, Math.max(50, total - 5 + ((seed + index) % 8)));
        return {
            ...subject,
            cbt1,
            cbt2,
            exam,
            lastCum,
            overall: Math.round((total + lastCum) / 2),
        };
    });

export default function AdminResultGeneratorPage() {
    const [variant, setVariant] = useState<ReportCardVariant>("junior");
    const [showAll, setShowAll] = useState(false);
    const preset =
        REPORT_CARD_VARIANTS.find((item) => item.id === variant) ?? REPORT_CARD_VARIANTS[0];
    const student = DEMO_STUDENTS[variant];
    const subjects = useMemo(
        () => withDemoScores(preset.subjects, DEMO_SEEDS[variant]),
        [preset, variant],
    );

    const renderPreview = (
        item: ReportCardVariantPreset,
        demo: DemoStudent,
        demoSubjects: ReportSubject[],
    ) => (
        <div key={item.id} className="border border-line bg-cream">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white px-4 py-3">
                <div>
                    <p className="font-display text-sm font-extrabold text-ink">{item.label}</p>
                    <p className="mt-0.5 text-xs text-muted">
                        {item.sectionTitle} - {item.subjects.length} subjects - sample scores
                    </p>
                </div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted">Preview only</p>
            </div>
            <div className="overflow-x-auto p-4 md:p-6">
                <ReportCard
                    variant={item.id}
                    term="FIRST"
                    session="2026/2027"
                    {...demo}
                    subjects={demoSubjects}
                />
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Reports"
                title="Result Generator"
                text="Preview the four result-notification sheets used by the school: Junior, Senior Science, Senior Commercial and Senior Art."
            />

            <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
                <div className="flex flex-wrap gap-2" role="group" aria-label="Report card variants">
                    {REPORT_CARD_VARIANTS.map((item) => {
                        const active = item.id === variant;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                    setVariant(item.id);
                                    setShowAll(false);
                                }}
                                aria-pressed={active}
                                className={`min-h-11 rounded border px-4 py-2 text-left text-sm transition-colors ${
                                    active
                                        ? "border-brand-500 bg-brand-50 text-brand-900"
                                        : "border-line bg-white text-muted hover:border-brand-300 hover:text-ink"
                                }`}
                            >
                                <span className="block font-bold">{item.label}</span>
                                <span className="mt-0.5 block text-xs opacity-70">
                                    {item.subjects.length} subjects
                                </span>
                            </button>
                        );
                    })}
                </div>
                <button
                    type="button"
                    onClick={() => setShowAll((value) => !value)}
                    aria-pressed={showAll}
                    className={`min-h-11 rounded border px-4 text-sm font-bold transition-colors ${
                        showAll
                            ? "border-brand-500 bg-brand-50 text-brand-900"
                            : "border-line bg-white text-muted hover:border-brand-300 hover:text-ink"
                    }`}
                >
                    {showAll ? "Show one at a time" : "Show all four"}
                </button>
            </div>

            {showAll ? (
                <div className="space-y-8">
                    {REPORT_CARD_VARIANTS.map((item) =>
                        renderPreview(
                            item,
                            DEMO_STUDENTS[item.id],
                            withDemoScores(item.subjects, DEMO_SEEDS[item.id]),
                        ),
                    )}
                </div>
            ) : (
                renderPreview(preset, student, subjects)
            )}
        </div>
    );
}
