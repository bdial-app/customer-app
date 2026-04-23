"use client";
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase";
import { useAppDispatch, useAppSelector } from "./useAppStore";
import { setUnreadCount, incrementUnread, setTyping } from "@/store/slices/chatSlice";
import { useUnreadCount } from "./useChat";

/**
 * Global subscription hook — mounted once at app level.
 * Subscribes to user-level conversation updates for badge counts
 * and incoming message notifications.
 */
export function useChatSubscription() {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);

  // Fetch initial unread count
  const { data: unreadData } = useUnreadCount(!!user);

  useEffect(() => {
    if (unreadData) {
      dispatch(setUnreadCount({
        total: unreadData.unreadCount,
        customer: unreadData.customerUnreadCount ?? 0,
        provider: unreadData.providerUnreadCount ?? 0,
      }));
    }
  }, [unreadData, dispatch]);

  // Subscribe to user-level conversation updates
  useEffect(() => {
    if (!user?.id || !supabase) return;

    const channel = supabase.channel(`user:${user.id}:conversations`);
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "conversation_update" }, (payload) => {
        // A new message arrived in one of our conversations
        const role: "customer" | "provider" | undefined =
          payload?.payload?.role ?? undefined;
        dispatch(incrementUnread(role));
        // Refresh conversation list
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
      })
      .subscribe();

    return () => {
      if (channelRef.current && supabase) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, queryClient, dispatch]);
}
