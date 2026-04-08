import { useQuery } from "@tanstack/react-query";

export function usePremium() {
  const { data, isLoading } = useQuery<{ subscription: any }>({
    queryKey: ["/api/stripe/subscription"],
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  return {
    isPremium: data?.subscription != null,
    isLoading,
  };
}

export const FREE_SUBSCRIPTION_LIMIT = 5;
