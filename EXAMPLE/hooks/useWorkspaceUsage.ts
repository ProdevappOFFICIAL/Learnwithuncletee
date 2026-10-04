import { useQuery } from "@tanstack/react-query";
import { workspaceApi } from "@/lib/api/workspaces";
import { userApi } from "@/lib/api/users";

export interface WorkspaceUsageData {
  usage: {
    students: number;
    teachers: number;
    exams: number;
    aiCredits: number;
    questions?: number;
    subjects?: number;
    classes?: number;
  };
  limits: {
    students: number;
    teachers: number;
    exams: number;
    aiCredits: number;
    questions?: number;
    subjects?: number;
    classes?: number;
  };
}

export function useWorkspaceUsage() {
  return useQuery({
    queryKey: ["workspace-usage"],
    queryFn: async () => {
      const userRes = await userApi.me();
      if (!userRes.success || !userRes.data) {
        throw new Error("Failed to fetch user profile");
      }
      const workspaceId = userRes.data.workspaceId;
      const res = await workspaceApi.getUsage(workspaceId);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to fetch usage data");
      }
      return res.data as WorkspaceUsageData;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
