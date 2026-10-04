"use client";

import { useEffect, useState } from 'react';
import { Briefcase, Loader2, Save, Info, Type } from 'lucide-react';
import { workspaceApi } from '@/lib/api/workspaces';
import { Workspace } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScaleLoader } from 'react-spinners';
import { useUser } from '@/hooks/useUser';

const ManageWorkspacePage = () => {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const { data: user } = useUser();
  const workspaceId = user?.workspaceId;

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        if (!workspaceId) return;
        setIsLoading(true);

        const response = await workspaceApi.getById(workspaceId);
        if (response.success && response.data) {
          setWorkspace(response.data);
          setFormData({
            name: response.data.name,
            description: response.data.description || ''
          });
        }
      } catch (error) {
        console.error('Failed to fetch workspace:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (workspaceId) {
      fetchWorkspace();
    }
  }, [workspaceId]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace) return;

    try {
      setIsUpdating(true);
      setMessage(null);
      const response = await workspaceApi.update(workspace.id, {
        name: formData.name,
        description: formData.description
      });

      if (response.success) {
        setMessage({ type: 'success', text: 'Workspace updated successfully!' });
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to update workspace.' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An unexpected error occurred.' });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 w-full">
        <ScaleLoader barCount={3} color="#a7a7a7" height={20} width={5} />
      </div>
    );
  }

  return (
    <div className="rounded  p-8 border-y border-zinc-200 bg-[#f9f9f9]">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 rounded">
          <Briefcase className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h4 className="  text-[#1B2559] ">Manage Workspace</h4>
          <p className=" text-[#A3AED0]">Update your workspace identity and details.</p>
        </div>
      </div>

      <form onSubmit={handleUpdate} className="space-y-6 max-w-2xl">
        <div className="space-y-4">
          <Input
            label="Workspace Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter workspace name"
            required
            className="bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-blue-500/20 transition-all"
          />

          <div className="space-y-2">
            <label className="  text-[#1B2559] ml-1 flex items-center gap-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tell us a bit about this workspace..."
              rows={4}
              className="w-full mt-2 px-4 py-3 bg-slate-50/50 border border-[#D0D5DD] rounded  text-[#1B2559] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all resize-none placeholder:text-[#A3AED0]"
            />
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded  flex items-center gap-3 animate-in fade-in zoom-in duration-300 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
            }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${message.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
            {message.text}
          </div>
        )}

        <div className="pt-2">
          <Button
            type="submit"
            isLoading={isUpdating}
            className="px-8 py-2.5 rounded flex items-center gap-2  transition-all active:scale-[0.98]"
          >
            <Save className="w-4 h-4" />
            Update Workspace
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ManageWorkspacePage;