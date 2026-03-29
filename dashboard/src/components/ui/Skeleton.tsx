import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div className={cn("bg-eve-elevated rounded-lg animate-pulse", className)} style={style} />
  );
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn("card p-5 space-y-3", className)}>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-3 w-40" />
    </div>
  );
}

export function SkeletonStatsGrid() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonCorridorRow() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-5 w-16 rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex gap-6">
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <div className="text-right space-y-2 ml-8">
          <Skeleton className="h-5 w-20 ml-auto" />
          <Skeleton className="h-3 w-16 ml-auto" />
          <Skeleton className="h-3 w-24 ml-auto" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonCorridorList() {
  return (
    <div className="grid gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonCorridorRow key={i} />
      ))}
    </div>
  );
}

// Deterministic heights to avoid SSR/client hydration mismatch
const SKELETON_BAR_HEIGHTS = [45, 62, 38, 71, 53, 80, 35, 58, 67, 42, 74, 50];

export function SkeletonChart() {
  return (
    <div className="card p-5">
      <Skeleton className="h-3 w-24 mb-5" />
      <div className="h-64 flex items-end gap-2 px-4">
        {SKELETON_BAR_HEIGHTS.map((h, i) => (
          <div key={i} className="flex-1 flex flex-col gap-1">
            <Skeleton
              className="w-full rounded-t-sm"
              style={{ height: `${h}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonActivityList() {
  return (
    <div className="card p-5 h-full">
      <Skeleton className="h-3 w-28 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="w-7 h-7 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3 border-b border-eve-border flex gap-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-16" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-5 py-3.5 border-b border-eve-border/40 flex items-center gap-8">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12 ml-auto" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
