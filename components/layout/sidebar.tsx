"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ArrowLeftRight, PiggyBank, CreditCard, Landmark,
  Wallet, Target, Lightbulb, Settings, HelpCircle, Sun, Moon, LogOut,
  PiggyBankIcon, ChevronLeft, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/transactions", icon: ArrowLeftRight, label: "Transaksi" },
  { href: "/budget", icon: PiggyBank, label: "Budget" },
  { href: "/credit-cards", icon: CreditCard, label: "Kartu Kredit" },
  { href: "/loans", icon: Landmark, label: "Pinjaman" },
  { href: "/accounts", icon: Wallet, label: "Rekening" },
  { href: "/goals", icon: Target, label: "Savings Goals" },
  { href: "/insights", icon: Lightbulb, label: "Insights" },
];

interface SidebarProps {
  user?: { name: string; email?: string };
  theme?: "dark" | "light";
  onThemeToggle?: () => void;
  onLogout?: () => void;
}

export function Sidebar({ user, theme = "dark", onThemeToggle, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col fixed top-0 left-0 h-screen z-30 transition-all duration-300",
        "bg-[#1E293B] border-r border-[#475569]",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center h-16 px-4 border-b border-[#475569]", collapsed ? "justify-center" : "justify-between")}>
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="text-[#F8FAFC] font-bold text-lg tracking-tight">Celengan</span>
          </Link>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-[#94A3B8] hover:text-[#F8FAFC] transition-colors p-1 rounded"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                    "hover:bg-[#334155] hover:text-[#F8FAFC]",
                    active
                      ? "bg-[#334155] text-[#F8FAFC] border-l-[3px] border-blue-500 pl-[calc(0.75rem-3px)]"
                      : "text-[#94A3B8] border-l-[3px] border-transparent pl-[calc(0.75rem-3px)]"
                  )}
                  title={collapsed ? label : undefined}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  {!collapsed && <span>{label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom section */}
      <div className="border-t border-[#475569] py-4 px-2 space-y-1">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            "text-[#94A3B8] hover:bg-[#334155] hover:text-[#F8FAFC]",
            "border-l-[3px] border-transparent pl-[calc(0.75rem-3px)]"
          )}
          title={collapsed ? "Settings" : undefined}
        >
          <Settings size={18} />
          {!collapsed && <span>Pengaturan</span>}
        </Link>

        <button
          onClick={onThemeToggle}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#94A3B8] hover:bg-[#334155] hover:text-[#F8FAFC] transition-colors border-l-[3px] border-transparent pl-[calc(0.75rem-3px)]"
          title={collapsed ? "Toggle Theme" : undefined}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          {!collapsed && <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
        </button>

        {user && (
          <div className={cn("flex items-center gap-3 px-3 py-2 mt-2 rounded-lg", collapsed ? "justify-center" : "")}>
            <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0 text-white font-semibold text-sm">
              {(user.name ?? "?").charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[#F8FAFC] text-sm font-medium truncate">{user.name}</p>
                {user.email && <p className="text-[#64748B] text-xs truncate">{user.email}</p>}
              </div>
            )}
            {!collapsed && (
              <button onClick={onLogout} className="text-[#64748B] hover:text-[#EF4444] transition-colors" title="Logout">
                <LogOut size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
