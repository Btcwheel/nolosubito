import { useQuery } from "@tanstack/react-query";
import { offersService } from "@/services/offers";

// Configurazioni a anticipo zero: caricate solo quando in home si sceglie "Anticipo 0€".
export function useZeroAdvanceConfigs(enabled) {
  return useQuery({
    queryKey: ["offers-zero-advance-configs"],
    queryFn: () => offersService.listZeroAdvanceConfigs(),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
