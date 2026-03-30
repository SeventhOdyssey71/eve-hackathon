import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-white/[0.04]",
        className
      )}
      style={style}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
    </div>
  );
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn("card p-6 space-y-4", className)}>
      <Skeleton className="h-3 w-24 rounded-lg" />
      <Skeleton className="h-8 w-32 rounded-lg" />
      <Skeleton className="h-3 w-40 rounded-lg" />
    </div>
  );
}

export function SkeletonStatsGrid() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonCorridorRow() {
  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-36 rounded-lg" />
            <Skeleton className="h-5 w-16 rounded-lg" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24 rounded-lg" />
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-4 w-24 rounded-lg" />
          </div>
        </div>
        <div className="text-right space-y-2 ml-8">
          <Skeleton className="h-5 w-20 ml-auto rounded-lg" />
          <Skeleton className="h-3 w-24 ml-auto rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonCorridorList() {
  return (
    <div className="grid gap-5">
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
    <div className="card p-6">
      <Skeleton className="h-3 w-24 mb-6 rounded-lg" />
      <div className="h-72 flex items-end gap-2.5 px-4">
        {SKELETON_BAR_HEIGHTS.map((h, i) => (
          <div key={i} className="flex-1 flex flex-col gap-1">
            <Skeleton
              className="w-full rounded-t-md"
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
    <div className="card p-6 h-full">
      <Skeleton className="h-3 w-28 mb-5 rounded-lg" />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-full rounded-lg" />
              <Skeleton className="h-3 w-20 rounded-lg" />
            </div>
            <Skeleton className="h-4 w-16 rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-white/[0.04] flex gap-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-16 rounded-lg" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-6 py-4 border-b border-white/[0.03] flex items-center gap-8">
          <Skeleton className="h-4 w-28 rounded-lg" />
          <Skeleton className="h-4 w-36 rounded-lg" />
          <Skeleton className="h-4 w-16 rounded-lg" />
          <Skeleton className="h-4 w-12 ml-auto rounded-lg" />
          <Skeleton className="h-4 w-16 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonSwapPanel() {
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="card p-6 space-y-4">
        <Skeleton className="h-3 w-20 rounded-lg" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="flex justify-center">
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        <Skeleton className="h-3 w-20 rounded-lg" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
      <Skeleton className="h-12 w-full rounded-xl" />
      <div className="card p-6 space-y-3">
        <Skeleton className="h-3 w-24 rounded-lg" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <Skeleton className="h-3 w-20 rounded-lg" />
            <Skeleton className="h-3 w-16 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonDetailPage() {
  return (
    <div className="space-y-6 max-w-[1440px]">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6 space-y-4">
          <Skeleton className="h-4 w-24 rounded-lg" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
        <div className="card p-6 space-y-4">
          <Skeleton className="h-4 w-24 rounded-lg" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-full rounded-lg" />
                <Skeleton className="h-3 w-20 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
