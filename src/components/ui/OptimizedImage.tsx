import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  getOptimizedImageUrl,
  getOptimizedImageSrcSet,
  IMAGE_OPTIMIZATION_PRESETS,
  type ImageOptimizationOptions,
} from '@/utils/imageOptimization';

export interface OptimizedImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string | null | undefined;
  alt: string;
  preset?: keyof typeof IMAGE_OPTIMIZATION_PRESETS;
  optimizationOptions?: ImageOptimizationOptions;
  priority?: boolean;
  responsiveWidths?: number[];
  containerClassName?: string;
  fallback?: React.ReactNode;
}

export function OptimizedImage({
  src,
  alt,
  className,
  containerClassName,
  preset = 'rewardCard',
  optimizationOptions,
  priority = false,
  responsiveWidths = [320, 480, 640],
  sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
  fallback,
  onLoad,
  onError,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Reset state when src changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <div
        className={cn(
          'w-full h-full flex items-center justify-center bg-muted/40 text-muted-foreground',
          containerClassName
        )}
      >
        {fallback ?? null}
      </div>
    );
  }

  const effectiveOptions = {
    ...IMAGE_OPTIMIZATION_PRESETS[preset],
    ...optimizationOptions,
  };

  const optimizedSrc = getOptimizedImageUrl(src, effectiveOptions);
  const srcSet = responsiveWidths.length > 0
    ? getOptimizedImageSrcSet(src, responsiveWidths, effectiveOptions)
    : undefined;

  return (
    <div
      className={cn(
        'relative w-full h-full overflow-hidden',
        containerClassName
      )}
    >
      {/* Shimmer skeleton while image is loading */}
      {!isLoaded && (
        <div
          className="absolute inset-0 bg-muted/70 animate-pulse z-0"
          aria-hidden="true"
        />
      )}

      <img
        src={optimizedSrc}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        // @ts-expect-error fetchpriority is a valid HTML attribute in modern browsers
        fetchpriority={priority ? 'high' : 'low'}
        decoding="async"
        onLoad={(e) => {
          setIsLoaded(true);
          onLoad?.(e);
        }}
        onError={(e) => {
          setHasError(true);
          onError?.(e);
        }}
        className={cn(
          'w-full h-full object-cover transform-gpu transition-opacity duration-300 ease-out',
          isLoaded ? 'opacity-100' : 'opacity-0',
          className
        )}
        {...props}
      />
    </div>
  );
}
