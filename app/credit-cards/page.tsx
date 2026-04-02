"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatRupiah } from "@/lib/format";
import { Plus, X, CreditCard as CreditCardIcon, Check, Trash2 } from "lucide-react";
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

function CardVisual({
  card,
  isSelected,
  onClick,
  onSaveBalance,
  onDelete,
}: {
  card: CreditCard;
  isSelected: boolean;
  onClick: () => void;
  onSaveBalance: (newBalance: number) => Promise<void>;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const days = (() => {
    const now = new Date();
    let due = new Date(now.getFullYear(), now.getMonth(), card.dueDate);
    if (due < now) due = new Date(now.getFullYear(), now.getMonth() + 1, card.dueDate);
    return Math.ceil((due.getTime() - now.getTime()) / 86400000);
  })();

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInputVal(String(card.balance));
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const val = parseFloat(inputVal);
    if (isNaN(val) || val < 0) { toast.error("Jumlah tidak valid"); return; }
    setSaving(true);
    try {
      await onSaveBalance(val);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(false);
  };

  return (
    <div
      onClick={!editing ? onClick : undefined}
      className={`flex-shrink-0 relative cursor-pointer transition-all duration-200 select-none group/card ${
        isSelected ? "scale-105" : "opacity-70 hover:opacity-100"
      }`}
      style={{ width: "270px", height: "168px" }}
    >
      {/* Card body — matte dark glass */}
      <div
        className="absolute inset-0 rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #1c1c2e 0%, #16213e 50%, #0f3460 100%)",
          boxShadow: isSelected
            ? "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)"
            : "0 8px 24px rgba(0,0,0,0.4)",
        }}
      >
        {/* Subtle texture overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)"
        }} />

        {/* Colored accent glow from bank color */}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 blur-2xl"
          style={{ background: card.color, transform: "translate(30%, -30%)" }} />

        {/* Top row: bank + last4 */}
        <div className="absolute top-4 left-5 right-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: card.color }}>
              <span className="text-white font-bold text-[9px]">
                {card.bank.slice(0, 1)}
              </span>
            </div>
            <span className="text-white/80 text-xs font-semibold tracking-wide">{card.bank}</span>
          </div>
          <span className="text-white/50 font-mono text-xs tracking-widest">•••• {card.last4}</span>
        </div>

        {/* Center: large balance — tap to edit */}
        <div className="absolute inset-0 flex items-center justify-start pl-5">
          {editing ? (
            <div className="flex flex-col gap-2 w-full pr-5" onClick={(e) => e.stopPropagation()}>
              <input
                ref={inputRef}
                type="number"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave(e as any);
                  if (e.key === "Escape") handleCancel(e as any);
                }}
                className="w-full bg-white/10 border border-white/30 text-white rounded-lg px-3 py-2 text-lg font-mono font-bold outline-none focus:border-white/60"
                placeholder="0"
              />
              <div className="flex gap-2">
                <button onClick={handleCancel}
                  className="flex-1 py-1 text-xs text-white/60 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10">
                  Batal
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-1 py-1 text-xs text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 rounded-lg font-medium">
                  <Check size={11} />
                  {saving ? "..." : "Simpan"}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={startEdit}
              className="text-left group"
              title="Klik untuk edit tagihan"
            >
              <p className="text-white/40 text-[10px] uppercase tracking-widest mb-0.5">Tagihan</p>
              <p className="text-white font-mono font-bold text-2xl leading-tight group-hover:text-violet-200 transition-colors">
                {formatRupiah(card.balance)}
              </p>
              <p className="text-white/30 text-[9px] mt-0.5 group-hover:text-white/50 transition-colors">tap to edit</p>
            </button>
          )}
        </div>

        {/* Bottom row: billing/due dates + days */}
        {!editing && (
          <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
            <div>
              <p className="text-white/30 text-[9px] uppercase tracking-wider">Tgl Billing / Tempo</p>
              <p className="text-white/70 font-mono text-sm font-medium">{card.billingDate} / {card.dueDate}</p>
            </div>
            <div className="text-right">
              <p className="text-white/30 text-[9px] uppercase tracking-wider">Jatuh Tempo</p>
              <p className={`font-mono text-sm font-semibold ${days <= 3 ? "text-red-400" : "text-white/70"}`}>
                {days}h lagi
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Delete button — top-right, visible on hover */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-black/40 hover:bg-red-500 text-white/70 hover:text-white flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all shadow z-10"
        title="Hapus kartu"
      >
        <X size={12} />
      </button>
    </div>
  );
}

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
      if (data.cards?.length > 0)
        setSelected((prev) => data.cards.find((c: CreditCard) => c.id === prev?.id) ?? data.cards[0]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  const handleAdd = async () => {
    if (!newCard.name || !newCard.last4 || !newCard.limit) { toast.error("Isi semua field wajib"); return; }
    if (!/^\d{4}$/.test(newCard.last4)) { toast.error("4 Digit Terakhir harus tepat 4 angka"); return; }
    const res = await fetch("/api/credit-cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newCard,
        last4: newCard.last4,
        limit: parseFloat(newCard.limit),
        billingDate: parseInt(newCard.billingDate),
        dueDate: parseInt(newCard.dueDate),
        color: BANK_COLORS[newCard.bank] ?? BANK_COLORS.default,
      }),
    });
    if (res.ok) { toast.success("Kartu kredit ditambahkan"); setShowAddModal(false); fetchCards(); }
  };

  const handleDelete = async (cardId: string) => {
    if (!confirm("Hapus kartu kredit ini?")) return;
    const res = await fetch(`/api/credit-cards/${cardId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Kartu kredit dihapus");
      setSelected((prev) => (prev?.id === cardId ? null : prev));
      fetchCards();
    } else {
      toast.error("Gagal menghapus");
    }
  };

  const handleSaveBalance = async (cardId: string, currentBalance: number, newBalance: number) => {
    const res = await fetch(`/api/credit-cards/${cardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ balance: newBalance }),
    });
    if (res.ok) {
      const delta = newBalance - currentBalance;
      toast.success(
        delta > 0
          ? `Tagihan +${formatRupiah(delta)} — dicatat sebagai pengeluaran`
          : delta < 0
          ? `Tagihan −${formatRupiah(Math.abs(delta))} — dicatat sebagai pemasukan`
          : "Tidak ada perubahan"
      );
      fetchCards();
    } else {
      toast.error("Gagal menyimpan");
      throw new Error("save failed");
    }
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
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="w-[270px] h-[168px] bg-[#1E293B] animate-pulse rounded-2xl flex-shrink-0" />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <div className="bg-[#1E293B] border border-[#475569] rounded-xl p-8 text-center">
            <CreditCardIcon size={40} className="mx-auto text-[#475569] mb-3" />
            <p className="text-[#64748B] text-sm">Belum ada kartu kredit. Tambah sekarang.</p>
          </div>
        ) : (
          <>
            <div className="flex gap-6 overflow-x-auto pb-2 pl-1 pt-2">
              {cards.map((card) => (
                <CardVisual
                  key={card.id}
                  card={card}
                  isSelected={selected?.id === card.id}
                  onClick={() => setSelected(card)}
                  onSaveBalance={(newBal) => handleSaveBalance(card.id, card.balance, newBal)}
                  onDelete={() => handleDelete(card.id)}
                />
              ))}
            </div>

            {selected && (
              <>
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
          <div className="relative bg-[#1E293B] border border-[#475569] rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-[#F8FAFC] mb-4">Tambah Kartu Kredit</h3>
            <div className="space-y-4">
              {[
                { label: "Nama Kartu", key: "name", placeholder: "BCA Visa Platinum" },
                { label: "Bank", key: "bank", placeholder: "BCA" },
                { label: "4 Digit Terakhir", key: "last4", placeholder: "4521", maxLength: 4 },
                { label: "Limit (Rp)", key: "limit", placeholder: "15000000", type: "number" },
                { label: "Tanggal Billing", key: "billingDate", placeholder: "25", type: "number" },
                { label: "Tanggal Jatuh Tempo", key: "dueDate", placeholder: "5", type: "number" },
              ].map(({ label, key, placeholder, type, maxLength }: any) => (
                <div key={key}>
                  <label className="text-xs text-[#94A3B8] block mb-1.5">{label}</label>
                  <input
                    type={type ?? "text"}
                    value={(newCard as any)[key]}
                    onChange={(e) => setNewCard((p) => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    maxLength={maxLength}
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
