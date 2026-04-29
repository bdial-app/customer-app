import { useQuery } from "@tanstack/react-query";
import {
  getTopLevelCategories,
  getAllCategories,
} from "@/services/category.service";

export const useTopLevelCategories = () => {
  return useQuery({
    queryKey: ["top-level-categories"],
    queryFn: getTopLevelCategories,
    staleTime: 5 * 60 * 1000, // 5 minutes — categories rarely change
    refetchOnWindowFocus: false,
  });
};

export const useAllCategories = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ["all-categories", page, limit],
    queryFn: () => getAllCategories(page, limit),
  });
};
