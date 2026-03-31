"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from "recharts";
import { useState } from "react";
import { formatRupiah } from "@/lib/format";

interface CategoryData {
  name: string;
  color: string;
  icon: string;
  amount: number;
}

interface CategoryDonutChartProps {
  data: CategoryData[];
  totalExpense: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="bg-[#0F172A]/95 border border-[#475569] rounded-lg px-3 py-2 text-xs">
      <p className="text-[#F8FAFC] font-medium">{item.icon} {item.name}</p>
      <p className="text-[#94A3B8] font-mono">{formatRupiah(item.amount)}</p>
      <p className="text-[#64748B]">{Math.round(item.pct)}%</p>
    </div>
  );
};

export function CategoryDonutChart({ data, totalExpense }: CategoryDonutChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Show top 6, group rest as "Other"
  const sorted = [...data].sort((a, b) => b.amount - a.amount);
  const top6 = sorted.slice(0, 6);
  const rest = sorted.slice(6);
  const restAmount = rest.reduce((s, c) => s + c.amount, 0);

  const chartData = [
    ...top6.map((c) => ({ ...c, pct: totalExpense > 0 ? (c.amount / totalExpense) * 100 : 0 })),
    ...(restAmount > 0 ? [{ name: "Lainnya", color: "#78716C", icon: "📦", amount: restAmount, pct: totalExpense > 0 ? (restAmount / totalExpense) * 100 : 0 }] : []),
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <ResponsiveContainer width={180} height={180}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={82}
              dataKey="amount"
              animationBegin={0}
              animationDuration={400}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={entry.color}
                  opacity={activeIndex === null || activeIndex === index ? 1 : 0.6}
                  stroke="none"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center stat */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[#64748B] text-[10px] uppercase tracking-wider">Total</span>
          <span className="font-mono font-bold text-[#F8FAFC] text-sm">{formatRupiah(totalExpense)}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 space-y-1.5 w-full">
        {chartData.slice(0, 5).map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-[#94A3B8] truncate">{item.name}</span>
            </div>
            <span className="font-mono text-xs text-[#64748B] flex-shrink-0">{Math.round(item.pct)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
