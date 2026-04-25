"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import {
  type ReportEntityType,
  type ReportReason,
  REASONS_BY_TYPE,
  submitReport,
} from "@/services/report.service";
import { useNotification } from "../context/NotificationContext";
import { checkContent } from "@/utils/content-sanitizer";

const IonIcon = dynamic(
  () => import("@ionic/react").then((m) => m.IonIcon),
  { ssr: false },
);
import { closeOutline, alertCircleOutline } from "ionicons/icons";

interface ReportSheetProps {
  entityType: ReportEntityType;
  entityId: string;
  isOpen: boolean;
  onClose: () => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  "409": "You've already reported this. Our team is reviewing it.",
  CONFLICT: "You've already reported this. Our team is reviewing it.",
  "403": "You can't submit a report right now. Please try again later.",
  "429": "Too many reports. Please try again later.",
  "404": "The item you're trying to report was not found.",
  "400": "Unable to submit report. Please check your input.",
};

function getErrorMessage(error: any): string {
  const status = error?.response?.status?.toString();
  if (status && ERROR_MESSAGES[status]) return ERROR_MESSAGES[status];
  const msg = error?.response?.data?.message;
  if (typeof msg === "string") return msg;
  return "Something went wrong. Please try again.";
}

export default function ReportSheet({
  entityType,
  entityId,
  isOpen,
  onClose,
}: ReportSheetProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(
    null,
  );
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { notify } = useNotification();

  const reasons = REASONS_BY_TYPE[entityType] || [];

  const handleSubmit = async () => {
    if (!selectedReason) return;

    // Sanitize the description
    if (selectedReason === "other" && description.trim()) {
      const contentCheck = checkContent(description);
      if (contentCheck.flagged) {
        notify({
          title: "Inappropriate language",
          subtitle: "Please remove inappropriate language from your description.",
          variant: "error",
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await submitReport(
        entityType,
        entityId,
        selectedReason,
        selectedReason === "other" && description.trim()
          ? description.trim()
          : undefined,
      );
      notify({
        title: "Report submitted",
        subtitle: "Our team will review it shortly.",
        variant: "success",
      });
      handleClose();
    } catch (error: any) {
      notify({
        title: "Report failed",
        subtitle: getErrorMessage(error),
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    setDescription("");
    onClose();
  };

  const entityLabel =
    entityType === "provider"
      ? "business"
      : entityType === "product"
        ? "product"
        : "message";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[100]"
            onClick={handleClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 inset-x-0 z-[101] bg-white rounded-t-2xl max-h-[85vh] flex flex-col safe-area-bottom"
          >
            {/* Handle + Header */}
            <div className="flex-shrink-0 px-5 pt-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center">
                    <IonIcon
                      icon={alertCircleOutline}
                      className="w-5 h-5 text-red-500"
                    />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-slate-900">
                      Report {entityLabel}
                    </h3>
                    <p className="text-[12px] text-slate-400">
                      Select a reason below
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
                >
                  <IonIcon
                    icon={closeOutline}
                    className="w-5 h-5 text-slate-500"
                  />
                </button>
              </div>
            </div>

            {/* Reasons */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
              {reasons.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setSelectedReason(r.value)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-[14px] font-medium transition-all border ${
                    selectedReason === r.value
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-slate-100 bg-slate-50 text-slate-700 active:bg-slate-100"
                  }`}
                >
                  {r.label}
                </button>
              ))}

              {/* Description for "other" */}
              {selectedReason === "other" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="pt-2"
                >
                  <textarea
                    value={description}
                    onChange={(e) =>
                      setDescription(e.target.value.slice(0, 500))
                    }
                    placeholder="Please describe the issue (max 500 characters)"
                    rows={3}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
                  />
                  <p className="text-[11px] text-slate-400 text-right mt-1">
                    {description.length}/500
                  </p>
                </motion.div>
              )}
            </div>

            {/* Submit */}
            <div className="flex-shrink-0 px-5 py-4 border-t border-slate-100">
              <button
                onClick={handleSubmit}
                disabled={!selectedReason || isSubmitting}
                className={`w-full py-3 rounded-xl text-[15px] font-semibold transition-all ${
                  selectedReason && !isSubmitting
                    ? "bg-red-500 text-white active:bg-red-600 shadow-sm shadow-red-200"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {isSubmitting ? "Submitting…" : "Submit Report"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
