"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import {
  FileText,
  Plus,
  Clock,
  GraduationCap,
  Layers,
  Search,
  Filter,
  Check,
  ChevronDown,
} from 'lucide-react';
import { MdArrowBack, MdOutlineControlPointDuplicate, MdOutlineDeleteOutline, MdOutlineModeEditOutline, MdOutlineCloudUpload } from 'react-icons/md';
import { examApi } from '@/lib/api/exams';
import { classApi } from '@/lib/api/classes';
import { questionApi } from '@/lib/api/questions';
import { subjectApi } from '@/lib/api/subjects';
import { userApi } from '@/lib/api/users';
import { resultApi } from '@/lib/api/results';
import { questionBankApi } from '@/lib/api/questionBank';
import { ExportConfirmModal } from '@/components/ui/ExportConfirmModal';
import { Exam, Class, Subject } from '@/types';
import { ScaleLoader } from 'react-spinners';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspaceUsage } from '@/hooks/useWorkspaceUsage';
import { useSidebar } from '@/context/SidebarContext';
import { useUser } from '@/hooks/useUser';
type ExamWithStatus = Exam & { status?: 'saving' | 'saved' | 'failed' | 'deleting' | 'done' };
interface ClassExamsPageProps {
  params: Promise<{
    classId: string;
  }>;
}
export default function ClassExamsPage({ params }: ClassExamsPageProps) {
  const { classId } = React.use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteProgress, setDeleteProgress] = useState<{ current: number; total: number } | null>(null);
  const { data: user } = useUser();
  const workspaceId = user?.workspaceId;
  const { data: usageData } = useWorkspaceUsage();
  const isExamLimitReached = usageData ? usageData.usage.exams >= usageData.limits.exams : false;
  // Fetch Class details
  const { data: currentClass } = useQuery<Class | null>({
    queryKey: ['class', classId, workspaceId],
    queryFn: async () => {
      if (!workspaceId || !classId) return null;
      const res = await classApi.list(workspaceId);
      return res.data?.find(c => c.id === classId) || null;
    },
    enabled: !!workspaceId && !!classId,
  });
  // Fetch Exams under this specific Class
  const { data: exams = [], isLoading: isLoadingExams } = useQuery({
    queryKey: ['exams', workspaceId, classId],
    queryFn: async () => {
      if (!workspaceId || !classId) return [];
      const res = await examApi.list({ workspaceId, classId });
      return (res.data || []) as ExamWithStatus[];
    },
    enabled: !!workspaceId && !!classId,
  });
  const { data: questions = [] } = useQuery({
    queryKey: ['questions'],
    queryFn: async () => {
      const res = await questionApi.list();
      return res.data || [];
    },
  });
  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const res = await subjectApi.list();
      return res.data || [];
    },
  });
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await userApi.list();
      return res.data || [];
    },
  });
  const { data: results = [] } = useQuery({
    queryKey: ['results'],
    queryFn: async () => {
      const res = await resultApi.list();
      return res.data || [];
    },
  });
  const isLoading = isLoadingExams;
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [formData, setFormData] = useState({
    exam_name: '',
    minutes: 60,
    visible: true
  });
  const filteredExams = useMemo(() => {
    return exams.filter(exam => {
      return exam.exam_name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [exams, searchTerm]);
  const handleOpenModal = (exam: Exam | null = null) => {
    if (exam) {
      setEditingExam(exam);
      setFormData({
        exam_name: exam.exam_name,
        minutes: exam.minutes,
        visible: exam.visible ?? true
      });
    } else {
      setEditingExam(null);
      setFormData({
        exam_name: '',
        minutes: 60,
        visible: true
      });
    }
    setIsModalOpen(true);
  };
  const createExamMutation = useMutation({
    mutationFn: (payload: any) => examApi.create(payload),
    onMutate: async (newExam) => {
      await queryClient.cancelQueries({ queryKey: ['exams', workspaceId, classId] });
      const previousExams = queryClient.getQueryData<ExamWithStatus[]>(['exams', workspaceId, classId]);
      const tempId = Math.random().toString(36).substring(7);
      queryClient.setQueryData(['exams', workspaceId, classId], (old: ExamWithStatus[] = []) => [
        { ...newExam, id: tempId, status: 'saving' } as ExamWithStatus,
        ...old,
      ]);
      return { previousExams, tempId };
    },
    onError: (err, newExam, context) => {
      queryClient.setQueryData(['exams', workspaceId, classId], context?.previousExams);
      alert('Failed to create exam');
    },
    onSuccess: (data, newExam, context) => {
      queryClient.setQueryData(['exams', workspaceId, classId], (old: ExamWithStatus[] = []) =>
        old.map((exam) =>
          exam.id === context?.tempId ? { ...data.data, status: 'saved' } : exam
        )
      );
      setTimeout(() => {
        queryClient.setQueryData(['exams', workspaceId, classId], (old: ExamWithStatus[] = []) =>
          old.map((exam) => (exam.id === data?.data?.id ? { ...exam, status: undefined } : exam))
        );
      }, 3000);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['exams', workspaceId, classId] });
    },
  });
  const updateExamMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => examApi.update(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['exams', workspaceId, classId] });
      const previousExams = queryClient.getQueryData<ExamWithStatus[]>(['exams', workspaceId, classId]);
      queryClient.setQueryData(['exams', workspaceId, classId], (old: ExamWithStatus[] = []) =>
        old.map((exam) => (exam.id === id ? { ...exam, ...payload, status: 'saving' } : exam))
      );
      return { previousExams };
    },
    onError: (err, { id }, context) => {
      queryClient.setQueryData(['exams', workspaceId, classId], context?.previousExams);
      alert('Failed to update exam');
    },
    onSuccess: (data, { id }) => {
      queryClient.setQueryData(['exams', workspaceId, classId], (old: ExamWithStatus[] = []) =>
        old.map((exam) => (exam.id === id ? { ...exam, status: 'saved' } : exam))
      );
      setTimeout(() => {
        queryClient.setQueryData(['exams', workspaceId, classId], (old: ExamWithStatus[] = []) =>
          old.map((exam) => (exam.id === id ? { ...exam, status: undefined } : exam))
        );
      }, 3000);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['exams', workspaceId, classId] });
    },
  });
  const deleteExamMutation = useMutation({
    mutationFn: (id: string) => examApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['exams', workspaceId, classId] });
      const previousExams = queryClient.getQueryData<ExamWithStatus[]>(['exams', workspaceId, classId]);
      queryClient.setQueryData(['exams', workspaceId, classId], (old: ExamWithStatus[] = []) =>
        old.map((exam) => (exam.id === id ? { ...exam, status: 'deleting' } : exam))
      );
      return { previousExams };
    },
    onSuccess: (data, id) => {
      queryClient.setQueryData(['exams', workspaceId, classId], (old: ExamWithStatus[] = []) =>
        old.map((exam) => (exam.id === id ? { ...exam, status: 'done' } : exam))
      );
      setTimeout(() => {
        queryClient.setQueryData(['exams', workspaceId, classId], (old: ExamWithStatus[] = []) =>
          old.filter((exam) => exam.id !== id)
        );
      }, 1000);
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(['exams', workspaceId, classId], context?.previousExams);
      alert('Failed to delete exam');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['exams', workspaceId, classId] });
    },
  });
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this exam?')) return;
    deleteExamMutation.mutate(id);
  };
  const [exportingExam, setExportingExam] = useState<Exam | null>(null);
  const exportQuestionsMutation = useMutation({
    mutationFn: (data: { examId: string; deleteOriginal: boolean }) => questionBankApi.exportFromExam(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams', workspaceId, classId] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      setExportingExam(null);
    },
    onError: (err: any) => alert(err.message || 'Failed to export questions to the bank'),
  });
  const handleDuplicate = async (exam: Exam) => {
    const payload = {
      exam_name: `${exam.exam_name} (Copy)`,
      minutes: exam.minutes,
      classId,
      workspaceId: exam.workspaceId
    };
    createExamMutation.mutate(payload);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;
    const payload = {
      ...formData,
      workspaceId,
      classId, // Automatically bound to this class context!
      minutes: Number(formData.minutes)
    };
    if (editingExam) {
      updateExamMutation.mutate({ id: editingExam.id, payload });
    } else {
      createExamMutation.mutate(payload);
    }
    setIsModalOpen(false);
  };
  const { isLeftSidebarCollapsed } = useSidebar();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 relative">
      {/* Back button */}
      <button
        onClick={() => router.push('/workspace')}
        className="flex items-center gap-1.5 m-4 text-xs text-[#6b6b6b] hover:text-[#0e0f10] transition-colors mb-1 active:scale-95"
      >
        <MdArrowBack size={14} /> Back to Classes
      </button>
      <div className={`${isLeftSidebarCollapsed ? 'sticky z-50' : ''} flex bg-[#f9f9f9] top-0 h-full w-full border-b border-[#ededed]`}>
        <DashboardHeader
          title={`Exams under ${currentClass?.name || '...'}`}
          description={`Class Group Context Locked. Manage assessment papers specifically for this group.`}
        >
          <button
            onClick={() => handleOpenModal()}
            disabled={isExamLimitReached}
            className={`flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-sm transition-all active:scale-[0.98] ${isExamLimitReached
              ? "bg-zinc-200 text-zinc-400 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-zinc-700"
              }`}
            title={isExamLimitReached ? "Exam limit reached for your plan" : "Create New Exam"}
          >
            <Plus size={14} />
            Create Exam
          </button>
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b6b]" size={13} />
            <input
              type="text"
              placeholder="Search exams under this class..."
              className="w-full pl-8 pr-3 py-1 text-xs rounded-sm bg-zinc-50 border border-zinc-400/20 focus:border-zinc-400/60 focus:bg-white text-[#0e0f10] outline-none transition-all placeholder:text-[#6b6b6b]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['exams', workspaceId, classId] })}
            className="px-3 py-1 text-xs rounded-sm bg-zinc-100 text-[#0e0f10] hover:bg-zinc-200 transition-colors border border-zinc-400/20"
          >
            Apply
          </button>
        </div>
      </div>
      {/* ── Exam List ── */}
      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 370px)' }}>
        <div className="grid grid-cols-1 gap-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <ScaleLoader barCount={3} color="#a7a7a7ff" height={18} width={4} />
            </div>
          ) : filteredExams.length > 0 ? (
            filteredExams.map((exam) => (
              <div
                key={exam.id}
                className="group border-y border-zinc-400/20 bg-white overflow-hidden hover:bg-zinc-300/10 transition-all duration-200"
              >
                <div className="px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
                  {/* Exam info */}
                  <div
                    className="flex items-center gap-4 flex-1 w-full cursor-pointer"
                    onClick={() => router.push(`/workspace/classes/${classId}/exams/${exam.id}/subjects`)}
                  >
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-[#0e0f10] tracking-tight flex items-center gap-2 hover:text-blue-500 transition-colors">
                        {exam.exam_name}
                        {exam.status && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-sm uppercase font-bold animate-pulse ${exam.status === 'saving' ? 'bg-amber-100 text-amber-700' :
                            exam.status === 'saved' ? 'bg-emerald-100 text-emerald-700' :
                              exam.status === 'deleting' ? 'bg-red-100 text-red-700' :
                                exam.status === 'done' ? 'bg-zinc-100 text-zinc-700' :
                                  'bg-red-100 text-red-700'
                            }`}>
                            {exam.status}
                          </span>
                        )}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-[#6b6b6b]">
                        <span className="flex items-center gap-1.5 bg-zinc-300/20 px-2 py-0.5 rounded-sm text-[#0e0f10]">
                          <Clock size={11} /> {exam.minutes} min
                        </span>
                        <span className="flex items-center gap-1.5">
                          <GraduationCap size={13} />
                          {currentClass?.name || 'Loading class...'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Layers size={13} /> Questions: {questions.filter(q => q.examId === exam.id).length}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Layers size={13} /> Subjects: {subjects.filter(s => s.classes?.find(c => c.id === exam.classId)).length}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Layers size={13} /> Users: {users.filter(u => u.classId === exam.classId).length}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Layers size={13} /> Results: {results.filter(r => r.examId === exam.id).length}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1 w-full md:w-auto border-t md:border-t-0 md:border-l border-zinc-400/20 pt-3 md:pt-0 md:pl-6">
                    <button
                      type="button"
                      onClick={() => updateExamMutation.mutate({ id: exam.id, payload: { visible: !exam.visible } })}
                      className={`w-9 h-5 rounded-full relative transition-colors duration-200 focus:outline-none mr-1 ${exam.visible ? 'bg-blue-500' : 'bg-zinc-300'}`}
                      title={exam.visible ? 'Visible to students' : 'Hidden from students'}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${exam.visible ? 'translate-x-4' : 'translate-x-0'}`}
                      />
                    </button>
                    <button
                      onClick={() => handleOpenModal(exam)}
                      className="px-2 py-1 text-xs text-[#6b6b6b] hover:bg-zinc-300/20 hover:text-[#0e0f10] rounded-sm transition-all"
                      title="Edit"
                    >
                      <MdOutlineModeEditOutline size={15} />
                    </button>
                    <button
                      onClick={() => handleDuplicate(exam)}
                      disabled={isExamLimitReached}
                      className={`px-2 py-1 text-xs rounded-sm transition-all ${isExamLimitReached
                        ? "text-zinc-300 cursor-not-allowed"
                        : "text-[#6b6b6b] hover:bg-zinc-300/20 hover:text-[#0e0f10]"
                        }`}
                      title={isExamLimitReached ? "Exam limit reached" : "Duplicate"}
                    >
                      <MdOutlineControlPointDuplicate size={15} />
                    </button>
                    <button
                      onClick={() => setExportingExam(exam)}
                      className="px-2 py-1 text-xs text-[#6b6b6b] hover:bg-zinc-300/20 hover:text-[#0e0f10] rounded-sm transition-all"
                      title="Export questions to Question Bank"
                    >
                      <MdOutlineCloudUpload size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(exam.id)}
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
                <FileText size={28} className="text-[#6b6b6b]" />
              </div>
              <h3 className="text-sm font-medium text-[#0e0f10] mb-2">No exams yet under this class</h3>
              <p className="text-xs text-[#6b6b6b] max-w-xs mx-auto mb-8 leading-relaxed">
                Create assessment papers under this group context to assign questions.
              </p>
              <button
                onClick={() => handleOpenModal()}
                disabled={isExamLimitReached}
                className={`px-4 py-1.5 text-xs font-medium rounded-sm transition-all ${isExamLimitReached
                  ? "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-zinc-700"
                  }`}
              >
                {isExamLimitReached ? "Limit Reached" : "Create Exam"}
              </button>
            </div>
          )}
        </div>
      </div>
      {/* ── Modal ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingExam ? 'Edit Exam' : 'New Exam'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Exam name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#0e0f10] ml-0.5">Exam Title</label>
            <Input
              placeholder="e.g. Mid-Term Physics Assessment"
              value={formData.exam_name}
              onChange={(e) => setFormData({ ...formData, exam_name: e.target.value })}
              required
              className="text-xs rounded-sm bg-zinc-50 border border-zinc-400/20 focus:border-zinc-400/60 text-[#0e0f10] placeholder:text-[#6b6b6b]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* Duration */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#0e0f10] ml-0.5">Duration (mins)</label>
              <div className="relative">
                <Input
                  type="number"
                  min="1"
                  value={formData.minutes}
                  onChange={(e) => setFormData({ ...formData, minutes: parseInt(e.target.value) })}
                  required
                  className="text-xs rounded-sm bg-zinc-50 border border-zinc-400/20 focus:border-zinc-400/60 text-[#0e0f10] pr-8"
                />
                <Clock className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b6b]" size={13} />
              </div>
            </div>
            {/* Locked Class Context Alert */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#6b6b6b] ml-0.5">Assigned Class Category</label>
              <div className="w-full px-3 py-1.5 text-xs rounded-sm bg-zinc-100 border border-zinc-400/10 text-zinc-600 font-semibold flex items-center gap-1">
                <GraduationCap size={13} />
                {currentClass?.name || 'Class context active'}
              </div>
            </div>
          </div>
          {/* Locked Assignment Notice */}
          <div className="text-[11px] p-2.5 bg-blue-50/50 border border-blue-200 text-blue-700 rounded-sm leading-relaxed">
            <strong>Note:</strong> This exam will be automatically mapped to <strong>{currentClass?.name || 'this class group'}</strong> to prevent any human errors.
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
              isLoading={createExamMutation.isPending || updateExamMutation.isPending}
            >
              {editingExam ? (
                <span className="flex items-center justify-center gap-1.5"><Check size={13} /> Save Changes</span>
              ) : (
                <span className="flex items-center justify-center gap-1.5"><Plus size={13} /> Create Exam</span>
              )}
            </Button>
          </div>
        </form>
      </Modal>
      <ExportConfirmModal
        isOpen={!!exportingExam}
        onClose={() => setExportingExam(null)}
        title="Export to Question Bank"
        itemCountLabel={`This will export all questions under "${exportingExam?.exam_name}" to the Question Bank.`}
        onConfirm={(deleteOriginal) => {
          if (!exportingExam) return;
          exportQuestionsMutation.mutate({ examId: exportingExam.id, deleteOriginal });
        }}
        isLoading={exportQuestionsMutation.isPending}
      />
    </div>
  );
}
