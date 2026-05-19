"use client";

import dynamic from "next/dynamic";
const IonIcon = dynamic(
  () => import("@ionic/react").then((m) => m.IonIcon),
  { ssr: false },
);
import { arrowBack } from "ionicons/icons";
import { useBackNavigation } from "@/hooks/useBackNavigation";

interface BackButtonProps {
  /** Route to navigate to when there is no history (default: "/") */
  fallbackRoute?: string;
  /** Visual variant: "overlay" for on-image hero, "surface" for white/light headers */
  variant?: "overlay" | "surface";
  /** Additional CSS classes */
  className?: string;
}

/**
 * Production-ready back button that handles the deep-link / shared-URL case.
 * When the user opened the page directly (no internal history), falls back to
 * the specified route instead of exiting the app.
 */
const BackButton = ({
  fallbackRoute = "/",
  variant = "surface",
  className = "",
}: BackButtonProps) => {
  const { goBack } = useBackNavigation();

  const baseStyles =
    "w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform";

  const variantStyles =
    variant === "overlay"
      ? "bg-black/30 backdrop-blur-md"
      : "bg-gray-100 dark:bg-slate-800";

  const iconStyles =
    variant === "overlay"
      ? "w-5 h-5 text-white"
      : "w-5 h-5 text-gray-700 dark:text-gray-300";

  return (
    <button
      onClick={() => goBack(fallbackRoute)}
      className={`${baseStyles} ${variantStyles} ${className}`}
      aria-label="Go back"
    >
      <IonIcon icon={arrowBack} className={iconStyles} />
    </button>
  );
};

export default BackButton;
