"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ProgressRing } from "@/components/ui/progress-ring";
import { BudgetStatusBadge } from "@/components/ui/status-badge";
import { formatRupiah } from "@/lib/format";
import { ChevronLeft, ChevronRight, Plus, X, Check, Pencil } from "lucide-react";
import { toast } from "sonner";

interface Budget {
  id: string;
  category: { id: string; name: string; icon: string; color: string };
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
}

const MONTH_NAMES = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

export default function BudgetPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; icon: string }>>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBudget, setNewBudget] = useState({ categoryId: "", amount: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/budgets?month=${month}&year=${year}`);
      const data = await res.json();
      setBudgets(data.budgets ?? []);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { fetchBudgets(); }, [fetchBudgets]);
  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((d) => setCategories(d.categories ?? []));
  }, []);

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const overallPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear((y) => y - 1); } else setMonth((m) => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear((y) => y + 1); } else setMonth((m) => m + 1); };

  const handleAdd = async () => {
    if (!newBudget.categoryId || !newBudget.amount) { toast.error("Pilih kategori dan isi jumlah"); return; }
    const res = await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId: newBudget.categoryId, amount: parseFloat(newBudget.amount), month, year }),
    });
    if (res.ok) {
      toast.success("Budget ditambahkan");
      setShowAddModal(false);
      setNewBudget({ categoryId: "", amount: "" });
      fetchBudgets();
    }
  };

  const handleEdit = async (id: string) => {
    const res = await fetch(`/api/budgets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: parseFloat(editAmount) }),
    });
    if (res.ok) {
      setEditingId(null);
      toast.success("Budget diupdate");
      fetchBudgets();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus budget ini?")) return;
    await fetch(`/api/budgets/${id}`, { method: "DELETE" });
    toast.success("Budget dihapus");
    fetchBudgets();
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-screen-xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#F8FAFC]">Budget</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Tambah Budget
          </button>
        </div>

        {/* Month Selector + Overview */}
        <div className="bg-[#1E293B] border border-[#475569] rounded-xl p-5">
          <div className="flex items-center justify-between mb-6">
            <button onClick={prevMonth} className="p-2 text-[#64748B] hover:text-[#F8FAFC] hover:bg-[#334155] rounded-lg transition-colors">
              <ChevronLeft size={18} />
            </button>
            <h2 className="text-lg font-semibold text-[#F8FAFC]">{MONTH_NAMES[month - 1]} {year}</h2>
            <button onClick={nextMonth} className="p-2 text-[#64748B] hover:text-[#F8FAFC] hover:bg-[#334155] rounded-lg transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ProgressRing percentage={overallPct} size={100} strokeWidth={9} color={overallPct > 80 ? "#EF4444" : overallPct > 60 ? "#F59E0B" : "#10B981"}>
              <div className="text-center">
                <p className="font-mono font-bold text-[#F8FAFC] text-lg">{Math.round(overallPct)}%</p>
                <p className="text-[#64748B] text-[10px]">terpakai</p>
              </div>
            </ProgressRing>
            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#94A3B8]">Total Budget</span>
                <span className="font-mono text-[#F8FAFC]">{formatRupiah(totalBudget)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#94A3B8]">Terpakai</span>
                <span className="font-mono text-red-400">{formatRupiah(totalSpent)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#94A3B8]">Sisa</span>
                <span className="font-mono text-emerald-400">{formatRupiah(totalBudget - totalSpent)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Budget Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-36 bg-[#1E293B] animate-pulse rounded-xl" />)}
          </div>
        ) : budgets.length === 0 ? (
          <div className="text-center py-16 bg-[#1E293B] border border-[#475569] rounded-xl">
            <p className="text-[#64748B] text-base">Belum ada budget bulan ini.</p>
            <p className="text-[#475569] text-sm mt-1">Klik "Tambah Budget" untuk mulai.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.map((b) => (
              <div
                key={b.id}
                className={`bg-[#1E293B] rounded-xl p-5 border transition-all ${b.percentage > 100 ? "border-red-500/50 animate-pulse-red" : "border-[#475569] hover:border-[#64748B]"}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{b.category.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-[#F8FAFC]">{b.category.name}</p>
                      <BudgetStatusBadge percentage={b.percentage} />
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditingId(b.id); setEditAmount(String(b.amount)); }}
                      className="p-1 text-[#64748B] hover:text-blue-400 transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleDelete(b.id)} className="p-1 text-[#64748B] hover:text-red-400 transition-colors">
                      <X size={13} />
                    </button>
                  </div>
                </div>

                <ProgressBar percentage={b.percentage} />

                {editingId === b.id ? (
                  <div className="flex gap-2 mt-3">
                    <input
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="flex-1 bg-[#334155] border border-[#475569] text-[#F8FAFC] text-xs rounded-lg px-2 py-1.5 font-mono outline-none focus:border-blue-500"
                    />
                    <button onClick={() => handleEdit(b.id)} className="p-1.5 bg-blue-600 text-white rounded-lg"><Check size={14} /></button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 bg-[#334155] text-[#94A3B8] rounded-lg"><X size={14} /></button>
                  </div>
                ) : (
                  <div className="flex justify-between mt-3 text-xs">
                    <span className="text-[#64748B] font-mono">{formatRupiah(b.spent)} dipakai</span>
                    <span className="text-[#94A3B8] font-mono">/ {formatRupiah(b.amount)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-[#1E293B] border border-[#475569] rounded-xl p-6 w-full max-w-sm animate-fade-in">
            <h3 className="text-lg font-semibold text-[#F8FAFC] mb-4">Tambah Budget</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#94A3B8] block mb-1.5">Kategori</label>
                <select
                  value={newBudget.categoryId}
                  onChange={(e) => setNewBudget((p) => ({ ...p, categoryId: e.target.value }))}
                  className="w-full bg-[#334155] border border-[#475569] text-[#F8FAFC] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                >
                  <option value="">Pilih kategori</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#94A3B8] block mb-1.5">Jumlah Budget (Rp)</label>
                <input
                  type="number"
                  value={newBudget.amount}
                  onChange={(e) => setNewBudget((p) => ({ ...p, amount: e.target.value }))}
                  placeholder="2000000"
                  className="w-full bg-[#334155] border border-[#475569] text-[#F8FAFC] rounded-lg px-3 py-2.5 text-sm font-mono outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex gap-3 mt-2">
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-lg text-sm text-[#94A3B8] bg-[#334155] hover:bg-[#475569] transition-colors">
                  Batal
                </button>
                <button onClick={handleAdd} className="flex-1 py-2.5 rounded-lg text-sm text-white bg-blue-600 hover:bg-blue-500 transition-colors font-medium">
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
