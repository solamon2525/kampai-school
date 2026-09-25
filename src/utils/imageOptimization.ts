/**
 * Image Optimization Utilities
 * Transforms Supabase Storage URLs into dynamic Edge CDN-rendered WebP images
 * with customizable width, height, quality, and format parameters.
 */

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'origin' | 'avif';
  resize?: 'cover' | 'contain' | 'fill';
}

export const IMAGE_OPTIMIZATION_PRESETS = {
  /** 1:1 square for reward catalog cards (high-DPI clear) */
  rewardCard: {
    width: 480,
    height: 480,
    quality: 75,
    format: 'webp',
    resize: 'cover',
  } as const,
  /** Compact 1:1 square for dialog lists, mobile previews */
  rewardThumbnail: {
    width: 240,
    height: 240,
    quality: 70,
    format: 'webp',
    resize: 'cover',
  } as const,
  /** Micro 1:1 square for avatar, badges, table icons */
  avatar: {
    width: 96,
    height: 96,
    quality: 80,
    format: 'webp',
    resize: 'cover',
  } as const,
  /** Larger 1:1 square for modal/detail views */
  dialog: {
    width: 720,
    height: 720,
    quality: 80,
    format: 'webp',
    resize: 'cover',
  } as const,
} as const;

/**
 * Returns an optimized CDN URL if the provided URL is a Supabase Storage URL.
 * Safely leaves non-Supabase URLs, data/blob URLs, and SVGs untouched.
 */
export function getOptimizedImageUrl(
  url: string | null | undefined,
  options: ImageOptimizationOptions = {}
): string {
  if (!url) return '';

  // Skip data, blob, or SVG files (vector graphics shouldn't be rasterized)
  if (
    url.startsWith('data:') ||
    url.startsWith('blob:') ||
    url.includes('.svg') ||
    url.endsWith('.svg')
  ) {
    return url;
  }

  // Detect Supabase storage public object or existing render URL
  const isSupabaseStorage =
    url.includes('/storage/v1/object/public/') ||
    url.includes('/storage/v1/render/image/public/');

  if (!isSupabaseStorage) {
    return url;
  }

  try {
    const {
      width = 480,
      height,
      quality = 75,
      format = 'webp',
      resize = 'cover',
    } = options;

    // Convert object URL to render URL
    const transformedPath = url.replace(
      '/storage/v1/object/public/',
      '/storage/v1/render/image/public/'
    );

    const parsedUrl = new URL(transformedPath);
    parsedUrl.searchParams.set('width', String(width));
    if (height) {
      parsedUrl.searchParams.set('height', String(height));
    }
    parsedUrl.searchParams.set('quality', String(quality));
    parsedUrl.searchParams.set('format', format);
    parsedUrl.searchParams.set('resize', resize);

    return parsedUrl.toString();
  } catch {
    // If URL parsing fails for any reason, return the original URL safely
    return url;
  }
}

/**
 * Generates responsive srcset string for Supabase images
 */
export function getOptimizedImageSrcSet(
  url: string | null | undefined,
  widths: number[] = [320, 480, 640],
  options: Omit<ImageOptimizationOptions, 'width'> = {}
): string | undefined {
  if (
    !url ||
    (!url.includes('/storage/v1/object/public/') &&
      !url.includes('/storage/v1/render/image/public/')) ||
    url.includes('.svg')
  ) {
    return undefined;
  }

  return widths
    .map((w) => {
      const optUrl = getOptimizedImageUrl(url, {
        ...options,
        width: w,
        height: options.height
          ? Math.round((options.height / 480) * w)
          : undefined,
      });
      return `${optUrl} ${w}w`;
    })
    .join(', ');
}
