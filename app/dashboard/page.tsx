"use client";

import { useEffect, useState, useCallback } from "react";
import { KpiCard } from "@/components/ui/kpi-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ProgressRing } from "@/components/ui/progress-ring";
import { StatusBadge, TxTypeBadge, BudgetStatusBadge } from "@/components/ui/status-badge";
import { Currency } from "@/components/ui/currency";
import { KpiCardSkeleton, ChartSkeleton } from "@/components/ui/skeleton";
import { IncomeExpenseChart } from "@/components/dashboard/income-expense-chart";
import { CategoryDonutChart } from "@/components/dashboard/category-donut-chart";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { formatRupiah, formatDateShort, getDayGreeting } from "@/lib/format";
import { useSSE } from "@/hooks/use-sse";
import { Bell, ExternalLink, Lightbulb, RefreshCw, X, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { formatDate } from "date-fns";

interface DashboardData {
  kpi: {
    totalIncome: number;
    totalExpense: number;
    netFlow: number;
    savingsRate: number;
    incomeChange: number;
    expenseChange: number;
  };
  dailyChart: Array<{ date: string; income: number; expense: number }>;
  categoryChart: Array<{ name: string; color: string; icon: string; amount: number }>;
  budgets: Array<{
    id: string;
    category: { id: string; name: string; icon: string; color: string };
    amount: number;
    spent: number;
    remaining: number;
    percentage: number;
  }>;
  goals: Array<{
    id: string;
    name: string;
    targetAmount: number;
    savedAmount: number;
    percentage: number;
    deadline?: string;
    color: string;
  }>;
  recentTransactions: Array<{
    id: string;
    type: "INCOME" | "EXPENSE" | "TRANSFER";
    amount: number;
    note?: string;
    date: string;
    category?: { name: string; icon: string; color: string };
    account: { name: string };
  }>;
  month: number;
  year: number;
}

interface BudgetTx {
  id: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  note?: string;
  date: string;
  account: { name: string };
}

export default function DashboardPage() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Kamu");
  const [selectedBudget, setSelectedBudget] = useState<DashboardData["budgets"][0] | null>(null);
  const [budgetTxs, setBudgetTxs] = useState<BudgetTx[]>([]);
  const [budgetTxLoading, setBudgetTxLoading] = useState(false);

  const openBudgetDetail = useCallback(async (budget: DashboardData["budgets"][0]) => {
    setSelectedBudget(budget);
    setBudgetTxLoading(true);
    try {
      const month = data?.month ?? selectedMonth;
      const year = data?.year ?? selectedYear;
      const from = `${year}-${String(month).padStart(2, "0")}-01`;
      const to = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`;
      const res = await fetch(`/api/transactions?categoryId=${budget.category.id}&dateFrom=${from}&dateTo=${to}&limit=20`);
      const json = await res.json();
      setBudgetTxs(json.transactions ?? []);
    } finally {
      setBudgetTxLoading(false);
    }
  }, [data?.month, data?.year, selectedMonth, selectedYear]);

  const fetchDashboard = useCallback(async (month: number, year: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?month=${month}&year=${year}`);
      if (!res.ok) return;
      const json = await res.json();
      setData(json);
    } catch {
      toast.error("Gagal memuat dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard(selectedMonth, selectedYear);
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (d.user) setUserName(d.user.name);
    });
  }, [fetchDashboard, selectedMonth, selectedYear]);

  const goToPrevMonth = () => {
    if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear((y) => y - 1); }
    else setSelectedMonth((m) => m - 1);
  };

  const goToNextMonth = () => {
    const isCurrentMonth = selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear();
    if (isCurrentMonth) return;
    if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear((y) => y + 1); }
    else setSelectedMonth((m) => m + 1);
  };

  // Real-time SSE updates
  useSSE({
    transaction: () => {
      fetchDashboard();
      toast.success("Transaksi baru dicatat!", { icon: "✅" });
    },
    budget_alert: (d: any) => {
      toast.warning(`Budget ${d.categoryId} sudah ${Math.round(d.percentage)}%!`, { icon: "⚠️" });
    },
  });

  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-screen-xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-[#F8FAFC]">
              {getDayGreeting(userName)}
            </h1>
            <p className="text-sm text-[#64748B] mt-0.5">
              {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchDashboard(selectedMonth, selectedYear)}
              className="p-2 text-[#64748B] hover:text-[#F8FAFC] hover:bg-[#334155] rounded-lg transition-colors"
            >
              <RefreshCw size={18} />
            </button>
            <button className="p-2 text-[#64748B] hover:text-[#F8FAFC] hover:bg-[#334155] rounded-lg transition-colors relative">
              <Bell size={18} />
            </button>
          </div>
        </div>

        {/* Month/Year Navigator */}
        <div className="flex items-center gap-1">
          <button
            onClick={goToPrevMonth}
            className="p-1.5 text-[#64748B] hover:text-[#F8FAFC] hover:bg-[#334155] rounded-lg transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-[#F8FAFC] min-w-[120px] text-center">
            {monthNames[selectedMonth - 1]} {selectedYear}
          </span>
          <button
            onClick={goToNextMonth}
            disabled={selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear()}
            className="p-1.5 text-[#64748B] hover:text-[#F8FAFC] hover:bg-[#334155] rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)
          ) : data ? (
            <>
              <KpiCard
                label="Total Pemasukan"
                value={data.kpi.totalIncome}
                change={data.kpi.incomeChange}
                accentColor="#10B981"
              />
              <KpiCard
                label="Total Pengeluaran"
                value={data.kpi.totalExpense}
                change={data.kpi.expenseChange}
                accentColor="#EF4444"
              />
              <KpiCard
                label="Net Flow"
                value={data.kpi.netFlow}
                accentColor={data.kpi.netFlow >= 0 ? "#3B82F6" : "#EF4444"}
              />
              <KpiCard
                label="Savings Rate"
                value={data.kpi.savingsRate}
                accentColor="#8B5CF6"
                prefix=""
                suffix="%"
                formatValue={(v) => `${v.toFixed(1)}%`}
              />
            </>
          ) : null}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Income vs Expense Area Chart */}
          <div className="lg:col-span-3 bg-[#1E293B] border border-[#475569] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-[#F8FAFC] mb-4">Pemasukan vs Pengeluaran</h2>
            {loading ? (
              <div className="h-56 bg-[#334155] animate-pulse rounded-lg" />
            ) : data ? (
              <IncomeExpenseChart data={data.dailyChart} />
            ) : null}
            {/* Legend */}
            <div className="flex gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                <div className="w-3 h-0.5 bg-emerald-500 rounded" />
                Pemasukan
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                <div className="w-3 h-0.5 bg-red-500 rounded" />
                Pengeluaran
              </div>
            </div>
          </div>

          {/* Category Donut */}
          <div className="lg:col-span-2 bg-[#1E293B] border border-[#475569] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-[#F8FAFC] mb-4">Pengeluaran per Kategori</h2>
            {loading ? (
              <div className="h-56 bg-[#334155] animate-pulse rounded-lg" />
            ) : data && data.categoryChart.length > 0 ? (
              <CategoryDonutChart data={data.categoryChart} totalExpense={data.kpi.totalExpense} />
            ) : (
              <div className="h-56 flex items-center justify-center text-[#64748B] text-sm">
                Belum ada pengeluaran bulan ini
              </div>
            )}
          </div>
        </div>

        {/* Budget Progress */}
        <div className="bg-[#1E293B] border border-[#475569] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#F8FAFC]">Budget {monthNames[selectedMonth - 1]}</h2>
            <Link href="/budget" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              Kelola <ExternalLink size={12} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-[#334155] animate-pulse rounded-lg" />)}
            </div>
          ) : data?.budgets.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.budgets.map((b) => (
                <button
                  key={b.id}
                  onClick={() => openBudgetDetail(b)}
                  className={`p-3 rounded-lg border transition-all text-left w-full hover:border-blue-500/50 hover:bg-[#334155]/60 ${b.percentage > 100 ? "border-red-500/30 animate-pulse-red bg-red-500/5" : "border-[#334155]"}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{b.category.icon}</span>
                      <span className="text-sm font-medium text-[#F8FAFC]">{b.category.name}</span>
                    </div>
                    <BudgetStatusBadge percentage={b.percentage} />
                  </div>
                  <ProgressBar percentage={b.percentage} height={6} />
                  <div className="flex justify-between mt-1.5 text-xs text-[#64748B]">
                    <span className="font-mono">{formatRupiah(b.spent)}</span>
                    <span className="font-mono">/ {formatRupiah(b.amount)}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[#64748B] text-sm">
              <p>Belum ada budget. <Link href="/budget" className="text-blue-400 hover:underline">Atur sekarang →</Link></p>
            </div>
          )}
        </div>

        {/* Savings Goals */}
        {(data?.goals?.length ?? 0) > 0 && (
          <div className="bg-[#1E293B] border border-[#475569] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[#F8FAFC]">Savings Goals</h2>
              <Link href="/goals" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                Lihat semua <ExternalLink size={12} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-x-auto">
              {data?.goals.slice(0, 3).map((goal) => (
                <div key={goal.id} className="p-4 rounded-lg border border-[#334155] flex flex-col items-center text-center gap-2">
                  <ProgressRing percentage={goal.percentage} size={80} strokeWidth={7} color={goal.color}>
                    <span className="font-mono font-bold text-sm text-[#F8FAFC]">
                      {Math.round(goal.percentage)}%
                    </span>
                  </ProgressRing>
                  <div>
                    <p className="text-sm font-medium text-[#F8FAFC]">{goal.name}</p>
                    <p className="text-xs text-[#64748B] font-mono">{formatRupiah(goal.savedAmount)} / {formatRupiah(goal.targetAmount)}</p>
                    {goal.deadline && (
                      <p className="text-xs text-[#64748B] mt-0.5">
                        Target: {new Date(goal.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        <div className="bg-[#1E293B] border border-[#475569] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#F8FAFC]">Transaksi Terakhir</h2>
            <Link href="/transactions" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              Lihat semua <ExternalLink size={12} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-[#334155] animate-pulse rounded-lg" />
              ))}
            </div>
          ) : data?.recentTransactions.length ? (
            <div className="divide-y divide-[#334155]">
              {data.recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 py-3 hover:bg-[#334155]/40 -mx-2 px-2 rounded-lg transition-colors">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                    style={{ backgroundColor: tx.category?.color ? tx.category.color + "20" : "#33415520" }}
                  >
                    {tx.category?.icon ?? (tx.type === "INCOME" ? "💰" : tx.type === "TRANSFER" ? "↔️" : "💸")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <TxTypeBadge type={tx.type} />
                      {tx.category && <span className="text-xs text-[#64748B]">{tx.category.name}</span>}
                    </div>
                    <p className="text-sm text-[#94A3B8] truncate mt-0.5">{tx.note ?? "—"}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p
                      className="font-mono font-medium text-sm"
                      style={{ color: tx.type === "INCOME" ? "#10B981" : tx.type === "EXPENSE" ? "#EF4444" : "#06B6D4" }}
                    >
                      {tx.type === "INCOME" ? "+" : tx.type === "EXPENSE" ? "−" : "↔"} {formatRupiah(tx.amount)}
                    </p>
                    <p className="text-xs text-[#64748B]">
                      {new Date(tx.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-[#64748B] text-sm">Belum ada transaksi bulan ini.</p>
              <p className="text-[#64748B] text-xs mt-1">Text ke bot Telegram kamu untuk mulai!</p>
            </div>
          )}
        </div>

        {/* Financial Tip */}
        <div className="border border-[#475569] rounded-xl p-5 flex gap-4" style={{ borderLeftWidth: "3px", borderLeftColor: "#8B5CF6" }}>
          <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
            <Lightbulb size={20} className="text-violet-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#F8FAFC]">Tips Keuangan Hari Ini</p>
            <p className="text-sm text-[#94A3B8] mt-1">
              Coba metode "Pay Yourself First" — langsung sisihkan 20% gaji ke tabungan begitu gaji masuk, sebelum bayar pengeluaran lain. Ini cara paling efektif membangun kebiasaan menabung.
            </p>
            <Link href="/insights" className="text-xs text-violet-400 hover:text-violet-300 mt-2 inline-flex items-center gap-1">
              Lihat semua insights <ExternalLink size={11} />
            </Link>
          </div>
        </div>
      </div>
      {/* Budget Transaction Slide-over */}
      {selectedBudget && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedBudget(null)} />
          {/* Panel */}
          <div className="relative w-full max-w-sm bg-[#1E293B] border-l border-[#475569] h-full flex flex-col shadow-2xl animate-slide-in-right">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#334155]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xl"
                  style={{ backgroundColor: selectedBudget.category.color + "25" }}>
                  {selectedBudget.category.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#F8FAFC]">{selectedBudget.category.name}</p>
                  <p className="text-xs text-[#64748B]">
                    {formatRupiah(selectedBudget.spent)} / {formatRupiah(selectedBudget.amount)}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedBudget(null)} className="p-1.5 text-[#64748B] hover:text-[#F8FAFC] hover:bg-[#334155] rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Budget bar */}
            <div className="px-5 py-3 border-b border-[#334155]">
              <div className="flex justify-between text-xs text-[#64748B] mb-1.5">
                <span>Penggunaan Budget</span>
                <span className="font-mono">{selectedBudget.percentage.toFixed(1)}%</span>
              </div>
              <ProgressBar percentage={selectedBudget.percentage} height={6} />
              <div className="flex justify-between mt-1.5 text-xs">
                <span className="text-[#64748B]">Sisa: <span className="font-mono text-[#F8FAFC]">{formatRupiah(selectedBudget.remaining)}</span></span>
                <BudgetStatusBadge percentage={selectedBudget.percentage} />
              </div>
            </div>

            {/* Transactions */}
            <div className="flex-1 overflow-y-auto p-5">
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-3">Transaksi Bulan Ini</p>
              {budgetTxLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-12 bg-[#334155] animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : budgetTxs.length ? (
                <div className="divide-y divide-[#334155]">
                  {budgetTxs.map((tx) => (
                    <div key={tx.id} className="flex items-center gap-3 py-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                        style={{ backgroundColor: selectedBudget.category.color + "20" }}>
                        {selectedBudget.category.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#F8FAFC] truncate">{tx.note ?? "—"}</p>
                        <p className="text-xs text-[#64748B]">{tx.account.name} · {new Date(tx.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</p>
                      </div>
                      <span className="font-mono text-sm text-red-400 flex-shrink-0">−{formatRupiah(tx.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-[#64748B] text-sm">
                  <p className="text-3xl mb-2">📭</p>
                  <p>Belum ada transaksi untuk kategori ini bulan ini.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
