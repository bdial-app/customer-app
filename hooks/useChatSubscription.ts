"use client";
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase";
import { useAppDispatch, useAppSelector } from "./useAppStore";
import { setUnreadCount, incrementUnread } from "@/store/slices/chatSlice";
import { useUnreadCount } from "./useChat";
import { onReconnect } from "./useNetworkStatus";

/**
 * Global subscription hook — mounted once at app level.
 * Subscribes to user-level conversation updates for badge counts
 * and incoming message notifications.
 */
export function useChatSubscription() {
  const { user } = useAppSelector((state) => state.auth);
  const activeConversationId = useAppSelector((state) => state.chat.activeConversationId);
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);
  // Keep a ref so the broadcast callback always has the latest value
  const activeConversationRef = useRef(activeConversationId);
  activeConversationRef.current = activeConversationId;

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

    let channel = supabase.channel(`user:${user.id}:conversations`);
    channelRef.current = channel;

    function attachHandlers(ch: typeof channel) {
      ch
        .on("broadcast", { event: "conversation_update" }, (payload) => {
          const conversationId: string | undefined = payload?.payload?.conversationId;
          const role: "customer" | "provider" | undefined =
            payload?.payload?.role ?? undefined;

          // Don't increment unread if the user is currently viewing this conversation
          if (conversationId && conversationId === activeConversationRef.current) {
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
            queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
            return;
          }

          dispatch(incrementUnread(role));
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
        })
        .subscribe();
    }

    attachHandlers(channel);

    // Re-subscribe after network reconnection (Supabase WS may have dropped)
    const unsubReconnect = onReconnect(() => {
      try {
        if (channelRef.current && supabase) supabase.removeChannel(channelRef.current);
      } catch {}
      setTimeout(() => {
        if (!supabase) return;
        channel = supabase.channel(`user:${user.id}:conversations`);
        channelRef.current = channel;
        attachHandlers(channel);
        // Refresh data that may have arrived while disconnected
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
      }, 1000);
    });

    return () => {
      unsubReconnect();
      if (channelRef.current && supabase) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, queryClient, dispatch]);
}
