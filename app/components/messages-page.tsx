"use client";
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IonIcon } from "@ionic/react";
import {
  arrowBack,
  sendSharp,
  happyOutline,
  attachOutline,
  checkmarkDone,
  checkmark,
  ellipsisVertical,
  callOutline,
  imageOutline,
  closeCircle,
  trashOutline,
  alertCircleOutline,
  banOutline,
  volumeMuteOutline,
} from "ionicons/icons";
import { checkContent } from "@/utils/content-sanitizer";
import {
  useMessages,
  useSendMessage,
  useMarkAsRead,
  useConversationDetail,
  useChatRealtime,
  useTypingIndicator,
  useUploadMedia,
  usePresence,
  useArchiveConversation,
} from "@/hooks/useChat";
import { useQuery } from "@tanstack/react-query";
import { useAppSelector } from "@/hooks/useAppStore";
import { getProviderById } from "@/services/provider.service";
import type { ChatMessage } from "@/services/chat.service";
import ReportSheet from "./report-sheet";

interface MessagesPageProps {
  onBack: () => void;
  conversationId?: string;
  chatName?: string; // fallback display name
}

/** Format time for message bubbles */
function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** Format date header */
function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

/** Format "last seen" timestamp */
function formatLastSeen(dateStr: string | null): string {
  if (!dateStr) return "Offline";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "last seen just now";
  if (diffMins < 60) return `last seen ${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `last seen ${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "last seen yesterday";
  return `last seen ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

export default function MessagesPage({
  onBack,
  conversationId,
  chatName = "Messages",
}: MessagesPageProps) {
  const [messageText, setMessageText] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedPreview, setAttachedPreview] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initiallyScrolled = useRef(false);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);

  const { user } = useAppSelector((state) => state.auth);
  const typingUsers = useAppSelector((state) => state.chat.typingUsers);

  // Menu state
  const [showMenu, setShowMenu] = useState(false);
  const [reportSheetOpen, setReportSheetOpen] = useState(false);
  const [sendError, setSendError] = useState("");

  // Data hooks
  const { data: convDetail } = useConversationDetail(conversationId || null);
  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: messagesLoading,
  } = useMessages(conversationId || null);
  const sendMutation = useSendMessage(conversationId || null);
  const markReadMutation = useMarkAsRead(conversationId || null);
  const uploadMutation = useUploadMedia(conversationId || null);
  const archiveMutation = useArchiveConversation();
  const { startTyping, stopTyping } = useTypingIndicator(conversationId || null);

  // Realtime subscription
  useChatRealtime(conversationId || null);

  // Online presence for the other user
  const otherUserId = convDetail?.otherParticipant?.userId || null;
  const { data: presenceData } = usePresence(otherUserId);

  // Fetch provider phone number when customer is chatting with a provider
  const isCustomerView = convDetail?.myRole === "customer";
  const otherProviderId =
    convDetail?.otherParticipant?.role === "provider"
      ? convDetail.otherParticipant.providerId
      : null;
  const { data: providerData } = useQuery({
    queryKey: ["provider", otherProviderId],
    queryFn: () => getProviderById(otherProviderId!),
    enabled: isCustomerView && !!otherProviderId,
    staleTime: 5 * 60 * 1000,
  });
  const providerPhone: string | null = providerData?.contactNumber ?? null;

  // Flatten paginated messages
  const allMessages = useMemo(() => {
    if (!messagesData?.pages) return [];
    return messagesData.pages.flatMap((page) => page.messages);
  }, [messagesData]);

  // Display name from conversation detail or fallback
  const displayName = convDetail?.otherParticipant?.name || chatName;
  const avatarUrl = convDetail?.otherParticipant?.avatarUrl;

  // Get initials
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  // Typing indicator for this conversation
  const typingEntries = Object.entries(typingUsers).filter(
    ([key]) => key.startsWith(`${conversationId}:`) && !key.endsWith(`:${user?.id}`)
  );
  const isOtherTyping = typingEntries.length > 0;
  const typingName = isOtherTyping ? typingEntries[0][1].userName : "";

  // Mark as read on open and when new messages arrive
  useEffect(() => {
    if (conversationId && allMessages.length > 0) {
      const lastMsg = allMessages[allMessages.length - 1];
      if (lastMsg.senderId !== user?.id) {
        markReadMutation.mutate(lastMsg.id);
      }
    }
  }, [conversationId, allMessages.length]);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: initiallyScrolled.current ? "smooth" : "auto",
      });
    }
  }, []);

  useEffect(() => {
    if (allMessages.length > 0) {
      scrollToBottom();
      initiallyScrolled.current = true;
    }
  }, [allMessages.length, scrollToBottom]);

  // Infinite scroll — load older messages on scroll to top
  useEffect(() => {
    const trigger = loadMoreTriggerRef.current;
    const container = scrollRef.current;
    if (!trigger || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          const prevHeight = container.scrollHeight;
          fetchNextPage().then(() => {
            // Maintain scroll position after prepending older messages
            requestAnimationFrame(() => {
              const newHeight = container.scrollHeight;
              container.scrollTop += newHeight - prevHeight;
            });
          });
        }
      },
      { root: container, threshold: 0.1 }
    );

    observer.observe(trigger);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Send message
  const handleSend = async () => {
    const text = messageText.trim();
    if (!text && !attachedFile) return;
    setSendError("");

    // Content moderation check (client-side first)
    if (text && !checkContent(text).clean) {
      setSendError("Your message contains inappropriate language. Please revise.");
      return;
    }

    stopTyping();

    if (attachedFile) {
      // Upload then send as image message
      try {
        const { url, storageKey } = await uploadMutation.mutateAsync(attachedFile);
        await sendMutation.mutateAsync({
          content: text || undefined,
          messageType: "image",
          metadata: { url, storageKey },
        });
      } catch {
        // Upload failed — could show toast
      }
      setAttachedFile(null);
      setAttachedPreview(null);
    } else {
      sendMutation.mutate(
        { content: text, messageType: "text" },
        {
          onError: (err: any) => {
            const msg = err?.response?.data?.message || err?.message || "Failed to send";
            setSendError(Array.isArray(msg) ? msg.join(", ") : msg);
          },
        },
      );
    }

    setMessageText("");
    if (inputRef.current) inputRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageText(e.target.value);
    startTyping();
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  // File attachment
  const handleAttachClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be under 5MB");
      return;
    }
    setAttachedFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setAttachedPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setAttachedPreview(null);
    }
    e.target.value = "";
  };

  // Group messages by "blocks" — consecutive messages from same sender
  const grouped: { senderId: string; msgs: ChatMessage[] }[] = [];
  allMessages.forEach((msg) => {
    const last = grouped[grouped.length - 1];
    if (last && last.senderId === msg.senderId) {
      last.msgs.push(msg);
    } else {
      grouped.push({ senderId: msg.senderId, msgs: [msg] });
    }
  });

  // Date headers
  const messagesWithDates: { type: "date"; date: string }[] | { type: "group"; senderId: string; msgs: ChatMessage[] }[] = [];
  let lastDate = "";
  const enriched: Array<
    { type: "date"; date: string } | { type: "group"; senderId: string; msgs: ChatMessage[] }
  > = [];

  allMessages.forEach((msg) => {
    const msgDate = new Date(msg.createdAt).toDateString();
    if (msgDate !== lastDate) {
      enriched.push({ type: "date", date: msg.createdAt });
      lastDate = msgDate;
    }
    // Group consecutive
    const lastItem = enriched[enriched.length - 1];
    if (lastItem && lastItem.type === "group" && lastItem.senderId === msg.senderId) {
      lastItem.msgs.push(msg);
    } else {
      enriched.push({ type: "group", senderId: msg.senderId, msgs: [msg] });
    }
  });

  return (
    <div className="flex flex-col h-[100dvh] bg-[#F5F5F0] dark:bg-slate-900">
      {/* Header */}
      <div
        className="shrink-0 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 z-30"
        style={{ paddingTop: "max(env(safe-area-inset-top), 8px)" }}
      >
        <div className="flex items-center gap-2 px-3 py-2.5">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            aria-label="Go back"
            className="w-9 h-9 rounded-full flex items-center justify-center active:bg-slate-100 dark:active:bg-slate-700 transition-colors"
          >
            <IonIcon icon={arrowBack} className="text-xl text-slate-700 dark:text-slate-300" />
          </motion.button>

          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-9 h-9 rounded-full object-cover shrink-0" loading="lazy" decoding="async" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-white">{initials}</span>
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-[14px] font-bold text-slate-800 dark:text-white truncate leading-tight">
                {displayName}
              </h3>
              <p className="text-[11px] font-medium">
                {isOtherTyping ? (
                  <span className="text-amber-500">typing...</span>
                ) : presenceData?.isOnline ? (
                  <span className="text-emerald-500">Online</span>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500">{formatLastSeen(presenceData?.lastSeenAt ?? null)}</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {isCustomerView && providerPhone && (
              <motion.a
                href={`tel:${providerPhone}`}
                whileTap={{ scale: 0.9 }}
                className="w-9 h-9 rounded-full flex items-center justify-center active:bg-emerald-50"
                title={`Call ${displayName}`}
              >
                <IonIcon icon={callOutline} className="text-lg text-emerald-600" />
              </motion.a>
            )}
            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowMenu(!showMenu)}
                aria-label="More options"
                className="w-9 h-9 rounded-full flex items-center justify-center active:bg-slate-100 dark:active:bg-slate-700"
              >
                <IonIcon icon={ellipsisVertical} className="text-lg text-slate-600 dark:text-slate-400" />
              </motion.button>
              {/* Dropdown menu */}
              <AnimatePresence>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1.5 z-50 overflow-hidden"
                    >
                      {[
                        { icon: trashOutline, label: "Delete Chat", color: "text-red-500", action: () => {
                          if (conversationId) {
                            archiveMutation.mutate(conversationId, { onSuccess: onBack });
                          }
                        }},
                        { icon: alertCircleOutline, label: "Report", color: "text-amber-600", action: () => {
                          setShowMenu(false);
                          setReportSheetOpen(true);
                        }},
                        { icon: banOutline, label: "Block User", color: "text-red-500", action: () => {
                          setShowMenu(false);
                          alert("User blocked. You won't receive messages from them.");
                        }},
                        { icon: volumeMuteOutline, label: "Mute Notifications", color: "text-slate-600", action: () => {
                          setShowMenu(false);
                          alert("Notifications muted for this conversation.");
                        }},
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => { setShowMenu(false); item.action(); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-600 transition-colors"
                        >
                          <IonIcon icon={item.icon} className={`text-base ${item.color}`} />
                          <span className={`text-[13px] font-medium ${item.color === "text-red-500" ? "text-red-500" : "text-slate-700 dark:text-slate-300"}`}>
                            {item.label}
                          </span>
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Enquiry context card */}
      {convDetail?.type === "enquiry" && convDetail.contextTitle && (
        <div className="shrink-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-100 dark:border-slate-700 px-4 py-2">
          <div className="flex items-center gap-2.5">
            {convDetail.contextImageUrl && (
              <img
                src={convDetail.contextImageUrl}
                alt={convDetail.contextTitle}
                className="w-10 h-10 rounded-lg object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider">
                {convDetail.contextType === "product" ? "Product Enquiry" : "Service Enquiry"}
              </p>
              <p className="text-[13px] font-medium text-slate-700 dark:text-slate-300 truncate">
                {convDetail.contextTitle}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-1"
      >
        {/* Load more trigger */}
        <div ref={loadMoreTriggerRef} className="h-1" />
        {isFetchingNextPage && (
          <div className="flex justify-center py-2">
            <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
          </div>
        )}

        {/* Loading state */}
        {messagesLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!messagesLoading && allMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center mb-3">
              <span className="text-2xl">👋</span>
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Say hello!</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Start a conversation with {displayName}</p>
          </div>
        )}

        {enriched.map((entry, i) => {
          if (entry.type === "date") {
            return (
              <div key={`date-${i}`} className="flex justify-center mb-3 mt-2">
                <span className="text-[10px] font-medium text-slate-400 bg-white/80 dark:bg-slate-800/80 dark:text-slate-500 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
                  {formatDateHeader(entry.date)}
                </span>
              </div>
            );
          }

          const group = entry;
          const isSent = group.senderId === user?.id;

          return (
            <div
              key={`group-${i}`}
              className={`flex flex-col ${
                isSent ? "items-end" : "items-start"
              } gap-0.5 mb-2`}
            >
              {group.msgs.map((msg, mi) => {
                const isFirst = mi === 0;
                const isLast = mi === group.msgs.length - 1;

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className={`max-w-[78%] px-3 py-2 ${
                      isSent
                        ? `bg-slate-800 dark:bg-slate-700 text-white ${
                            isFirst && isLast
                              ? "rounded-2xl rounded-br-md"
                              : isFirst
                              ? "rounded-2xl rounded-br-md"
                              : isLast
                              ? "rounded-2xl rounded-tr-md"
                              : "rounded-2xl rounded-r-md"
                          }`
                        : `bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm ${
                            isFirst && isLast
                              ? "rounded-2xl rounded-bl-md"
                              : isFirst
                              ? "rounded-2xl rounded-bl-md"
                              : isLast
                              ? "rounded-2xl rounded-tl-md"
                              : "rounded-2xl rounded-l-md"
                          }`
                    }`}
                  >
                    {/* Image message */}
                    {msg.messageType === "image" && msg.metadata?.url && (
                      <div className="mb-1.5 -mx-1 -mt-0.5">
                        <img
                          src={msg.metadata.url}
                          alt="Shared image"
                          className="rounded-xl max-w-full max-h-60 object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}

                    {/* Enquiry card */}
                    {msg.messageType === "enquiry" && msg.metadata && (
                      <div className={`rounded-xl p-2.5 mb-1.5 -mx-0.5 ${isSent ? "bg-white/10" : "bg-amber-50 dark:bg-amber-900/30"}`}>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
                          📋 Product Enquiry
                        </p>
                        {msg.metadata.productName && (
                          <p className={`text-[12px] font-semibold ${isSent ? "text-white" : "text-slate-700 dark:text-slate-200"}`}>
                            {msg.metadata.productName}
                          </p>
                        )}
                        {msg.metadata.productPrice && (
                          <p className={`text-[11px] ${isSent ? "text-white/60" : "text-slate-500 dark:text-slate-400"}`}>
                            {msg.metadata.currency || "₹"}{msg.metadata.productPrice}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Text content */}
                    {msg.content && (
                      <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    )}

                    {/* Timestamp + read receipt */}
                    <div
                      className={`flex items-center gap-1 justify-end mt-0.5 ${
                        isSent ? "text-white/40" : "text-slate-400"
                      }`}
                    >
                      <span className="text-[9px]">{formatMessageTime(msg.createdAt)}</span>
                      {isSent && (
                        <IonIcon
                          icon={msg.status === "read" ? checkmarkDone : checkmark}
                          className={`text-[10px] ${
                            msg.status === "read" ? "text-sky-300" : isSent ? "text-white/40" : "text-slate-400"
                          }`}
                        />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          );
        })}

        {/* Typing indicator */}
        {isOtherTyping && (
          <div className="flex items-start mb-2">
            <div className="bg-white dark:bg-slate-800 shadow-sm rounded-2xl rounded-bl-md px-4 py-2.5">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Attachment preview */}
      {attachedFile && (
        <div className="shrink-0 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 px-3 py-2">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 rounded-xl p-2">
            {attachedPreview ? (
              <img src={attachedPreview} alt="Preview" className="w-14 h-14 rounded-lg object-cover" loading="lazy" decoding="async" />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
                <IonIcon icon={imageOutline} className="text-xl text-slate-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{attachedFile.name}</p>
              <p className="text-[10px] text-slate-400">{(attachedFile.size / 1024).toFixed(0)} KB</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => { setAttachedFile(null); setAttachedPreview(null); }}
            >
              <IonIcon icon={closeCircle} className="text-xl text-slate-400" />
            </motion.button>
          </div>
        </div>
      )}
      {/* Send error banner */}
      {sendError && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/30 border-t border-red-100 dark:border-red-800 flex items-center justify-between gap-2">
          <p className="text-xs text-red-600 flex-1">{sendError}</p>
          <button onClick={() => setSendError("")} className="text-xs text-red-400 font-medium shrink-0">Dismiss</button>
        </div>
      )}
      {/* Input bar */}
      <div
        className="shrink-0 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 px-3 py-2"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}
      >
        <div className="flex items-end gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleAttachClick}
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mb-0.5 active:bg-slate-100 dark:active:bg-slate-700"
          >
            <IonIcon icon={attachOutline} className="text-xl text-slate-500 dark:text-slate-400" />
          </motion.button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-2xl px-3.5 py-2 flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={messageText}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="flex-1 bg-transparent text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none resize-none max-h-[120px] leading-5"
              style={{ height: "auto" }}
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="shrink-0 mb-px"
            >
              <IonIcon icon={happyOutline} className="text-xl text-slate-400" />
            </motion.button>
          </div>

          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={handleSend}
            disabled={sendMutation.isPending || uploadMutation.isPending}
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mb-0.5 transition-colors ${
              messageText.trim() || attachedFile
                ? "bg-slate-800 dark:bg-slate-600 shadow-lg"
                : "bg-slate-200 dark:bg-slate-700"
            }`}
          >
            {sendMutation.isPending || uploadMutation.isPending ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <IonIcon
                icon={sendSharp}
                className={`text-base ${
                  messageText.trim() || attachedFile ? "text-white" : "text-slate-400"
                }`}
                style={{ transform: "rotate(-35deg)", marginLeft: 2 }}
              />
            )}
          </motion.button>
        </div>
      </div>

      {/* Report Sheet */}
      {conversationId && (
        <ReportSheet
          entityType="message"
          entityId={conversationId}
          isOpen={reportSheetOpen}
          onClose={() => setReportSheetOpen(false)}
        />
      )}
    </div>
  );
}
