"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { formatRupiah } from "@/lib/format";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Recommendation {
  type: "tip" | "warning" | "alert";
  emoji: string;
  title: string;
  description: string;
  action?: string;
}

interface InsightsData {
  monthlyReport: {
    month: string;
    income: number;
    expense: number;
    savingsRate: number;
    prevIncome: number;
    prevExpense: number;
    topCategories: Array<{ name: string; color: string; amount: number }>;
    incomeChange: number;
    expenseChange: number;
  };
  recommendations: Recommendation[];
  heatmap: number[][];
}

const ACCENT_COLORS = {
  tip: { border: "#8B5CF6", bg: "rgba(139,92,246,0.08)", icon: "text-violet-400" },
  warning: { border: "#F59E0B", bg: "rgba(245,158,11,0.08)", icon: "text-amber-400" },
  alert: { border: "#EF4444", bg: "rgba(239,68,68,0.08)", icon: "text-red-400" },
};

const DAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function InsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/insights")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const maxHeat = data ? Math.max(...data.heatmap.flatMap((r) => r)) || 1 : 1;

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-screen-xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-[#F8FAFC]">Insights & Rekomendasi</h1>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-[#1E293B] animate-pulse rounded-xl" />)}
          </div>
        ) : data ? (
          <>
            {/* Monthly Report */}
            <div className="bg-[#1E293B] border border-[#475569] rounded-xl p-6">
              <h2 className="text-base font-semibold text-[#F8FAFC] mb-4">📊 Laporan {data.monthlyReport.month}</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {[
                  { label: "Pemasukan", value: formatRupiah(data.monthlyReport.income), change: data.monthlyReport.incomeChange, color: "#10B981" },
                  { label: "Pengeluaran", value: formatRupiah(data.monthlyReport.expense), change: data.monthlyReport.expenseChange, color: "#EF4444" },
                  { label: "Savings Rate", value: `${data.monthlyReport.savingsRate.toFixed(1)}%`, color: "#8B5CF6" },
                  { label: "Net Flow", value: formatRupiah(data.monthlyReport.income - data.monthlyReport.expense), color: data.monthlyReport.income > data.monthlyReport.expense ? "#10B981" : "#EF4444" },
                ].map((item) => (
                  <div key={item.label} className="bg-[#334155] rounded-lg p-3">
                    <p className="text-xs text-[#94A3B8] uppercase tracking-wider mb-1">{item.label}</p>
                    <p className="font-mono font-bold" style={{ color: item.color }}>{item.value}</p>
                    {"change" in item && item.change !== undefined && (
                      <div className={`flex items-center gap-0.5 text-xs mt-1 ${item.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {item.change >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {Math.abs(item.change).toFixed(1)}% vs bulan lalu
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Top 3 categories */}
              {data.monthlyReport.topCategories.length > 0 && (
                <div>
                  <p className="text-xs text-[#94A3B8] uppercase tracking-wider mb-2">Top Pengeluaran</p>
                  <div className="flex flex-wrap gap-2">
                    {data.monthlyReport.topCategories.map((cat, i) => (
                      <div key={cat.name} className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: cat.color + "20" }}>
                        <span className="text-xs font-medium text-[#94A3B8]">#{i + 1}</span>
                        <span className="text-xs font-medium text-[#F8FAFC]">{cat.name}</span>
                        <span className="font-mono text-xs" style={{ color: cat.color }}>{formatRupiah(cat.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Recommendations */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wider">Rekomendasi Untukmu</h2>
              {data.recommendations.length === 0 ? (
                <div className="bg-[#1E293B] border border-[#475569] rounded-xl p-6 text-center">
                  <p className="text-2xl mb-2">🎉</p>
                  <p className="text-[#F8FAFC] text-sm font-medium">Keuanganmu sehat!</p>
                  <p className="text-[#64748B] text-xs mt-1">Tidak ada rekomendasi saat ini. Terus pertahankan!</p>
                </div>
              ) : (
                data.recommendations.map((rec, i) => {
                  const colors = ACCENT_COLORS[rec.type];
                  return (
                    <div key={i} className="rounded-xl p-5 flex gap-4 border border-[#475569] transition-all hover:border-[#64748B]"
                      style={{ borderLeftWidth: "4px", borderLeftColor: colors.border, background: colors.bg }}>
                      <span className="text-2xl flex-shrink-0">{rec.emoji}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[#F8FAFC] mb-1">{rec.title}</p>
                        <p className="text-sm text-[#94A3B8] leading-relaxed">{rec.description}</p>
                        {rec.action && (
                          <button className="mt-2 text-xs font-medium px-3 py-1.5 rounded-lg" style={{ color: colors.border, backgroundColor: colors.border + "20" }}>
                            {rec.action}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Spending Heatmap */}
            <div className="bg-[#1E293B] border border-[#475569] rounded-xl p-5">
              <h2 className="text-sm font-semibold text-[#F8FAFC] mb-1">Pola Pengeluaran</h2>
              <p className="text-xs text-[#64748B] mb-4">Kapan kamu paling banyak spend</p>
              <div className="overflow-x-auto">
                <div className="min-w-max">
                  {/* Hour labels */}
                  <div className="flex gap-0.5 mb-1 ml-10">
                    {Array.from({ length: 24 }, (_, h) => (
                      <div key={h} className="w-5 text-center text-[9px] text-[#475569]">
                        {h % 6 === 0 ? `${h}` : ""}
                      </div>
                    ))}
                  </div>
                  {/* Heatmap grid */}
                  {data.heatmap.map((row, day) => (
                    <div key={day} className="flex items-center gap-0.5 mb-0.5">
                      <span className="w-9 text-right text-[10px] text-[#64748B] pr-2">{DAY_LABELS[day]}</span>
                      {row.map((val, hour) => {
                        const intensity = val / maxHeat;
                        return (
                          <div
                            key={hour}
                            title={`${DAY_LABELS[day]} ${hour}:00 — ${formatRupiah(val)}`}
                            className="w-5 h-5 rounded-sm transition-colors"
                            style={{ backgroundColor: val === 0 ? "#1E293B" : `rgba(139,92,246,${0.15 + intensity * 0.85})` }}
                          />
                        );
                      })}
                    </div>
                  ))}
                  {/* Legend */}
                  <div className="flex items-center gap-2 mt-3 justify-end">
                    <span className="text-[10px] text-[#64748B]">Rendah</span>
                    {[0.2, 0.4, 0.6, 0.8, 1].map((v) => (
                      <div key={v} className="w-4 h-4 rounded-sm" style={{ backgroundColor: `rgba(139,92,246,${v})` }} />
                    ))}
                    <span className="text-[10px] text-[#64748B]">Tinggi</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-16 text-[#64748B]">Gagal memuat insights</div>
        )}
      </div>
    </DashboardLayout>
  );
}
