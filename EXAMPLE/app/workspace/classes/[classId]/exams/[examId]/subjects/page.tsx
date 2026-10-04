"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import {
    BookOpen,
    Plus,
    Search,
    Filter,
    Check,
    Layers,
    Hash,
    MessageSquare,
} from 'lucide-react';
import { MdArrowBack, MdOutlineDeleteOutline, MdOutlineModeEditOutline } from 'react-icons/md';
import { subjectApi } from '@/lib/api/subjects';
import { examApi } from '@/lib/api/exams';
import { classApi } from '@/lib/api/classes';
import { questionApi } from '@/lib/api/questions';
import { Subject, Class, Exam, Question } from '@/types';
import { ScaleLoader } from 'react-spinners';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSidebar } from '@/context/SidebarContext';
import { useUser } from '@/hooks/useUser';

type SubjectWithStatus = Subject & { status?: 'saving' | 'saved' | 'failed' | 'deleting' | 'done' };

interface ExamSubjectsPageProps {
    params: Promise<{
        classId: string;
        examId: string;
    }>;
}

export default function ExamSubjectsPage({ params }: ExamSubjectsPageProps) {
    const { classId, examId } = React.use(params);
    const router = useRouter();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [deleteProgress, setDeleteProgress] = useState<{ current: number; total: number } | null>(null);

    const { data: user } = useUser();
    const workspaceId = user?.workspaceId;

    // Fetch the Exam
    const { data: exam, isLoading: isLoadingExam } = useQuery<any>({
        queryKey: ['exam', examId],
        queryFn: async () => {
            if (!examId) return null;
            const res = await examApi.getById(examId);
            return res.data;
        },
        enabled: !!examId,
    });

    // Fetch all Subjects
    const { data: subjects = [], isLoading: isLoadingSubjects } = useQuery({
        queryKey: ['subjects', workspaceId],
        queryFn: async () => {
            if (!workspaceId) return [];
            const res = await subjectApi.list(workspaceId);
            return (res.data || []) as SubjectWithStatus[];
        },
        enabled: !!workspaceId,
    });

    // Fetch all Questions for this exam
    const { data: examQuestions = [], isLoading: isLoadingQuestions } = useQuery({
        queryKey: ['questions', 'exam', examId],
        queryFn: async () => {
            if (!examId) return [];
            const res = await questionApi.list({ examId, limit: 1000 });
            return (res.data || []) as Question[];
        },
        enabled: !!examId,
    });

    const questionCountsBySubject = useMemo(() => {
        const counts: Record<string, number> = {};
        examQuestions.forEach(q => {
            if (q.subjectId) {
                counts[q.subjectId] = (counts[q.subjectId] || 0) + 1;
            }
        });
        return counts;
    }, [examQuestions]);

    const isLoading = isLoadingExam || isLoadingSubjects || isLoadingQuestions;

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
    const [formData, setFormData] = useState<{
        name: string;
        code: string;
        description: string;
    }>({
        name: '',
        code: '',
        description: '',
    });

    // Filter subjects to only show those connected to the class context
    const filteredSubjects = useMemo(() => {
        if (!exam) return [];
        return subjects.filter(
            (s) => {
                const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (s.code && s.code.toLowerCase().includes(searchTerm.toLowerCase()));

                // Match with classId
                const matchesClass = s.classes?.some((c) => c.id === classId);
                return matchesSearch && matchesClass;
            }
        );
    }, [subjects, searchTerm, exam, classId]);

    const handleOpenModal = (subject: Subject | null = null) => {
        if (subject) {
            setEditingSubject(subject);
            setFormData({
                name: subject.name,
                code: subject.code || '',
                description: subject.description || '',
            });
        } else {
            setEditingSubject(null);
            setFormData({ name: '', code: '', description: '' });
        }
        setIsModalOpen(true);
    };

    const createSubjectMutation = useMutation({
        mutationFn: (payload: any) => subjectApi.create(payload),
        onMutate: async (newSubject) => {
            await queryClient.cancelQueries({ queryKey: ['subjects'] });
            const previousSubjects = queryClient.getQueryData<SubjectWithStatus[]>(['subjects']);
            const tempId = Math.random().toString(36).substring(7);
            queryClient.setQueryData(['subjects'], (old: SubjectWithStatus[] = []) => [
                { ...newSubject, id: tempId, status: 'saving' } as SubjectWithStatus,
                ...old,
            ]);
            return { previousSubjects, tempId };
        },
        onError: (err, newSubject, context) => {
            queryClient.setQueryData(['subjects'], context?.previousSubjects);
            alert('Failed to create subject');
        },
        onSuccess: (data, newSubject, context) => {
            queryClient.setQueryData(['subjects'], (old: SubjectWithStatus[] = []) =>
                old.map((s) =>
                    s.id === context?.tempId ? { ...data.data, status: 'saved' } : s
                )
            );
            setTimeout(() => {
                queryClient.setQueryData(['subjects'], (old: SubjectWithStatus[] = []) =>
                    old.map((s) => (s.id === data?.data?.id ? { ...s, status: undefined } : s))
                );
            }, 3000);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['subjects'] });
        },
    });

    const updateSubjectMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: any }) => subjectApi.update(id, payload),
        onMutate: async ({ id, payload }) => {
            await queryClient.cancelQueries({ queryKey: ['subjects'] });
            const previousSubjects = queryClient.getQueryData<SubjectWithStatus[]>(['subjects']);
            queryClient.setQueryData(['subjects'], (old: SubjectWithStatus[] = []) =>
                old.map((s) => (s.id === id ? { ...s, ...payload, status: 'saving' } : s))
            );
            return { previousSubjects };
        },
        onError: (err, { id }, context) => {
            queryClient.setQueryData(['subjects'], context?.previousSubjects);
            alert('Failed to update subject');
        },
        onSuccess: (data, { id }) => {
            queryClient.setQueryData(['subjects'], (old: SubjectWithStatus[] = []) =>
                old.map((s) => (s.id === id ? { ...s, status: 'saved' } : s))
            );
            setTimeout(() => {
                queryClient.setQueryData(['subjects'], (old: SubjectWithStatus[] = []) =>
                    old.map((s) => (s.id === id ? { ...s, status: undefined } : s))
                );
            }, 3000);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['subjects'] });
        },
    });

    const deleteSubjectMutation = useMutation({
        mutationFn: (id: string) => subjectApi.delete(id),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ['subjects'] });
            const previousSubjects = queryClient.getQueryData<SubjectWithStatus[]>(['subjects']);
            queryClient.setQueryData(['subjects'], (old: SubjectWithStatus[] = []) =>
                old.map((s) => (s.id === id ? { ...s, status: 'deleting' } : s))
            );
            return { previousSubjects };
        },
        onSuccess: (data, id) => {
            queryClient.setQueryData(['subjects'], (old: SubjectWithStatus[] = []) =>
                old.map((s) => (s.id === id ? { ...s, status: 'done' } : s))
            );
            setTimeout(() => {
                queryClient.setQueryData(['subjects'], (old: SubjectWithStatus[] = []) =>
                    old.filter((s) => s.id !== id)
                );
            }, 1000);
        },
        onError: (err, id, context) => {
            queryClient.setQueryData(['subjects'], context?.previousSubjects);
            alert('Failed to delete subject');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['subjects'] });
        },
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!workspaceId || !exam) {
            alert('Workspace or Exam not found');
            return;
        }

        // Automatically connect new/edited subject to this Class context
        const payload = {
            ...formData,
            workspaceId,
            classIds: [classId]
        };

        if (editingSubject) {
            updateSubjectMutation.mutate({ id: editingSubject.id, payload });
        } else {
            createSubjectMutation.mutate(payload);
        }
        setIsModalOpen(false);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this subject?')) return;
        deleteSubjectMutation.mutate(id);
    };

    const handleBulkDelete = async () => {
        if (selectedSubjects.length === 0) return;
        if (!window.confirm(`Delete ${selectedSubjects.length} subjects?`)) return;
        const idsToDelete = [...selectedSubjects];
        setDeleteProgress({ current: 0, total: idsToDelete.length });

        for (let i = 0; i < idsToDelete.length; i++) {
            const id = idsToDelete[i];
            try {
                await deleteSubjectMutation.mutateAsync(id);
                setDeleteProgress(prev => prev ? { ...prev, current: i + 1 } : null);
            } catch (err) {
                console.error(`Failed to delete ${id}`, err);
            }
        }

        setTimeout(() => setDeleteProgress(null), 2000);
        setSelectedSubjects([]);
    };

    const { isLeftSidebarCollapsed } = useSidebar();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 relative">
            {deleteProgress && (
                <div className="sticky top-0 z-50 bg-white border-b border-red-100 p-2 mb-4 animate-in slide-in-from-top duration-300">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Deleting Subjects...</span>
                        <span className="text-[10px] font-bold text-red-600">{deleteProgress.current} / {deleteProgress.total}</span>
                    </div>
                    <div className="w-full h-1 bg-red-50 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-red-500 transition-all duration-300 ease-out"
                            style={{ width: `${(deleteProgress.current / deleteProgress.total) * 100}%` }}
                        />
                    </div>
                </div>
            )}
            {/* Back to Exams breadcrumb */}
            <button
                onClick={() => router.push(`/workspace/classes/${classId}/exams`)}
                className="flex items-center gap-1.5 m-4 text-xs text-[#6b6b6b] hover:text-[#0e0f10] transition-colors mb-1 active:scale-95"
            >
                <MdArrowBack size={14} /> Back to Exams
            </button>
            <div className={`${isLeftSidebarCollapsed ? 'sticky z-50' : ''} flex bg-[#f9f9f9] top-0 h-full w-full border-b border-[#ededed]`}>
                <DashboardHeader
                    title={`Subjects under ${exam?.exam_name || '...'}`}
                    description={`Class: ${exam?.class?.name || 'Loading class...'} • Select a subject below to manage its questions.`}
                >
                    <div className="flex items-center gap-2">
                        {selectedSubjects.length > 0 && (
                            <button
                                onClick={handleBulkDelete}
                                className="flex items-center gap-2 px-3 py-1 text-xs font-medium text-red-500 bg-red-50 rounded-sm hover:bg-red-100 transition-all border border-red-200"
                            >
                                <MdOutlineDeleteOutline size={14} />
                                Delete ({selectedSubjects.length})
                            </button>
                        )}
                        <button
                            onClick={() => handleOpenModal()}
                            className="flex items-center gap-2 px-3 py-1 text-xs font-medium bg-blue-500 text-white rounded-sm hover:bg-zinc-700 transition-all active:scale-[0.98]"
                        >
                            <Plus size={14} />
                            Add Subject
                        </button>
                    </div>
                </DashboardHeader>
            </div>
            {/* ── Filter Section ── */}
            <div className="bg-white p-4 border-y border-zinc-400/20 space-y-4">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2 text-[#6b6b6b]">
                        <Filter size={13} />
                        <span className="text-xs font-medium text-[#0e0f10]">Filter</span>
                    </div>
                    <button
                        onClick={() => setSearchTerm('')}
                        className="text-xs text-[#6b6b6b] hover:text-[#0e0f10] transition-colors"
                    >
                        Reset
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-3 relative">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b6b]"
                            size={13}
                        />
                        <input
                            type="text"
                            placeholder="Search by subject name or catalog code..."
                            className="w-full pl-8 pr-3 py-1 text-xs rounded-sm bg-zinc-50 border border-zinc-400/20 focus:border-zinc-400/60 focus:bg-white text-[#0e0f10] outline-none transition-all placeholder:text-[#6b6b6b]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['subjects'] })}
                        className="px-3 py-1 text-xs rounded-sm bg-zinc-100 text-[#0e0f10] hover:bg-zinc-200 transition-colors border border-zinc-400/20"
                    >
                        Apply
                    </button>
                </div>
            </div>
            {/* ── Subject List ── */}

            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 370px)' }}>
                <div className="grid grid-cols-1 gap-3">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <ScaleLoader barCount={3} color="#a7a7a7ff" height={18} width={4} />
                        </div>
                    ) : filteredSubjects.length > 0 ? (
                        filteredSubjects.map((subject) => (
                            <div
                                key={subject.id}
                                className="group border-y border-zinc-400/20 bg-white overflow-hidden hover:bg-zinc-300/10 transition-all duration-200"
                            >
                                <div className="px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
                                    {/* Subject info */}
                                    <div
                                        className="flex items-center gap-4 flex-1 w-full cursor-pointer"
                                        onClick={() => router.push(`/workspace/questions?examId=${examId}&subjectId=${subject.id}&classId=${classId}`)}
                                    >
                                        <div className="space-y-1">
                                            <h3 className="text-sm font-medium text-[#0e0f10] tracking-tight flex items-center gap-2 hover:text-blue-500 transition-colors">
                                                {subject.name}
                                                {subject.status && (
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-sm uppercase font-bold animate-pulse ${subject.status === 'saving' ? 'bg-amber-100 text-amber-700' :
                                                        subject.status === 'saved' ? 'bg-emerald-100 text-emerald-700' :
                                                            subject.status === 'deleting' ? 'bg-red-100 text-red-700' :
                                                                subject.status === 'done' ? 'bg-zinc-100 text-zinc-700' :
                                                                    'bg-red-100 text-red-700'
                                                        }`}>
                                                        {subject.status}
                                                    </span>
                                                )}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-[#6b6b6b]">
                                                <span className="flex items-center gap-1.5 bg-zinc-300/20 px-2 py-0.5 rounded-sm text-[#0e0f10] font-mono text-[10px]">
                                                    {subject.code || 'UNCODED'}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Layers size={11} /> Questions: {questionCountsBySubject[subject.id] || 0}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Actions */}
                                    <div className="flex items-center gap-1 w-full md:w-auto border-t md:border-t-0 md:border-l border-zinc-400/20 pt-3 md:pt-0 md:pl-6">
                                        <button
                                            onClick={() => handleOpenModal(subject)}
                                            className="px-2 py-1 text-xs text-[#6b6b6b] hover:bg-zinc-300/20 hover:text-[#0e0f10] rounded-sm transition-all"
                                            title="Edit"
                                        >
                                            <MdOutlineModeEditOutline size={15} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(subject.id)}
                                            className="px-2 py-1 text-xs text-[#6b6b6b] hover:bg-red-50 hover:text-red-500 rounded-sm transition-all"
                                            title="Delete"
                                        >
                                            <MdOutlineDeleteOutline size={15} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        /* ── Empty state ── */
                        <div className="text-center py-20 bg-white rounded-sm border border-dashed border-zinc-400/30 flex flex-col items-center">
                            <div className="w-16 h-16 bg-zinc-100 rounded-sm flex items-center justify-center mb-6">
                                <Layers size={28} className="text-[#6b6b6b]" />
                            </div>
                            <h3 className="text-sm font-medium text-[#0e0f10] mb-2">No subjects under this exam yet</h3>
                            <p className="text-xs text-[#6b6b6b] max-w-xs mx-auto mb-8 leading-relaxed">
                                Add subject units that are assessed under this exam's class unit.
                            </p>
                            <button
                                onClick={() => handleOpenModal()}
                                className="px-4 py-1.5 text-xs font-medium bg-blue-500 text-white rounded-sm hover:bg-zinc-700 transition-all"
                            >
                                Add First Subject
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {/* ── Modal ── */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingSubject ? 'Edit Subject' : 'New Subject'}
            >
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-3">
                        {/* Subject name */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[#0e0f10] ml-0.5 flex items-center gap-1">
                                <BookOpen size={11} className="text-[#6b6b6b]" /> Subject Name
                            </label>
                            <Input
                                placeholder="e.g. APPLIED PHYSICS"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                                required
                                className="text-xs rounded-sm bg-zinc-50 border border-zinc-400/20 focus:border-zinc-400/60 text-[#0e0f10] placeholder:text-[#6b6b6b]"
                            />
                        </div>
                        {/* Code */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[#0e0f10] ml-0.5 flex items-center gap-1">
                                <Hash size={11} className="text-[#6b6b6b]" /> Catalog Code
                            </label>
                            <Input
                                placeholder="e.g. PHY-202"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                className="text-xs rounded-sm bg-zinc-50 border border-zinc-400/20 focus:border-zinc-400/60 text-[#0e0f10] placeholder:text-[#6b6b6b] font-mono"
                            />
                        </div>
                    </div>
                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-[#0e0f10] ml-0.5 flex items-center gap-1">
                            <MessageSquare size={11} className="text-[#6b6b6b]" /> Description
                        </label>
                        <textarea
                            className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-400/20 focus:border-zinc-400/60 rounded-sm text-[#0e0f10] outline-none transition-all min-h-[72px] placeholder:text-[#6b6b6b] resize-none"
                            placeholder="Outline the core learning objectives and scope..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    {/* Locked Assignment Notice */}
                    <div className="text-[11px] p-2.5 bg-blue-50/50 border border-blue-200 text-blue-700 rounded-sm leading-relaxed">
                        <strong>Note:</strong> This subject will be automatically assigned and linked to the Exam's class (<strong>{exam?.class?.name || '...'}</strong>) to prevent human mapping errors.
                    </div>
                    {/* Footer buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 py-1.5 text-xs text-[#6b6b6b] hover:bg-zinc-100 rounded-sm transition-all border border-zinc-400/20"
                        >
                            Cancel
                        </button>
                        <Button
                            type="submit"
                            className="flex-1 py-1.5 text-xs rounded-sm bg-blue-500 text-white hover:bg-zinc-700 transition-all"
                            isLoading={createSubjectMutation.isPending || updateSubjectMutation.isPending}
                        >
                            {editingSubject ? (
                                <span className="flex items-center justify-center gap-1.5"><Check size={13} /> Save Changes</span>
                            ) : (
                                <span className="flex items-center justify-center gap-1.5"><Plus size={13} /> Create Subject</span>
                            )}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
