import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-4 text-center">
      <p className="text-6xl mb-4">🐷</p>
      <h1 className="text-2xl font-bold text-[#F8FAFC] mb-2">Halaman Tidak Ditemukan</h1>
      <p className="text-[#64748B] text-sm mb-6">Celenganmu ada, tapi halaman ini tidak.</p>
      <Link href="/dashboard" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
        Kembali ke Dashboard
      </Link>
    </div>
  );
}
