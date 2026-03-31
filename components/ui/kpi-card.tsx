"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { useCountUp } from "@/hooks/use-count-up";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: number;
  change?: number;
  prefix?: string;
  suffix?: string;
  accentColor?: string;
  formatValue?: (v: number) => string;
}

export function KpiCard({
  label,
  value,
  change,
  prefix = "Rp ",
  suffix = "",
  accentColor = "#3B82F6",
  formatValue,
}: KpiCardProps) {
  const animatedValue = useCountUp(value, 800);

  const displayValue = formatValue
    ? formatValue(animatedValue)
    : prefix + Math.round(animatedValue).toLocaleString("id-ID") + suffix;

  const isPositive = (change ?? 0) >= 0;

  return (
    <div
      className={cn(
        "relative bg-[#1E293B] border border-[#475569] rounded-xl p-5 transition-all duration-200",
        "hover:border-[#64748B] hover:scale-[1.01] cursor-default",
        "animate-fade-in"
      )}
      style={{ borderLeftWidth: "3px", borderLeftColor: accentColor }}
    >
      {/* Label */}
      <p
        className="text-xs font-medium text-[#94A3B8] uppercase tracking-[0.05em] mb-3"
      >
        {label}
      </p>

      {/* Value */}
      <p
        className="font-mono font-bold text-[#F8FAFC] mb-2 leading-none"
        style={{ fontSize: "clamp(1.25rem, 3vw, 1.75rem)" }}
      >
        {displayValue}
      </p>

      {/* Trend */}
      {change !== undefined && (
        <div className={cn("flex items-center gap-1 text-xs font-medium", isPositive ? "text-emerald-400" : "text-red-400")}>
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>
            {isPositive ? "+" : ""}{change.toFixed(1)}% vs bulan lalu
          </span>
        </div>
      )}
    </div>
  );
}
