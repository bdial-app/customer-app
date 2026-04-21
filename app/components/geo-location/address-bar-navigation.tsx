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
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-2.5 active:opacity-70 transition-opacity"
    >
      {!hideIcon && (
        <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center shrink-0">
          <IonIcon icon={locationSharp} className="text-amber-400 text-base" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        {showSkeleton ? (
          <div className="flex flex-col gap-1.5">
            <div className="h-4 w-24 bg-white/10 animate-pulse rounded-md" />
            <div className="h-3 w-36 bg-white/5 animate-pulse rounded-md" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1">
              <span className="text-[13px] font-bold text-white truncate leading-tight">
                {title}
              </span>
              {!hideChevron && (
                <IonIcon icon={chevronDown} className="text-xs text-white/50" />
              )}
            </div>
            <p className="text-[11px] text-white/50 truncate mt-0.5 leading-tight">
              {address}
            </p>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default AddressBarNavigation;
