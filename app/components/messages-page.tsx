"use client";
import React, { useState, useRef, useEffect } from "react";
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
} from "ionicons/icons";

interface MessagesPageProps {
  onBack: () => void;
  chatName?: string;
}

interface MessageData {
  id: string;
  type: "sent" | "received";
  text: string;
  time: string;
  read?: boolean;
  name?: string;
}

const INITIAL_MESSAGES: MessageData[] = [
  {
    id: "1",
    type: "received",
    text: "Assalamu Alaikum! Thank you for reaching out. How can I help you today?",
    time: "10:00 AM",
    name: "Provider",
  },
  {
    id: "2",
    type: "sent",
    text: "Walaikum Assalam! I need a suit stitched for a wedding next month.",
    time: "10:02 AM",
    read: true,
  },
  {
    id: "3",
    type: "received",
    text: "Sure! I can help with that. Do you have a specific design in mind, or would you like to browse our catalog?",
    time: "10:03 AM",
    name: "Provider",
  },
  {
    id: "4",
    type: "sent",
    text: "I have a reference photo, let me share it",
    time: "10:04 AM",
    read: true,
  },
  {
    id: "5",
    type: "sent",
    text: "Something like this with the navy blue fabric",
    time: "10:04 AM",
    read: true,
  },
  {
    id: "6",
    type: "received",
    text: "Great choice! That's a classic sherwani style. For navy blue fabric with that cut, it would be around ₹3,500–₹4,500 depending on the material.",
    time: "10:06 AM",
    name: "Provider",
  },
  {
    id: "7",
    type: "received",
    text: "When is the wedding? I'll need about 10–12 days for stitching.",
    time: "10:06 AM",
    name: "Provider",
  },
  {
    id: "8",
    type: "sent",
    text: "The wedding is on March 15th. Can we do a fitting this Saturday?",
    time: "10:08 AM",
    read: false,
  },
];

export default function MessagesPage({
  onBack,
  chatName = "Messages",
}: MessagesPageProps) {
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<MessageData[]>(INITIAL_MESSAGES);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initiallyScrolled = useRef(false);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: initiallyScrolled.current ? "smooth" : "auto",
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
    initiallyScrolled.current = true;
  }, [messages]);

  const handleSend = () => {
    const text = messageText.trim();
    if (!text) return;

    const now = new Date();
    const time = now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    setMessages((prev) => [
      ...prev,
      {
        id: `sent-${Date.now()}`,
        type: "sent",
        text,
        time,
        read: false,
      },
    ]);
    setMessageText("");

    // Auto-resize textarea back
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageText(e.target.value);
    // Auto-resize
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  // Get initials from chat name
  const initials = chatName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  // Group messages by "blocks" — consecutive messages from same sender
  const grouped: { type: "sent" | "received"; msgs: MessageData[] }[] = [];
  messages.forEach((msg) => {
    const last = grouped[grouped.length - 1];
    if (last && last.type === msg.type) {
      last.msgs.push(msg);
    } else {
      grouped.push({ type: msg.type, msgs: [msg] });
    }
  });

  return (
    <div className="flex flex-col h-[100dvh] bg-[#F5F5F0]">
      {/* Header */}
      <div
        className="shrink-0 bg-white border-b border-slate-100 z-30"
        style={{ paddingTop: "max(env(safe-area-inset-top), 8px)" }}
      >
        <div className="flex items-center gap-2 px-3 py-2.5">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center active:bg-slate-100 transition-colors"
          >
            <IonIcon icon={arrowBack} className="text-xl text-slate-700" />
          </motion.button>

          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-white">{initials}</span>
            </div>
            <div className="min-w-0">
              <h3 className="text-[14px] font-bold text-slate-800 truncate leading-tight">
                {chatName}
              </h3>
              <p className="text-[11px] text-emerald-500 font-medium">Online</p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="w-9 h-9 rounded-full flex items-center justify-center active:bg-slate-100"
            >
              <IonIcon icon={callOutline} className="text-lg text-slate-600" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="w-9 h-9 rounded-full flex items-center justify-center active:bg-slate-100"
            >
              <IonIcon icon={ellipsisVertical} className="text-lg text-slate-600" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-1"
      >
        {/* Date header */}
        <div className="flex justify-center mb-3">
          <span className="text-[10px] font-medium text-slate-400 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
            Today
          </span>
        </div>

        {grouped.map((group, gi) => (
          <div
            key={gi}
            className={`flex flex-col ${
              group.type === "sent" ? "items-end" : "items-start"
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
                    msg.type === "sent"
                      ? `bg-[#1a1a2e] text-white ${
                          isFirst && isLast
                            ? "rounded-2xl rounded-br-md"
                            : isFirst
                            ? "rounded-2xl rounded-br-md"
                            : isLast
                            ? "rounded-2xl rounded-tr-md"
                            : "rounded-2xl rounded-r-md"
                        }`
                      : `bg-white text-slate-800 shadow-sm ${
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
                  <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                  </p>
                  <div
                    className={`flex items-center gap-1 justify-end mt-0.5 ${
                      msg.type === "sent" ? "text-white/40" : "text-slate-400"
                    }`}
                  >
                    <span className="text-[9px]">{msg.time}</span>
                    {msg.type === "sent" && (
                      <IonIcon
                        icon={msg.read ? checkmarkDone : checkmark}
                        className={`text-[10px] ${
                          msg.read ? "text-sky-300" : "text-white/40"
                        }`}
                      />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Input bar */}
      <div
        className="shrink-0 bg-white border-t border-slate-100 px-3 py-2"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}
      >
        <div className="flex items-end gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mb-0.5 active:bg-slate-100"
          >
            <IonIcon icon={attachOutline} className="text-xl text-slate-500" />
          </motion.button>

          <div className="flex-1 bg-slate-100 rounded-2xl px-3.5 py-2 flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={messageText}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none resize-none max-h-[120px] leading-5"
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
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mb-0.5 transition-colors ${
              messageText.trim()
                ? "bg-[#1a1a2e] shadow-lg"
                : "bg-slate-200"
            }`}
          >
            <IonIcon
              icon={sendSharp}
              className={`text-base ${
                messageText.trim() ? "text-white" : "text-slate-400"
              }`}
              style={{ transform: "rotate(-35deg)", marginLeft: 2 }}
            />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
