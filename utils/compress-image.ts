import imageCompression from 'browser-image-compression';

export interface CompressOptions {
  /** Max file size in MB (default: 1) */
  maxSizeMB?: number;
  /** Max width or height in pixels (default: 2048) */
  maxWidthOrHeight?: number;
  /** Use web worker for non-blocking compression (default: true) */
  useWebWorker?: boolean;
  /** Output file type (default: 'image/webp') */
  fileType?: string;
}

const DEFAULT_OPTIONS: Required<CompressOptions> = {
  maxSizeMB: 1,
  maxWidthOrHeight: 2048,
  useWebWorker: true,
  fileType: 'image/webp',
};

/**
 * Compress an image file before upload.
 * Reduces file size significantly while maintaining visual quality.
 * Returns the original file unchanged if:
 * - It's not an image (e.g. PDF)
 * - It's already smaller than 100KB
 * - It's a GIF (animation would be lost)
 */
export async function compressImageFile(
  file: File,
  options: CompressOptions = {},
): Promise<File> {
  // Skip non-images
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // Skip GIFs (would lose animation)
  if (file.type === 'image/gif') {
    return file;
  }

  // Skip already-small files (<100KB)
  if (file.size < 100 * 1024) {
    return file;
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: opts.maxSizeMB,
      maxWidthOrHeight: opts.maxWidthOrHeight,
      useWebWorker: opts.useWebWorker,
      fileType: opts.fileType,
      initialQuality: 0.8,
    });

    // Return compressed file with proper name
    const newName = file.name.replace(/\.[^.]+$/, '.webp');
    return new File([compressed], newName, { type: opts.fileType });
  } catch (error) {
    // If compression fails, return original file — backend will compress anyway
    console.warn('[Image Compression] Failed, using original:', error);
    return file;
  }
}

/**
 * Compress multiple image files in parallel.
 */
export async function compressImageFiles(
  files: File[],
  options: CompressOptions = {},
): Promise<File[]> {
  return Promise.all(files.map((f) => compressImageFile(f, options)));
}

/** Presets for common use cases */
export const COMPRESS_PRESETS = {
  /** For profile/banner images - higher quality */
  profile: { maxSizeMB: 0.8, maxWidthOrHeight: 1600 } satisfies CompressOptions,
  /** For product/gallery photos - balanced */
  product: { maxSizeMB: 1, maxWidthOrHeight: 2048 } satisfies CompressOptions,
  /** For chat attachments - smaller for fast sending */
  chat: { maxSizeMB: 0.5, maxWidthOrHeight: 1200 } satisfies CompressOptions,
  /** For thumbnails/icons */
  thumbnail: { maxSizeMB: 0.2, maxWidthOrHeight: 512 } satisfies CompressOptions,
} as const;
