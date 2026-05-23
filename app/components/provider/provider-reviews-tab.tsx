"use client";
import { motion } from "framer-motion";
import { IonIcon } from "@ionic/react";
import {
  star,
  personCircleOutline,
} from "ionicons/icons";
import { ProviderDetailsReview } from "@/services/provider.service";

interface ProviderReviewsTabProps {
  reviews: ProviderDetailsReview[];
}

const ProviderReviewsTab = ({ reviews }: ProviderReviewsTabProps) => {

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
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {review.reviewText}
                </p>
              )}
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
    </div>
  );
};

export default ProviderReviewsTab;
