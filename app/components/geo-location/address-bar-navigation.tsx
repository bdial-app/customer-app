"use client";
import { IonIcon } from "@ionic/react";
import { locationSharp, chevronDown } from "ionicons/icons";
import { motion } from "framer-motion";
import React, { useState, useEffect } from "react";

const AddressBarNavigation = ({
  title,
  address,
  isLoading,
  hideIcon = false,
  hideChevron = false,
}: {
  title: string;
  address: string;
  isLoading?: boolean;
  hideIcon?: boolean;
  hideChevron?: boolean;
}) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const showSkeleton = mounted && isLoading;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex items-center gap-2.5 min-w-0"
    >
      {!hideIcon && (
        <div className="w-9 h-9 rounded-2xl bg-amber-400/15 border border-amber-400/20 flex items-center justify-center shrink-0">
          <IonIcon icon={locationSharp} className="text-amber-400 text-[17px]" />
        </div>
      )}

      <div className="min-w-0">
        {showSkeleton ? (
          <div className="flex flex-col gap-1.5">
            <div className="h-3.5 w-28 bg-white/10 animate-pulse rounded-full" />
            <div className="h-2.5 w-40 bg-white/[0.06] animate-pulse rounded-full" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1">
              <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest leading-none mb-0.5">
                Current Location
              </p>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[14px] font-semibold text-white truncate leading-snug">
                {title}
              </span>
              {!hideChevron && (
                <IonIcon icon={chevronDown} className="text-[11px] text-amber-400/80 shrink-0" />
              )}
            </div>
            <p className="text-[11px] text-white/35 truncate leading-tight">
              {address}
            </p>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default AddressBarNavigation;
