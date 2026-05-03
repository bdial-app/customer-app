import { useQuery } from "@tanstack/react-query";
import {
  getTopLevelCategories,
  getAllCategories,
} from "@/services/category.service";

export const useTopLevelCategories = () => {
  return useQuery({
    queryKey: ["top-level-categories"],
    queryFn: getTopLevelCategories,
    staleTime: 10 * 60 * 1000, // 10 minutes — categories rarely change
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: (prev: any) => prev, // Show cached data instantly
  });
};

export const useAllCategories = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ["all-categories", page, limit],
    queryFn: () => getAllCategories(page, limit),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
  });
};
