import { useQuery } from "@tanstack/react-query";
import { getWarningsUnreadCount, getMyWarnings } from "@/services/report.service";

export const WARNINGS_UNREAD_KEY = ["warnings-unread-count"];
export const WARNINGS_ALL_KEY = ["my-warnings"];

export const useWarningsUnreadCount = () => {
  return useQuery({
    queryKey: WARNINGS_UNREAD_KEY,
    queryFn: getWarningsUnreadCount,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};

export const useMyWarnings = () => {
  return useQuery({
    queryKey: WARNINGS_ALL_KEY,
    queryFn: getMyWarnings,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
    placeholderData: (prev: any) => prev,
    refetchOnWindowFocus: false,
  });
};
