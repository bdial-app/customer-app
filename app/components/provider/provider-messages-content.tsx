"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IonIcon } from "@ionic/react";
import {
  searchOutline,
  checkmarkDone,
  checkmark,
  chatbubbleOutline,
  timeOutline,
  flashOutline,
  storefrontOutline,
} from "ionicons/icons";
import { useConversations } from "@/hooks/useChat";
import { useSendMessage } from "@/hooks/useChat";
import { useAppSelector } from "@/hooks/useAppStore";
import type { ConversationListItem } from "@/services/chat.service";

interface ProviderMessagesContentProps {
  onChatClick: (conversationId: string) => void;
}

const QUICK_REPLIES = [
  "Thank you for your enquiry!",
  "Yes, available! Let me share details.",
  "I'll send you a quote shortly.",
  "Sorry, fully booked for that date.",
];

const enquiryBadge: Record<string, { label: string; cls: string }> = {
  product: { label: "Quote", cls: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" },
  listing: { label: "Booking", cls: "bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400" },
  provider: { label: "Chat", cls: "bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300" },
  direct: { label: "Chat", cls: "bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300" },
};

/** Generate avatar initials from a name */
function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const GRADIENTS = [
  "from-teal-400 to-emerald-500",
  "from-violet-400 to-purple-500",
  "from-amber-400 to-orange-500",
  "from-pink-400 to-rose-500",
  "from-sky-400 to-blue-500",
  "from-emerald-400 to-teal-500",
  "from-purple-400 to-violet-500",
  "from-red-400 to-pink-500",
];

function getGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

const ProviderMessagesContent = ({ onChatClick }: ProviderMessagesContentProps) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "quotes">("all");
  const { user } = useAppSelector((state) => state.auth);

  const apiFilter = filter === "quotes" ? "enquiries" : filter === "unread" ? "unread" : "all";
  const { data, isLoading } = useConversations(apiFilter as any, search || undefined, "provider");

  const conversations = data?.conversations || [];
  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0);
  const quoteCount = conversations.filter((c) => c.type === "enquiry").length;

  return (
    <div className="flex flex-col">
      {/* Stats strip */}
      <div className="px-4 pt-2 pb-1 flex gap-2">
        <div className="flex-1 bg-teal-50 dark:bg-teal-900/30 rounded-xl px-3 py-2 flex items-center gap-2">
          <IonIcon icon={chatbubbleOutline} className="text-teal-600 dark:text-teal-400 text-sm" />
          <div>
            <p className="text-sm font-bold text-teal-700 dark:text-teal-300">{totalUnread}</p>
            <p className="text-[9px] text-teal-600/60 dark:text-teal-400/60">Unread</p>
          </div>
        </div>
        <div className="flex-1 bg-amber-50 dark:bg-amber-900/30 rounded-xl px-3 py-2 flex items-center gap-2">
          <IonIcon icon={flashOutline} className="text-amber-600 dark:text-amber-400 text-sm" />
          <div>
            <p className="text-sm font-bold text-amber-700 dark:text-amber-300">{quoteCount}</p>
            <p className="text-[9px] text-amber-600/60 dark:text-amber-400/60">Enquiries</p>
          </div>
        </div>
        <div className="flex-1 bg-blue-50 dark:bg-blue-900/30 rounded-xl px-3 py-2 flex items-center gap-2">
          <IonIcon icon={timeOutline} className="text-blue-600 dark:text-blue-400 text-sm" />
          <div>
            <p className="text-sm font-bold text-blue-700 dark:text-blue-300">&lt;5m</p>
            <p className="text-[9px] text-blue-600/60 dark:text-blue-400/60">Avg Reply</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pt-2 pb-1">
        <div className="flex items-center gap-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl px-3.5 py-2.5">
          <IonIcon icon={searchOutline} className="text-base text-slate-400" />
          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
          />
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 px-4 py-2">
        {([
          { key: "all" as const, label: "All" },
          { key: "unread" as const, label: `Unread (${totalUnread})` },
          { key: "quotes" as const, label: `Enquiries (${quoteCount})` },
        ]).map((f) => (
          <motion.button
            key={f.key}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter(f.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === f.key
                ? "bg-teal-600 text-white"
                : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300"
            }`}
          >
            {f.label}
          </motion.button>
        ))}
      </div>

      {/* Quick reply suggestions */}
      <div className="px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
        {QUICK_REPLIES.map((reply, i) => (
          <button
            key={i}
            className="shrink-0 px-3 py-1.5 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-[10px] font-medium border border-teal-100 dark:border-teal-800 active:bg-teal-100 dark:active:bg-teal-900/50"
          >
            {reply}
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="flex flex-col gap-1 px-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 py-3 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-4/5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chat list */}
      {!isLoading && (
        <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col">
          <AnimatePresence>
            {conversations.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 px-4"
              >
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                  <IonIcon icon={searchOutline} className="text-2xl text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-sm font-medium text-slate-400 dark:text-slate-500">No conversations found</p>
              </motion.div>
            ) : (
              conversations.map((conv) => {
                const name = conv.otherParticipant.name;
                const isSentByMe = conv.lastMessageSenderId === user?.id;
                const badgeKey = conv.contextType || "direct";
                const badge = enquiryBadge[badgeKey] || enquiryBadge.direct;

                return (
                  <motion.div
                    key={conv.id}
                    variants={item}
                    layout
                    onClick={() => onChatClick(conv.id)}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-slate-50 dark:border-slate-800 active:bg-slate-50 dark:active:bg-slate-800 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {conv.otherParticipant.avatarUrl ? (
                        <img
                          src={conv.otherParticipant.avatarUrl}
                          alt={name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getGradient(name)} flex items-center justify-center`}>
                          <span className="text-sm font-bold text-white">{getInitials(name)}</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className={`text-[14px] leading-tight truncate ${conv.unreadCount > 0 ? "font-bold text-slate-900 dark:text-white" : "font-semibold text-slate-700 dark:text-slate-200"}`}>
                          {name}
                        </h4>
                        <span className={`text-[11px] shrink-0 ${conv.unreadCount > 0 ? "font-semibold text-teal-500" : "text-slate-400"}`}>
                          {formatRelativeTime(conv.lastMessageAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <div className="flex items-center gap-1 min-w-0 flex-1">
                          {isSentByMe && (
                            <IonIcon
                              icon={conv.lastMessageStatus === "read" ? checkmarkDone : checkmark}
                              className={`text-xs shrink-0 ${conv.lastMessageStatus === "read" ? "text-teal-500" : "text-slate-400"}`}
                            />
                          )}
                          <p className={`text-[12px] truncate ${conv.unreadCount > 0 ? "text-slate-700 dark:text-slate-200 font-medium" : "text-slate-500 dark:text-slate-400"}`}>
                            {conv.lastMessagePreview || "Start a conversation"}
                          </p>
                        </div>
                        {conv.unreadCount > 0 && (
                          <div className="shrink-0 min-w-[20px] h-5 rounded-full bg-teal-500 flex items-center justify-center px-1.5">
                            <span className="text-[10px] font-bold text-white">{conv.unreadCount}</span>
                          </div>
                        )}
                      </div>
                      {/* Tags row */}
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${badge.cls}`}>
                          {badge.label}
                        </span>
                        {conv.contextTitle && (
                          <span className="text-[9px] text-slate-400 bg-slate-50 dark:bg-slate-700 dark:text-slate-400 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                            <IonIcon icon={storefrontOutline} className="text-[8px]" />
                            {conv.contextTitle}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default ProviderMessagesContent;
