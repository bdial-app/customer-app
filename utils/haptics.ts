import { Capacitor } from "@capacitor/core";

export type HapticStyle = "light" | "medium" | "heavy" | "selection" | "success" | "warning" | "error";

export async function triggerHaptic(style: HapticStyle = "light"): Promise<void> {
  try {
    if (Capacitor.isNativePlatform()) {
      const { Haptics, ImpactStyle, NotificationType } = await import("@capacitor/haptics");
      if (style === "selection") {
        await Haptics.selectionChanged();
      } else if (style === "success" || style === "warning" || style === "error") {
        const type =
          style === "success" ? NotificationType.Success :
          style === "warning" ? NotificationType.Warning :
          NotificationType.Error;
        await Haptics.notification({ type });
      } else {
        const impactStyle =
          style === "heavy" ? ImpactStyle.Heavy :
          style === "medium" ? ImpactStyle.Medium :
          ImpactStyle.Light;
        await Haptics.impact({ style: impactStyle });
      }
    } else if (typeof window !== "undefined" && "vibrate" in navigator) {
      const ms =
        style === "heavy" || style === "error" ? 50 :
        style === "medium" || style === "warning" ? 25 :
        style === "success" ? [10, 50, 10] :
        10;
      navigator.vibrate(ms);
    }
  } catch {
    // Non-critical — haptics never break the flow
  }
}
