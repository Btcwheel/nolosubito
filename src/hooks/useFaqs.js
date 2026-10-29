import { useQuery } from "@tanstack/react-query";
import { faqsService } from "@/services/faqs";

export const FAQS_KEY = ["faqs-published"];

export function useFaqs() {
  return useQuery({
    queryKey: FAQS_KEY,
    queryFn: () => faqsService.listPublished(),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}
