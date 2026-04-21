"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IonIcon } from "@ionic/react";
import {
  searchOutline,
  checkmarkDone,
  checkmark,
  personCircleOutline,
  callOutline,
  chatbubbleOutline,
  timeOutline,
  flashOutline,
  storefrontOutline,
} from "ionicons/icons";

interface ProviderMessagesContentProps {
  onChatClick: (chatName: string) => void;
}

interface CustomerChat {
  id: string;
  name: string;
  avatar: string;
  avatarColor: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  enquiryType?: "quote" | "booking" | "general";
  listing?: string;
  read?: boolean;
  delivered?: boolean;
}

const PROVIDER_CHATS: CustomerChat[] = [
  {
    id: "1",
    name: "Fatima Bensalem",
    avatar: "FB",
    avatarColor: "from-teal-400 to-emerald-500",
    lastMessage: "How much for a full bridal mehendi?",
    time: "5m",
    unread: 1,
    online: true,
    enquiryType: "quote",
    listing: "Mehendi & Henna",
  },
  {
    id: "2",
    name: "Aisha Khan",
    avatar: "AK",
    avatarColor: "from-violet-400 to-purple-500",
    lastMessage: "Can I book for this Saturday?",
    time: "23m",
    unread: 1,
    online: true,
    enquiryType: "booking",
    listing: "Tailoring",
  },
  {
    id: "3",
    name: "Mohammed Qureshi",
    avatar: "MQ",
    avatarColor: "from-amber-400 to-orange-500",
    lastMessage: "Thank you! The suit fits perfectly",
    time: "2h",
    unread: 0,
    online: false,
    enquiryType: "general",
    listing: "Tailoring",
    delivered: true,
    read: true,
  },
  {
    id: "4",
    name: "Maryam Saifee",
    avatar: "MS",
    avatarColor: "from-pink-400 to-rose-500",
    lastMessage: "Do you offer catering for 50 people?",
    time: "1d",
    unread: 0,
    online: false,
    enquiryType: "quote",
    listing: "Catering",
    delivered: true,
    read: false,
  },
  {
    id: "5",
    name: "Husain Burhanpurwala",
    avatar: "HB",
    avatarColor: "from-sky-400 to-blue-500",
    lastMessage: "Sent you the reference image",
    time: "2d",
    unread: 0,
    online: false,
    enquiryType: "general",
    listing: "Mehendi & Henna",
    delivered: true,
    read: true,
  },
];

const QUICK_REPLIES = [
  "Thank you for your enquiry!",
  "Yes, available! Let me share details.",
  "I'll send you a quote shortly.",
  "Sorry, fully booked for that date.",
];

const enquiryBadge = {
  quote: { label: "Quote", cls: "bg-amber-50 text-amber-700" },
  booking: { label: "Booking", cls: "bg-teal-50 text-teal-700" },
  general: { label: "Chat", cls: "bg-slate-50 text-slate-600" },
};

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

  const filtered = PROVIDER_CHATS.filter((c) => {
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.listing?.toLowerCase().includes(search.toLowerCase());
    if (filter === "unread") return matchesSearch && c.unread > 0;
    if (filter === "quotes") return matchesSearch && c.enquiryType === "quote";
    return matchesSearch;
  });

  const totalUnread = PROVIDER_CHATS.reduce((s, c) => s + c.unread, 0);
  const quoteCount = PROVIDER_CHATS.filter((c) => c.enquiryType === "quote").length;

  return (
    <div className="flex flex-col">
      {/* Stats strip */}
      <div className="px-4 pt-2 pb-1 flex gap-2">
        <div className="flex-1 bg-teal-50 rounded-xl px-3 py-2 flex items-center gap-2">
          <IonIcon icon={chatbubbleOutline} className="text-teal-600 text-sm" />
          <div>
            <p className="text-sm font-bold text-teal-700">{totalUnread}</p>
            <p className="text-[9px] text-teal-600/60">Unread</p>
          </div>
        </div>
        <div className="flex-1 bg-amber-50 rounded-xl px-3 py-2 flex items-center gap-2">
          <IonIcon icon={flashOutline} className="text-amber-600 text-sm" />
          <div>
            <p className="text-sm font-bold text-amber-700">{quoteCount}</p>
            <p className="text-[9px] text-amber-600/60">Quote Requests</p>
          </div>
        </div>
        <div className="flex-1 bg-blue-50 rounded-xl px-3 py-2 flex items-center gap-2">
          <IonIcon icon={timeOutline} className="text-blue-600 text-sm" />
          <div>
            <p className="text-sm font-bold text-blue-700">&lt;5m</p>
            <p className="text-[9px] text-blue-600/60">Avg Reply</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pt-2 pb-1">
        <div className="flex items-center gap-2.5 bg-slate-100 rounded-xl px-3.5 py-2.5">
          <IonIcon icon={searchOutline} className="text-base text-slate-400" />
          <input
            type="text"
            placeholder="Search customers or listings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
          />
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 px-4 py-2">
        {([
          { key: "all" as const, label: "All" },
          { key: "unread" as const, label: `Unread (${totalUnread})` },
          { key: "quotes" as const, label: `Quotes (${quoteCount})` },
        ]).map((f) => (
          <motion.button
            key={f.key}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter(f.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === f.key
                ? "bg-teal-600 text-white"
                : "bg-slate-100 text-slate-500"
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
            className="shrink-0 px-3 py-1.5 rounded-full bg-teal-50 text-teal-700 text-[10px] font-medium border border-teal-100 active:bg-teal-100"
          >
            {reply}
          </button>
        ))}
      </div>

      {/* Chat list */}
      <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col">
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
            filtered.map((chat) => {
              const badge = enquiryBadge[chat.enquiryType ?? "general"];
              return (
                <motion.div
                  key={chat.id}
                  variants={item}
                  layout
                  onClick={() => onChatClick(chat.name)}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-slate-50 active:bg-slate-50 transition-colors"
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${chat.avatarColor} flex items-center justify-center`}>
                      <span className="text-sm font-bold text-white">{chat.avatar}</span>
                    </div>
                    {chat.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`text-[14px] leading-tight truncate ${chat.unread > 0 ? "font-bold text-slate-900" : "font-semibold text-slate-700"}`}>
                        {chat.name}
                      </h4>
                      <span className={`text-[11px] shrink-0 ${chat.unread > 0 ? "font-semibold text-teal-500" : "text-slate-400"}`}>
                        {chat.time}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <div className="flex items-center gap-1 min-w-0 flex-1">
                        {chat.delivered && (
                          <IonIcon
                            icon={chat.read ? checkmarkDone : checkmark}
                            className={`text-xs shrink-0 ${chat.read ? "text-teal-500" : "text-slate-400"}`}
                          />
                        )}
                        <p className={`text-[12px] truncate ${chat.unread > 0 ? "text-slate-700 font-medium" : "text-slate-500"}`}>
                          {chat.lastMessage}
                        </p>
                      </div>
                      {chat.unread > 0 && (
                        <div className="shrink-0 min-w-[20px] h-5 rounded-full bg-teal-500 flex items-center justify-center px-1.5">
                          <span className="text-[10px] font-bold text-white">{chat.unread}</span>
                        </div>
                      )}
                    </div>
                    {/* Tags row */}
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${badge.cls}`}>
                        {badge.label}
                      </span>
                      {chat.listing && (
                        <span className="text-[9px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                          <IonIcon icon={storefrontOutline} className="text-[8px]" />
                          {chat.listing}
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
    </div>
  );
};

export default ProviderMessagesContent;
