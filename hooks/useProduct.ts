import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  ProductDetailsResponse,
  CreateProductPayload,
  UpdateProductPayload,
} from "@/services/product.service";
import { PROVIDER_STATUS_KEY } from "./useMyProvider";

export const useProduct = (id: string) => {
  return useQuery<ProductDetailsResponse>({
    queryKey: ["product", id],
    queryFn: () => getProductById(id),
    enabled: !!id,
  });
};

export const useCreateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProductPayload) => createProduct(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROVIDER_STATUS_KEY });
    },
  });
};

export const useUpdateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateProductPayload & { id: string }) =>
      updateProduct(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROVIDER_STATUS_KEY });
    },
  });
};

export const useDeleteProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROVIDER_STATUS_KEY });
    },
  });
};
