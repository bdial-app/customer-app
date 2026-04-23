"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient, useQuery, useMutation, useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase";
import * as chatApi from "@/services/chat.service";
import type { ChatMessage, ConversationDetail } from "@/services/chat.service";
import { useAppDispatch, useAppSelector } from "./useAppStore";
import { setTyping, setActiveConversation } from "@/store/slices/chatSlice";

// ─── Conversation List ────────────────────────

export function useConversations(
  filter: "all" | "unread" | "enquiries" = "all",
  search?: string,
  role?: "customer" | "provider",
) {
  return useQuery({
    queryKey: ["conversations", filter, search, role],
    queryFn: () => chatApi.getConversations({ filter, search, limit: 50, role }),
    refetchInterval: 30000, // Fallback polling every 30s
    staleTime: 5000,
  });
}

// ─── Single Conversation Detail ───────────────

export function useConversationDetail(conversationId: string | null) {
  return useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => chatApi.getConversation(conversationId!),
    enabled: !!conversationId,
  });
}

// ─── Messages with cursor pagination ──────────

export function useMessages(conversationId: string | null) {
  return useInfiniteQuery({
    queryKey: ["messages", conversationId],
    queryFn: ({ pageParam }) =>
      chatApi.getMessages(conversationId!, {
        limit: 30,
        before: pageParam as string | undefined,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.oldestTimestamp ?? undefined : undefined,
    enabled: !!conversationId,
    initialPageParam: undefined as string | undefined,
  });
}

// ─── Send Message (with optimistic update) ────

export function useSendMessage(conversationId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      content?: string;
      messageType?: "text" | "image" | "enquiry" | "quote_request";
      metadata?: Record<string, any>;
    }) => {
      const clientMessageId = crypto.randomUUID();
      return chatApi.sendMessage(conversationId!, {
        ...data,
        clientMessageId,
      });
    },
    onSuccess: () => {
      // Invalidate both messages and conversations to update previews
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

// ─── Mark as Read ─────────────────────────────

export function useMarkAsRead(conversationId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (upToMessageId?: string) =>
      chatApi.markAsRead(conversationId!, upToMessageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
    },
  });
}

// ─── Upload Media ─────────────────────────────

export function useUploadMedia(conversationId: string | null) {
  return useMutation({
    mutationFn: (file: File) => chatApi.uploadChatMedia(conversationId!, file),
  });
}

// ─── Unread Count ─────────────────────────────

export function useUnreadCount(enabled = true) {
  return useQuery({
    queryKey: ["unreadCount"],
    queryFn: chatApi.getUnreadCount,
    refetchInterval: 30000,
    enabled,
  });
}

// ─── Create Conversation ──────────────────────

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: chatApi.createConversation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

// ─── Archive Conversation ─────────────────────

export function useArchiveConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => chatApi.archiveConversation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
    },
  });
}

// ─── Realtime: subscribe to a single conversation channel ─

export function useChatRealtime(conversationId: string | null) {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!conversationId || !supabase) return;

    dispatch(setActiveConversation(conversationId));

    const channel = supabase.channel(`chat:${conversationId}`);
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "new_message" }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      })
      .on("broadcast", { event: "typing" }, (payload) => {
        const { userId, userName, isTyping } = payload.payload;
        dispatch(setTyping({ conversationId, userId, userName, isTyping }));
      })
      .on("broadcast", { event: "read_receipt" }, () => {
        queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      })
      .subscribe();

    return () => {
      dispatch(setActiveConversation(null));
      if (supabase && channel) supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId, queryClient, dispatch]);
}

// ─── Typing indicator (debounced) ─────────────

export function useTypingIndicator(conversationId: string | null) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  const startTyping = useCallback(() => {
    if (!conversationId || isTypingRef.current) return;
    isTypingRef.current = true;
    chatApi.sendTypingIndicator(conversationId, true);

    // Auto-stop after 3s of no keystrokes
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      chatApi.sendTypingIndicator(conversationId, false);
    }, 3000);
  }, [conversationId]);

  const stopTyping = useCallback(() => {
    if (!conversationId || !isTypingRef.current) return;
    isTypingRef.current = false;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    chatApi.sendTypingIndicator(conversationId, false);
  }, [conversationId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (isTypingRef.current && conversationId) {
        chatApi.sendTypingIndicator(conversationId, false);
      }
    };
  }, [conversationId]);

  return { startTyping, stopTyping };
}

// ─── Heartbeat (call periodically while app is open) ─

export function useHeartbeat() {
  useEffect(() => {
    // Send immediately, then every 60s
    chatApi.sendHeartbeat().catch(() => {});
    const interval = setInterval(() => {
      chatApi.sendHeartbeat().catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, []);
}

// ─── Presence (online status of another user) ─

export function usePresence(userId: string | null) {
  return useQuery({
    queryKey: ["presence", userId],
    queryFn: () => chatApi.getPresence(userId!),
    enabled: !!userId,
    refetchInterval: 30000, // Re-check every 30s
    staleTime: 15000,
  });
}
