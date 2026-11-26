import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Session + dashboard data: fresh enough without refetch storms.
      staleTime: 60 * 1000,
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});
