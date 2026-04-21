"use client";
import { motion, AnimatePresence } from "framer-motion";
import { IonIcon } from "@ionic/react";
import {
  checkmarkCircle,
  timeOutline,
  closeCircleOutline,
  callOutline,
  chatbubbleOutline,
  navigateOutline,
  receiptOutline,
  starOutline,
  refreshOutline,
  chevronForward,
  calendarOutline,
} from "ionicons/icons";
import { useState } from "react";

/* ── Types ── */

type BookingStatus =
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "pending";

interface Booking {
  id: string;
  providerName: string;
  providerAvatar: string;
  avatarColor: string;
  service: string;
  date: string;
  time: string;
  status: BookingStatus;
  price: string;
  rated?: boolean;
  rating?: number;
}

/* ── Mock Data ── */

const BOOKINGS: Booking[] = [
  {
    id: "B001",
    providerName: "Ahmed's Tailoring",
    providerAvatar: "AT",
    avatarColor: "from-amber-400 to-orange-500",
    service: "Suit Stitching — Navy Sherwani",
    date: "Today",
    time: "3:00 PM",
    status: "in_progress",
    price: "₹3,800",
  },
  {
    id: "B002",
    providerName: "QuickFix AC",
    providerAvatar: "QF",
    avatarColor: "from-sky-400 to-blue-500",
    service: "Full AC Service & Gas Refill",
    date: "Tomorrow",
    time: "10:00 AM",
    status: "confirmed",
    price: "₹499",
  },
  {
    id: "B003",
    providerName: "Glow Studio",
    providerAvatar: "GS",
    avatarColor: "from-pink-400 to-rose-500",
    service: "Bridal Trial Makeup",
    date: "Apr 25",
    time: "2:00 PM",
    status: "pending",
    price: "₹2,500",
  },
  {
    id: "B004",
    providerName: "Mehandi Arts",
    providerAvatar: "MA",
    avatarColor: "from-emerald-400 to-teal-500",
    service: "Bridal Mehandi — Full Hands",
    date: "Mar 15",
    time: "11:00 AM",
    status: "completed",
    price: "₹1,800",
    rated: true,
    rating: 5,
  },
  {
    id: "B005",
    providerName: "Royal Catering",
    providerAvatar: "RC",
    avatarColor: "from-purple-400 to-violet-500",
    service: "Event Catering — 50 guests",
    date: "Mar 10",
    time: "7:00 PM",
    status: "completed",
    price: "₹12,000",
    rated: false,
  },
  {
    id: "B006",
    providerName: "Stitch Perfect",
    providerAvatar: "SP",
    avatarColor: "from-red-400 to-pink-500",
    service: "Trouser Alteration",
    date: "Feb 28",
    time: "4:00 PM",
    status: "cancelled",
    price: "₹350",
  },
];

/* ── Status config ── */

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; color: string; bg: string; icon: string }
> = {
  in_progress: {
    label: "In Progress",
    color: "text-blue-600",
    bg: "bg-blue-50",
    icon: timeOutline,
  },
  confirmed: {
    label: "Confirmed",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    icon: checkmarkCircle,
  },
  pending: {
    label: "Pending",
    color: "text-amber-600",
    bg: "bg-amber-50",
    icon: timeOutline,
  },
  completed: {
    label: "Completed",
    color: "text-slate-500",
    bg: "bg-slate-50",
    icon: checkmarkCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-red-500",
    bg: "bg-red-50",
    icon: closeCircleOutline,
  },
};

type FilterKey = "active" | "past" | "all";

/* ── Component ── */

