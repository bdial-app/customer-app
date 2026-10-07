"use client";
import { motion } from "framer-motion";
import { IonIcon } from "@ionic/react";
import {
  star,
  starHalf,
  starOutline,
  thumbsUpOutline,
  chatbubblesOutline,
  shareSocialOutline,
  ribbonOutline,
  arrowUndoOutline,
} from "ionicons/icons";
import { ProviderDetailsReview } from "@/services/provider.service";
import { Card, EmptyState, GroupLabel, HowItWorks, ManagePage, SectionHeader } from "./manage/kit";
import { BoostNudge } from "./manage/boost";

interface ProviderReviewsTabProps {
  reviews: ProviderDetailsReview[];
}

const AVATAR_TONES = [
  "from-indigo-500 to-violet-500",
  "from-sky-500 to-indigo-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
  "from-fuchsia-500 to-violet-500",
];

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "C";

const toneFor = (seed: string) => AVATAR_TONES[[...seed].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_TONES.length];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

/** Five stars; `value` may be fractional (shows a half star). */
function Stars({ value, size = "text-[13px]" }: { value: number; size?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((s) => {
        const full = value >= s - 0.25;
        const half = !full && value >= s - 0.75;
        return (
          <IonIcon
            key={s}
            icon={full ? star : half ? starHalf : star}
            className={`${size} ${full || half ? "text-amber-400" : "text-slate-200 dark:text-slate-700"}`}
          />
        );
      })}
    </span>
  );
}

const GET_REVIEWS_TIPS = [
  { icon: chatbubblesOutline, text: "Ask happy customers — in person or on WhatsApp — to leave you a review." },
  { icon: shareSocialOutline, text: "Share your business page link. Customers leave reviews right there." },
  { icon: ribbonOutline, text: "Keep your details and photos fresh so new customers feel confident." },
];

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
  const happyPct = totalReviews > 0 ? Math.round((reviews.filter((r) => r.starRating >= 4).length / totalReviews) * 100) : 0;

  return (
    <ManagePage>
      <SectionHeader
        title="Reviews"
        subtitle="What customers say about you. Good reviews help new customers choose you."
      />

      <HowItWorks
        id="reviews"
        title="How reviews work"
        steps={[
          "Customers rate you from 1 to 5 stars and can add a few words or photos.",
          "Every review shows here and on your business page.",
          "Reviews are written by customers, so they can't be edited here.",
        ]}
      />

      {totalReviews > 0 ? (
        <>
          {/* Rating summary */}
          <Card className="!p-0 overflow-hidden">
            <div className="flex items-center gap-4 p-4">
              <div className="w-[104px] shrink-0 text-center">
                <p className="text-[40px] font-extrabold leading-none tracking-tight text-slate-900 dark:text-white tabular-nums">{avgRating}</p>
                <div className="mt-2 flex justify-center">
                  <Stars value={Number(avgRating)} size="text-[14px]" />
                </div>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1.5">
                  {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
                </p>
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                {ratingCounts.map((r) => (
                  <div key={r.stars} className="flex items-center gap-2">
                    <span className="w-6 shrink-0 inline-flex items-center gap-0.5 text-[11.5px] font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                      {r.stars}
                      <IonIcon icon={star} className="text-[10px] text-amber-400" />
                    </span>
                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: totalReviews > 0 ? `${(r.count / totalReviews) * 100}%` : "0%" }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
                      />
                    </div>
                    <span className="w-5 shrink-0 text-right text-[11.5px] text-slate-400 dark:text-slate-500 tabular-nums">{r.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50/70 dark:bg-emerald-950/30 border-t border-emerald-100/70 dark:border-emerald-900/40">
              <IonIcon icon={thumbsUpOutline} className="text-[16px] text-emerald-600 dark:text-emerald-400 shrink-0" />
              <p className="text-[12.5px] text-emerald-800 dark:text-emerald-200">
                <b>{happyPct}%</b> of customers rated you 4 stars or more
              </p>
            </div>
          </Card>

          {Number(avgRating) >= 4 && (
            <BoostNudge
              id="reviews"
              title={`A ${avgRating}★ rating deserves more eyes`}
              body="Customers trust great reviews. Boost puts yours at the top so more of them see it."
            />
          )}

          {/* Reviews list */}
          <GroupLabel>What customers said · {totalReviews}</GroupLabel>
          <div className="flex flex-col gap-3">
            {reviews.map((review, i) => {
              const name = review.reviewer?.name || "Customer";
              return (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card>
                    {/* Reviewer info */}
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${toneFor(name)} flex items-center justify-center shrink-0 shadow-sm`}>
                        <span className="text-[13px] font-bold text-white">{initials(name)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-bold text-slate-900 dark:text-white truncate">{name}</p>
                        <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-0.5">{formatDate(review.postedAt)}</p>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <Stars value={review.starRating} />
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tabular-nums">{review.starRating}.0</span>
                      </div>
                    </div>

                    {/* Review text */}
                    {review.reviewText ? (
                      <p className="mt-3 text-[14px] text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line break-words">{review.reviewText}</p>
                    ) : (
                      <p className="mt-3 text-[13px] italic text-slate-400 dark:text-slate-500">Rated you without leaving a comment.</p>
                    )}

                    {/* Review photos */}
                    {review.photos && review.photos.length > 0 && (
                      <div className="mt-3 -mx-4 px-4 flex gap-2 overflow-x-auto no-scrollbar">
                        {review.photos.map((ph) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={ph.id}
                            src={ph.imageUrl}
                            alt="Photo from customer"
                            className="w-20 h-20 rounded-xl object-cover shrink-0 bg-slate-100 dark:bg-slate-800 ring-1 ring-black/5 dark:ring-white/5"
                          />
                        ))}
                      </div>
                    )}

                    {/* Existing reply (read-only) */}
                    {review.replyText && (
                      <div className="mt-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 ring-1 ring-indigo-100 dark:ring-indigo-900/50 px-3.5 py-3">
                        <p className="flex items-center gap-1.5 text-[11.5px] font-bold text-indigo-700 dark:text-indigo-300">
                          <IonIcon icon={arrowUndoOutline} className="text-[13px]" />
                          Your reply
                          {review.repliedAt && <span className="font-medium text-indigo-400 dark:text-indigo-400/70">· {formatDate(review.repliedAt)}</span>}
                        </p>
                        <p className="mt-1 text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line break-words">{review.replyText}</p>
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <EmptyState
            icon={starOutline}
            title="No reviews yet"
            body="Reviews help new customers trust you. When customers review your business, you'll see them here."
          />
          <GroupLabel>Get your first reviews</GroupLabel>
          <Card className="!py-1.5">
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {GET_REVIEWS_TIPS.map((t) => (
                <li key={t.text} className="flex items-start gap-3 py-2.5">
                  <span className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center shrink-0">
                    <IonIcon icon={t.icon} className="text-[16px] text-amber-600 dark:text-amber-300" />
                  </span>
                  <p className="text-[13px] text-slate-600 dark:text-slate-300 leading-snug pt-1.5">{t.text}</p>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </ManagePage>
  );
};

export default ProviderReviewsTab;
