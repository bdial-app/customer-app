import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acceptLegalDocuments,
  getLegalDocument,
  getLegalDocuments,
  getMyLegalStatus,
  type LegalAcceptMethod,
} from "@/services/legal.service";

export const MY_LEGAL_KEY = ["legal", "me"] as const;

/** Every legal document (titles and versions, no text). */
export function useLegalDocuments() {
  return useQuery({
    queryKey: ["legal", "documents"],
    queryFn: getLegalDocuments,
    staleTime: 10 * 60_000,
  });
}

/** One document's live text. */
export function useLegalDocument(slug: string | null) {
  return useQuery({
    queryKey: ["legal", "document", slug],
    queryFn: () => getLegalDocument(slug as string),
    enabled: !!slug,
    staleTime: 10 * 60_000,
    retry: 1,
  });
}

/** What the signed-in person still has to accept. */
export function useMyLegalStatus(enabled: boolean) {
  return useQuery({
    queryKey: MY_LEGAL_KEY,
    queryFn: getMyLegalStatus,
    enabled,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useAcceptLegal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ documents, method }: { documents: { slug: string; version: number }[]; method: LegalAcceptMethod }) =>
      acceptLegalDocuments(documents, method),
    onSuccess: (status) => qc.setQueryData(MY_LEGAL_KEY, status),
  });
}
