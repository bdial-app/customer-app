import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
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
export const MY_PRODUCTS_KEY = ["my-products"];

/** The owner's catalogue, hidden items included (the public page hides them). */
export const useMyProducts = (enabled = true) =>
  useQuery({ queryKey: MY_PRODUCTS_KEY, queryFn: getMyProducts, enabled });

const invalidateProductQueries = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: MY_PRODUCTS_KEY });
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
