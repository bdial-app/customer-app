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
import { Sheet, Page, Navbar, Button, Block, List, ListInput } from "konsta/react";
import { ListingReview } from "@/services/listing.service";

interface ProviderReviewsTabProps {
  reviews: ListingReview[];
}

const ProviderReviewsTab = ({ reviews }: ProviderReviewsTabProps) => {
  const [replySheet, setReplySheet] = useState(false);
  const [selectedReview, setSelectedReview] = useState<ListingReview | null>(null);
  const [replyText, setReplyText] = useState("");

  const handleOpenReply = (review: ListingReview) => {
    setSelectedReview(review);
    setReplyText("");
    setReplySheet(true);
  };

  const handleSubmitReply = () => {
    // TODO: Integrate with reply API when available
    if (selectedReview && replyText.trim()) {
      console.log("Reply to review:", selectedReview.id, replyText);
    }
    setReplySheet(false);
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
        <div className="mx-4 mt-4 bg-white rounded-2xl border border-slate-100 p-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-800">{avgRating}</p>
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
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
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
        <h3 className="text-sm font-bold text-slate-800">
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
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm"
            >
              {/* Reviewer info */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                    <IonIcon icon={personCircleOutline} className="text-xl text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
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
                <p className="text-sm text-slate-700 leading-relaxed mb-3">
                  {review.reviewText}
                </p>
              )}

              {/* Reply action */}
              <div className="flex justify-end border-t border-slate-50 pt-2">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleOpenReply(review)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-50 active:bg-teal-100"
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
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <IonIcon icon={star} className="text-4xl text-amber-300" />
          </div>
          <h4 className="text-base font-bold text-slate-800 mb-1">
            No reviews yet
          </h4>
          <p className="text-sm text-slate-500 max-w-[250px] mx-auto">
            Reviews from customers will appear here once you start getting bookings
          </p>
        </div>
      )}

      <div className="h-20" />

      {/* Reply Sheet */}
      <Sheet
        opened={replySheet}
        onBackdropClick={() => setReplySheet(false)}
        className="pb-safe rounded-t-3xl min-h-[400px]"
      >
        <Page className="flex flex-col">
          <Navbar
            title="Reply to Review"
            left={
              <Button clear onClick={() => setReplySheet(false)}>
                <IonIcon icon={closeOutline} className="w-5 h-5" />
              </Button>
            }
          />
          {selectedReview && (
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
              <div className="flex items-center gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <IonIcon
                    key={s}
                    icon={star}
                    className={`text-xs ${s <= selectedReview.starRating ? "text-amber-400" : "text-slate-200"}`}
                  />
                ))}
              </div>
              <p className="text-sm text-slate-600 line-clamp-2">
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
              onChange={(e: any) => setReplyText(e.target.value)}
              inputClassName="!h-32 resize-none"
            />
          </List>
          <Block className="mt-auto px-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmitReply}
              disabled={!replyText.trim()}
              className="w-full py-3.5 rounded-xl bg-teal-500 text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <IonIcon icon={sendOutline} className="text-lg" />
              Send Reply
            </motion.button>
          </Block>
        </Page>
      </Sheet>
    </div>
  );
};

export default ProviderReviewsTab;
