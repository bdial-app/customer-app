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

/** Invalidate both provider-status and provider-details so the products list refreshes */
const invalidateProductQueries = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: PROVIDER_STATUS_KEY });
  qc.invalidateQueries({ queryKey: ["provider-details"] });
};

export const useCreateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProductPayload) => createProduct(payload),
    onSuccess: () => invalidateProductQueries(qc),
  });
};

export const useUpdateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateProductPayload & { id: string }) =>
      updateProduct(id, payload),
    onSuccess: () => invalidateProductQueries(qc),
  });
};

export const useDeleteProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => invalidateProductQueries(qc),
  });
};
