"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowLeftRight, PiggyBank, Target, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/transactions", icon: ArrowLeftRight, label: "Transaksi" },
  { href: "/budget", icon: PiggyBank, label: "Budget" },
  { href: "/goals", icon: Target, label: "Goals" },
  { href: "/settings", icon: MoreHorizontal, label: "Menu" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#1E293B] border-t border-[#475569] safe-area-pb">
      <ul className="flex items-center justify-around h-16">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/settings" && pathname.startsWith(href + "/"));
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 h-16 text-xs font-medium transition-colors",
                  active ? "text-blue-400" : "text-[#64748B]"
                )}
              >
                <Icon size={22} />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
