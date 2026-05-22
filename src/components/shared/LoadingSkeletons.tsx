import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton = ({ className, ...props }: SkeletonProps) => {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted/70 dark:bg-muted/40", className)}
      {...props}
    />
  );
};

// ─── 1. Card Loading Skeleton ───
export const CardSkeleton = ({ className }: { className?: string }) => {
  return (
    <div className={cn("p-5 border rounded-2xl bg-card shadow-sm space-y-4", className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
        <div className="space-y-2 flex-1 min-w-0">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <div className="space-y-2 pt-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-5/6" />
        <Skeleton className="h-3.5 w-4/5" />
      </div>
    </div>
  );
};

// ─── 2. Table Loading Skeleton ───
export const TableSkeleton = ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) => {
  return (
    <div className="border rounded-2xl bg-card overflow-hidden shadow-sm">
      {/* Header Row */}
      <div className="flex items-center gap-4 px-6 py-4 border-b bg-muted/40 dark:bg-muted/10">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton 
            key={`th-${i}`} 
            className={cn("h-4", i === 0 ? "w-1/4" : "w-1/6", i > 1 && "hidden sm:block")} 
          />
        ))}
      </div>
      
      {/* Body Rows */}
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={`tr-${r}`} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/5 transition-colors">
            {Array.from({ length: cols }).map((_, c) => (
              <div 
                key={`td-${r}-${c}`} 
                className={cn("flex items-center gap-2", c === 0 ? "w-1/4" : "w-1/6", c > 1 && "hidden sm:block")}
              >
                {c === 0 && <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />}
                <Skeleton className={cn("h-3.5", c === 0 ? "w-2/3" : "w-4/5")} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── 3. Grid/Dashboard Loading Skeleton ───
export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={`stat-${i}`} className="p-5 border rounded-2xl bg-card shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="w-8 h-8 rounded-lg" />
            </div>
            <Skeleton className="h-7 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        ))}
      </div>

      {/* Main Grid: List + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Table (2/3 width on large screens) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
          <TableSkeleton rows={4} cols={4} />
        </div>

        {/* Right Side: Quick Action list (1/3 width) */}
        <div className="space-y-4">
          <Skeleton className="h-5 w-1/3" />
          <div className="border rounded-2xl bg-card p-4 shadow-sm space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={`action-${i}`} className="flex items-center gap-3 p-2 rounded-xl bg-muted/20 dark:bg-muted/5">
                <Skeleton className="w-9 h-9 rounded-lg flex-shrink-0" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <Skeleton className="h-3.5 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
