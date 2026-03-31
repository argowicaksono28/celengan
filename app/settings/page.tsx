"use client";

import { useEffect, useState, useRef } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { User, Palette, Bell, Database, Layers, Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";

const ICON_OPTIONS = [
  "🍜","🍔","🍕","🥗","☕","🍰","🛒",
  "🚗","🚌","✈️","🚂","⛽","🏠","🏢",
  "💡","🛁","🛍️","👗","👟","💄","💍",
  "🎬","🎮","🎵","📺","🎭","🏋️","⚽",
  "🏥","💊","🏃","🧘","📚","🎓","✏️",
  "📱","💻","📡","🔧","💰","📈","💳",
  "🎁","🤝","🐾","🌿","🌍","⚡","📦",
];

const SECTIONS = [
  { id: "profile", label: "Profil", icon: User },
  { id: "appearance", label: "Tampilan", icon: Palette },
  { id: "categories", label: "Kategori", icon: Layers },
  { id: "notifications", label: "Notifikasi", icon: Bell },
  { id: "data", label: "Data", icon: Database },
];

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("profile");
  const [user, setUser] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", icon: "📦", color: "#6366F1" });
  const [showNewIconPicker, setShowNewIconPicker] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", icon: "", color: "" });
  const [showEditIconPicker, setShowEditIconPicker] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [notifications, setNotifications] = useState({
    budgetAlerts: true,
    goalMilestones: true,
    weeklyDigest: false,
    billReminders: true,
  });

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setUser(d.user));
    fetch("/api/categories").then((r) => r.json()).then((d) => setCategories(d.categories ?? []));
  }, []);

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) return toast.error("Nama kategori wajib diisi");
    setSavingCategory(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCategory),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCategories((prev) => [...prev, data.category].sort((a, b) => a.name.localeCompare(b.name)));
      setShowAddCategory(false);
      setNewCategory({ name: "", icon: "📦", color: "#6366F1" });
      toast.success("Kategori berhasil ditambahkan!");
    } catch {
      toast.error("Gagal menambah kategori");
    } finally {
      setSavingCategory(false);
    }
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditForm({ name: cat.name, icon: cat.icon, color: cat.color });
    setShowEditIconPicker(false);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editForm.name.trim()) return toast.error("Nama wajib diisi");
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/categories/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCategories((prev) => prev.map((c) => c.id === editingId ? data.category : c).sort((a, b) => a.name.localeCompare(b.name)));
      setEditingId(null);
      toast.success("Kategori diperbarui!");
    } catch {
      toast.error("Gagal menyimpan perubahan");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Hapus kategori "${name}"? Transaksi terkait tidak akan terhapus.`)) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success("Kategori dihapus");
    } catch {
      toast.error("Gagal menghapus kategori");
    }
  };

  const handleExport = async () => {
    const res = await fetch("/api/transactions?limit=1000");
    const data = await res.json();
    const txs = data.transactions ?? [];
    const csv = ["Date,Type,Category,Amount,Account,Note",
      ...txs.map((t: any) => `${t.date},${t.type},${t.category?.name ?? ""},${t.amount},${t.account?.name ?? ""},${t.note ?? ""}`)
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `celengan-export-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    toast.success("Data diekspor!");
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-screen-xl mx-auto">
        <h1 className="text-2xl font-bold text-[#F8FAFC] mb-6">Pengaturan</h1>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <aside className="md:w-52 flex-shrink-0">
            <nav className="space-y-1">
              {SECTIONS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${activeSection === id ? "bg-[#334155] text-[#F8FAFC]" : "text-[#94A3B8] hover:bg-[#1E293B] hover:text-[#F8FAFC]"}`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1 bg-[#1E293B] border border-[#475569] rounded-xl p-6">
            {activeSection === "profile" && (
              <div className="space-y-6">
                <h2 className="text-base font-semibold text-[#F8FAFC]">Profil</h2>
                {user && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-[#334155] rounded-lg">
                      <div className="w-12 h-12 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-lg">
                        {user.firstName?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[#F8FAFC] font-semibold">{user.firstName} {user.lastName ?? ""}</p>
                        {user.username && <p className="text-[#64748B] text-sm">@{user.username}</p>}
                        <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${user.plan === "PREMIUM" ? "bg-amber-500/20 text-amber-400" : user.plan === "PRO" ? "bg-blue-500/20 text-blue-400" : "bg-[#475569]/50 text-[#94A3B8]"}`}>
                          {user.plan}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-[#94A3B8] block mb-1.5">Telegram ID</label>
                        <input readOnly value={user.telegramId ?? ""} className="w-full bg-[#334155] border border-[#475569] text-[#64748B] rounded-lg px-3 py-2.5 text-sm font-mono cursor-not-allowed" />
                      </div>
                      <div>
                        <label className="text-xs text-[#94A3B8] block mb-1.5">Username Telegram</label>
                        <input readOnly value={user.username ? `@${user.username}` : "—"} className="w-full bg-[#334155] border border-[#475569] text-[#64748B] rounded-lg px-3 py-2.5 text-sm cursor-not-allowed" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeSection === "appearance" && (
              <div className="space-y-6">
                <h2 className="text-base font-semibold text-[#F8FAFC]">Tampilan</h2>
                <div>
                  <label className="text-sm text-[#94A3B8] block mb-3">Tema</label>
                  <div className="flex gap-3">
                    {[
                      { value: "dark", label: "🌙 Dark", desc: "Default" },
                      { value: "light", label: "☀️ Light", desc: "" },
                    ].map((t) => (
                      <button
                        key={t.value}
                        onClick={() => {
                          localStorage.setItem("celengan-theme", t.value);
                          document.documentElement.classList.toggle("dark", t.value === "dark");
                          toast.success(`Tema ${t.value} aktif`);
                        }}
                        className="flex-1 py-3 px-4 bg-[#334155] hover:bg-[#475569] rounded-lg text-sm text-[#F8FAFC] transition-colors border border-[#475569]"
                      >
                        {t.label}
                        {t.desc && <span className="ml-1 text-xs text-[#64748B]">({t.desc})</span>}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-[#94A3B8] block mb-3">Bahasa</label>
                  <div className="flex gap-3">
                    <button className="flex-1 py-3 px-4 bg-blue-600/20 border border-blue-500 rounded-lg text-sm text-blue-400">🇮🇩 Bahasa Indonesia</button>
                    <button className="flex-1 py-3 px-4 bg-[#334155] hover:bg-[#475569] rounded-lg text-sm text-[#94A3B8] border border-[#475569] transition-colors">🇬🇧 English</button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "categories" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-[#F8FAFC]">Kategori</h2>
                  <button
                    onClick={() => { setShowAddCategory((v) => !v); setShowNewIconPicker(false); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <Plus size={14} /> Tambah
                  </button>
                </div>

                {/* Add form */}
                {showAddCategory && (
                  <div className="bg-[#334155] border border-[#475569] rounded-lg p-4 space-y-3">
                    <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Kategori Baru</p>
                    <div className="flex gap-3 items-end">
                      {/* Icon picker button */}
                      <div className="flex-shrink-0 relative">
                        <label className="text-xs text-[#94A3B8] block mb-1.5">Icon</label>
                        <button
                          onClick={() => setShowNewIconPicker((v) => !v)}
                          className="w-12 h-10 rounded-lg bg-[#1E293B] border border-[#475569] hover:border-blue-500 text-xl flex items-center justify-center transition-colors"
                        >
                          {newCategory.icon}
                        </button>
                        {showNewIconPicker && (
                          <div className="absolute top-full left-0 mt-1 z-20 bg-[#0F172A] border border-[#475569] rounded-xl p-3 w-64 shadow-2xl">
                            <div className="grid grid-cols-7 gap-1">
                              {ICON_OPTIONS.map((em) => (
                                <button
                                  key={em}
                                  onClick={() => { setNewCategory((p) => ({ ...p, icon: em })); setShowNewIconPicker(false); }}
                                  className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center hover:bg-[#334155] transition-colors ${newCategory.icon === em ? "bg-blue-600/30 ring-1 ring-blue-500" : ""}`}
                                >
                                  {em}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-[#94A3B8] block mb-1.5">Nama</label>
                        <input
                          type="text"
                          value={newCategory.name}
                          onChange={(e) => setNewCategory((p) => ({ ...p, name: e.target.value }))}
                          onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                          placeholder="Nama kategori..."
                          className="w-full bg-[#1E293B] border border-[#475569] text-[#F8FAFC] rounded-lg px-3 py-2 text-sm placeholder-[#475569] focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="flex-shrink-0">
                        <label className="text-xs text-[#94A3B8] block mb-1.5">Warna</label>
                        <input
                          type="color"
                          value={newCategory.color}
                          onChange={(e) => setNewCategory((p) => ({ ...p, color: e.target.value }))}
                          className="w-10 h-10 rounded-lg border border-[#475569] bg-[#1E293B] cursor-pointer p-0.5"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => { setShowAddCategory(false); setShowNewIconPicker(false); setNewCategory({ name: "", icon: "📦", color: "#6366F1" }); }}
                        className="px-3 py-1.5 text-xs text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
                      >
                        Batal
                      </button>
                      <button
                        onClick={handleAddCategory}
                        disabled={savingCategory}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        {savingCategory ? "Menyimpan..." : "Simpan"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Category list */}
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <div key={cat.id}>
                      {editingId === cat.id ? (
                        /* Edit row */
                        <div className="bg-[#334155] border border-blue-500/50 rounded-lg p-3 space-y-3">
                          <div className="flex gap-3 items-end">
                            {/* Icon picker */}
                            <div className="flex-shrink-0 relative">
                              <label className="text-xs text-[#94A3B8] block mb-1.5">Icon</label>
                              <button
                                onClick={() => setShowEditIconPicker((v) => !v)}
                                className="w-12 h-10 rounded-lg bg-[#1E293B] border border-[#475569] hover:border-blue-500 text-xl flex items-center justify-center transition-colors"
                              >
                                {editForm.icon}
                              </button>
                              {showEditIconPicker && (
                                <div className="absolute top-full left-0 mt-1 z-20 bg-[#0F172A] border border-[#475569] rounded-xl p-3 w-64 shadow-2xl">
                                  <div className="grid grid-cols-7 gap-1">
                                    {ICON_OPTIONS.map((em) => (
                                      <button
                                        key={em}
                                        onClick={() => { setEditForm((p) => ({ ...p, icon: em })); setShowEditIconPicker(false); }}
                                        className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center hover:bg-[#334155] transition-colors ${editForm.icon === em ? "bg-blue-600/30 ring-1 ring-blue-500" : ""}`}
                                      >
                                        {em}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <label className="text-xs text-[#94A3B8] block mb-1.5">Nama</label>
                              <input
                                type="text"
                                value={editForm.name}
                                onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                                onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                                autoFocus
                                className="w-full bg-[#1E293B] border border-[#475569] text-[#F8FAFC] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                              />
                            </div>
                            <div className="flex-shrink-0">
                              <label className="text-xs text-[#94A3B8] block mb-1.5">Warna</label>
                              <input
                                type="color"
                                value={editForm.color}
                                onChange={(e) => setEditForm((p) => ({ ...p, color: e.target.value }))}
                                className="w-10 h-10 rounded-lg border border-[#475569] bg-[#1E293B] cursor-pointer p-0.5"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => { setEditingId(null); setShowEditIconPicker(false); }}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
                            >
                              <X size={12} /> Batal
                            </button>
                            <button
                              onClick={handleSaveEdit}
                              disabled={savingEdit}
                              className="flex items-center gap-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
                            >
                              <Check size={12} /> {savingEdit ? "Menyimpan..." : "Simpan"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Normal row */
                        <div className="flex items-center gap-3 px-4 py-3 bg-[#334155] rounded-lg group">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: cat.color + "25" }}>
                            {cat.icon}
                          </div>
                          <span className="text-sm text-[#F8FAFC] flex-1">{cat.name}</span>
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEdit(cat)}
                              className="p-1.5 text-[#475569] hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                              title="Edit kategori"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat.id, cat.name)}
                              className="p-1.5 text-[#475569] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Hapus kategori"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === "notifications" && (
              <div className="space-y-6">
                <h2 className="text-base font-semibold text-[#F8FAFC]">Notifikasi Telegram</h2>
                <div className="space-y-4">
                  {[
                    { key: "budgetAlerts", label: "Alert Budget", desc: "Notif saat budget 80% dan 100%" },
                    { key: "goalMilestones", label: "Goal Milestone", desc: "Notif saat savings goal tercapai" },
                    { key: "weeklyDigest", label: "Weekly Digest", desc: "Ringkasan mingguan setiap Minggu" },
                    { key: "billReminders", label: "Tagihan Reminder", desc: "Reminder jatuh tempo CC 3 hari sebelumnya" },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between py-3 border-b border-[#334155]">
                      <div>
                        <p className="text-sm text-[#F8FAFC] font-medium">{label}</p>
                        <p className="text-xs text-[#64748B]">{desc}</p>
                      </div>
                      <button
                        onClick={() => setNotifications((p) => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                        className={`w-11 h-6 rounded-full transition-colors relative ${notifications[key as keyof typeof notifications] ? "bg-blue-600" : "bg-[#334155]"}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${notifications[key as keyof typeof notifications] ? "left-6" : "left-1"}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === "data" && (
              <div className="space-y-6">
                <h2 className="text-base font-semibold text-[#F8FAFC]">Kelola Data</h2>
                <div className="space-y-3">
                  <button onClick={handleExport} className="w-full flex items-center gap-3 p-4 bg-[#334155] hover:bg-[#475569] rounded-lg text-sm text-[#F8FAFC] transition-colors text-left border border-[#475569]">
                    <Database size={18} className="text-blue-400" />
                    <div>
                      <p className="font-medium">Ekspor Data (CSV)</p>
                      <p className="text-xs text-[#64748B]">Download semua transaksi dalam format CSV</p>
                    </div>
                  </button>
                  <button
                    onClick={() => { if (confirm("Yakin ingin logout?")) { fetch("/api/auth/telegram", { method: "DELETE" }).then(() => window.location.href = "/login"); } }}
                    className="w-full flex items-center gap-3 p-4 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-sm text-red-400 transition-colors text-left border border-red-500/20"
                  >
                    <span className="text-lg">🚪</span>
                    <div>
                      <p className="font-medium">Logout</p>
                      <p className="text-xs text-red-400/70">Keluar dari akun Celengan</p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
