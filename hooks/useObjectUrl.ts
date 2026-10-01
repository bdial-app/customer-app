"use client";

import { useEffect, useMemo } from "react";

/**
 * A blob: URL for previewing a picked file, released when the file changes
 * or the component unmounts. Derived rather than stored in state, so there is
 * no extra render with a missing preview.
 */
export function useObjectUrl(file: Blob | null | undefined): string | null {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    if (!url) return;
    return () => URL.revokeObjectURL(url);
  }, [url]);
  return url;
}

/** The same, for a list of files. */
export function useObjectUrls(files: readonly Blob[]): string[] {
  const urls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls]);
  return urls;
}
