"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  percentage: number;
  className?: string;
  showLabel?: boolean;
  height?: number;
  animated?: boolean;
}

export function ProgressBar({ percentage, className, showLabel = true, height = 8, animated = true }: ProgressBarProps) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setWidth(Math.min(percentage, 100)), 100);
      return () => clearTimeout(timer);
    } else {
      setWidth(Math.min(percentage, 100));
    }
  }, [percentage, animated]);

  const getColor = () => {
    if (percentage > 100) return "#EF4444";
    if (percentage > 80) return "#EF4444";
    if (percentage > 60) return "#F59E0B";
    return "#10B981";
  };

  const isOver = percentage > 100;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className="flex-1 rounded-full overflow-hidden"
        style={{ height: `${height}px`, background: "#334155" }}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-500 ease-out", isOver && "animate-pulse-red")}
          style={{
            width: `${width}%`,
            backgroundColor: getColor(),
          }}
        />
      </div>
      {showLabel && (
        <span className="font-mono text-xs text-[#94A3B8] w-10 text-right flex-shrink-0">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}
