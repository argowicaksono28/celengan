"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProgressRing } from "@/components/ui/progress-ring";
import { formatRupiah } from "@/lib/format";
import { Plus, X, PiggyBank, Plane, Laptop, Shield, Heart, Star } from "lucide-react";
import { toast } from "sonner";

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  percentage: number;
  deadline?: string;
  color: string;
  icon: string;
  isCompleted: boolean;
}

const SUGGESTED_GOALS = [
  { name: "Dana Darurat", icon: "🛡️", color: "#10B981" },
  { name: "Liburan", icon: "✈️", color: "#06B6D4" },
  { name: "Gadget Baru", icon: "💻", color: "#8B5CF6" },
  { name: "Dana Nikah", icon: "💍", color: "#EC4899" },
  { name: "Umrah/Haji", icon: "🕌", color: "#F59E0B" },
  { name: "Beli Kendaraan", icon: "🚗", color: "#3B82F6" },
];

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState<Goal | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [newGoal, setNewGoal] = useState({ name: "", targetAmount: "", deadline: "", color: "#8B5CF6" });

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/goals");
      const data = await res.json();
      setGoals(data.goals ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const handleAdd = async () => {
    if (!newGoal.name || !newGoal.targetAmount) { toast.error("Isi nama dan target"); return; }
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newGoal, targetAmount: parseFloat(newGoal.targetAmount), deadline: newGoal.deadline || null }),
    });
    if (res.ok) {
      toast.success("Goal ditambahkan!");
      setShowAddModal(false);
      setNewGoal({ name: "", targetAmount: "", deadline: "", color: "#8B5CF6" });
      fetchGoals();
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || !showDepositModal) return;
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deposit", goalId: showDepositModal.id, amount: parseFloat(depositAmount) }),
    });
    if (res.ok) {
      const data = await res.json();
      toast.success(data.goal.isCompleted ? "🎉 Goal tercapai! Selamat!" : `Berhasil menabung ${formatRupiah(parseFloat(depositAmount))}`);
      setShowDepositModal(null);
      setDepositAmount("");
      fetchGoals();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus goal ini?")) return;
    await fetch(`/api/goals/${id}`, { method: "DELETE" });
    toast.success("Goal dihapus");
    fetchGoals();
  };

  const activeGoals = goals.filter((g) => !g.isCompleted);
  const completedGoals = goals.filter((g) => g.isCompleted);

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-screen-xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#F8FAFC]">Savings Goals</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Buat Goal
          </button>
        </div>

        {/* Active Goals */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-56 bg-[#1E293B] animate-pulse rounded-xl" />
            ))}
          </div>
        ) : activeGoals.length === 0 ? (
          <div className="bg-[#1E293B] border border-[#475569] rounded-xl p-8 text-center">
            <p className="text-3xl mb-3">🎯</p>
            <p className="text-[#F8FAFC] font-medium mb-1">Kamu mau menabung untuk apa?</p>
            <p className="text-[#64748B] text-sm mb-6">Buat savings goal pertamamu sekarang</p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTED_GOALS.map((s) => (
                <button
                  key={s.name}
                  onClick={() => { setNewGoal((p) => ({ ...p, name: s.name, color: s.color })); setShowAddModal(true); }}
                  className="px-3 py-1.5 bg-[#334155] hover:bg-[#475569] text-[#94A3B8] text-xs rounded-lg transition-colors"
                >
                  {s.icon} {s.name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeGoals.map((goal) => {
              const remaining = goal.targetAmount - goal.savedAmount;
              const daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000) : null;
              const monthsLeft = daysLeft !== null ? Math.max(1, Math.ceil(daysLeft / 30)) : null;
              const monthlyNeeded = remaining > 0 && monthsLeft ? remaining / monthsLeft : 0;

              return (
                <div key={goal.id} className="bg-[#1E293B] border border-[#475569] hover:border-[#64748B] rounded-xl p-5 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-base font-semibold text-[#F8FAFC]">{goal.name}</h3>
                    <button onClick={() => handleDelete(goal.id)} className="text-[#475569] hover:text-red-400 transition-colors">
                      <X size={14} />
                    </button>
                  </div>

                  {/* Progress Ring */}
                  <div className="flex flex-col items-center my-4">
                    <ProgressRing percentage={goal.percentage} size={120} strokeWidth={10} color={goal.color}>
                      <div className="text-center">
                        <p className="font-mono font-bold text-[#F8FAFC] text-xl">{Math.round(goal.percentage)}%</p>
                      </div>
                    </ProgressRing>
                  </div>

                  {/* Stats */}
                  <div className="space-y-1.5 text-xs text-center mb-4">
                    <p className="font-mono text-[#F8FAFC] text-base font-semibold">{formatRupiah(goal.savedAmount)}</p>
                    <p className="text-[#64748B]">dari {formatRupiah(goal.targetAmount)}</p>
                    <p className="text-[#94A3B8]">Sisa: <span className="font-mono">{formatRupiah(remaining)}</span></p>
                    {goal.deadline && (
                      <p className="text-[#64748B]">
                        Target: {new Date(goal.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        {daysLeft !== null && daysLeft > 0 && ` (${daysLeft} hari lagi)`}
                      </p>
                    )}
                    {monthlyNeeded > 0 && (
                      <p className="text-[#94A3B8]">Perlu: <span className="font-mono text-violet-400">{formatRupiah(monthlyNeeded)}/bln</span></p>
                    )}
                  </div>

                  <button
                    onClick={() => setShowDepositModal(goal)}
                    className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
                    style={{ backgroundColor: goal.color }}
                  >
                    + Tambah Tabungan
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">✅ Tercapai</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedGoals.map((goal) => (
                <div key={goal.id} className="bg-[#1E293B] border border-emerald-500/30 rounded-xl p-5 opacity-75">
                  <div className="flex items-center gap-3">
                    <ProgressRing percentage={100} size={56} strokeWidth={6} color="#10B981">
                      <span className="text-lg">✓</span>
                    </ProgressRing>
                    <div>
                      <p className="text-sm font-semibold text-[#F8FAFC]">{goal.name}</p>
                      <p className="text-xs text-emerald-400 font-mono">{formatRupiah(goal.targetAmount)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-[#1E293B] border border-[#475569] rounded-xl p-6 w-full max-w-sm animate-fade-in">
            <h3 className="text-lg font-semibold text-[#F8FAFC] mb-4">Buat Savings Goal</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#94A3B8] block mb-1.5">Nama Goal</label>
                <input value={newGoal.name} onChange={(e) => setNewGoal((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Dana Darurat, Liburan Bali..." className="w-full bg-[#334155] border border-[#475569] text-[#F8FAFC] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 placeholder-[#475569]" />
              </div>
              <div>
                <label className="text-xs text-[#94A3B8] block mb-1.5">Target (Rp)</label>
                <input type="number" value={newGoal.targetAmount} onChange={(e) => setNewGoal((p) => ({ ...p, targetAmount: e.target.value }))}
                  placeholder="10000000" className="w-full bg-[#334155] border border-[#475569] text-[#F8FAFC] rounded-lg px-3 py-2.5 text-sm font-mono outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-[#94A3B8] block mb-1.5">Deadline (opsional)</label>
                <input type="date" value={newGoal.deadline} onChange={(e) => setNewGoal((p) => ({ ...p, deadline: e.target.value }))}
                  className="w-full bg-[#334155] border border-[#475569] text-[#F8FAFC] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-[#94A3B8] block mb-1.5">Warna</label>
                <div className="flex gap-2">
                  {["#8B5CF6","#10B981","#06B6D4","#EC4899","#F59E0B","#3B82F6"].map((c) => (
                    <button key={c} onClick={() => setNewGoal((p) => ({ ...p, color: c }))}
                      className="w-8 h-8 rounded-full border-2 transition-all"
                      style={{ backgroundColor: c, borderColor: newGoal.color === c ? "#F8FAFC" : "transparent" }} />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 mt-2">
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-lg text-sm text-[#94A3B8] bg-[#334155] hover:bg-[#475569] transition-colors">Batal</button>
                <button onClick={handleAdd} className="flex-1 py-2.5 rounded-lg text-sm text-white bg-violet-600 hover:bg-violet-500 transition-colors font-medium">Buat Goal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowDepositModal(null)} />
          <div className="relative bg-[#1E293B] border border-[#475569] rounded-xl p-6 w-full max-w-sm animate-fade-in">
            <h3 className="text-lg font-semibold text-[#F8FAFC] mb-1">Tambah Tabungan</h3>
            <p className="text-sm text-[#94A3B8] mb-4">{showDepositModal.name}</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#94A3B8] block mb-1.5">Jumlah (Rp)</label>
                <input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="500000" autoFocus className="w-full bg-[#334155] border border-[#475569] text-[#F8FAFC] rounded-lg px-3 py-2.5 text-sm font-mono outline-none focus:border-violet-500" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowDepositModal(null)} className="flex-1 py-2.5 rounded-lg text-sm text-[#94A3B8] bg-[#334155]">Batal</button>
                <button onClick={handleDeposit} className="flex-1 py-2.5 rounded-lg text-sm text-white font-medium" style={{ backgroundColor: showDepositModal.color }}>Tabung</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
