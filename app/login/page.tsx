"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    onTelegramAuth?: (user: any) => void;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if already logged in
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.user) router.push("/dashboard"); });

    // Telegram Login Widget callback
    window.onTelegramAuth = async (user: any) => {
      const res = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
      if (res.ok) {
        router.push("/dashboard");
      }
    };

    // Load Telegram widget script
    const botName = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME;
    if (botName && containerRef.current) {
      const script = document.createElement("script");
      script.src = "https://telegram.org/js/telegram-widget.js?22";
      script.setAttribute("data-telegram-login", botName);
      script.setAttribute("data-size", "large");
      script.setAttribute("data-onauth", "onTelegramAuth(user)");
      script.setAttribute("data-request-access", "write");
      script.async = true;
      containerRef.current.appendChild(script);
    }

    return () => {
      delete window.onTelegramAuth;
    };
  }, [router]);

  // Show dev button when no Telegram bot is configured, or when dev login is explicitly enabled
  const isDev = !process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || process.env.NEXT_PUBLIC_DEV_LOGIN === "true";

  const devLogin = async () => {
    const mockUser = {
      id: 123456789,
      first_name: "Budi",
      last_name: "Santoso",
      username: "demo_user",
      auth_date: Math.floor(Date.now() / 1000),
      hash: "dev_bypass",
    };
    const res = await fetch("/api/auth/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mockUser),
    });
    if (res.ok) router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-transparent to-blue-900/10 pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-violet-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-500/25">
            <span className="text-white text-3xl font-bold">C</span>
          </div>
          <h1 className="text-3xl font-bold text-[#F8FAFC]">Celengan</h1>
          <p className="text-[#94A3B8] mt-2 text-sm">Smart Finance Dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-[#1E293B] border border-[#475569] rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-[#F8FAFC] text-center mb-2">Masuk ke Celengan</h2>
          <p className="text-sm text-[#94A3B8] text-center mb-8">
            Gunakan akun Telegram-mu untuk masuk.<br />Tidak perlu password.
          </p>

          {/* Telegram Widget Container */}
          <div className="flex justify-center mb-6" ref={containerRef} />

          {/* Dev bypass */}
          {isDev && (
            <div className="mt-4 pt-4 border-t border-[#334155]">
              <p className="text-xs text-[#475569] text-center mb-3">Development Mode</p>
              <button
                onClick={devLogin}
                className="w-full py-3 px-4 bg-[#334155] hover:bg-[#475569] text-[#94A3B8] rounded-lg text-sm font-medium transition-colors border border-[#475569]"
              >
                🔧 Login as Demo User (Dev Only)
              </button>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          {[
            { emoji: "🤖", text: "Bot Telegram" },
            { emoji: "📊", text: "Dashboard Real-time" },
            { emoji: "🎯", text: "Savings Goals" },
          ].map((f) => (
            <div key={f.text} className="bg-[#1E293B]/60 rounded-xl p-3 border border-[#334155]">
              <p className="text-2xl mb-1">{f.emoji}</p>
              <p className="text-xs text-[#64748B]">{f.text}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-[#475569] mt-6">
          Track every Rupiah, effortlessly.
        </p>
      </div>
    </div>
  );
}
