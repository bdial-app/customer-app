"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { IonIcon } from "@ionic/react";
import {
  star,
  chatbubbleOutline,
  closeOutline,
  sendOutline,
  personCircleOutline,
} from "ionicons/icons";
import { List, ListInput } from "konsta/react";
import { BottomSheet } from "../bottom-sheet";
import { ProviderDetailsReview } from "@/services/provider.service";
import { useReplyToReview } from "@/hooks/useMyProvider";
import { checkContent } from "@/utils/content-sanitizer";
import { useNotification } from "@/app/context/NotificationContext";

interface ProviderReviewsTabProps {
  reviews: ProviderDetailsReview[];
}

const ProviderReviewsTab = ({ reviews }: ProviderReviewsTabProps) => {
  const [replySheet, setReplySheet] = useState(false);
  const [selectedReview, setSelectedReview] = useState<ProviderDetailsReview | null>(null);
  const [replyText, setReplyText] = useState("");
  const replyMutation = useReplyToReview();
  const { notify } = useNotification();

  const handleOpenReply = (review: ProviderDetailsReview) => {
    setSelectedReview(review);
    setReplyText("");
    setReplySheet(true);
  };

  const handleSubmitReply = () => {
    if (selectedReview && replyText.trim()) {
      const contentCheck = checkContent(replyText.trim());
      if (contentCheck.flagged) {
        notify({ title: "Inappropriate language", subtitle: "Please remove inappropriate language from your reply.", variant: "error" });
        return;
      }
      replyMutation.mutate(
        { reviewId: selectedReview.id, replyText: replyText.trim() },
        { onSuccess: () => setReplySheet(false) },
      );
    }
  };

  // Calculate rating distribution
  const ratingCounts = [5, 4, 3, 2, 1].map((r) => ({
    stars: r,
    count: reviews.filter((rv) => rv.starRating === r).length,
  }));
  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? (reviews.reduce((sum, r) => sum + r.starRating, 0) / totalReviews).toFixed(1)
      : "0.0";

  return (
    <div className="animate-in fade-in duration-300">
      {/* Rating Summary */}
      {totalReviews > 0 && (
        <div className="mx-4 mt-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-800 dark:text-white">{avgRating}</p>
              <div className="flex items-center gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <IonIcon
                    key={s}
                    icon={star}
                    className={`text-sm ${s <= Math.round(Number(avgRating)) ? "text-amber-400" : "text-slate-200"}`}
                  />
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">{totalReviews} reviews</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {ratingCounts.map((r) => (
                <div key={r.stars} className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 w-3">{r.stars}</span>
                  <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: totalReviews > 0 ? `${(r.count / totalReviews) * 100}%` : "0%" }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      className="h-full bg-amber-400 rounded-full"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 w-5 text-right">{r.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white">
          Customer Reviews ({totalReviews})
        </h3>
      </div>

      {totalReviews > 0 ? (
        <div className="px-4 space-y-3">
          {reviews.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm dark:shadow-none"
            >
              {/* Reviewer info */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                    <IonIcon icon={personCircleOutline} className="text-xl text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">
                      {review.reviewer?.name || "Customer"}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(review.postedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <IonIcon
                      key={s}
                      icon={star}
                      className={`text-xs ${s <= review.starRating ? "text-amber-400" : "text-slate-200"}`}
                    />
                  ))}
                </div>
              </div>

              {/* Review text */}
              {review.reviewText && (
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                  {review.reviewText}
                </p>
              )}

              {/* Reply action */}
              <div className="flex justify-end border-t border-slate-50 dark:border-slate-700 pt-2">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleOpenReply(review)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-50 dark:bg-teal-900/30 active:bg-teal-100 dark:active:bg-teal-900/50"
                >
                  <IonIcon icon={chatbubbleOutline} className="text-teal-600 text-sm" />
                  <span className="text-xs font-semibold text-teal-600">Reply</span>
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="px-4 py-12 text-center">
          <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <IonIcon icon={star} className="text-4xl text-amber-300" />
          </div>
          <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1">
            No reviews yet
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[250px] mx-auto">
            Reviews from customers will appear here once you start getting bookings
          </p>
        </div>
      )}

      <div className="h-20" />

      {/* Reply Sheet */}
      <BottomSheet
        opened={replySheet}
        onClose={() => setReplySheet(false)}
        title="Reply to Review"
        headerLeft={
          <button onClick={() => setReplySheet(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
            <IonIcon icon={closeOutline} className="w-5 h-5 text-gray-500 dark:text-slate-400" />
          </button>
        }
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {selectedReview && (
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <IonIcon
                    key={s}
                    icon={star}
                    className={`text-xs ${s <= selectedReview.starRating ? "text-amber-400" : "text-slate-200"}`}
                  />
                ))}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                {selectedReview.reviewText || "No comment"}
              </p>
            </div>
          )}
          <List strongIos insetIos>
            <ListInput
              label="Your Reply"
              type="textarea"
              placeholder="Thank the customer for their feedback..."
              value={replyText}
              onChange={(e: any) => setReplyText(e.target.value.slice(0, 2000))}
              inputClassName="!h-32 resize-none"
            />
          </List>
          <div className="px-4 pb-4 mt-auto">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmitReply}
              disabled={!replyText.trim()}
              className="w-full py-3.5 rounded-xl bg-teal-500 text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <IonIcon icon={sendOutline} className="text-lg" />
              Send Reply
            </motion.button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};

export default ProviderReviewsTab;
