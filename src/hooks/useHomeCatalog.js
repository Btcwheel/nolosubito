import { useQuery } from "@tanstack/react-query";
import { offersService } from "@/services/offers";

export const HOME_CATALOG_KEY = ["offers-home-catalog"];

export function useHomeCatalog() {
  return useQuery({
    queryKey: HOME_CATALOG_KEY,
    queryFn: () => offersService.listWithMinPrice(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
}
