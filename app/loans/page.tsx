"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProgressRing } from "@/components/ui/progress-ring";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatRupiah } from "@/lib/format";
import { Plus, ChevronDown, ChevronUp, X } from "lucide-react";
import { toast } from "sonner";

interface Loan {
  id: string;
  personName: string;
  direction: "LENT" | "BORROWED";
  originalAmount: number;
  remainingAmount: number;
  monthlyAmount?: number;
  dueDate?: string;
  status: "ACTIVE" | "OVERDUE" | "CLEARED";
  notes?: string;
  paidPercent: number;
  payments: Array<{ id: string; amount: number; date: string; note?: string }>;
}

export default function LoansPage() {
  const [tab, setTab] = useState<"LENT" | "BORROWED">("LENT");
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState<Loan | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [newLoan, setNewLoan] = useState({ personName: "", originalAmount: "", monthlyAmount: "", dueDate: "", notes: "" });

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/loans?direction=${tab}`);
      const data = await res.json();
      setLoans(data.loans ?? []);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchLoans(); }, [fetchLoans]);

  const handleAdd = async () => {
    if (!newLoan.personName || !newLoan.originalAmount) { toast.error("Isi nama dan jumlah"); return; }
    const res = await fetch("/api/loans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newLoan, direction: tab, originalAmount: parseFloat(newLoan.originalAmount), monthlyAmount: newLoan.monthlyAmount ? parseFloat(newLoan.monthlyAmount) : undefined, dueDate: newLoan.dueDate || null }),
    });
    if (res.ok) { toast.success("Pinjaman ditambahkan"); setShowAddModal(false); fetchLoans(); }
  };

  const handlePayment = async () => {
    if (!payAmount || !showPayModal) return;
    const res = await fetch("/api/loans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "payment", loanId: showPayModal.id, amount: parseFloat(payAmount) }),
    });
    if (res.ok) { toast.success("Pembayaran dicatat"); setShowPayModal(null); setPayAmount(""); fetchLoans(); }
  };

  const statusVariant = (s: string): "active" | "overdue" | "cleared" => {
    if (s === "OVERDUE") return "overdue";
    if (s === "CLEARED") return "cleared";
    return "active";
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-screen-xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#F8FAFC]">Pinjaman</h1>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} />
            Tambah
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#1E293B] border border-[#475569] rounded-lg p-1 w-fit">
          {(["LENT", "BORROWED"] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); setExpanded(null); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t ? "bg-[#334155] text-[#F8FAFC]" : "text-[#64748B] hover:text-[#94A3B8]"}`}>
              {t === "LENT" ? "💸 Aku yang Piutang" : "🏦 Aku yang Hutang"}
            </button>
          ))}
        </div>

        {/* Loan Cards */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 bg-[#1E293B] animate-pulse rounded-xl" />)}
          </div>
        ) : loans.length === 0 ? (
          <div className="text-center py-16 bg-[#1E293B] border border-[#475569] rounded-xl">
            <p className="text-[#64748B] text-sm">{tab === "LENT" ? "Belum ada piutang." : "Belum ada hutang."}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {loans.map((loan) => (
              <div key={loan.id} className="bg-[#1E293B] border border-[#475569] rounded-xl overflow-hidden">
                <div className="p-5">
                  <div className="flex items-center gap-4">
                    {/* Avatar + Progress Ring */}
                    <ProgressRing percentage={loan.paidPercent} size={64} strokeWidth={6} color={tab === "LENT" ? "#10B981" : "#EF4444"}>
                      <span className="text-[#F8FAFC] font-bold text-sm">{loan.personName.charAt(0).toUpperCase()}</span>
                    </ProgressRing>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-[#F8FAFC]">{loan.personName}</h3>
                        <StatusBadge variant={statusVariant(loan.status)} />
                      </div>
                      <p className="font-mono text-[#F8FAFC] text-lg font-bold">{formatRupiah(loan.remainingAmount)}</p>
                      <p className="text-xs text-[#64748B]">dari {formatRupiah(loan.originalAmount)} · {Math.round(loan.paidPercent)}% lunas</p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {loan.dueDate && (
                        <div className="text-right">
                          <p className="text-xs text-[#64748B]">Jatuh Tempo</p>
                          <p className="text-xs font-mono text-[#94A3B8]">{new Date(loan.dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</p>
                        </div>
                      )}
                      {loan.status !== "CLEARED" && (
                        <button onClick={() => setShowPayModal(loan)} className={`px-3 py-1.5 text-xs font-medium rounded-lg text-white ${tab === "LENT" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-red-600 hover:bg-red-500"}`}>
                          Catat Bayar
                        </button>
                      )}
                      <button onClick={() => setExpanded(expanded === loan.id ? null : loan.id)} className="text-[#64748B] hover:text-[#94A3B8]">
                        {expanded === loan.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Payment History */}
                {expanded === loan.id && loan.payments.length > 0 && (
                  <div className="border-t border-[#334155] p-5">
                    <p className="text-xs text-[#94A3B8] uppercase tracking-wider mb-3">Riwayat Pembayaran</p>
                    <div className="space-y-2">
                      {loan.payments.map((p) => (
                        <div key={p.id} className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                          <span className="text-xs text-[#64748B] w-24 flex-shrink-0 font-mono">
                            {new Date(p.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                          </span>
                          <span className="text-xs font-mono text-emerald-400">{formatRupiah(p.amount)}</span>
                          {p.note && <span className="text-xs text-[#475569]">— {p.note}</span>}
                        </div>
                      ))}
                    </div>
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
            <h3 className="text-lg font-semibold text-[#F8FAFC] mb-4">{tab === "LENT" ? "Tambah Piutang" : "Tambah Hutang"}</h3>
            <div className="space-y-4">
              {[
                { label: "Nama", key: "personName", placeholder: "Ahmad Fauzi" },
                { label: "Jumlah (Rp)", key: "originalAmount", placeholder: "5000000", type: "number" },
                { label: "Cicilan/bln (opsional)", key: "monthlyAmount", placeholder: "500000", type: "number" },
                { label: "Jatuh Tempo", key: "dueDate", type: "date" },
                { label: "Catatan", key: "notes", placeholder: "Untuk biaya nikahan..." },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label className="text-xs text-[#94A3B8] block mb-1.5">{label}</label>
                  <input type={type ?? "text"} value={(newLoan as any)[key]} onChange={(e) => setNewLoan((p) => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder} className="w-full bg-[#334155] border border-[#475569] text-[#F8FAFC] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 placeholder-[#475569]" />
                </div>
              ))}
              <div className="flex gap-3">
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-lg text-sm text-[#94A3B8] bg-[#334155]">Batal</button>
                <button onClick={handleAdd} className="flex-1 py-2.5 rounded-lg text-sm text-white bg-blue-600 hover:bg-blue-500 font-medium">Simpan</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowPayModal(null)} />
          <div className="relative bg-[#1E293B] border border-[#475569] rounded-xl p-6 w-full max-w-sm animate-fade-in">
            <h3 className="text-lg font-semibold text-[#F8FAFC] mb-1">Catat Pembayaran</h3>
            <p className="text-sm text-[#94A3B8] mb-4">{showPayModal.personName} · Sisa {formatRupiah(showPayModal.remainingAmount)}</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#94A3B8] block mb-1.5">Jumlah (Rp)</label>
                <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                  placeholder={showPayModal.monthlyAmount ? String(showPayModal.monthlyAmount) : "500000"}
                  autoFocus className="w-full bg-[#334155] border border-[#475569] text-[#F8FAFC] rounded-lg px-3 py-2.5 text-sm font-mono outline-none focus:border-blue-500" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowPayModal(null)} className="flex-1 py-2.5 rounded-lg text-sm text-[#94A3B8] bg-[#334155]">Batal</button>
                <button onClick={handlePayment} className="flex-1 py-2.5 rounded-lg text-sm text-white bg-emerald-600 hover:bg-emerald-500 font-medium">Catat</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
