import { useMutation } from "@tanstack/react-query";
import { updateUser, UpdateUserPayload } from "@/services/user.service";
import { useAppDispatch } from "./useAppStore";
import { setUser } from "@/store/slices/authSlice";
import { getTokenSync } from "@/utils/storage";

export const useUpdateUser = () => {
  const dispatch = useAppDispatch();
  return useMutation({
    mutationFn: (payload: UpdateUserPayload) => updateUser(payload),
    onSuccess: (data) => {
      // Sync updated profile back into Redux
      dispatch(
        setUser({
          token: getTokenSync() ?? "",
          user: data,
        }),
      );
    },
  });
};
