"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { IonIcon } from "@ionic/react";
import { logoInstagram, playCircle, openOutline } from "ionicons/icons";
import { useProviderInstagram } from "@/hooks/useProvider";

interface Props {
  providerId: string;
}

/**
 * The shop's five most recent Instagram posts, as a mosaic: one large tile and
 * four small ones. Tapping a tile opens that post on Instagram.
 *
 * Renders nothing at all unless there are posts — a business with no Instagram,
 * a personal account or a failed lookup simply has no section here rather than
 * an empty box.
 */
function InstagramGridInner({ providerId }: Props) {
  const { data, isLoading } = useProviderInstagram(providerId);
  const posts = data?.posts ?? [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 grid-rows-2 gap-1.5 rounded-2xl overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`aspect-square bg-gray-100 dark:bg-slate-700 animate-pulse ${
              i === 0 ? "col-span-2 row-span-2" : ""
            }`}
          />
        ))}
      </div>
    );
  }

  if (posts.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <IonIcon icon={logoInstagram} className="w-4 h-4 text-pink-500" />
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 dark:text-slate-400">
            Latest on Instagram
          </p>
        </div>
        {data?.profileUrl && (
          <a
            href={data.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] font-semibold text-pink-500 active:opacity-70"
          >
            @{data.handle}
            <IonIcon icon={openOutline} className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* One big tile, four small — the whole set stays a neat square block. */}
      <div className="grid grid-cols-4 grid-rows-2 gap-1.5 rounded-2xl overflow-hidden">
        {posts.slice(0, 5).map((post, i) => (
          <motion.a
            key={post.permalink}
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.04 }}
            whileTap={{ scale: 0.97 }}
            className={`relative aspect-square overflow-hidden bg-gray-100 dark:bg-slate-700 ${
              i === 0 ? "col-span-2 row-span-2" : ""
            }`}
          >
            <img
              src={post.imageUrl}
              alt={post.caption ?? ""}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
              // A signed Instagram link can expire; drop the tile rather than
              // leaving a broken image in the middle of the grid.
              onError={(e) => {
                (e.currentTarget.parentElement as HTMLElement).style.display = "none";
              }}
            />
            {post.isVideo && (
              <div className="absolute top-1.5 right-1.5">
                <IonIcon
                  icon={playCircle}
                  className={`text-white drop-shadow ${i === 0 ? "w-6 h-6" : "w-4 h-4"}`}
                />
              </div>
            )}
          </motion.a>
        ))}
      </div>
    </div>
  );
}

export const InstagramGrid = memo(InstagramGridInner);
export default InstagramGrid;
