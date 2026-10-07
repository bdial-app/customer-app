import type { OnboardingMediaKind } from "@/services/onboarding.service";
import { optimizeImage, type ImageUse } from "@/utils/compress-image";

const USE: Record<OnboardingMediaKind, ImageUse> = {
  banner: "banner",
  profile: "avatar",
  product: "product",
  verification: "document",
};

/** Rejects after `ms` — no step of the flow may wait forever. */
export function withDeadline<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}

/** Shrink a photo before upload (PDFs go as they are); see `optimizeImage`. */
export function prepareForUpload(file: File, kind: OnboardingMediaKind): Promise<File> {
  return optimizeImage(file, USE[kind]);
}
