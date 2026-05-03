"use client";
import { motion, AnimatePresence } from "framer-motion";
import { IonIcon } from "@ionic/react";
import { searchOutline, checkmarkDone, checkmark, imageOutline, chatbubblesOutline } from "ionicons/icons";
import { useState, memo } from "react";
import { useConversations } from "@/hooks/useChat";
import type { ConversationListItem } from "@/services/chat.service";
import { useAppSelector } from "@/hooks/useAppStore";

interface MessagesContentProps {
  onChatClick: (conversationId: string) => void;
}

/** Generate avatar initials from a name */
function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/** Deterministic gradient from name for avatar color */
const GRADIENTS = [
  "from-amber-400 to-orange-500",
  "from-pink-400 to-rose-500",
  "from-sky-400 to-blue-500",
  "from-emerald-400 to-teal-500",
  "from-purple-400 to-violet-500",
  "from-red-400 to-pink-500",
  "from-teal-400 to-emerald-500",
  "from-violet-400 to-purple-500",
];

function getGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

/** Format timestamp to relative time */
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

const MessagesContent = memo(({ onChatClick }: MessagesContentProps) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const { user } = useAppSelector((state) => state.auth);

  const { data, isLoading } = useConversations(
    filter === "unread" ? "unread" : "all",
    search || undefined,
    "customer",
  );

  const conversations = data?.conversations || [];
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div className="flex flex-col pb-20">
      {/* Search bar */}
      <div className="px-4 pt-2 pb-1">
        <div className="flex items-center gap-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl px-3.5 py-2.5">
          <IonIcon icon={searchOutline} className="text-base text-slate-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-800 dark:text-white placeholder:text-slate-400 outline-none"
          />
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 px-4 py-2">
        {(["all", "unread"] as const).map((f) => (
          <motion.button
            key={f}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === f
                ? "bg-slate-800 dark:bg-white text-white dark:text-slate-900"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
            }`}
          >
            {f === "all" ? "All" : `Unread (${totalUnread})`}
          </motion.button>
        ))}
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="flex flex-col gap-1 px-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 py-3 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                <div className="h-3 bg-slate-100 dark:bg-slate-600 rounded w-4/5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chat list */}
      {!isLoading && (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-col"
        >
          <AnimatePresence>
            {conversations.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 px-4"
              >
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <IonIcon icon={chatbubblesOutline} className="text-2xl text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-400">
                  {search ? "No conversations found" : "No messages yet"}
                </p>
                {!search && (
                  <p className="text-xs text-slate-300 mt-1 text-center">
                    Start chatting with a service provider from their page
                  </p>
                )}
              </motion.div>
            ) : (
              conversations.map((conv) => {
                const name = conv.otherParticipant.name;
                const isSentByMe = conv.lastMessageSenderId === user?.id;

                return (
                  <motion.div
                    key={conv.id}
                    variants={item}
                    layout
                    whileTap={{ backgroundColor: "rgba(0,0,0,0.03)" }}
                    onClick={() => onChatClick(conv.id)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open conversation with ${name}`}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onChatClick(conv.id); }}
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
                        <div
                          className={`w-12 h-12 rounded-full bg-gradient-to-br ${getGradient(name)} flex items-center justify-center`}
                        >
                          <span className="text-sm font-bold text-white">
                            {getInitials(name)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4
                          className={`text-[14px] leading-tight truncate ${
                            conv.unreadCount > 0
                              ? "font-bold text-slate-900 dark:text-white"
                              : "font-semibold text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {name}
                        </h4>
                        <span
                          className={`text-[11px] shrink-0 ${
                            conv.unreadCount > 0
                              ? "font-semibold text-amber-500"
                              : "text-slate-400"
                          }`}
                        >
                          {formatRelativeTime(conv.lastMessageAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <div className="flex items-center gap-1 min-w-0 flex-1">
                          {/* Delivery status for sent messages */}
                          {isSentByMe && (
                            <IonIcon
                              icon={conv.lastMessageStatus === "read" ? checkmarkDone : checkmark}
                              className={`text-xs shrink-0 ${
                                conv.lastMessageStatus === "read" ? "text-blue-500" : "text-slate-400"
                              }`}
                            />
                          )}
                          {conv.lastMessagePreview?.startsWith("📷") && (
                            <IonIcon
                              icon={imageOutline}
                              className="text-xs text-slate-400 shrink-0"
                            />
                          )}
                          <p
                            className={`text-[12px] truncate ${
                              conv.unreadCount > 0
                                ? "text-slate-700 dark:text-slate-200 font-medium"
                                : "text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            {conv.lastMessagePreview || "Start a conversation"}
                          </p>
                        </div>
                        {/* Unread badge */}
                        {conv.unreadCount > 0 && (
                          <div className="shrink-0 min-w-[20px] h-5 rounded-full bg-amber-500 flex items-center justify-center px-1.5">
                            <span className="text-[10px] font-bold text-white">
                              {conv.unreadCount}
                            </span>
                          </div>
                        )}
                      </div>
                      {/* Context tag */}
                      {conv.contextTitle && (
                        <span className="inline-block mt-1 text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          {conv.contextTitle}
                        </span>
                      )}
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
});

MessagesContent.displayName = "MessagesContent";

export default MessagesContent;
