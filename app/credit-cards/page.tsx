"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatRupiah } from "@/lib/format";
import { Plus, X, CreditCard as CreditCardIcon, Pencil, Check } from "lucide-react";
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

function CardVisual({ card, isSelected, onClick }: { card: CreditCard; isSelected: boolean; onClick: () => void }) {
  const days = (() => {
    const now = new Date();
    let due = new Date(now.getFullYear(), now.getMonth(), card.dueDate);
    if (due < now) due = new Date(now.getFullYear(), now.getMonth() + 1, card.dueDate);
    return Math.ceil((due.getTime() - now.getTime()) / 86400000);
  })();

  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 relative transition-all duration-200 ${isSelected ? "scale-105" : "opacity-70 hover:opacity-90 hover:scale-102"}`}
      style={{ width: "288px", height: "176px" }}
    >
      {/* Card body with left diagonal cut */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          clipPath: "polygon(28px 0%, 100% 0%, 100% 100%, 0% 100%)",
          background: `linear-gradient(135deg, ${card.color}ee 0%, ${card.color} 60%, ${card.color}bb 100%)`,
          borderRadius: "0 16px 16px 0",
        }}
      >
        {/* Decorative circles */}
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-10" style={{ background: "white" }} />
        <div className="absolute -right-4 -bottom-10 w-32 h-32 rounded-full opacity-10" style={{ background: "white" }} />

        {/* Chip */}
        <div className="absolute top-5 left-10">
          <div className="w-9 h-7 rounded-md border-2 border-white/40 bg-gradient-to-br from-yellow-200/60 to-yellow-400/40 flex items-center justify-center">
            <div className="grid grid-cols-2 gap-0.5">
              <div className="w-1.5 h-1.5 bg-yellow-300/70 rounded-sm" />
              <div className="w-1.5 h-1.5 bg-yellow-300/70 rounded-sm" />
              <div className="w-1.5 h-1.5 bg-yellow-300/70 rounded-sm" />
              <div className="w-1.5 h-1.5 bg-yellow-300/70 rounded-sm" />
            </div>
          </div>
        </div>

        {/* Bank name top right */}
        <div className="absolute top-5 right-5">
          <p className="text-white/80 text-xs font-bold uppercase tracking-widest">{card.bank}</p>
        </div>

        {/* Card number */}
        <div className="absolute top-16 left-10">
          <p className="text-white/70 font-mono text-sm tracking-[0.25em]">•••• •••• •••• {card.last4}</p>
        </div>

        {/* Card name */}
        <div className="absolute bottom-10 left-10">
          <p className="text-white font-semibold text-base">{card.name}</p>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-4 left-10 right-5 flex justify-between items-end">
          <div>
            <p className="text-white/50 text-[9px] uppercase tracking-wider">Tagihan</p>
            <p className="text-white font-mono font-bold text-sm">{formatRupiah(card.balance)}</p>
          </div>
          <div className="text-right">
            <p className="text-white/50 text-[9px] uppercase tracking-wider">Jatuh Tempo</p>
            <p className={`font-mono font-semibold text-sm ${days <= 3 ? "text-red-300" : "text-white"}`}>{days}h lagi</p>
          </div>
        </div>

        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute inset-0 ring-2 ring-white/40 rounded-r-2xl" style={{ clipPath: "polygon(28px 0%, 100% 0%, 100% 100%, 0% 100%)" }} />
        )}
      </div>

      {/* Left edge accent line */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ background: `${card.color}`, transform: "skewY(-4deg)", transformOrigin: "top" }}
      />
    </button>
  );
}

export default function CreditCardsPage() {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CreditCard | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCard, setNewCard] = useState({ name: "", bank: "BCA", last4: "", limit: "", billingDate: "25", dueDate: "5" });

  // Balance editing state
  const [editingBalance, setEditingBalance] = useState(false);
  const [balanceInput, setBalanceInput] = useState("");
  const [savingBalance, setSavingBalance] = useState(false);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/credit-cards");
      const data = await res.json();
      setCards(data.cards ?? []);
      if (data.cards?.length > 0) setSelected((prev) => data.cards.find((c: CreditCard) => c.id === prev?.id) ?? data.cards[0]);
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
      body: JSON.stringify({
        ...newCard,
        last4: newCard.last4.slice(-4),
        limit: parseFloat(newCard.limit),
        billingDate: parseInt(newCard.billingDate),
        dueDate: parseInt(newCard.dueDate),
        color: BANK_COLORS[newCard.bank] ?? BANK_COLORS.default,
      }),
    });
    if (res.ok) { toast.success("Kartu kredit ditambahkan"); setShowAddModal(false); fetchCards(); }
  };

  const handleSaveBalance = async () => {
    if (!selected) return;
    const newBalance = parseFloat(balanceInput.replace(/\./g, "").replace(",", "."));
    if (isNaN(newBalance) || newBalance < 0) { toast.error("Masukkan jumlah yang valid"); return; }
    setSavingBalance(true);
    try {
      const res = await fetch(`/api/credit-cards/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ balance: newBalance }),
      });
      if (res.ok) {
        const delta = newBalance - selected.balance;
        toast.success(delta > 0 ? `Tagihan bertambah ${formatRupiah(Math.abs(delta))} — dicatat sebagai pengeluaran` : delta < 0 ? `Tagihan berkurang ${formatRupiah(Math.abs(delta))} — dicatat sebagai pemasukan` : "Tidak ada perubahan");
        setEditingBalance(false);
        fetchCards();
      } else {
        toast.error("Gagal menyimpan");
      }
    } finally {
      setSavingBalance(false);
    }
  };

  const startEditBalance = () => {
    if (!selected) return;
    setBalanceInput(String(selected.balance));
    setEditingBalance(true);
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
          <div className="flex gap-6 overflow-x-auto pb-2">
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
            <div className="flex gap-6 overflow-x-auto pb-2 pl-1 pt-1">
              {cards.map((card) => (
                <CardVisual
                  key={card.id}
                  card={card}
                  isSelected={selected?.id === card.id}
                  onClick={() => { setSelected(card); setEditingBalance(false); }}
                />
              ))}
            </div>

            {/* Selected Card Detail */}
            {selected && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Editable balance */}
                  <div className="bg-[#1E293B] border border-[#475569] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-[#94A3B8] uppercase tracking-wider">Tagihan Saat Ini</p>
                      {!editingBalance ? (
                        <button onClick={startEditBalance} className="text-[#475569] hover:text-violet-400 transition-colors">
                          <Pencil size={13} />
                        </button>
                      ) : (
                        <button onClick={() => setEditingBalance(false)} className="text-[#475569] hover:text-red-400 transition-colors">
                          <X size={13} />
                        </button>
                      )}
                    </div>
                    {editingBalance ? (
                      <div className="space-y-2">
                        <input
                          type="number"
                          value={balanceInput}
                          onChange={(e) => setBalanceInput(e.target.value)}
                          className="w-full bg-[#0F172A] border border-violet-500 text-[#F8FAFC] rounded-lg px-3 py-2 text-sm font-mono outline-none"
                          placeholder="0"
                          autoFocus
                          onKeyDown={(e) => e.key === "Enter" && handleSaveBalance()}
                        />
                        <button
                          onClick={handleSaveBalance}
                          disabled={savingBalance}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium"
                        >
                          <Check size={12} />
                          {savingBalance ? "Menyimpan..." : "Simpan"}
                        </button>
                      </div>
                    ) : (
                      <p className="font-mono font-bold text-xl text-[#EF4444]">{formatRupiah(selected.balance)}</p>
                    )}
                  </div>

                  {[
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

                {/* Utilization Bar */}
                <div className="bg-[#1E293B] border border-[#475569] rounded-xl p-5">
                  <div className="flex justify-between mb-3">
                    <span className="text-sm font-medium text-[#F8FAFC]">Utilisasi Kredit</span>
                    <span className="font-mono text-sm text-[#94A3B8]">{formatRupiah(selected.balance)} / {formatRupiah(selected.limit)}</span>
                  </div>
                  <ProgressBar percentage={selected.utilization} height={10} />
                  <p className="text-xs text-[#64748B] mt-2">Rekomendasi: jaga di bawah 30% untuk credit score yang baik</p>
                </div>
              </>
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
                  <input
                    type={type ?? "text"}
                    value={(newCard as any)[key]}
                    onChange={(e) => setNewCard((p) => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full bg-[#334155] border border-[#475569] text-[#F8FAFC] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 placeholder-[#475569]"
                  />
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
