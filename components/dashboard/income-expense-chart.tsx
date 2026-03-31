"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { formatRupiah } from "@/lib/format";

interface DailyData {
  date: string;
  income: number;
  expense: number;
}

interface IncomeExpenseChartProps {
  data: DailyData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const day = String(label);
  return (
    <div className="bg-[#0F172A]/95 border border-[#475569] rounded-lg px-3 py-2 text-xs">
      <p className="text-[#94A3B8] mb-1">Hari ke-{day}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-mono">
          {p.name === "income" ? "Masuk" : "Keluar"}: {formatRupiah(p.value)}
        </p>
      ))}
    </div>
  );
};

export function IncomeExpenseChart({ data }: IncomeExpenseChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    day: parseInt(d.date.slice(-2)),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#475569" strokeOpacity={0.3} vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fill: "#64748B", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          interval={4}
        />
        <YAxis
          tick={{ fill: "#64748B", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}jt` : v >= 1000 ? `${v / 1000}k` : String(v)}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="income"
          name="income"
          stroke="#10B981"
          strokeWidth={2}
          fill="url(#incomeGrad)"
          animationDuration={500}
          dot={false}
          activeDot={{ r: 4, fill: "#10B981" }}
        />
        <Area
          type="monotone"
          dataKey="expense"
          name="expense"
          stroke="#EF4444"
          strokeWidth={2}
          fill="url(#expenseGrad)"
          animationDuration={500}
          dot={false}
          activeDot={{ r: 4, fill: "#EF4444" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
