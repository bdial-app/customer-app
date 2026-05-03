"use client";
import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { IonIcon } from "@ionic/react";
import { arrowBack, checkmarkDoneOutline } from "ionicons/icons";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from "@/hooks/useNotifications";
import NotificationItemCard from "./NotificationItem";
import NotificationEmptyState from "./NotificationEmptyState";
import { resolveDeepLink } from "@/utils/deep-link";
import type { NotificationItem } from "@/services/notification.service";

interface NotificationListProps {
  open: boolean;
  onClose: () => void;
}

export default function NotificationList({ open, onClose }: NotificationListProps) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { data, isLoading } = useNotifications(page, undefined, filter);
  const markRead = useMarkAsRead();
  const markAllRead = useMarkAllAsRead();
  const deleteNotif = useDeleteNotification();

  const handlePress = useCallback(
    (notification: NotificationItem) => {
      if (!notification.isRead) {
        markRead.mutate(notification.id);
      }
      const url = resolveDeepLink(notification.data);
      onClose();
      router.push(url);
    },
    [markRead, onClose, router]
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteNotif.mutate(id);
    },
    [deleteNotif]
  );

  const notifications = data?.data || [];
  const meta = data?.meta;

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed inset-0 z-[100] bg-white dark:bg-slate-900 overflow-y-auto"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {/* Header */}
          <div
            className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800"
            style={{ paddingTop: "max(env(safe-area-inset-top), 8px)" }}
          >
            <div className="flex items-center justify-between px-4 py-3">
              <button
                onClick={onClose}
                className="text-blue-500 font-semibold text-sm active:opacity-50 flex items-center gap-1"
              >
                <IonIcon icon={arrowBack} className="text-lg" />
                Back
              </button>
              <h2 className="text-base font-bold text-slate-800 dark:text-white">
                Notifications
              </h2>
              <button
                onClick={() => markAllRead.mutate()}
                className="text-blue-500 font-medium text-xs active:opacity-50 flex items-center gap-0.5"
                disabled={markAllRead.isPending}
              >
                <IonIcon icon={checkmarkDoneOutline} className="text-sm" />
                Read all
              </button>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 px-4 pb-2">
              {(["all", "unread"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setFilter(f);
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    filter === f
                      ? "bg-amber-500 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {f === "all" ? "All" : "Unread"}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <NotificationEmptyState />
          ) : (
            <div className="divide-y divide-slate-50">
              {notifications.map((n) => (
                <NotificationItemCard
                  key={n.id}
                  notification={n}
                  onPress={handlePress}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 py-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-slate-400">
                {page} / {meta.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page >= meta.totalPages}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
