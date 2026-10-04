"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import {
  Users as UsersIcon,
  Plus,
  Mail,
  Search,
  Filter,
  Check,
  GraduationCap,
  ChevronDown,
} from 'lucide-react';
import { userApi } from '@/lib/api/users';
import { workspaceApi } from '@/lib/api/workspaces';
import { classApi } from '@/lib/api/classes';
import { studentBankApi } from '@/lib/api/studentBank';
import { ExportConfirmModal } from '@/components/ui/ExportConfirmModal';
import { User, Class } from '@/types';
import { MdOutlineDelete, MdOutlineModeEditOutline, MdOutlineCloudUpload } from 'react-icons/md';
import { ScaleLoader } from 'react-spinners';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspaceUsage } from '@/hooks/useWorkspaceUsage';
import { useSidebar } from '@/context/SidebarContext';
import { useUser } from '@/hooks/useUser';

type UserWithStatus = User & { status?: 'saving' | 'saved' | 'failed' | 'deleting' | 'done' };

export default function StudentsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [deleteProgress, setDeleteProgress] = useState<{ current: number; total: number } | null>(null);

  const { data: usageData } = useWorkspaceUsage();
  const isStudentLimitReached = usageData ? usageData.usage.students >= usageData.limits.students : false;

  const { data: user } = useUser();
  const workspaceId = user?.workspaceId;

  const { data: studentResponse, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['students', workspaceId, page, limit, searchTerm, selectedClass],
    queryFn: async () => {
      if (!workspaceId) return { data: [], meta: { total: 0, page: 1, limit: 10 } };
      const res = await userApi.list({
        role: 'STUDENT',
        workspaceId,
        page,
        limit,
        searchTerm,
        classId: selectedClass === 'all' ? undefined : selectedClass
      });
      return res;
    },
    enabled: !!workspaceId,
  });

  const users = (studentResponse?.data || []) as UserWithStatus[];
  const totalStudents = studentResponse?.meta?.total || 0;
  const totalPages = Math.ceil(totalStudents / limit);

  const { data: classes = [] } = useQuery({
    queryKey: ['classes', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const res = await classApi.list(workspaceId);
      return res.data || [];
    },
    enabled: !!workspaceId,
  });

  const isLoading = isLoadingUsers;

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    user_name: '',
    user_email: '',
    user_password: '',
    classId: '',
    role: 'STUDENT' as const,
    active: true,
  });


  const filteredUsers = users;
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportAllIds, setExportAllIds] = useState<string[] | null>(null);
  const [isFetchingAllForExport, setIsFetchingAllForExport] = useState(false);
  const exportStudentsMutation = useMutation({
    mutationFn: (data: { userIds: string[]; deleteOriginal: boolean }) => studentBankApi.exportStudents(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setIsExportModalOpen(false);
      setExportAllIds(null);
    },
    onError: (err: any) => alert(err.message || 'Failed to export students to the bank'),
  });

  const handleExportAll = async () => {
    if (!workspaceId) return;
    setIsFetchingAllForExport(true);
    try {
      const res = await userApi.list({
        role: 'STUDENT',
        workspaceId,
        searchTerm,
        classId: selectedClass === 'all' ? undefined : selectedClass,
        limit: totalStudents || 100000,
      });
      setExportAllIds((res.data || []).map((u) => u.id));
      setIsExportModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'Failed to load all students for export');
    } finally {
      setIsFetchingAllForExport(false);
    }
  };

  const handleOpenModal = (u: User | null = null) => {
    if (u) {
      setEditingUser(u);
      setFormData({
        user_name: u.user_name,
        user_email: u.user_email,
        user_password: '',
        classId: u.classId?.toString() || '',
        role: u.role as any,
        active: u.active,
      });
    } else {
      setEditingUser(null);
      setFormData({
        user_name: '',
        user_email: '',
        user_password: 'password123',
        classId: classes[0]?.id.toString() || '',
        role: 'STUDENT',
        active: true,
      });
    }
    setIsModalOpen(true);
  };

  const createStudentMutation = useMutation({
    mutationFn: (payload: any) => {
      if (!workspaceId) throw new Error('Workspace not found');
      return workspaceApi.createStudent(workspaceId, payload);
    },
    onMutate: async (newStudent) => {
      await queryClient.cancelQueries({ queryKey: ['students'] });
      const previousStudents = queryClient.getQueryData<UserWithStatus[]>(['students']);
      const tempId = Math.random().toString(36).substring(7);
      queryClient.setQueryData(['students'], (old: UserWithStatus[] = []) => [
        { ...newStudent, id: tempId, status: 'saving' } as UserWithStatus,
        ...old,
      ]);
      return { previousStudents, tempId };
    },
    onError: (err, newStudent, context) => {
      queryClient.setQueryData(['students'], context?.previousStudents);
      alert('Failed to enroll student');
    },
    onSuccess: (data, newStudent, context) => {
      queryClient.setQueryData(['students'], (old: UserWithStatus[] = []) =>
        old.map((s) =>
          s.id === context?.tempId ? { ...data.data, status: 'saved' } : s
        )
      );
      setTimeout(() => {
        queryClient.setQueryData(['students'], (old: UserWithStatus[] = []) =>
          old.map((s) => (s.id === data.data.id ? { ...s, status: undefined } : s))
        );
      }, 3000);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  const updateStudentMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => userApi.update(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['students'] });
      const previousStudents = queryClient.getQueryData<UserWithStatus[]>(['students']);
      queryClient.setQueryData(['students'], (old: UserWithStatus[] = []) =>
        old.map((s) => (s.id === id ? { ...s, ...payload, status: 'saving' } : s))
      );
      return { previousStudents };
    },
    onError: (err, { id }, context) => {
      queryClient.setQueryData(['students'], context?.previousStudents);
      alert('Failed to update student');
    },
    onSuccess: (data, { id }) => {
      queryClient.setQueryData(['students'], (old: UserWithStatus[] = []) =>
        old.map((s) => (s.id === id ? { ...s, status: 'saved' } : s))
      );
      setTimeout(() => {
        queryClient.setQueryData(['students'], (old: UserWithStatus[] = []) =>
          old.map((s) => (s.id === id ? { ...s, status: undefined } : s))
        );
      }, 3000);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  const deleteStudentMutation = useMutation({
    mutationFn: (id: string) => userApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['students'] });
      const previousStudents = queryClient.getQueryData<UserWithStatus[]>(['students']);
      queryClient.setQueryData(['students'], (old: UserWithStatus[] = []) =>
        old.map((s) => (s.id === id ? { ...s, status: 'deleting' } : s))
      );
      return { previousStudents };
    },
    onSuccess: (data, id) => {
      queryClient.setQueryData(['students'], (old: UserWithStatus[] = []) =>
        old.map((s) => (s.id === id ? { ...s, status: 'done' } : s))
      );
      setTimeout(() => {
        queryClient.setQueryData(['students'], (old: UserWithStatus[] = []) =>
          old.filter((s) => s.id !== id)
        );
      }, 1000);
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(['students'], context?.previousStudents);
      alert('Failed to delete student');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this account?')) return;
    deleteStudentMutation.mutate(id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateStudentMutation.mutate({
        id: editingUser.id,
        payload: {
          user_name: formData.user_name,
          user_email: formData.user_email,
          classId: formData.classId || null,
          active: formData.active,
        },
      });
    } else {
      createStudentMutation.mutate({
        user_name: formData.user_name,
        user_email: formData.user_email,
        user_password: formData.user_password,
        classId: formData.classId || null,
        active: formData.active,
      });
    }
    setIsModalOpen(false);
  };
  const { isLeftSidebarCollapsed, toggleLeftSidebar } = useSidebar();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 relative">
      {deleteProgress && (
        <div className="sticky top-0 z-50 bg-white border-b border-red-100 p-2 mb-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Deleting Students...</span>
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
      <div className={`${isLeftSidebarCollapsed ? 'sticky  z-50' : ''} flex  bg-[#f9f9f9]  top-0  h-full w-full border-b border-[#ededed]  `}>
        <DashboardHeader
          title="Students"
          description="Manage student enrollments and account access."
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setExportAllIds(null); setIsExportModalOpen(true); }}
              disabled={filteredUsers.length === 0}
              className="flex items-center gap-2 px-3 py-1 text-xs font-medium bg-zinc-100 text-[#0e0f10] rounded-sm hover:bg-zinc-200 transition-all border border-zinc-400/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export currently filtered students to the Student Bank"
            >
              <MdOutlineCloudUpload size={14} />
              Export to Student Bank
            </button>
            <button
              onClick={handleExportAll}
              disabled={totalStudents === 0 || isFetchingAllForExport}
              className="flex items-center gap-2 px-3 py-1 text-xs font-medium bg-zinc-100 text-[#0e0f10] rounded-sm hover:bg-zinc-200 transition-all border border-zinc-400/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export all students matching the current filters, across all pages"
            >
              <MdOutlineCloudUpload size={14} />
              {isFetchingAllForExport ? 'Loading...' : 'Export All'}
            </button>
            <button
              onClick={() => handleOpenModal()}
              disabled={isStudentLimitReached}
              className={`flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-sm transition-all active:scale-[0.98] ${isStudentLimitReached
                ? "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-zinc-700"
                }`}
              title={isStudentLimitReached ? "Student limit reached for your plan" : "Enroll New Student"}
            >
              <Plus size={14} />
              Enroll New Student
            </button>
          </div>
        </DashboardHeader>
      </div>


      {/* Filter Section */}
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

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b6b]"
              size={13}
            />
            <input
              type="text"
              placeholder="Search by name or email..."
              className="w-full pl-8 pr-3 py-1 text-xs rounded-sm bg-zinc-50 border border-zinc-400/20 focus:border-zinc-400/60 focus:bg-white text-[#0e0f10] outline-none transition-all placeholder:text-[#6b6b6b]"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="relative">
            <select
              className="w-full px-3 py-1 text-xs rounded-sm bg-zinc-50 border border-zinc-400/20 focus:border-zinc-400/60 focus:bg-white text-[#0e0f10] outline-none appearance-none cursor-pointer"
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b6b] pointer-events-none"
              size={13}
            />
          </div>

          <div className="relative">
            <select
              className="w-full px-3 py-1 text-xs rounded-sm bg-zinc-50 border border-zinc-400/20 focus:border-zinc-400/60 focus:bg-white text-[#0e0f10] outline-none appearance-none cursor-pointer"
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
            <ChevronDown
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b6b] pointer-events-none"
              size={13}
            />
          </div>

          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['students'] })}
            className="px-3 py-1 text-xs rounded-sm bg-zinc-100 text-[#0e0f10] hover:bg-zinc-200 transition-colors border border-zinc-400/20"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Student List */}
      <div className="overflow-y-auto" style={{ maxHeight: `calc(100vh - ${totalPages > 1 ? '350' : '290'}px)` }}>
        <div className="grid grid-cols-1 gap-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <ScaleLoader barCount={3} color="#a7a7a7ff" height={18} width={4} />
            </div>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((student) => (
              <div
                key={student.id}
                className="group border-y border-zinc-400/20 bg-white  overflow-hidden hover:bg-zinc-300/10 transition-all duration-200"
              >
                <div className="px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 w-full">
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-[#0e0f10] tracking-tight flex items-center gap-2">
                        {student.user_name}
                        {student.status && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-sm uppercase font-bold animate-pulse ${student.status === 'saving' ? 'bg-amber-100 text-amber-700' :
                            student.status === 'saved' ? 'bg-emerald-100 text-emerald-700' :
                              student.status === 'deleting' ? 'bg-red-100 text-red-700' :
                                student.status === 'done' ? 'bg-zinc-100 text-zinc-700' :
                                  'bg-red-100 text-red-700'
                            }`}>
                            {student.status}
                          </span>
                        )}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-[#6b6b6b]">
                        <span className="flex items-center gap-1.5">
                          <Mail size={11} /> {student.user_email}
                        </span>
                        <span className="flex items-center gap-1.5 bg-zinc-300/20 px-2 py-0.5 rounded-sm text-[#0e0f10]">
                          <GraduationCap size={11} />
                          {classes.find((c) => c.id === student.classId)?.name || 'Unassigned'}
                        </span>
                        <span
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-medium ${student.active
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-zinc-100 text-[#6b6b6b]'
                            }`}
                        >
                          {student.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 w-full md:w-auto border-t md:border-t-0 md:border-l border-zinc-400/20 pt-3 md:pt-0 md:pl-6">
                    <button
                      onClick={() => handleOpenModal(student)}
                      className="px-2 py-1 text-xs text-[#6b6b6b] hover:bg-zinc-300/20 hover:text-[#0e0f10] rounded-sm transition-all"
                      title="Edit"
                    >
                      <MdOutlineModeEditOutline size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(student.id)}
                      className="px-2 py-1 text-xs text-[#6b6b6b] hover:bg-red-50 hover:text-red-500 rounded-sm transition-all"
                      title="Delete"
                    >
                      <MdOutlineDelete size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-white rounded-sm border border-dashed border-zinc-400/30 flex flex-col items-center">
              <div className="w-16 h-16 bg-zinc-100 rounded-sm flex items-center justify-center mb-6">
                <UsersIcon size={28} className="text-[#6b6b6b]" />
              </div>
              <h3 className="text-sm font-medium text-[#0e0f10] mb-2">No students enrolled</h3>
              <p className="text-xs text-[#6b6b6b] max-w-xs mx-auto mb-8 leading-relaxed">
                Start by enrolling your first student to organize their learning path.
              </p>
              <button
                onClick={() => handleOpenModal()}
                disabled={isStudentLimitReached}
                className={`px-4 py-1.5 text-xs font-medium rounded-sm transition-all ${isStudentLimitReached
                  ? "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-zinc-700"
                  }`}
              >
                {isStudentLimitReached ? "Limit Reached" : "Enroll First Student"}
              </button>
            </div>
          )}
        </div> </div>

      {/* ── Pagination ── */}
      {
        totalPages > 1 && (
          <div className="flex sticky items-center justify-between px-4 py-3 bg-white border border-zinc-400/20 rounded-sm">
            <div className="text-xs text-[#6b6b6b]">
              Showing <span className="font-medium text-[#0e0f10]">{(page - 1) * limit + 1}</span> to <span className="font-medium text-[#0e0f10]">{Math.min(page * limit, totalStudents)}</span> of <span className="font-medium text-[#0e0f10]">{totalStudents}</span> students
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-xs font-medium bg-zinc-50 text-[#0e0f10] border border-zinc-400/20 rounded-sm hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => {
                  const p = i + 1;
                  if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-7 h-7 flex items-center justify-center text-xs font-medium rounded-sm transition-all ${page === p ? 'bg-blue-500 text-white' : 'hover:bg-zinc-100 text-[#0e0f10]'}`}
                      >
                        {p}
                      </button>
                    );
                  } else if (p === page - 2 || p === page + 2) {
                    return <span key={p} className="text-[#6b6b6b]">...</span>;
                  }
                  return null;
                })}
              </div>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-xs font-medium bg-zinc-50 text-[#0e0f10] border border-zinc-400/20 rounded-sm hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )
      }

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Edit Student' : 'New Student'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#0e0f10] ml-0.5">Full Name</label>
            <Input
              placeholder="e.g. NIKOLA TESLA"
              value={formData.user_name}
              onChange={(e) => setFormData({ ...formData, user_name: e.target.value.toUpperCase() })}
              required
              className="text-xs rounded-sm bg-zinc-50 border border-zinc-400/20 focus:border-zinc-400/60 text-[#0e0f10] placeholder:text-[#6b6b6b]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#0e0f10] ml-0.5">Email / ID</label>
            <Input
              type="text"
              placeholder="student@school.com"
              value={formData.user_email}
              onChange={(e) => setFormData({ ...formData, user_email: e.target.value.toLowerCase() })}
              required
              className="text-xs rounded-sm bg-zinc-50 border border-zinc-400/20 focus:border-zinc-400/60 text-[#0e0f10] placeholder:text-[#6b6b6b]"
            />
          </div>

          {!editingUser && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#0e0f10] ml-0.5">Password</label>
              <Input
                type="password"
                placeholder="Initial password"
                value={formData.user_password}
                onChange={(e) => setFormData({ ...formData, user_password: e.target.value })}
                required
                className="text-xs rounded-sm bg-zinc-50 border border-zinc-400/20 focus:border-zinc-400/60 text-[#0e0f10] placeholder:text-[#6b6b6b]"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#0e0f10] ml-0.5">Class</label>
            <div className="relative">
              <select
                required
                className="w-full px-3 py-1 text-xs rounded-sm bg-zinc-50 border border-zinc-400/20 focus:border-zinc-400/60 text-[#0e0f10] outline-none appearance-none cursor-pointer"
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
              >
                <option value="" disabled>Select a class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b6b] pointer-events-none"
                size={13}
              />
            </div>
          </div>

          <div className="flex items-center justify-between px-3 py-2.5 bg-zinc-50 rounded-sm border border-zinc-400/20">
            <div>
              <p className="text-xs font-medium text-[#0e0f10]">Active Enrollment</p>
              <p className="text-[11px] text-[#6b6b6b] mt-0.5">Allow student to access exams</p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, active: !formData.active })}
              className={`w-10 h-5 rounded-full relative transition-colors duration-200 focus:outline-none ${formData.active ? 'bg-blue-500' : 'bg-zinc-300'}`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${formData.active ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </div>

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
              isLoading={createStudentMutation.isPending || updateStudentMutation.isPending}
            >
              {editingUser ? (
                <span className="flex items-center justify-center gap-1.5"><Check size={13} /> Save Changes</span>
              ) : (
                <span className="flex items-center justify-center gap-1.5"><Plus size={13} /> Enroll Student</span>
              )}
            </Button>
          </div>
        </form>
      </Modal>
      <ExportConfirmModal
        isOpen={isExportModalOpen}
        onClose={() => { setIsExportModalOpen(false); setExportAllIds(null); }}
        title="Export to Student Bank"
        itemCountLabel={
          exportAllIds
            ? `This will export all ${exportAllIds.length} matching student(s) to the Student Bank.`
            : `This will export ${filteredUsers.length} currently filtered student(s) to the Student Bank.`
        }
        onConfirm={(deleteOriginal) =>
          exportStudentsMutation.mutate({ userIds: exportAllIds ?? filteredUsers.map((u) => u.id), deleteOriginal })
        }
        isLoading={exportStudentsMutation.isPending}
      />
    </div >
  );
}