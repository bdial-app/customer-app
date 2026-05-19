"use client";

import { DynamicIcon } from "lucide-react/dynamic";
import Image from "next/image";

/* ─── Gradient Palette ─────────────────────────────────────────────────────── */
export const GRADIENT_PALETTE: Record<
  string,
  { gradient: string; bg: string; border: string }
> = {
  amber: {
    gradient: "from-amber-400 to-orange-500",
    bg: "bg-amber-50 dark:bg-amber-900/30",
    border: "border-amber-100 dark:border-amber-800/40",
  },
  emerald: {
    gradient: "from-emerald-400 to-teal-500",
    bg: "bg-emerald-50 dark:bg-emerald-900/30",
    border: "border-emerald-100 dark:border-emerald-800/40",
  },
  rose: {
    gradient: "from-rose-400 to-pink-500",
    bg: "bg-rose-50 dark:bg-rose-900/30",
    border: "border-rose-100 dark:border-rose-800/40",
  },
  blue: {
    gradient: "from-blue-400 to-indigo-500",
    bg: "bg-blue-50 dark:bg-blue-900/30",
    border: "border-blue-100 dark:border-blue-800/40",
  },
  violet: {
    gradient: "from-violet-400 to-purple-500",
    bg: "bg-violet-50 dark:bg-violet-900/30",
    border: "border-violet-100 dark:border-violet-800/40",
  },
  cyan: {
    gradient: "from-cyan-400 to-blue-500",
    bg: "bg-cyan-50 dark:bg-cyan-900/30",
    border: "border-cyan-100 dark:border-cyan-800/40",
  },
  orange: {
    gradient: "from-orange-400 to-red-500",
    bg: "bg-orange-50 dark:bg-orange-900/30",
    border: "border-orange-100 dark:border-orange-800/40",
  },
  pink: {
    gradient: "from-pink-400 to-fuchsia-500",
    bg: "bg-pink-50 dark:bg-pink-900/30",
    border: "border-pink-100 dark:border-pink-800/40",
  },
  lime: {
    gradient: "from-lime-400 to-green-500",
    bg: "bg-lime-50 dark:bg-lime-900/30",
    border: "border-lime-100 dark:border-lime-800/40",
  },
  indigo: {
    gradient: "from-indigo-400 to-blue-600",
    bg: "bg-indigo-50 dark:bg-indigo-900/30",
    border: "border-indigo-100 dark:border-indigo-800/40",
  },
  teal: {
    gradient: "from-teal-400 to-emerald-500",
    bg: "bg-teal-50 dark:bg-teal-900/30",
    border: "border-teal-100 dark:border-teal-800/40",
  },
  red: {
    gradient: "from-red-400 to-rose-600",
    bg: "bg-red-50 dark:bg-red-900/30",
    border: "border-red-100 dark:border-red-800/40",
  },
  fuchsia: {
    gradient: "from-fuchsia-400 to-purple-600",
    bg: "bg-fuchsia-50 dark:bg-fuchsia-900/30",
    border: "border-fuchsia-100 dark:border-fuchsia-800/40",
  },
  sky: {
    gradient: "from-sky-400 to-blue-500",
    bg: "bg-sky-50 dark:bg-sky-900/30",
    border: "border-sky-100 dark:border-sky-800/40",
  },
  yellow: {
    gradient: "from-yellow-400 to-amber-500",
    bg: "bg-yellow-50 dark:bg-yellow-900/30",
    border: "border-yellow-100 dark:border-yellow-800/40",
  },
};

const PALETTE_KEYS = Object.keys(GRADIENT_PALETTE);

/** Deterministic color from name hash */
function colorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE_KEYS[Math.abs(hash) % PALETTE_KEYS.length];
}

/** Check if a string looks like a URL (not an emoji or Lucide name) */
function isUrl(str: string): boolean {
  return str.startsWith("http") || str.startsWith("/");
}

/* ─── Size presets ─────────────────────────────────────────────────────────── */
const SIZES = {
  xs: { container: "w-8 h-8", icon: 14, text: "text-sm", rounded: "rounded-lg" },
  sm: { container: "w-10 h-10", icon: 16, text: "text-base", rounded: "rounded-xl" },
  md: { container: "w-14 h-14", icon: 22, text: "text-xl", rounded: "rounded-2xl" },
  lg: { container: "w-[62px] h-[62px]", icon: 26, text: "text-2xl", rounded: "rounded-2xl" },
  xl: { container: "w-20 h-20", icon: 32, text: "text-3xl", rounded: "rounded-3xl" },
};

/* ─── Props ────────────────────────────────────────────────────────────────── */
export interface CategoryIconProps {
  icon?: string | null;
  iconColor?: string | null;
  imageUrl?: string | null;
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
}

/* ─── Component ────────────────────────────────────────────────────────────── */
export default function CategoryIcon({
  icon,
  iconColor,
  imageUrl,
  name,
  size = "md",
  className = "",
}: CategoryIconProps) {
  const s = SIZES[size];
  const colorKey = iconColor || colorFromName(name);
  const palette = GRADIENT_PALETTE[colorKey] || GRADIENT_PALETTE.amber;

  // Priority 1: imageUrl — show full image
  if (imageUrl) {
    return (
      <div
        className={`${s.container} ${s.rounded} overflow-hidden flex-shrink-0 ${className}`}
      >
        <Image
          src={imageUrl}
          alt={name}
          width={80}
          height={80}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Priority 2: icon is a URL
  if (icon && isUrl(icon)) {
    return (
      <div
        className={`${s.container} ${s.rounded} overflow-hidden flex-shrink-0 ${className}`}
      >
        <Image
          src={icon}
          alt={name}
          width={80}
          height={80}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Priority 3: icon is a Lucide icon name — render inside gradient container
  if (icon && !isUrl(icon)) {
    return (
      <div
        className={`${s.container} ${s.rounded} bg-gradient-to-br ${palette.gradient} flex items-center justify-center flex-shrink-0 shadow-sm ${className}`}
      >
        <DynamicIcon
          // @ts-expect-error — dynamic name string
          name={icon}
          size={s.icon}
          className="text-white drop-shadow-sm"
          strokeWidth={1.8}
        />
      </div>
    );
  }

  // Fallback: letter initial in gradient container
  return (
    <div
      className={`${s.container} ${s.rounded} bg-gradient-to-br ${palette.gradient} flex items-center justify-center flex-shrink-0 shadow-sm ${className}`}
    >
      <span className={`${s.text} font-bold text-white/90`}>
        {name?.[0]?.toUpperCase() || "?"}
      </span>
    </div>
  );
}
