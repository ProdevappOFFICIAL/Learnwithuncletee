  'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { workspaceApi, type AuditLogFilters } from '@/lib/api/workspaces';
import { AuditLog } from '@/types';
import { ScaleLoader } from 'react-spinners';

const roleOptions = ['ALL', 'ADMIN', 'TEACHER'];
const actionOptions = [
  'ALL',
  'CLASS_CREATED',
  'CLASS_UPDATED',
  'CLASS_DELETED',
  'EXAM_CREATED',
  'EXAM_UPDATED',
  'EXAM_DELETED',
  'SUBJECT_CREATED',
  'SUBJECT_UPDATED',
  'SUBJECT_DELETED',
  'QUESTION_CREATED',
  'QUESTION_UPDATED',
  'QUESTION_DELETED',
  'WORKSPACE_CREATED',
];
const timeOptions = ['all', 'today', 'this_week', 'last_week'];

const formatAction = (action: string) => action.replace(/_/g, ' ');

const AuditLogs = () => {
  const [filters, setFilters] = React.useState<AuditLogFilters>({
    userRole: 'ALL',
    action: 'ALL',
    timeRange: 'all',
  });

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['workspace-audit-logs', filters],
    queryFn: async () => {
      const res = await workspaceApi.getAuditLogs(filters);
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to load audit logs');
      }
      return res.data;
    },
    staleTime: 60_000,
  });

  const getActionTone = (action: string) => {
    const normalizedAction = action.toLocaleUpperCase();

    if (normalizedAction.includes('DELETE')) {
      return 'bg-red-50 border-red-200 text-red-900';
    }

    if (normalizedAction.includes('CREATE')) {
      return 'bg-emerald-50 border-emerald-200 text-emerald-900';
    }

    if (normalizedAction.includes('UPDATE')) {
      return 'bg-blue-50 border-blue-200 text-blue-900';
    }

    return 'bg-white border-slate-200 text-slate-900';
  };

  const getDetails = (log: AuditLog) => {
    const previousName = log.metadata?.previousName;
    const updatedName = log.metadata?.updatedName;
    const previousQuestion = log.metadata?.previousQuestion;
    const updatedQuestion = log.metadata?.updatedQuestion;

    if (log.action.toUpperCase().includes('UPDATE')) {
      const previousValue = previousName ?? previousQuestion;
      const updatedValue = updatedName ?? updatedQuestion;

      if (previousValue && updatedValue) {
        return (
          <div className="flex space-x-1">
            <div>
              <span className="font-semibold">{log.user?.user_name || 'System'}</span> updated {String(previousValue)}
            </div>
            <div>
              <span className="font-semibold">to</span> {String(updatedValue)}
            </div>
          </div>
        );
      }
    }

    return log.description;
  };

  const updateFilter = <K extends keyof AuditLogFilters>(key: K, value: AuditLogFilters[K]) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  return (
    <div className="p-6 select-none">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-sm font-medium text-slate-900">Audit logs</h1>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isFetching ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="mb-4 flex w-full justify-between gap-3 rounded border border-slate-200 bg-white p-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700 w-full">
          User
          <select
            value={filters.userRole ?? 'ALL'}
            onChange={(event) => updateFilter('userRole', event.target.value as AuditLogFilters['userRole'])}
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role === 'ALL' ? 'All users' : role}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
          Action
          <select
            value={filters.action ?? 'ALL'}
            onChange={(event) => updateFilter('action', event.target.value)}
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 w-full"
          >
            {actionOptions.map((action) => (
              <option key={action} value={action}>
                {formatAction(action)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700" w-full>
          Time
          <select
            value={filters.timeRange ?? 'all'}
            onChange={(event) => updateFilter('timeRange', event.target.value as AuditLogFilters['timeRange'])}
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 w-full"
          >
            {timeOptions.map((time) => (
              <option key={time} value={time}>
                {time === 'all' ? 'All time' : time === 'today' ? 'Today' : time === 'this_week' ? 'This week' : 'Last week'}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center">
       <ScaleLoader barCount={3} color="#a7a7a7" height={12} width={4} />
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error instanceof Error ? error.message : 'Failed to load audit logs'}
        </div>
      )}

      {!isLoading && !isError && (!data || data.length === 0) && (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white p-8 text-slate-500">
          No audit activity yet.
        </div>
      )}

      {!isLoading && !isError && data && data.length > 0 && (
        <div className="overflow-x-auto rounded border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Time</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">User</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Action</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((log) => (
                <tr key={log.id} className={`${getActionTone(log.action)} border-l-4`}>
                  <td className="px-4 py-3">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {log.user?.user_name || 'System'}
                  </td>
                  <td className="px-4 py-3">
                    {formatAction(log.action)}
                  </td>
                  <td className="px-4 py-3">
                    {getDetails(log)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;