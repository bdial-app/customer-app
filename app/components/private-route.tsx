"use client";

import { useEffect, useState } from "react";
import { IonIcon } from "@ionic/react";
import { lockClosedOutline, logInOutline } from "ionicons/icons";
import { useAuthGate } from "@/hooks/useAuthGate";

interface PrivateRouteProps {
  children: React.ReactNode;
  /** Page title shown in the sign-in wall (e.g. "Become a Provider") */
  title?: string;
  /** Sub-message shown below the title */
  description?: string;
}

/**
 * Wraps a page so it is only accessible to authenticated users.
 * - During client hydration: shows a neutral loading state (avoids SSR mismatch).
 * - Not authenticated: shows a full-screen sign-in wall and opens the auth gate.
 * - Authenticated: renders children normally.
 */
export default function PrivateRoute({
  children,
  title = "Sign in required",
  description = "Please sign in to access this page.",
}: PrivateRouteProps) {
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated, requireAuth } = useAuthGate();

  // Only run on the client — avoids hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Open auth gate automatically when the wall appears
  useEffect(() => {
    if (mounted && !isAuthenticated) {
      requireAuth(() => {});
    }
  }, [mounted, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Phase 1: hydrating — render nothing visible yet
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Phase 2: client-rendered, not authenticated — show sign-in wall
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-8 text-center">
        <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
          <IonIcon icon={lockClosedOutline} className="text-4xl text-amber-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-sm text-gray-500 mb-8 max-w-xs leading-relaxed">{description}</p>
        <button
          onClick={() => requireAuth(() => {})}
          className="flex items-center gap-2 bg-amber-400 text-white font-semibold text-sm px-8 py-3 rounded-2xl shadow-md active:scale-95 transition-transform"
        >
          <IonIcon icon={logInOutline} className="text-base" />
          Sign In
        </button>
      </div>
    );
  }

  // Phase 3: authenticated — render the actual page
  return <>{children}</>;
}
