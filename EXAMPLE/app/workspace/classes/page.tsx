"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  Check,
} from 'lucide-react';
import { classApi } from '@/lib/api/classes';
import { Class } from '@/types';
import { ScaleLoader } from 'react-spinners';
import { MdOutlineDelete, MdOutlineModeEditOutline } from 'react-icons/md';
import { useSidebar } from '@/context/SidebarContext';
import { useUser } from '@/hooks/useUser';

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState({ name: '' });

  const { data: user } = useUser();
  const workspaceId = user?.workspaceId;

  const fetchClasses = async () => {
    if (!workspaceId) return;
    try {
      setIsLoading(true);
      const res = await classApi.list(workspaceId);
      if (res.data) setClasses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) fetchClasses();
  }, [workspaceId]);

  const filteredClasses = useMemo(() =>
    classes.filter(cls => cls.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [classes, searchTerm]
  );

  const handleOpenModal = (cls: Class | null = null) => {
    if (cls) {
      setEditingClass(cls);
      setFormData({ name: cls.name });
    } else {
      setEditingClass(null);
      setFormData({ name: '' });
    }
    setIsModalOpen(true);
  };
  const { isLeftSidebarCollapsed, toggleLeftSidebar } = useSidebar();

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this class? This action cannot be undone.')) return;
    try {
      setIsLoading(true);
      const response = await classApi.delete(id);
      if (response.success) await fetchClasses();
    } catch (err: any) {
      alert(err.message || 'Failed to delete class');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (!workspaceId) throw new Error('Workspace not found');
      const payload = { ...formData, workspaceId };
      const response = editingClass
        ? await classApi.update(editingClass.id, payload)
        : await classApi.create(payload);
      if (response.success) {
        await fetchClasses();
        setIsModalOpen(false);
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className={`${isLeftSidebarCollapsed ? 'sticky  z-50' : ''} flex  bg-[#f9f9f9]  top-0  h-full w-full border-b border-[#ededed]  `}>
        <DashboardHeader
          title="Classes"
          description="Manage your student groups and academic year structures."
        >
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-3 py-1 text-xs font-medium bg-blue-500 text-white rounded-sm hover:bg-zinc-700 transition-all active:scale-[0.98]"
          >
            <Plus size={14} />
            Add New Class
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

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b6b]" size={13} />
          <input
            type="text"
            placeholder="Search by class name..."
            className="w-full pl-8 pr-3 py-1 text-xs rounded-sm bg-zinc-50 border border-zinc-400/20 focus:border-zinc-400/60 focus:bg-white text-[#0e0f10] outline-none transition-all placeholder:text-[#6b6b6b]"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* ── Class List ── */}
      <div className="grid grid-cols-1 gap-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <ScaleLoader barCount={3} color="#a7a7a7ff" height={18} width={4} />
          </div>
        ) : filteredClasses.length > 0 ? (
          filteredClasses.map(cls => (
            <div
              key={cls.id}
              className="group border-y border-zinc-400/20 bg-white overflow-hidden hover:bg-zinc-300/10 transition-all duration-200"
            >
              <div className="px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Class info */}
                <div className="flex items-center gap-3 flex-1 w-full">
                  <span className="flex items-center justify-center bg-zinc-300/20 text-[#0e0f10] rounded-sm px-1.5 py-1">
                    <GraduationCap size={13} />
                  </span>
                  <h3 className="text-sm font-medium text-[#0e0f10] tracking-tight">
                    {cls.name}
                  </h3>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 w-full md:w-auto border-t md:border-t-0 md:border-l border-zinc-400/20 pt-3 md:pt-0 md:pl-6">
                  <button
                    onClick={() => handleOpenModal(cls)}
                    className="px-2 py-1 text-xs text-[#6b6b6b] hover:bg-zinc-300/20 hover:text-[#0e0f10] rounded-sm transition-all"
                    title="Edit"
                  >
                    <MdOutlineModeEditOutline size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(cls.id)}
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
          /* ── Empty state ── */
          <div className="text-center py-20 bg-white rounded-sm border border-dashed border-zinc-400/30 flex flex-col items-center">
            <div className="w-16 h-16 bg-zinc-100 rounded-sm flex items-center justify-center mb-6">
              <GraduationCap size={28} className="text-[#6b6b6b]" />
            </div>
            <h3 className="text-sm font-medium text-[#0e0f10] mb-2">No classes yet</h3>
            <p className="text-xs text-[#6b6b6b] max-w-xs mx-auto mb-8 leading-relaxed">
              Start by creating your first class to assign students and organise your exams.
            </p>
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-1.5 text-xs font-medium bg-[#0e0f10] text-white rounded-sm hover:bg-zinc-700 transition-all"
            >
              Create First Class
            </button>
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClass ? 'Edit Class' : 'New Class'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#0e0f10] ml-0.5">Class Name</label>
            <Input
              placeholder="e.g. JSS1, Grade 10-A, Final Year"
              value={formData.name}
              onChange={e => setFormData({ name: e.target.value.toUpperCase() })}
              required
              className="text-xs rounded-sm bg-zinc-50 border border-zinc-400/20 focus:border-zinc-400/60 text-[#0e0f10] placeholder:text-[#6b6b6b]"
            />
            <p className="text-[11px] text-[#6b6b6b] ml-0.5">This name will be visible to students and teachers.</p>
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
              isLoading={isSubmitting}
            >
              {editingClass ? (
                <span className="flex items-center justify-center gap-1.5"><Check size={13} /> Save Changes</span>
              ) : (
                <span className="flex items-center justify-center gap-1.5"><Plus size={13} /> Create Class</span>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}