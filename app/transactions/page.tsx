"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TxTypeBadge } from "@/components/ui/status-badge";
import { Currency } from "@/components/ui/currency";
import { formatRupiah } from "@/lib/format";
import { Plus, Search, X, ChevronLeft, ChevronRight, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Transaction {
  id: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  note?: string;
  date: string;
  category?: { id: string; name: string; icon: string; color: string };
  account: { id: string; name: string };
}

interface Summary { totalIncome: number; totalExpense: number; net: number; }

const TYPE_OPTIONS = ["", "INCOME", "EXPENSE", "TRANSFER"];
const DATE_PRESETS = [
  { label: "Hari Ini", days: 0 },
  { label: "Minggu Ini", days: 7 },
  { label: "Bulan Ini", days: 30 },
  { label: "3 Bulan", days: 90 },
];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalIncome: 0, totalExpense: 0, net: 0 });
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [datePreset, setDatePreset] = useState<number | null>(30);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; icon: string }>>([]);
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string }>>([]);
  const [newTx, setNewTx] = useState({ type: "EXPENSE", amount: "", categoryId: "", accountId: "", note: "", date: new Date().toISOString().slice(0, 10) });

  const buildParams = useCallback(() => {
    const p = new URLSearchParams({ page: String(page), limit: "20" });
    if (type) p.set("type", type);
    if (search) p.set("search", search);
    if (datePreset !== null) {
      const from = new Date();
      from.setDate(from.getDate() - datePreset);
      p.set("dateFrom", from.toISOString().slice(0, 10));
    }
    return p.toString();
  }, [page, type, search, datePreset]);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/transactions?${buildParams()}`);
      const data = await res.json();
      setTransactions(data.transactions ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
      setSummary(data.summary ?? { totalIncome: 0, totalExpense: 0, net: 0 });
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((d) => setCategories(d.categories ?? []));
    fetch("/api/accounts").then((r) => r.json()).then((d) => {
      setAccounts(d.accounts ?? []);
      if (d.accounts?.[0]) setNewTx((prev) => ({ ...prev, accountId: d.accounts[0].id }));
    });
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus transaksi ini?")) return;
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    toast.success("Transaksi dihapus");
    fetchTransactions();
  };

  const handleAdd = async () => {
    if (!newTx.amount || !newTx.accountId) { toast.error("Isi jumlah dan rekening"); return; }
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newTx, amount: parseFloat(newTx.amount), categoryId: newTx.categoryId || null }),
    });
    if (res.ok) {
      toast.success("Transaksi ditambahkan");
      setShowAddPanel(false);
      fetchTransactions();
    } else {
      toast.error("Gagal menambah transaksi");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-screen-xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#F8FAFC]">Transaksi</h1>
          <button
            onClick={() => setShowAddPanel(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Tambah
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Date presets */}
          {DATE_PRESETS.map((p) => (
            <button
              key={p.days}
              onClick={() => { setDatePreset(p.days); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${datePreset === p.days ? "bg-blue-600 text-white" : "bg-[#1E293B] text-[#94A3B8] hover:bg-[#334155] border border-[#475569]"}`}
            >
              {p.label}
            </button>
          ))}

          {/* Type filter */}
          <select
            value={type}
            onChange={(e) => { setType(e.target.value); setPage(1); }}
            className="bg-[#1E293B] border border-[#475569] text-[#94A3B8] text-xs rounded-lg px-3 py-1.5 outline-none focus:border-blue-500"
          >
            <option value="">Semua Tipe</option>
            <option value="INCOME">Pemasukan</option>
            <option value="EXPENSE">Pengeluaran</option>
            <option value="TRANSFER">Transfer</option>
          </select>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari catatan..."
              className="w-full bg-[#1E293B] border border-[#475569] text-[#F8FAFC] text-xs rounded-lg pl-8 pr-3 py-1.5 outline-none focus:border-blue-500 placeholder-[#475569]"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B]">
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#1E293B] border border-[#475569] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#334155]">
                  {["Tanggal", "Tipe", "Kategori", "Jumlah", "Rekening", "Catatan", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[#94A3B8] uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]">
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-[#334155] animate-pulse rounded" /></td>
                      ))}
                    </tr>
                  ))
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <p className="text-[#64748B] text-sm">Tidak ada transaksi ditemukan.</p>
                      <p className="text-[#475569] text-xs mt-1">Text ke bot Telegram kamu untuk catat transaksi!</p>
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#334155]/50 group transition-colors">
                      <td className="px-4 py-3 text-xs text-[#64748B] whitespace-nowrap font-mono">
                        {new Date(tx.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                      </td>
                      <td className="px-4 py-3"><TxTypeBadge type={tx.type} /></td>
                      <td className="px-4 py-3">
                        {tx.category ? (
                          <div className="flex items-center gap-1.5">
                            <span>{tx.category.icon}</span>
                            <span className="text-xs text-[#94A3B8]">{tx.category.name}</span>
                          </div>
                        ) : <span className="text-xs text-[#475569]">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="font-mono text-sm font-medium"
                          style={{ color: tx.type === "INCOME" ? "#10B981" : tx.type === "EXPENSE" ? "#EF4444" : "#06B6D4" }}
                        >
                          {tx.type === "INCOME" ? "+" : tx.type === "EXPENSE" ? "−" : "↔"} {formatRupiah(tx.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#94A3B8]">{tx.account.name}</td>
                      <td className="px-4 py-3 text-xs text-[#94A3B8] max-w-[180px] truncate">{tx.note ?? "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleDelete(tx.id)}
                            className="p-1.5 text-[#64748B] hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#334155]">
              <span className="text-xs text-[#64748B]">
                Menampilkan {((page - 1) * 20) + 1}–{Math.min(page * 20, total)} dari {total}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 text-[#64748B] hover:text-[#F8FAFC] disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-3 py-1 text-xs text-[#94A3B8]">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 text-[#64748B] hover:text-[#F8FAFC] disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Summary Footer */}
        <div className="sticky bottom-16 md:bottom-0 bg-[#1E293B] border border-[#475569] rounded-xl px-5 py-3 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-[#94A3B8]">Pemasukan:</span>
            <span className="font-mono text-sm text-emerald-400">{formatRupiah(summary.totalIncome)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-xs text-[#94A3B8]">Pengeluaran:</span>
            <span className="font-mono text-sm text-red-400">{formatRupiah(summary.totalExpense)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-xs text-[#94A3B8]">Net:</span>
            <span className={`font-mono text-sm ${summary.net >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatRupiah(summary.net)}</span>
          </div>
        </div>
      </div>

      {/* Add Transaction Panel */}
      {showAddPanel && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/60" onClick={() => setShowAddPanel(false)} />
          <div className="w-full max-w-sm bg-[#1E293B] border-l border-[#475569] p-6 overflow-y-auto animate-slide-in-right">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[#F8FAFC]">Tambah Transaksi</h2>
              <button onClick={() => setShowAddPanel(false)} className="text-[#64748B] hover:text-[#F8FAFC]"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              {/* Type */}
              <div>
                <label className="text-xs text-[#94A3B8] block mb-1.5">Tipe</label>
                <div className="flex gap-2">
                  {["INCOME", "EXPENSE", "TRANSFER"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setNewTx((p) => ({ ...p, type: t }))}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${newTx.type === t ? "bg-blue-600 text-white" : "bg-[#334155] text-[#94A3B8] hover:bg-[#475569]"}`}
                    >
                      {t === "INCOME" ? "Masuk" : t === "EXPENSE" ? "Keluar" : "Transfer"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="text-xs text-[#94A3B8] block mb-1.5">Jumlah (Rp)</label>
                <input
                  type="number"
                  value={newTx.amount}
                  onChange={(e) => setNewTx((p) => ({ ...p, amount: e.target.value }))}
                  placeholder="50000"
                  className="w-full bg-[#334155] border border-[#475569] text-[#F8FAFC] rounded-lg px-3 py-2.5 text-sm font-mono outline-none focus:border-blue-500"
                />
              </div>

              {/* Account */}
              <div>
                <label className="text-xs text-[#94A3B8] block mb-1.5">Rekening</label>
                <select
                  value={newTx.accountId}
                  onChange={(e) => setNewTx((p) => ({ ...p, accountId: e.target.value }))}
                  className="w-full bg-[#334155] border border-[#475569] text-[#F8FAFC] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                >
                  {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              {/* Category (not for income) */}
              {newTx.type === "EXPENSE" && (
                <div>
                  <label className="text-xs text-[#94A3B8] block mb-1.5">Kategori</label>
                  <select
                    value={newTx.categoryId}
                    onChange={(e) => setNewTx((p) => ({ ...p, categoryId: e.target.value }))}
                    className="w-full bg-[#334155] border border-[#475569] text-[#F8FAFC] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="">Pilih kategori</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
              )}

              {/* Date */}
              <div>
                <label className="text-xs text-[#94A3B8] block mb-1.5">Tanggal</label>
                <input
                  type="date"
                  value={newTx.date}
                  onChange={(e) => setNewTx((p) => ({ ...p, date: e.target.value }))}
                  className="w-full bg-[#334155] border border-[#475569] text-[#F8FAFC] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              {/* Note */}
              <div>
                <label className="text-xs text-[#94A3B8] block mb-1.5">Catatan</label>
                <input
                  value={newTx.note}
                  onChange={(e) => setNewTx((p) => ({ ...p, note: e.target.value }))}
                  placeholder="Nasi goreng tekko..."
                  className="w-full bg-[#334155] border border-[#475569] text-[#F8FAFC] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 placeholder-[#475569]"
                />
              </div>

              <button
                onClick={handleAdd}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg text-sm font-semibold transition-colors mt-2"
              >
                Simpan Transaksi
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
