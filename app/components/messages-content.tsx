"use client";
import { motion, AnimatePresence } from "framer-motion";
import { IonIcon } from "@ionic/react";
import { searchOutline, checkmarkDone, checkmark, imageOutline } from "ionicons/icons";
import { useState } from "react";

interface MessagesContentProps {
  onChatClick: (chatName: string) => void;
}

interface Chat {
  id: string;
  name: string;
  avatar: string;
  avatarColor: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  service?: string;
  isImage?: boolean;
  delivered?: boolean;
  read?: boolean;
}

const CHATS: Chat[] = [
  {
    id: "1",
    name: "Ahmed's Tailoring",
    avatar: "AT",
    avatarColor: "from-amber-400 to-orange-500",
    lastMessage: "Your suit is ready for pickup! 🎉",
    time: "2m",
    unread: 2,
    online: true,
    service: "Tailoring",
    read: false,
  },
  {
    id: "2",
    name: "Glow Studio",
    avatar: "GS",
    avatarColor: "from-pink-400 to-rose-500",
    lastMessage: "Confirmed for tomorrow at 3 PM",
    time: "15m",
    unread: 0,
    online: true,
    service: "Beauty Salon",
    delivered: true,
    read: true,
  },
  {
    id: "3",
    name: "QuickFix AC Repair",
    avatar: "QF",
    avatarColor: "from-sky-400 to-blue-500",
    lastMessage: "The technician is on the way",
    time: "1h",
    unread: 1,
    online: false,
    service: "AC Service",
  },
  {
    id: "4",
    name: "Mehandi Arts by Zahra",
    avatar: "MA",
    avatarColor: "from-emerald-400 to-teal-500",
    lastMessage: "Sent a photo",
    time: "3h",
    unread: 0,
    online: false,
    service: "Mehandi",
    isImage: true,
    delivered: true,
    read: true,
  },
  {
    id: "5",
    name: "Royal Catering",
    avatar: "RC",
    avatarColor: "from-purple-400 to-violet-500",
    lastMessage: "Menu has been updated for your event",
    time: "Yesterday",
    unread: 0,
    online: false,
    service: "Catering",
    delivered: true,
    read: false,
  },
  {
    id: "6",
    name: "Stitch Perfect",
    avatar: "SP",
    avatarColor: "from-red-400 to-pink-500",
    lastMessage: "Thank you for choosing us! Rate your experience",
    time: "2d",
    unread: 0,
    online: false,
    service: "Alterations",
    delivered: true,
    read: true,
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

const MessagesContent = ({ onChatClick }: MessagesContentProps) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filtered = CHATS.filter((c) => {
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.service?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || c.unread > 0;
    return matchesSearch && matchesFilter;
  });

  const totalUnread = CHATS.reduce((sum, c) => sum + c.unread, 0);

  return (
    <div className="flex flex-col">
      {/* Search bar */}
      <div className="px-4 pt-2 pb-1">
        <div className="flex items-center gap-2.5 bg-slate-100 rounded-xl px-3.5 py-2.5">
          <IonIcon icon={searchOutline} className="text-base text-slate-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
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
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {f === "all" ? "All" : `Unread (${totalUnread})`}
          </motion.button>
        ))}
      </div>

      {/* Chat list */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex flex-col"
      >
        <AnimatePresence>
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 px-4"
            >
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <IonIcon icon={searchOutline} className="text-2xl text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-400">No conversations found</p>
            </motion.div>
          ) : (
            filtered.map((chat) => (
              <motion.div
                key={chat.id}
                variants={item}
                layout
                whileTap={{ backgroundColor: "rgba(0,0,0,0.03)" }}
                onClick={() => onChatClick(chat.name)}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-slate-50 active:bg-slate-50 transition-colors"
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div
                    className={`w-12 h-12 rounded-full bg-gradient-to-br ${chat.avatarColor} flex items-center justify-center`}
                  >
                    <span className="text-sm font-bold text-white">
                      {chat.avatar}
                    </span>
                  </div>
                  {/* Online dot */}
                  {chat.online && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4
                      className={`text-[14px] leading-tight truncate ${
                        chat.unread > 0
                          ? "font-bold text-slate-900"
                          : "font-semibold text-slate-700"
                      }`}
                    >
                      {chat.name}
                    </h4>
                    <span
                      className={`text-[11px] shrink-0 ${
                        chat.unread > 0
                          ? "font-semibold text-amber-500"
                          : "text-slate-400"
                      }`}
                    >
                      {chat.time}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <div className="flex items-center gap-1 min-w-0 flex-1">
                      {/* Delivery status for sent messages */}
                      {chat.delivered && (
                        <IonIcon
                          icon={chat.read ? checkmarkDone : checkmark}
                          className={`text-xs shrink-0 ${
                            chat.read ? "text-blue-500" : "text-slate-400"
                          }`}
                        />
                      )}
                      {chat.isImage && (
                        <IonIcon
                          icon={imageOutline}
                          className="text-xs text-slate-400 shrink-0"
                        />
                      )}
                      <p
                        className={`text-[12px] truncate ${
                          chat.unread > 0
                            ? "text-slate-700 font-medium"
                            : "text-slate-500"
                        }`}
                      >
                        {chat.lastMessage}
                      </p>
                    </div>
                    {/* Unread badge */}
                    {chat.unread > 0 && (
                      <div className="shrink-0 min-w-[20px] h-5 rounded-full bg-amber-500 flex items-center justify-center px-1.5">
                        <span className="text-[10px] font-bold text-white">
                          {chat.unread}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Service tag */}
                  {chat.service && (
                    <span className="inline-block mt-1 text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
                      {chat.service}
                    </span>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default MessagesContent;
