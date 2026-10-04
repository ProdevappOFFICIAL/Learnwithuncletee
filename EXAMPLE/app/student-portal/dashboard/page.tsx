"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/hooks/useUser';
import { resultApi } from '@/lib/api/results';
import { subjectApi } from '@/lib/api/subjects';
import { classApi } from '@/lib/api/classes';
import { authApi } from '@/lib/api/auth';
import StudentAuthGuard from '@/components/auth/StudentAuthGuard';
import { Modal } from '@/components/ui/Modal';
import {
    CheckCircle2,
    FileText,
    BarChart3,
    GraduationCap,
    Mail,
    LogOut,
    Calendar,
    Award
} from 'lucide-react';
import { ScaleLoader } from 'react-spinners';
import Image from 'next/image';
import { Result, SubjectScore } from '@/types';

function StudentDashboardContent() {
    const { data: student, isLoading: isLoadingStudent } = useUser();
    const [selectedResult, setSelectedResult] = useState<Result | null>(null);
    const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

    // Fetch student results
    const { data: results = [], isLoading: isLoadingResults } = useQuery({
        queryKey: ['student-results', student?.id],
        queryFn: async () => {
            if (!student?.id) return [];
            const res = await resultApi.list({ userId: student.id, workspaceId: student.workspaceId });
            return res.data || [];
        },
        enabled: !!student?.id,
    });

    // Fetch subjects in workspace to translate IDs
    const { data: subjects = [] } = useQuery({
        queryKey: ['subjects', student?.workspaceId],
        queryFn: async () => {
            if (!student?.workspaceId) return [];
            const res = await subjectApi.list(student.workspaceId);
            return res.data || [];
        },
        enabled: !!student?.workspaceId,
    });

    // Fetch classes to display student class
    const { data: classes = [] } = useQuery({
        queryKey: ['classes', student?.workspaceId],
        queryFn: async () => {
            if (!student?.workspaceId) return [];
            const res = await classApi.list(student.workspaceId);
            return res.data || [];
        },
        enabled: !!student?.workspaceId,
    });

    const handleSelectResult = (result: Result) => {
        setSelectedResult(result);
        setIsMobileModalOpen(true);
    };

    const handleLogout = () => {
        authApi.logout();
    };

    const isLoading = isLoadingStudent || isLoadingResults;
    const activeClassName = classes.find((c) => c.id === student?.classId)?.name || 'Unassigned';

    const renderSubjectScores = (result: Result) => {
        try {
            let scores = result.subjectScores || {};
            if (typeof scores === 'string') {
                scores = JSON.parse(scores) as Record<string, SubjectScore>;
            }

            if (Object.keys(scores).length === 0) {
                return <span className="text-xs text-[#6b6b6b] italic">Analytical data pending</span>;
            }

            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(scores).map(([subId, stats]: [string, any]) => {
                        const subName = subjects.find((s) => s.id === subId)?.name || 'General';
                        const percentage = Math.round((stats.correct / stats.total) * 100);
                        return (
                            <div
                                key={subId}
                                className="bg-zinc-50 p-3 rounded-sm border border-zinc-400/20 space-y-2"
                            >
                                <div className="flex justify-between items-center">
                                    <span className="text-xs  text-[#0e0f10]">{subName}</span>
                                    <span className="text-xs text-[#6b6b6b]">{percentage}%</span>
                                </div>
                                <div className="w-full h-1 bg-zinc-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-500 ${percentage >= 50 ? 'bg-emerald-500' : 'bg-red-500'
                                            }`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                <p className="text-[10px] text-[#6b6b6b]">
                                    {stats.correct} correct of {stats.total} questions
                                </p>
                            </div>
                        );
                    })}
                </div>
            );
        } catch (e) {
            return <span className="text-xs text-red-400">Data parsing error</span>;
        }
    };

    const renderResultDetails = (result: Result) => {
        return (
            <div className="space-y-5 bg-white p-6 rounded-sm border border-zinc-400/20">
                <h2 className="text-sm  text-[#0e0f10] pb-2 border-b border-zinc-400/20 flex items-center gap-2">
                    <Award size={16} className="text-blue-500" />
                    {result.exam?.exam_name || 'Examination Results'}
                </h2>
                {/* Header info - Exact match of Detail Modal in results/page.tsx */}
                <div className="flex items-center gap-6 px-3 py-2.5 bg-zinc-50 rounded-sm border border-zinc-400/20">
                    <div>
                        <p className="text-[10px] text-[#6b6b6b] uppercase tracking-wide mb-0.5">Score</p>
                        <p
                            className={`text-sm  ${result.overallScore >= 50 ? 'text-emerald-600' : 'text-red-500'
                                }`}
                        >
                            {result.overallScore}%
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] text-[#6b6b6b] uppercase tracking-wide mb-0.5">Date</p>
                        <p className="text-xs text-[#0e0f10]">
                            {new Date(result.date).toLocaleDateString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] text-[#6b6b6b] uppercase tracking-wide mb-0.5">Status</p>
                        <span
                            className={`text-[10px]  px-2 py-0.5 rounded-sm ${result.overallScore >= 50 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                                }`}
                        >
                            {result.overallScore >= 50 ? 'Passed' : 'Failed'}
                        </span>
                    </div>
                </div>

                {/* Subject breakdown */}
                <div className="space-y-2">
                    <div className="flex items-center gap-1.5 px-0.5">
                        <CheckCircle2 size={12} className="text-[#6b6b6b]" />
                        <p className="text-xs  text-[#0e0f10]">Subject Breakdown</p>
                    </div>
                    {renderSubjectScores(result)}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#F4F7FF] flex flex-col">
            {/* Navigation Header */}
            <header className="sticky top-0 z-40 bg-white border-b border-zinc-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Image
                            src="https://avatars.githubusercontent.com/u/225484805?s=200&v=4"
                            alt="LearningDeck Logo"
                            width={28}
                            height={28}
                            className="rounded-md"
                        />
                        <span className="text-sm tracking-tight text-gray-800 ">
                            LearningDeck |<span className="text-blue-600 font-normal text-sm"> Student Portal</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        {student && (
                            <div className="hidden md:flex flex-col items-end text-right">
                                <span className="text-xs  text-gray-900 uppercase">
                                    {student.user_name}
                                </span>
                                <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                    <GraduationCap size={10} /> Class: {activeClassName}
                                </span>
                            </div>
                        )}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 border border-red-200 hover:bg-red-50 rounded-sm transition-all active:scale-[0.98]"
                        >
                            <LogOut size={13} />
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Container */}
            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
                {isLoading ? (
                    <div className="flex items-center justify-center py-32">
                        <ScaleLoader barCount={3} color="#a7a7a7ff" height={18} width={4} />
                    </div>
                ) : results.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-sm border border-dashed border-zinc-400/30 flex flex-col items-center max-w-xl mx-auto">
                        <div className="w-16 h-16 bg-zinc-100 rounded-sm flex items-center justify-center mb-6">
                            <BarChart3 size={28} className="text-[#6b6b6b]" />
                        </div>
                        <h3 className="text-sm  text-[#0e0f10] mb-2">No results yet</h3>
                        <p className="text-xs text-[#6b6b6b] max-w-xs mx-auto mb-4 leading-relaxed">
                            Your results and performance breakdown will appear here once you take and submit examinations.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left side list of completed exams */}
                        <div className="lg:col-span-1 space-y-4">
                            <h3 className="text-xs  text-gray-400 uppercase tracking-wider ml-1">
                                Completed Examinations ({results.length})
                            </h3>
                            <div className="space-y-3">
                                {results.map((res) => {
                                    const isSelected = selectedResult?.id === res.id;
                                    return (
                                        <button
                                            key={res.id}
                                            onClick={() => handleSelectResult(res)}
                                            className={`w-full text-left p-4 rounded-sm border transition-all duration-200 flex flex-col gap-2 bg-white ${isSelected
                                                ? 'border-blue-500 ring-1 ring-blue-500 shadow-sm'
                                                : 'border-zinc-200 hover:border-zinc-300'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start gap-2">
                                                <h4 className="text-xs  text-gray-900 line-clamp-2">
                                                    {res.exam?.exam_name || 'Unknown Exam'}
                                                </h4>
                                                <span
                                                    className={`text-[9px]  px-1.5 py-0.5 rounded-sm shrink-0 uppercase ${res.overallScore >= 50
                                                        ? 'bg-emerald-50 text-emerald-600'
                                                        : 'bg-red-50 text-red-500'
                                                        }`}
                                                >
                                                    {res.overallScore >= 50 ? 'Pass' : 'Fail'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] text-gray-500 mt-1">
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={11} /> {new Date(res.date).toLocaleDateString()}
                                                </span>
                                                <span className=" text-gray-700">
                                                    Score: {res.overallScore}%
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right side Detail Panel (Desktop only) */}
                        <div className="hidden lg:block lg:col-span-2">
                            {selectedResult ? (
                                renderResultDetails(selectedResult)
                            ) : (
                                <div className="bg-white p-12 rounded-sm border border-zinc-200 text-center flex flex-col items-center justify-center min-h-[300px]">
                                    <FileText size={32} className="text-blue-500 mb-3 opacity-60" />
                                    <h4 className="text-xs  text-[#0e0f10] mb-1">
                                        Select an Examination
                                    </h4>
                                    <p className="text-[11px] text-gray-500 max-w-xs">
                                        Choose any examination from the left list to see its complete analytical score and subject breakdown.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Mobile Modal View */}
                        {selectedResult && (
                            <div className="lg:hidden">
                                <Modal
                                    isOpen={isMobileModalOpen}
                                    onClose={() => setIsMobileModalOpen(false)}
                                    title="Examination Breakdown"
                                >
                                    <div className="max-h-[80vh] overflow-y-auto pr-1">
                                        {renderResultDetails(selectedResult)}
                                    </div>
                                </Modal>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

export default function StudentDashboardPage() {
    return (
        <StudentAuthGuard>
            <StudentDashboardContent />
        </StudentAuthGuard>
    );
}
