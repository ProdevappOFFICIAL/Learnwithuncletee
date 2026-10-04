"use client";

import React, { useState } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { PaginationFooter } from '@/components/ui/PaginationFooter';
import {
  HelpCircle,
  Search,
  Filter,
  Download,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import { questionBankApi } from '@/lib/api/questionBank';
import { examApi } from '@/lib/api/exams';
import { subjectApi } from '@/lib/api/subjects';
import { classApi } from '@/lib/api/classes';
import { QuestionBankItem } from '@/types';
import { ScaleLoader } from 'react-spinners';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/hooks/useUser';

export default function QuestionBankPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [bulkTarget, setBulkTarget] = useState({ examId: '', subjectId: '', classId: '' });
  const { data: user } = useUser();
  const workspaceId = user?.workspaceId;

  const { data: response, isLoading } = useQuery({
    queryKey: ['question-bank', workspaceId, page, limit, searchTerm],
    queryFn: async () => {
      if (!workspaceId) return { data: [], meta: { total: 0, page: 1, limit: 10 } };
      return questionBankApi.list({ workspaceId, page, limit, searchTerm });
    },
    enabled: !!workspaceId,
  });

  const { data: exams = [] } = useQuery({
    queryKey: ['exams', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const res = await examApi.list({ workspaceId });
      return res.data || [];
    },
    enabled: !!workspaceId,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const res = await subjectApi.list(workspaceId);
      return res.data || [];
    },
    enabled: !!workspaceId,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const res = await classApi.list(workspaceId);
      return res.data || [];
    },
    enabled: !!workspaceId,
  });

  const items = (response?.data || []) as QuestionBankItem[];
  const total = response?.meta?.total || 0;

  const importMutation = useMutation({
    mutationFn: (id: string) => questionBankApi.importItems({ ids: [id], deleteFromBank: true }),
    onSuccess: (res) => {
      if (res.data?.failed?.length) {
        alert(res.data.failed[0].error);
      }
      queryClient.invalidateQueries({ queryKey: ['question-bank'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
    onError: () => alert('Failed to import question'),
  });

  const bulkImportMutation = useMutation({
    mutationFn: (data: { ids: string[]; examId?: string; subjectId?: string; classId?: string }) =>
      questionBankApi.importItems({ ids: data.ids, deleteFromBank: true, examId: data.examId, subjectId: data.subjectId, classId: data.classId }),
    onSuccess: (res) => {
      if (res.data?.failed?.length) {
        alert(`${res.data.imported.length} imported, ${res.data.failed.length} failed:\n${res.data.failed.map(f => f.error).join('\n')}`);
      }
      queryClient.invalidateQueries({ queryKey: ['question-bank'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      setSelectedIds([]);
      setIsBulkImportOpen(false);
    },
    onError: (err: any) => alert(err.message || 'Failed to import questions'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => questionBankApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['question-bank'] }),
    onError: () => alert('Failed to delete bank item'),
  });

  const handleDelete = (id: string) => {
    if (!window.confirm('Permanently delete this item from the Question Bank?')) return;
    deleteMutation.mutate(id);
  };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === items.length ? [] : items.map((i) => i.id));
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const openBulkImport = () => {
    setBulkTarget({ examId: '', subjectId: '', classId: '' });
    setIsBulkImportOpen(true);
  };

  const [isImportingAll, setIsImportingAll] = useState(false);
  const handleImportAll = async () => {
    if (!workspaceId || total === 0) return;
    setIsImportingAll(true);
    try {
      const res = await questionBankApi.list({ workspaceId, searchTerm, limit: total });
      setSelectedIds((res.data || []).map((i) => i.id));
      openBulkImport();
    } catch (err: any) {
      alert(err.message || 'Failed to load all bank items');
    } finally {
      setIsImportingAll(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <DashboardHeader
        title="Question Bank"
        description="Archived questions exported from exams. Import them back or delete them permanently."
      >
        <button
          onClick={handleImportAll}
          disabled={total === 0 || isImportingAll}
          className="flex items-center gap-2 px-3 py-1 text-xs font-medium bg-blue-500 text-white rounded-sm hover:bg-zinc-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={14} />
          {isImportingAll ? 'Loading...' : 'Import All'}
        </button>
      </DashboardHeader>

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
              placeholder="Search archived questions..."
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
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b6b] pointer-events-none" size={13} />
          </div>
        </div>
      </div>

      {/* ── Selection Actions ── */}
      {items.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-50 border-y border-zinc-400/20">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              className="w-3.5 h-3.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              checked={selectedIds.length === items.length && items.length > 0}
              onChange={toggleSelectAll}
            />
            <span className="text-xs font-medium text-[#0e0f10]">
              {selectedIds.length} selected
            </span>
          </div>
          {selectedIds.length > 0 && (
            <button
              onClick={openBulkImport}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-sm hover:bg-blue-100 transition-all active:scale-95"
            >
              <Download size={14} />
              Import Selected
            </button>
          )}
        </div>
      )}

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 500px)' }}>

       
      <div className="grid grid-cols-1 gap-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <ScaleLoader barCount={3} color="#a7a7a7ff" height={18} width={4} />
          </div>
        ) : items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.id}
              className="group border-y border-zinc-400/20 bg-white overflow-hidden hover:bg-zinc-300/10 transition-all duration-200"
            >
              <div className="px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 w-full">
                  <input
                    type="checkbox"
                    className="mt-1 w-3.5 h-3.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => toggleSelectOne(item.id)}
                  />
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-[#0e0f10] tracking-tight line-clamp-1">{item.question}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6b6b6b]">
                      <span className="bg-zinc-300/20 px-2 py-0.5 rounded-sm text-[#0e0f10]">{item.examName || 'Unknown exam'}</span>
                      <span>{item.subjectName || 'Unknown subject'}</span>
                      <span>{item.className || 'Unknown class'}</span>
                      <span>Exported {new Date(item.exportedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 w-full md:w-auto border-t md:border-t-0 md:border-l border-zinc-400/20 pt-3 md:pt-0 md:pl-6">
                  <button
                    onClick={() => importMutation.mutate(item.id)}
                    disabled={importMutation.isPending}
                    className="flex items-center gap-1.5 px-2 py-1 text-xs text-[#6b6b6b] hover:bg-zinc-300/20 hover:text-[#0e0f10] rounded-sm transition-all"
                    title="Import back into Questions"
                  >
                    <Download size={14} /> Import
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="px-2 py-1 text-xs text-[#6b6b6b] hover:bg-red-50 hover:text-red-500 rounded-sm transition-all"
                    title="Delete permanently"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-sm border border-dashed border-zinc-400/30 flex flex-col items-center">
            <div className="w-16 h-16 bg-zinc-100 rounded-sm flex items-center justify-center mb-6">
              <HelpCircle size={28} className="text-[#6b6b6b]" />
            </div>
            <h3 className="text-sm font-medium text-[#0e0f10] mb-2">Question Bank is empty</h3>
            <p className="text-xs text-[#6b6b6b] max-w-xs mx-auto leading-relaxed">
              Export questions from an exam to archive them here.
            </p>
          </div>
        )}
      </div>
 </div>
      <PaginationFooter page={page} limit={limit} total={total} onPageChange={setPage} itemLabel="archived questions" />

      {/* ── Bulk Import Modal ── */}
      <Modal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        title="Import Selected Questions"
      >
        <div className="space-y-5">
          <p className="text-xs text-[#6b6b6b]">
            Choose the destination exam, subject, and class for the {selectedIds.length} selected question(s). Leave a field blank to use each item&apos;s original source (if it still exists).
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#0e0f10] ml-0.5">Exam</label>
            <div className="relative">
              <select
                className="w-full px-3 py-1 text-xs rounded-sm bg-zinc-50 border border-zinc-400/20 focus:border-zinc-400/60 text-[#0e0f10] outline-none appearance-none cursor-pointer"
                value={bulkTarget.examId}
                onChange={(e) => setBulkTarget({ ...bulkTarget, examId: e.target.value })}
              >
                <option value="">Use original exam</option>
                {exams.map((e) => (
                  <option key={e.id} value={e.id}>{e.exam_name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b6b] pointer-events-none" size={13} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#0e0f10] ml-0.5">Subject</label>
            <div className="relative">
              <select
                className="w-full px-3 py-1 text-xs rounded-sm bg-zinc-50 border border-zinc-400/20 focus:border-zinc-400/60 text-[#0e0f10] outline-none appearance-none cursor-pointer"
                value={bulkTarget.subjectId}
                onChange={(e) => setBulkTarget({ ...bulkTarget, subjectId: e.target.value })}
              >
                <option value="">Use original subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b6b] pointer-events-none" size={13} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#0e0f10] ml-0.5">Class</label>
            <div className="relative">
              <select
                className="w-full px-3 py-1 text-xs rounded-sm bg-zinc-50 border border-zinc-400/20 focus:border-zinc-400/60 text-[#0e0f10] outline-none appearance-none cursor-pointer"
                value={bulkTarget.classId}
                onChange={(e) => setBulkTarget({ ...bulkTarget, classId: e.target.value })}
              >
                <option value="">Use original class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b6b] pointer-events-none" size={13} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsBulkImportOpen(false)}
              className="flex-1 py-1.5 text-xs text-[#6b6b6b] hover:bg-zinc-100 rounded-sm transition-all border border-zinc-400/20"
            >
              Cancel
            </button>
            <Button
              type="button"
              onClick={() =>
                bulkImportMutation.mutate({
                  ids: selectedIds,
                  examId: bulkTarget.examId || undefined,
                  subjectId: bulkTarget.subjectId || undefined,
                  classId: bulkTarget.classId || undefined,
                })
              }
              className="flex-1 py-1.5 text-xs rounded-sm bg-blue-500 text-white hover:bg-zinc-700 transition-all"
              isLoading={bulkImportMutation.isPending}
            >
              Import {selectedIds.length} Question(s)
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

