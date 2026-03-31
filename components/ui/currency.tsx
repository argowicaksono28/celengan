import { cn } from "@/lib/utils";

interface CurrencyProps {
  amount: number;
  className?: string;
  size?: "sm" | "base" | "lg" | "xl" | "2xl";
  colored?: boolean;
  type?: "income" | "expense" | "neutral";
}

const SIZE_CLASSES = {
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
};

export function Currency({ amount, className, size = "base", colored = false, type = "neutral" }: CurrencyProps) {
  const formatted = "Rp " + Math.round(Math.abs(amount)).toLocaleString("id-ID");
  const colorClass = !colored ? "" : type === "income" ? "text-emerald-400" : type === "expense" ? "text-red-400" : "";
  const prefix = type === "income" ? "+" : type === "expense" ? "−" : "";

  return (
    <span className={cn("font-mono tabular-nums", SIZE_CLASSES[size], colorClass, className)}>
      {prefix}{formatted}
    </span>
  );
}
