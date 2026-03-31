"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatRupiah } from "@/lib/format";
import { Plus, X, CreditCard as CreditCardIcon } from "lucide-react";
import { toast } from "sonner";

interface CreditCard {
  id: string;
  name: string;
  bank: string;
  last4: string;
  limit: number;
  balance: number;
  utilization: number;
  billingDate: number;
  dueDate: number;
  color: string;
}

const BANK_COLORS: Record<string, string> = {
  BCA: "#1E40AF", BNI: "#F97316", BRI: "#1D4ED8", Mandiri: "#F59E0B",
  CIMB: "#DC2626", HSBC: "#EF4444", Danamon: "#7C3AED", default: "#3B82F6",
};

export default function CreditCardsPage() {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CreditCard | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCard, setNewCard] = useState({ name: "", bank: "BCA", last4: "", limit: "", billingDate: "25", dueDate: "5" });

  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/credit-cards");
      const data = await res.json();
      setCards(data.cards ?? []);
      if (data.cards?.length > 0) setSelected(data.cards[0]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  const handleAdd = async () => {
    if (!newCard.name || !newCard.last4 || !newCard.limit) { toast.error("Isi semua field wajib"); return; }
    const res = await fetch("/api/credit-cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newCard, last4: newCard.last4.slice(-4), limit: parseFloat(newCard.limit), billingDate: parseInt(newCard.billingDate), dueDate: parseInt(newCard.dueDate), color: BANK_COLORS[newCard.bank] ?? BANK_COLORS.default }),
    });
    if (res.ok) { toast.success("Kartu kredit ditambahkan"); setShowAddModal(false); fetchCards(); }
  };

  const daysUntilDue = (dueDate: number) => {
    const now = new Date();
    let due = new Date(now.getFullYear(), now.getMonth(), dueDate);
    if (due < now) due = new Date(now.getFullYear(), now.getMonth() + 1, dueDate);
    return Math.ceil((due.getTime() - now.getTime()) / 86400000);
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-screen-xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#F8FAFC]">Kartu Kredit</h1>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} />
            Tambah Kartu
          </button>
        </div>

        {loading ? (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {Array.from({ length: 2 }).map((_, i) => <div key={i} className="w-72 h-44 bg-[#1E293B] animate-pulse rounded-2xl flex-shrink-0" />)}
          </div>
        ) : cards.length === 0 ? (
          <div className="bg-[#1E293B] border border-[#475569] rounded-xl p-8 text-center">
            <CreditCardIcon size={40} className="mx-auto text-[#475569] mb-3" />
            <p className="text-[#64748B] text-sm">Belum ada kartu kredit. Tambah sekarang.</p>
          </div>
        ) : (
          <>
            {/* Card Carousel */}
            <div className="flex gap-4 overflow-x-auto pb-2">
              {cards.map((card) => {
                const days = daysUntilDue(card.dueDate);
                const isSelected = selected?.id === card.id;
                return (
                  <button
                    key={card.id}
                    onClick={() => setSelected(card)}
                    className={`flex-shrink-0 w-72 h-44 rounded-2xl p-5 text-left transition-all relative overflow-hidden ${isSelected ? "ring-2 ring-white/30 scale-105" : "opacity-75 hover:opacity-100"}`}
                    style={{ background: `linear-gradient(135deg, ${card.color}, ${card.color}cc)` }}
                  >
                    <div className="absolute top-3 right-3 opacity-20">
                      <CreditCardIcon size={48} />
                    </div>
                    <p className="text-white/70 text-xs font-medium uppercase tracking-wider">{card.bank}</p>
                    <p className="text-white font-semibold text-lg mt-1">{card.name}</p>
                    <p className="text-white/70 font-mono text-sm mt-3 tracking-[0.2em]">•••• •••• •••• {card.last4}</p>
                    <div className="flex justify-between mt-4">
                      <div>
                        <p className="text-white/50 text-[10px]">TAGIHAN</p>
                        <p className="text-white font-mono font-semibold text-sm">{formatRupiah(card.balance)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/50 text-[10px]">JATUH TEMPO</p>
                        <p className={`font-mono font-semibold text-sm ${days <= 3 ? "text-red-300" : "text-white"}`}>{days} hari lagi</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Card Detail */}
            {selected && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Tagihan Saat Ini", value: formatRupiah(selected.balance), color: "#EF4444" },
                  { label: "Kredit Tersedia", value: formatRupiah(selected.limit - selected.balance), color: "#10B981" },
                  { label: "Utilisasi", value: `${Math.round(selected.utilization)}%`, color: selected.utilization > 80 ? "#EF4444" : selected.utilization > 60 ? "#F59E0B" : "#10B981" },
                  { label: "Hari Jatuh Tempo", value: `${daysUntilDue(selected.dueDate)} hari`, color: daysUntilDue(selected.dueDate) <= 3 ? "#EF4444" : "#F8FAFC" },
                ].map((kpi) => (
                  <div key={kpi.label} className="bg-[#1E293B] border border-[#475569] rounded-xl p-4">
                    <p className="text-xs text-[#94A3B8] uppercase tracking-wider mb-2">{kpi.label}</p>
                    <p className="font-mono font-bold text-xl" style={{ color: kpi.color }}>{kpi.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Utilization Bar */}
            {selected && (
              <div className="bg-[#1E293B] border border-[#475569] rounded-xl p-5">
                <div className="flex justify-between mb-3">
                  <span className="text-sm font-medium text-[#F8FAFC]">Utilisasi Kredit</span>
                  <span className="font-mono text-sm text-[#94A3B8]">{formatRupiah(selected.balance)} / {formatRupiah(selected.limit)}</span>
                </div>
                <ProgressBar percentage={selected.utilization} height={10} />
                <p className="text-xs text-[#64748B] mt-2">Rekomendasi: jaga di bawah 30% untuk credit score yang baik</p>
              </div>
            )}
          </>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-[#1E293B] border border-[#475569] rounded-xl p-6 w-full max-w-sm animate-fade-in">
            <h3 className="text-lg font-semibold text-[#F8FAFC] mb-4">Tambah Kartu Kredit</h3>
            <div className="space-y-4">
              {[
                { label: "Nama Kartu", key: "name", placeholder: "BCA Visa Platinum" },
                { label: "Bank", key: "bank", placeholder: "BCA" },
                { label: "4 Digit Terakhir", key: "last4", placeholder: "4521" },
                { label: "Limit (Rp)", key: "limit", placeholder: "15000000", type: "number" },
                { label: "Tanggal Billing", key: "billingDate", placeholder: "25", type: "number" },
                { label: "Tanggal Jatuh Tempo", key: "dueDate", placeholder: "5", type: "number" },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label className="text-xs text-[#94A3B8] block mb-1.5">{label}</label>
                  <input type={type ?? "text"} value={(newCard as any)[key]} onChange={(e) => setNewCard((p) => ({ ...p, [key]: e.target.value }))}
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
    </DashboardLayout>
  );
}
