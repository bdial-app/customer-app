import { useQuery } from "@tanstack/react-query";
import {
  getProductById,
  ProductDetailsResponse,
} from "@/services/product.service";

export const useProduct = (id: string) => {
  return useQuery<ProductDetailsResponse>({
    queryKey: ["product", id],
    queryFn: () => getProductById(id),
    enabled: !!id,
  });
};
