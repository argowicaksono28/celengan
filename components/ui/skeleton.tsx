import React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-[#334155]", className)}
      style={style}
    />
  );
}

export function KpiCardSkeleton() {
  return (
    <div className="bg-[#1E293B] border border-[#475569] rounded-xl p-5" style={{ borderLeftWidth: "3px", borderLeftColor: "#334155" }}>
      <Skeleton className="h-3 w-24 mb-3" />
      <Skeleton className="h-8 w-36 mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function ChartSkeleton({ height = 240 }: { height?: number }) {
  return (
    <div className="bg-[#1E293B] border border-[#475569] rounded-xl p-5">
      <Skeleton className="h-4 w-32 mb-4" />
      <Skeleton style={{ height }} />
    </div>
  );
}

export function TableRowSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-28" />
        </div>
      ))}
    </div>
  );
}
