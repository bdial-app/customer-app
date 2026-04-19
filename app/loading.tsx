"use client";
import { Page, Block } from "konsta/react";

const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded-md ${className}`} />
);

export default function Loading() {
  return (
    <Page
      style={{
        background: "radial-gradient(at 0% 10%, #f0eff4, #f0ecff)",
      }}
    >
      {/* Search / header area */}
      <Block className="pt-4 pb-2 flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full shrink-0" />
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="w-9 h-9 rounded-full shrink-0" />
      </Block>

      {/* Search bar */}
      <Block className="py-0">
        <Skeleton className="h-10 w-full rounded-full" />
      </Block>

      {/* Category chips row */}
      <Block className="py-3">
        <div className="flex gap-2 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full shrink-0" />
          ))}
        </div>
      </Block>

      {/* Section title */}
      <Block className="pb-1">
        <Skeleton className="h-4 w-36" />
      </Block>

      {/* Cards grid */}
      <Block className="pt-0">
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden">
              <Skeleton className="h-32 w-full rounded-none" />
              <div className="p-2 flex flex-col gap-1.5">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </Block>

      {/* Second section title */}
      <Block className="pb-1">
        <Skeleton className="h-4 w-28" />
      </Block>

      {/* Horizontal slider skeletons */}
      <Block className="pt-0">
        <div className="flex gap-3 overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl overflow-hidden shrink-0 w-40"
            >
              <Skeleton className="h-24 w-full rounded-none" />
              <div className="p-2 flex flex-col gap-1.5">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </Block>

      {/* Bottom bar placeholder */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100 flex items-center justify-around px-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <Skeleton className="w-6 h-6 rounded-md" />
            <Skeleton className="w-10 h-2 rounded" />
          </div>
        ))}
      </div>
    </Page>
  );
}
