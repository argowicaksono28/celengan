"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  plan: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const router = useRouter();

  useEffect(() => {
    // Load user from session
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        } else {
          router.push("/login");
        }
      })
      .catch(() => router.push("/login"));
  }, [router]);

  useEffect(() => {
    const stored = localStorage.getItem("celengan-theme") as "dark" | "light" | null;
    if (stored) setTheme(stored);
    document.documentElement.classList.toggle("dark", stored !== "light");
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("celengan-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className={cn("min-h-screen bg-[#0F172A] text-[#F8FAFC]", theme === "light" && "bg-white text-[#0F172A]")}>
      <Sidebar user={user ?? undefined} theme={theme} onThemeToggle={toggleTheme} onLogout={handleLogout} />
      <BottomNav />
      <main className="md:ml-60 pb-16 md:pb-0 min-h-screen transition-all duration-300">
        {children}
      </main>
      <Toaster
        theme={theme}
        position="top-right"
        toastOptions={{
          style: { background: "#1E293B", border: "1px solid #475569", color: "#F8FAFC" },
        }}
      />
    </div>
  );
}
