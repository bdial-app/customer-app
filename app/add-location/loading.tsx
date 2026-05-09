"use client";
import { useEffect, useState } from "react";

const Bone = ({ className = "" }: { className?: string }) => (
  <div
    className={`animate-pulse rounded-md bg-slate-200 dark:bg-slate-700 ${className}`}
  />
);

export default function AddLocationLoading() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  return (
    <div
      className="min-h-screen dark:bg-slate-900"
      // style={{ background: isDark ? "#0f172a" : "#f8fafc" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <Bone className="w-9 h-9 rounded-full shrink-0" />
        <Bone className="h-5 w-36" />
      </div>

      {/* Search bar */}
      <div className="px-4 pt-4 pb-3">
        <Bone className="h-11 w-full rounded-2xl" />
      </div>

      {/* Map placeholder */}
      <div className="px-4 pb-3">
        <Bone className="h-[260px] w-full rounded-2xl" />
      </div>

      {/* Detect location button */}
      <div className="px-4 pb-3">
        <Bone className="h-12 w-full rounded-2xl" />
      </div>

      {/* Address type chips */}
      <div className="px-4 pb-3 flex gap-2">
        <Bone className="h-9 w-20 rounded-full" />
        <Bone className="h-9 w-20 rounded-full" />
        <Bone className="h-9 w-20 rounded-full" />
      </div>

      {/* Address detail rows */}
      <div className="px-4 space-y-3">
        <Bone className="h-14 w-full rounded-2xl" />
        <Bone className="h-14 w-full rounded-2xl" />
        <Bone className="h-14 w-4/5 rounded-2xl" />
      </div>

      {/* Save button */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-8 pt-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-100 dark:border-slate-800">
        <Bone className="h-12 w-full rounded-2xl" />
      </div>
    </div>
  );
}