const OrdersContent = () => {
  const [filter, setFilter] = useState<FilterKey>("active");

  const filtered = BOOKINGS.filter((b) => {
    if (filter === "active")
      return ["confirmed", "in_progress", "pending"].includes(b.status);
    if (filter === "past")
      return ["completed", "cancelled"].includes(b.status);
    return true;
  });

  const activeCount = BOOKINGS.filter((b) =>
    ["confirmed", "in_progress", "pending"].includes(b.status)
  ).length;

  return (
    <div className="flex flex-col pb-4">
      {/* Stats strip */}
      <div className="px-4 pt-2 pb-3">
        <div className="flex gap-3">
          {[
            {
              label: "Active",
              value: activeCount,
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              label: "Completed",
              value: BOOKINGS.filter((b) => b.status === "completed").length,
              color: "text-emerald-600",
              bg: "bg-emerald-50",
            },
            {
              label: "Total Spent",
              value: "₹20.9K",
              color: "text-amber-600",
              bg: "bg-amber-50",
            },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex-1 ${stat.bg} rounded-xl p-3 text-center`}
            >
              <p className={`text-lg font-extrabold ${stat.color}`}>
                {stat.value}
              </p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 px-4 pb-3">
        {(["active", "past", "all"] as const).map((f) => (
          <motion.button
            key={f}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors capitalize ${
              filter === f
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {f === "active" ? `Active (${activeCount})` : f === "past" ? "Past" : "All"}
          </motion.button>
        ))}
      </div>

      {/* Bookings list */}
      <div className="flex flex-col gap-3 px-4">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16"
            >
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <IonIcon
                  icon={calendarOutline}
                  className="text-2xl text-slate-300"
                />
              </div>
              <p className="text-sm font-semibold text-slate-400">
                No bookings here
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Book a service to get started
              </p>
            </motion.div>
          ) : (
            filtered.map((booking, i) => {
              const statusCfg = STATUS_CONFIG[booking.status];
              const isActive = ["confirmed", "in_progress", "pending"].includes(
                booking.status
              );

              return (
                <motion.div
                  key={booking.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                >
                  {/* In progress live indicator */}
                  {booking.status === "in_progress" && (
                    <div className="bg-blue-500 px-4 py-1.5 flex items-center gap-2">
                      <div className="relative">
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        <motion.div
                          animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-white"
                        />
                      </div>
                      <span className="text-[10px] font-bold text-white tracking-wider">
                        LIVE — Work in progress
                      </span>
                    </div>
                  )}

                  <div className="p-3.5">
                    {/* Header row */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl bg-gradient-to-br ${booking.avatarColor} flex items-center justify-center shrink-0`}
                      >
                        <span className="text-[11px] font-bold text-white">
                          {booking.providerAvatar}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-[13px] font-bold text-slate-800 truncate">
                            {booking.providerName}
                          </h3>
                          <span
                            className={`shrink-0 flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusCfg.color} ${statusCfg.bg}`}
                          >
                            <IonIcon
                              icon={statusCfg.icon}
                              className="text-[10px]"
                            />
                            {statusCfg.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {booking.service}
                        </p>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-50">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <IonIcon
                          icon={calendarOutline}
                          className="text-xs text-slate-400"
                        />
                        {booking.date} • {booking.time}
                      </div>
                      <div className="ml-auto text-[13px] font-bold text-slate-800">
                        {booking.price}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 mt-3">
                      {isActive && (
                        <>
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 text-slate-700 text-[11px] font-semibold py-2 rounded-xl"
                          >
                            <IonIcon icon={chatbubbleOutline} className="text-sm" />
                            Chat
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 text-slate-700 text-[11px] font-semibold py-2 rounded-xl"
                          >
                            <IonIcon icon={callOutline} className="text-sm" />
                            Call
                          </motion.button>
                          {booking.status === "confirmed" && (
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              className="flex-1 flex items-center justify-center gap-1.5 bg-blue-50 text-blue-600 text-[11px] font-semibold py-2 rounded-xl"
                            >
                              <IonIcon icon={navigateOutline} className="text-sm" />
                              Track
                            </motion.button>
                          )}
                        </>
                      )}

                      {booking.status === "completed" && !booking.rated && (
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-amber-50 text-amber-700 text-[11px] font-semibold py-2 rounded-xl"
                        >
                          <IonIcon icon={starOutline} className="text-sm" />
                          Rate & Review
                        </motion.button>
                      )}

                      {booking.status === "completed" && booking.rated && (
                        <div className="flex items-center gap-1 px-3 py-2 bg-slate-50 rounded-xl">
                          <span className="text-[11px] text-slate-500">
                            You rated
                          </span>
                          <span className="text-[11px] font-bold text-amber-500">
                            {"★".repeat(booking.rating || 0)}
                          </span>
                        </div>
                      )}

                      {booking.status === "completed" && (
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 text-white text-[11px] font-semibold py-2 rounded-xl"
                        >
                          <IonIcon icon={refreshOutline} className="text-sm" />
                          Rebook
                        </motion.button>
                      )}

                      {booking.status === "cancelled" && (
                        <>
                          <div className="flex items-center gap-1 flex-1">
                            <span className="text-[11px] text-red-400">
                              Booking was cancelled
                            </span>
                          </div>
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center justify-center gap-1.5 bg-slate-100 text-slate-700 text-[11px] font-semibold py-2 px-4 rounded-xl"
                          >
                            <IonIcon icon={receiptOutline} className="text-sm" />
                            Details
                          </motion.button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Progress tracker for in_progress */}
                  {booking.status === "in_progress" && (
                    <div className="px-3.5 pb-3.5">
                      <div className="bg-slate-50 rounded-xl p-3">
                        <div className="flex items-center gap-3">
                          {[
                            { label: "Booked", done: true },
                            { label: "Working", done: true, active: true },
                            { label: "Quality Check", done: false },
                            { label: "Ready", done: false },
                          ].map((step, si) => (
                            <div
                              key={step.label}
                              className="flex flex-col items-center flex-1"
                            >
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                  step.done
                                    ? step.active
                                      ? "bg-blue-500"
                                      : "bg-emerald-500"
                                    : "bg-slate-200"
                                }`}
                              >
                                {step.done && (
                                  <span className="text-[8px] text-white font-bold">
                                    {step.active ? "●" : "✓"}
                                  </span>
                                )}
                              </div>
                              <span className="text-[8px] text-slate-500 mt-1 text-center leading-tight">
                                {step.label}
                              </span>
                              {/* Connector */}
                              {si < 3 && (
                                <div
                                  className={`absolute h-px w-[calc(25%-20px)] ${
                                    step.done ? "bg-emerald-300" : "bg-slate-200"
                                  }`}
                                  style={{ display: "none" }}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                        {/* Progress bar */}
                        <div className="mt-2 h-1 bg-slate-200 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "50%" }}
                            transition={{ duration: 1, delay: 0.3 }}
                            className="h-full bg-blue-500 rounded-full"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OrdersContent;
