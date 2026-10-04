"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { inviteApi } from '@/lib/api/invites';
import {
  UserPlus,
  Mail,
  Copy,
  RefreshCcw,
  Trash2,
  X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { ScaleLoader } from 'react-spinners';
import { useWorkspaceUsage } from '@/hooks/useWorkspaceUsage';

interface Invite {
  id: string;
  email: string;
  role: string;
  status: 'PENDING' | 'COMPLETED' | 'REVOKED';
  token: string;
  createdAt: string;
  expiresAt: string;
}

const TABS = ['ALL', 'PENDING', 'COMPLETED', 'REVOKED'];

const Invitations = () => {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [tab, setTab] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ email: '', role: 'TEACHER' });

  const { data: usageData } = useWorkspaceUsage();
  const isTeacherLimitReached = usageData ? usageData.usage.teachers >= usageData.limits.teachers : false;

  useEffect(() => { fetchInvites(); }, []);

  const fetchInvites = async () => {
    setIsLoading(true);
    try {
      const response = await inviteApi.list();
      if (response.success) setInvites(response.data || []);
    } catch (error) {
      toast.error('Failed to load invitations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await inviteApi.create(formData);
      if (response.success) {
        toast.success('Invitation sent successfully');
        setIsModalOpen(false);
        setFormData({ email: '', role: 'TEACHER' });
        fetchInvites();
      } else {
        toast.error(response.message || 'Failed to send invitation');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async (id: string) => {
    try {
      const response = await inviteApi.resend(id);
      if (response.success) { toast.success('Invitation resent successfully'); fetchInvites(); }
    } catch { toast.error('Failed to resend invitation'); }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this invitation?')) return;
    try {
      const response = await inviteApi.revoke(id);
      if (response.success) { toast.success('Invitation revoked'); fetchInvites(); }
    } catch { toast.error('Failed to revoke invitation'); }
  };

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/invite/${token}`);
    toast.success('Invite link copied to clipboard');
  };

  const filteredInvites = invites.filter((invite) => {
    if (tab === 'ALL') return true;
    return invite.status === tab;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <div className="inline-flex items-center gap-1.5 bg-neutral-50 px-2 py-0.5 rounded border border-neutral-200">
            <span className="w-1.5 h-1.5 bg-neutral-900 rounded-full" />
            <span className="text-[#6b6b6b] uppercase tracking-wider text-[10px] font-medium">Accepted</span>
          </div>
        );
      case 'REVOKED':
        return (
          <div className="inline-flex items-center gap-1.5 bg-neutral-50 px-2 py-0.5 rounded border border-neutral-200">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
            <span className="text-red-600 uppercase tracking-wider text-[10px] font-medium">Revoked</span>
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center gap-1.5 bg-neutral-50 px-2 py-0.5 rounded border border-neutral-200">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
            <span className="text-amber-700 uppercase tracking-wider text-[10px] font-medium">Pending</span>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6 overflow-hidden h-full text-[#0e0f10] ">
      {isLoading ? (
        <div className="flex items-center justify-center h-64 w-full">
          <ScaleLoader barCount={3} color="#0e0f10" height={20} width={5} />
        </div>
      ) : invites.length > 0 ? (
        <>
          {/* Header & Tabs Grid Container */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 ">
            <div className="flex items-center gap-1">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors -mb-[2px] ${tab === t
                    ? "border-[#0e0f10] text-[#0e0f10]"
                    : "border-transparent text-[#6b6b6b] hover:text-[#0e0f10]"
                  }`}
                >
                  {t === 'COMPLETED' ? 'ACCEPTED' : t}
                </button>
              ))}
            </div>
            
            <Button
              onClick={() => setIsModalOpen(true)}
              disabled={isTeacherLimitReached}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors border-none ring-0 self-end sm:self-auto text-xs font-medium tracking-wide ${
                isTeacherLimitReached 
                  ? "bg-neutral-100 text-neutral-400 cursor-not-allowed" 
                  : "bg-[#0e0f10] text-white hover:bg-neutral-800"
              }`}
              title={isTeacherLimitReached ? "Teacher limit reached for your plan" : "Invite Member"}
            >
              <UserPlus className="w-3.5 h-3.5" /> Invite Member
            </Button>
          </div>

          {/* Cleaned Modern Table Section */}
          {filteredInvites.length > 0 ? (
            <div className="bg-white border border-neutral-200/80 rounded overflow-hidden divide-y divide-neutral-100">
              {/* Table header */}
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3.5 bg-neutral-50/70">
                {['Email', 'Role', 'Status', 'Sent', 'Actions'].map((h) => (
                  <span key={h} className="text-[10px] text-[#6b6b6b] uppercase tracking-wider font-semibold">{h}</span>
                ))}
              </div>

              {/* Table Rows */}
                <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 290px)' }}>
                    {filteredInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="group grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-center py-4 px-5 transition-colors hover:bg-neutral-50/40 text-xs font-medium"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-neutral-50 rounded-md flex items-center justify-center border border-neutral-200 shrink-0">
                      <Mail className="w-3.5 h-3.5 text-[#6b6b6b] group-hover:text-[#0e0f10] transition-colors" />
                    </div>
                    <span className="text-[#0e0f10] font-normal">{invite.email}</span>
                  </div>

                  <span className="capitalize text-[#6b6b6b] font-normal">{invite.role.toLowerCase()}</span>

                  <div>{getStatusBadge(invite.status)}</div>

                  <span className="text-[#6b6b6b] font-normal">
                    {formatDistanceToNow(new Date(invite.createdAt), { addSuffix: true })}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => copyLink(invite.token)}
                      className="p-1.5 text-[#6b6b6b] hover:text-[#0e0f10] hover:bg-neutral-100 rounded-md transition-all"
                      title="Copy Link"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {invite.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleResend(invite.id)}
                          className="p-1.5 text-[#6b6b6b] hover:text-[#0e0f10] hover:bg-neutral-100 rounded-md transition-all"
                          title="Resend"
                        >
                          <RefreshCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRevoke(invite.id)}
                          className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                          title="Revoke"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
                </div>
            
            </div>
          ) : (
            <div className="text-center py-16 border border-dashed border-neutral-200 rounded-xl bg-neutral-50/20">
              <p className="text-[#6b6b6b] text-xs">
                No {tab.toLowerCase() === 'all' ? '' : tab.toLowerCase()} invitations found.
              </p>
            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <div className="text-center py-24 border border-dashed border-neutral-200 rounded-xl bg-white">
          <div className="w-12 h-12 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-neutral-200">
            <Mail className="w-5 h-5 text-[#6b6b6b]" />
          </div>
          <h3 className="text-[#0e0f10] font-medium mb-1 text-sm">No invitations yet</h3>
          <p className="text-[#6b6b6b] text-xs max-w-xs mx-auto mb-6">
            Invite your team members to start collaborating on your workspace.
          </p>
          <Button
            onClick={() => setIsModalOpen(true)}
            disabled={isTeacherLimitReached}
            className={`px-6 h-9 rounded-md transition-colors border-none ring-0 text-xs font-medium tracking-wide ${
              isTeacherLimitReached 
                ? "bg-neutral-100 text-neutral-400 cursor-not-allowed" 
                : "bg-[#0e0f10] text-white hover:bg-neutral-800"
            }`}
          >
            {isTeacherLimitReached ? "Limit Reached" : "Send Invite"}
          </Button>
        </div>
      )}

      {/* Overhauled Modal Layout */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-[2px]">
          <div className="bg-white rounded-xl border border-neutral-200 w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <h3 className="text-[#0e0f10] text-sm font-medium">Invite Team Member</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-[#0e0f10] hover:bg-neutral-100 rounded-md transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleInvite} className="p-6 space-y-5">
              <Input
                label="Email Address"
                type="email"
                placeholder="colleague@example.com"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="text-xs"
              />
              <div className="space-y-2">
                <label className="text-[#6b6b6b] text-xs font-medium">Assign Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {['TEACHER', 'ADMIN'].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setFormData({ ...formData, role })}
                      className={`py-2 px-4 rounded-md border text-xs font-medium transition-all ${formData.role === role
                        ? 'border-[#0e0f10] bg-neutral-50 text-[#0e0f10] shadow-sm'
                        : 'border-neutral-200 bg-white text-[#6b6b6b] hover:border-neutral-300'
                      }`}
                    >
                      {role.charAt(0) + role.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-9 rounded-md bg-[#0e0f10] text-white hover:bg-neutral-800 transition-colors border-none ring-0 text-xs font-medium tracking-wide shadow-sm"
                isLoading={isSubmitting}
              >
                Send Invitation
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invitations;