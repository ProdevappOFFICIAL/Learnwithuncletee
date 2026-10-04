import { useQuery } from "@tanstack/react-query";
import { userApi } from "@/lib/api/users";
import { User } from "@/types";

export function useUser() {
  return useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const res = await userApi.me();
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to fetch user profile");
      }
      return res.data as User;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}
