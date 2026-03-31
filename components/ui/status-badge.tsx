import { cn } from "@/lib/utils";

type BadgeVariant = "income" | "expense" | "transfer" | "on-track" | "warning" | "over-budget" | "overdue" | "active" | "cleared";

const BADGE_CONFIG: Record<BadgeVariant, { label: string; color: string; bg: string }> = {
  income: { label: "Pemasukan", color: "#10B981", bg: "rgba(16,185,129,0.15)" },
  expense: { label: "Pengeluaran", color: "#EF4444", bg: "rgba(239,68,68,0.15)" },
  transfer: { label: "Transfer", color: "#06B6D4", bg: "rgba(6,182,212,0.15)" },
  "on-track": { label: "On Track", color: "#10B981", bg: "rgba(16,185,129,0.15)" },
  warning: { label: "Hampir Habis", color: "#F59E0B", bg: "rgba(245,158,11,0.15)" },
  "over-budget": { label: "Over Budget", color: "#EF4444", bg: "rgba(239,68,68,0.15)" },
  overdue: { label: "Terlambat", color: "#EF4444", bg: "rgba(239,68,68,0.15)" },
  active: { label: "Aktif", color: "#10B981", bg: "rgba(16,185,129,0.15)" },
  cleared: { label: "Lunas", color: "#94A3B8", bg: "rgba(148,163,184,0.15)" },
};

interface StatusBadgeProps {
  variant: BadgeVariant;
  className?: string;
  custom?: { label: string; color: string; bg: string };
}

export function StatusBadge({ variant, className, custom }: StatusBadgeProps) {
  const config = custom ?? BADGE_CONFIG[variant];
  return (
    <span
      className={cn("inline-flex items-center font-semibold rounded-md px-2.5 py-0.5", className)}
      style={{
        fontSize: "11px",
        color: config.color,
        backgroundColor: config.bg,
      }}
    >
      {config.label}
    </span>
  );
}

export function TxTypeBadge({ type }: { type: "INCOME" | "EXPENSE" | "TRANSFER" }) {
  const map = { INCOME: "income", EXPENSE: "expense", TRANSFER: "transfer" } as const;
  return <StatusBadge variant={map[type]} />;
}

export function BudgetStatusBadge({ percentage }: { percentage: number }) {
  if (percentage > 100) return <StatusBadge variant="over-budget" />;
  if (percentage > 80) return <StatusBadge variant="warning" />;
  return <StatusBadge variant="on-track" />;
}
