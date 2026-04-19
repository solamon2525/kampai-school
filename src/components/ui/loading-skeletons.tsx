import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/* ────────────────────────────────────────────────────────────────── *
 * Preset Skeleton components for common admin/portal loading states.
 * All variants use the shadcn `<Skeleton>` primitive (animate-pulse).
 * ────────────────────────────────────────────────────────────────── */

interface BaseProps {
  className?: string;
}

/** Grid of card skeletons — good for news, gallery, hero carousels */
export function CardSkeleton({
  count = 3,
  className,
  cols = 3,
}: BaseProps & { count?: number; cols?: 1 | 2 | 3 | 4 }) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  }[cols];
  return (
    <div className={cn("grid gap-4", gridCols, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="h-40 w-full rounded-none" />
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** Table skeleton — admin data tables */
export function TableSkeleton({
  rows = 8,
  cols = 5,
  className,
}: BaseProps & { rows?: number; cols?: number }) {
  return (
    <div className={cn("w-full space-y-3", className)}>
      {/* header row */}
      <div className="flex gap-3 px-2 pb-2 border-b border-border">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* data rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3 px-2 py-1 items-center">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton
              key={c}
              className={cn(
                "h-5 flex-1",
                c === 0 && "max-w-[60px]",
                c === cols - 1 && "max-w-[80px]"
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** List skeleton — sidebar lists, notifications, menus */
export function ListSkeleton({
  count = 5,
  className,
  showAvatar = true,
}: BaseProps & { count?: number; showAvatar?: boolean }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border">
          {showAvatar && <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Stat cards grid — dashboards */
export function StatSkeleton({
  count = 4,
  className,
}: BaseProps & { count?: number }) {
  return (
    <div
      className={cn(
        "grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** Hero carousel skeleton — homepage */
export function HeroSkeleton({ className }: BaseProps) {
  return (
    <div className={cn("relative w-full", className)}>
      <Skeleton className="h-64 md:h-80 lg:h-96 w-full rounded-xl" />
      <div className="absolute bottom-6 left-6 right-6 space-y-3">
        <Skeleton className="h-5 w-24 bg-white/30" />
        <Skeleton className="h-8 w-2/3 bg-white/30" />
        <Skeleton className="h-4 w-1/3 bg-white/30" />
      </div>
    </div>
  );
}

/** Form skeleton — while fetching initial values */
export function FormSkeleton({
  fields = 4,
  className,
}: BaseProps & { fields?: number }) {
  return (
    <div className={cn("space-y-4 max-w-xl", className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex gap-2 pt-4">
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  );
}

/** Chart skeleton — analytics dashboards */
export function ChartSkeleton({
  className,
  height = 300,
}: BaseProps & { height?: number }) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="w-full" style={{ height }} />
      </CardContent>
    </Card>
  );
}

/** Section skeleton — generic "loading an admin page" */
export function PageSectionSkeleton({ className }: BaseProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <StatSkeleton count={4} />
      <TableSkeleton rows={6} cols={5} />
    </div>
  );
}
