"use client";

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { BookOpen, GraduationCap, ArrowRight, ClipboardList, ChevronDown, Filter } from 'lucide-react';
import { ScaleLoader } from 'react-spinners';
import { useQuery } from '@tanstack/react-query';
import { workspaceApi } from '@/lib/api/workspaces';
import { useUser } from '@/hooks/useUser';
import { useSidebar } from '@/context/SidebarContext';

interface TeacherAssignment {
  id: string;
  subjectId: string;
  classId: string;
  examId?: string | null;
  subject?: { name: string };
  class?: { name: string };
  exam?: { id: string; exam_name: string };
}

const AssignmentsPage = () => {
  const router = useRouter();
  const { data: user } = useUser();
  const workspaceId = user?.workspaceId;
  const { isLeftSidebarCollapsed } = useSidebar();
  const [selectedExam, setSelectedExam] = useState('all');

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['my-assignments', user?.id],
    queryFn: async () => {
      if (!workspaceId || !user?.id) return [];
      const res = await workspaceApi.getAssignments(workspaceId, user.id);
      return (res.data || []) as TeacherAssignment[];
    },
    enabled: !!workspaceId && !!user?.id,
  });

  const examOptions = useMemo(() => {
    const map = new Map<string, string>();
    assignments.forEach((a) => {
      if (a.examId && a.exam?.exam_name) map.set(a.examId, a.exam.exam_name);
    });
    return Array.from(map.entries());
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    if (selectedExam === 'all') return assignments;
    return assignments.filter((a) => a.examId === selectedExam);
  }, [assignments, selectedExam]);

  const handleOpen = (assignment: TeacherAssignment) => {
    router.push(`/workspace/questions?subjectId=${assignment.subjectId}&classId=${assignment.classId}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className={`${isLeftSidebarCollapsed ? 'sticky z-50' : ''} flex bg-[#f9f9f9] top-0 h-full w-full border-b border-[#ededed]`}>
        <DashboardHeader
          title="Assignments"
          description="Subjects and classes assigned to you. Select one to manage its questions."
        />
      </div>

      <div className="bg-white p-4 border-y border-zinc-400/20 space-y-3">
        <div className="flex items-center gap-2 text-[#6b6b6b] px-1">
          <Filter size={13} />
          <span className="text-xs font-medium text-[#0e0f10]">Filter</span>
        </div>
        <div className="relative max-w-xs">
          <select
            className="w-full px-3 py-1 text-xs rounded-sm bg-zinc-50 border border-zinc-400/20 focus:border-zinc-400/60 focus:bg-white text-[#0e0f10] outline-none appearance-none cursor-pointer"
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
          >
            <option value="all">All Exams</option>
            {examOptions.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b6b] pointer-events-none" size={13} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <ScaleLoader barCount={3} color="#a7a7a7ff" height={18} width={4} />
          </div>
        ) : filteredAssignments.length > 0 ? (
          filteredAssignments.map((assignment) => (
            <button
              key={assignment.id}
              onClick={() => handleOpen(assignment)}
              className="group text-left border-y border-zinc-400/20 bg-white overflow-hidden hover:bg-zinc-300/10 transition-all duration-200"
            >
              <div className="px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="flex items-center justify-center bg-zinc-300/20 text-[#0e0f10] rounded-sm px-1.5 py-1">
                    <ClipboardList size={15} />
                  </span>
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-[#0e0f10] tracking-tight">
                      {assignment.subject?.name || 'Unknown subject'}
                    </h3>
                    <div className="flex items-center gap-x-4 gap-y-1 text-xs text-[#6b6b6b]">
                      <span className="flex items-center gap-1.5">
                        <BookOpen size={11} /> {assignment.subject?.name || 'N/A'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <GraduationCap size={11} /> {assignment.class?.name || 'N/A'}
                      </span>
                      {assignment.exam?.exam_name && (
                        <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-sm text-[10px]">
                          {assignment.exam.exam_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ArrowRight size={14} className="text-[#6b6b6b] group-hover:text-[#0e0f10] group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-sm border border-dashed border-zinc-400/30 flex flex-col items-center">
            <div className="w-16 h-16 bg-zinc-100 rounded-sm flex items-center justify-center mb-6">
              <ClipboardList size={28} className="text-[#6b6b6b]" />
            </div>
            <h3 className="text-sm font-medium text-[#0e0f10] mb-2">No assignments yet</h3>
            <p className="text-xs text-[#6b6b6b] max-w-xs mx-auto leading-relaxed">
              An administrator hasn't assigned you to any subject/class combination yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentsPage;
