"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Briefcase, Plus, Users, BookOpen, GraduationCap, FileText, ChevronRight, HelpCircle } from 'lucide-react';
import { workspaceApi } from '@/lib/api/workspaces';
import { Workspace } from '@/types';
import Link from 'next/link';
import { ScaleLoader } from 'react-spinners';

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await workspaceApi.list();
        if (res.data) setWorkspaces(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex flex-col gap-8 h-full">
      {isLoading ? (
        <div className="flex items-center justify-center h-64 w-full">
          <ScaleLoader barCount={3} color="#6b6b6b" height={20} width={5} />
        </div>
      ) : workspaces.length > 0 ? (
        <div className="divide-y divide-[#ededed] border-t border-b border-[#ededed] bg-[#f9f9f9]">
          {workspaces.map((ws) => (
            <div
              key={ws.id}
              className="group py-10 px-5 flex flex-col md:flex-row md:items-center justify-between gap-8 transition-colors hover:bg-white/60 border-b border-[#ededed] last:border-b-0"
            >
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded flex items-center justify-center border border-[#ededed]">
                    <Briefcase className="w-4 h-4 text-[#0e0f10]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-xs font-medium text-[#0e0f10] tracking-tight">
                        {ws.name}
                      </h3>
                      <div className="inline-flex items-center gap-1.5 bg-white px-2 py-0.5 rounded border border-[#ededed]">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                        <span className="text-[10px] font-medium text-[#6b6b6b] uppercase tracking-wider">Active</span>
                      </div>
                    </div>
                    <p className="text-xs text-[#6b6b6b] mt-1 max-w-2xl leading-relaxed">
                      {ws.description || "Integrated digital learning environment for streamlined education management."}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
                  <div className="flex items-center gap-2 text-xs text-[#6b6b6b]">
                    <Users className="w-3.5 h-3.5 text-[#6b6b6b]/60" />
                    <span className="text-[#0e0f10] font-medium">{ws._count?.users || 0}</span> Students
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#6b6b6b]">
                    <FileText className="w-3.5 h-3.5 text-[#6b6b6b]/60" />
                    <span className="text-[#0e0f10] font-medium">{ws._count?.exams || 0}</span> Exams
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#6b6b6b]">
                    <GraduationCap className="w-3.5 h-3.5 text-[#6b6b6b]/60" />
                    <span className="text-[#0e0f10] font-medium">{ws._count?.teachers || 0}</span> Teachers
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#6b6b6b]">
                    <BookOpen className="w-3.5 h-3.5 text-[#6b6b6b]/60" />
                    <span className="text-[#0e0f10] font-medium">{ws._count?.subjects || 0}</span> Subjects
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#6b6b6b]">
                    <BookOpen className="w-3.5 h-3.5 text-[#6b6b6b]/60" />
                    <span className="text-[#0e0f10] font-medium">{ws._count?.questions || 0}</span> Questions
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#6b6b6b]">
                    <BookOpen className="w-3.5 h-3.5 text-[#6b6b6b]/60" />
                    <span className="text-[#0e0f10] font-medium">{ws._count?.classes || 0}</span> Classes
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Link
                  href={`/workspace`}
                  className="h-9 px-4 bg-white text-xs font-medium text-[#6b6b6b] border border-[#ededed] rounded hover:text-[#0e0f10] hover:border-[#0e0f10] transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  Open Workspace
                  <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 border border-dashed border-[#ededed] rounded">
          <div className="w-12 h-12 bg-white rounded flex items-center justify-center mx-auto mb-4 border border-[#ededed]">
            <Briefcase className="w-5 h-5 text-[#6b6b6b]" />
          </div>
          <h3 className="text-xs font-medium text-[#0e0f10] mb-2">No workspaces found</h3>
          <p className="text-xs text-[#6b6b6b] max-w-xs mx-auto mb-6">
            Get started by creating your first workspace for your school or organization.
          </p>
          <Button className="bg-[#0e0f10] text-white text-xs font-medium px-6 h-9 rounded hover:bg-[#0e0f10]/90 transition-colors border-none ring-0">
            Create Now
          </Button>
        </div>
      )}
    </div>
  );
}