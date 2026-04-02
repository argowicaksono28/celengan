"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { formatRupiah } from "@/lib/format";
import { Plus, X, ArrowLeftRight, Building2, Wallet, Banknote, TrendingUp, Pencil, Check } from "lucide-react";
import { toast } from "sonner";

interface Account {
  id: string;
  name: string;
  type: "BANK" | "EWALLET" | "CASH" | "INVESTMENT";
  balance: number;
  color: string;
  isDefault: boolean;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  BANK: <Building2 size={18} />,
  EWALLET: <Wallet size={18} />,
  CASH: <Banknote size={18} />,
  INVESTMENT: <TrendingUp size={18} />,
};

const TYPE_LABELS: Record<string, string> = {
  BANK: "Bank", EWALLET: "E-Wallet", CASH: "Tunai", INVESTMENT: "Investasi",
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [newAccount, setNewAccount] = useState({ name: "", type: "BANK", balance: "", color: "#3B82F6" });
  const [transfer, setTransfer] = useState({ fromId: "", toId: "", amount: "" });

  // Balance editing per account
  const [editingId, setEditingId] = useState<string | null>(null);
  const [balanceInput, setBalanceInput] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/accounts");
      const data = await res.json();
      setAccounts(data.accounts ?? []);
      setTotalBalance(data.totalBalance ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const handleAdd = async () => {
    if (!newAccount.name) { toast.error("Isi nama rekening"); return; }
    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newAccount, balance: parseFloat(newAccount.balance || "0") }),
    });
    if (res.ok) { toast.success("Rekening ditambahkan"); setShowAddModal(false); fetchAccounts(); }
  };

  const handleTransfer = async () => {
    if (!transfer.fromId || !transfer.toId || !transfer.amount) { toast.error("Isi semua field"); return; }
    if (transfer.fromId === transfer.toId) { toast.error("Rekening sumber dan tujuan harus berbeda"); return; }
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId: transfer.fromId, type: "TRANSFER", amount: parseFloat(transfer.amount), transferToId: transfer.toId, note: "Transfer antar rekening" }),
    });
    if (res.ok) { toast.success("Transfer berhasil"); setShowTransfer(false); setTransfer({ fromId: "", toId: "", amount: "" }); fetchAccounts(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus rekening ini? Semua transaksi terkait akan terputus.")) return;
    await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    toast.success("Rekening dihapus");
    fetchAccounts();
  };

  const startEdit = (acc: Account) => {
    setEditingId(acc.id);
    setBalanceInput(String(acc.balance));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setBalanceInput("");
  };

  const handleSaveBalance = async (acc: Account) => {
    const newBalance = parseFloat(balanceInput);
    if (isNaN(newBalance)) { toast.error("Masukkan jumlah yang valid"); return; }
    setSavingId(acc.id);
    try {
      const res = await fetch(`/api/accounts/${acc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ balance: newBalance }),
      });
      if (res.ok) {
        const delta = newBalance - acc.balance;
        if (delta > 0) toast.success(`Saldo bertambah ${formatRupiah(delta)} — dicatat sebagai pemasukan`);
        else if (delta < 0) toast.success(`Saldo berkurang ${formatRupiah(Math.abs(delta))} — dicatat sebagai pengeluaran`);
        else toast.success("Tidak ada perubahan");
        setEditingId(null);
        fetchAccounts();
      } else {
        toast.error("Gagal menyimpan");
      }
    } finally {
      setSavingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-screen-xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#F8FAFC]">Rekening</h1>
          <div className="flex gap-2">
            <button onClick={() => setShowTransfer(true)} className="flex items-center gap-2 bg-[#334155] hover:bg-[#475569] text-[#F8FAFC] px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-[#475569]">
              <ArrowLeftRight size={16} />
              Transfer
            </button>
            <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Plus size={16} />
              Tambah
            </button>
          </div>
        </div>

        {/* Total Balance KPI */}
        <div className="bg-[#1E293B] border border-[#475569] rounded-xl p-6" style={{ borderLeftWidth: "3px", borderLeftColor: "#3B82F6" }}>
          <p className="text-xs text-[#94A3B8] uppercase tracking-wider mb-2">Total Saldo</p>
          <p className="font-mono font-bold text-[#F8FAFC] text-3xl">{formatRupiah(totalBalance)}</p>
          <p className="text-xs text-[#64748B] mt-1">{accounts.length} rekening aktif</p>
        </div>

        {/* Account Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-36 bg-[#1E293B] animate-pulse rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((acc) => (
              <div key={acc.id} className="bg-[#1E293B] border border-[#475569] hover:border-[#64748B] rounded-xl p-5 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: acc.color + "25", color: acc.color }}>
                      {TYPE_ICONS[acc.type]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#F8FAFC]">{acc.name}</p>
                      <p className="text-xs text-[#64748B]">{TYPE_LABELS[acc.type]}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(acc.id)} className="opacity-0 group-hover:opacity-100 text-[#475569] hover:text-red-400 transition-all">
                    <X size={14} />
                  </button>
                </div>

                {editingId === acc.id ? (
                  <div className="space-y-2">
                    <input
                      type="number"
                      value={balanceInput}
                      onChange={(e) => setBalanceInput(e.target.value)}
                      className="w-full bg-[#0F172A] border border-violet-500 text-[#F8FAFC] rounded-lg px-3 py-2 text-base font-mono outline-none"
                      placeholder="0"
                      autoFocus
                      onKeyDown={(e) => { if (e.key === "Enter") handleSaveBalance(acc); if (e.key === "Escape") cancelEdit(); }}
                    />
                    <div className="flex gap-2">
                      <button onClick={cancelEdit} className="flex-1 py-1.5 rounded-lg text-xs text-[#94A3B8] bg-[#334155] border border-[#475569]">
                        Batal
                      </button>
                      <button
                        onClick={() => handleSaveBalance(acc)}
                        disabled={savingId === acc.id}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium"
                      >
                        <Check size={12} />
                        {savingId === acc.id ? "..." : "Simpan"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-end justify-between">
                    <p className="font-mono font-bold text-2xl" style={{ color: acc.balance < 0 ? "#EF4444" : "#F8FAFC" }}>
                      {formatRupiah(acc.balance)}
                    </p>
                    <button
                      onClick={() => startEdit(acc)}
                      className="opacity-0 group-hover:opacity-100 text-[#475569] hover:text-violet-400 transition-all p-1"
                      title="Edit saldo"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                )}

                {acc.isDefault && (
                  <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-medium">Default</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-[#1E293B] border border-[#475569] rounded-xl p-6 w-full max-w-sm animate-fade-in">
            <h3 className="text-lg font-semibold text-[#F8FAFC] mb-4">Tambah Rekening</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#94A3B8] block mb-1.5">Nama Rekening</label>
                <input value={newAccount.name} onChange={(e) => setNewAccount((p) => ({ ...p, name: e.target.value }))}
                  placeholder="BCA Tabungan, GoPay..." className="w-full bg-[#334155] border border-[#475569] text-[#F8FAFC] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 placeholder-[#475569]" />
              </div>
              <div>
                <label className="text-xs text-[#94A3B8] block mb-1.5">Tipe</label>
                <select value={newAccount.type} onChange={(e) => setNewAccount((p) => ({ ...p, type: e.target.value }))}
                  className="w-full bg-[#334155] border border-[#475569] text-[#F8FAFC] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500">
                  {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#94A3B8] block mb-1.5">Saldo Awal (Rp)</label>
                <input type="number" value={newAccount.balance} onChange={(e) => setNewAccount((p) => ({ ...p, balance: e.target.value }))}
                  placeholder="0" className="w-full bg-[#334155] border border-[#475569] text-[#F8FAFC] rounded-lg px-3 py-2.5 text-sm font-mono outline-none focus:border-blue-500" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-lg text-sm text-[#94A3B8] bg-[#334155]">Batal</button>
                <button onClick={handleAdd} className="flex-1 py-2.5 rounded-lg text-sm text-white bg-blue-600 hover:bg-blue-500 font-medium">Simpan</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowTransfer(false)} />
          <div className="relative bg-[#1E293B] border border-[#475569] rounded-xl p-6 w-full max-w-sm animate-fade-in">
            <h3 className="text-lg font-semibold text-[#F8FAFC] mb-4">Transfer Antar Rekening</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#94A3B8] block mb-1.5">Dari</label>
                <select value={transfer.fromId} onChange={(e) => setTransfer((p) => ({ ...p, fromId: e.target.value }))}
                  className="w-full bg-[#334155] border border-[#475569] text-[#F8FAFC] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500">
                  <option value="">Pilih rekening</option>
                  {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} ({formatRupiah(a.balance)})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#94A3B8] block mb-1.5">Ke</label>
                <select value={transfer.toId} onChange={(e) => setTransfer((p) => ({ ...p, toId: e.target.value }))}
                  className="w-full bg-[#334155] border border-[#475569] text-[#F8FAFC] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500">
                  <option value="">Pilih rekening</option>
                  {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#94A3B8] block mb-1.5">Jumlah (Rp)</label>
                <input type="number" value={transfer.amount} onChange={(e) => setTransfer((p) => ({ ...p, amount: e.target.value }))}
                  placeholder="200000" className="w-full bg-[#334155] border border-[#475569] text-[#F8FAFC] rounded-lg px-3 py-2.5 text-sm font-mono outline-none focus:border-blue-500" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowTransfer(false)} className="flex-1 py-2.5 rounded-lg text-sm text-[#94A3B8] bg-[#334155]">Batal</button>
                <button onClick={handleTransfer} className="flex-1 py-2.5 rounded-lg text-sm text-white bg-cyan-600 hover:bg-cyan-500 font-medium">Transfer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
