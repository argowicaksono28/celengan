/**
 * Format Indonesian Rupiah: Rp 1.500.000
 */
export function formatRupiah(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return "Rp 0";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "Rp 0";
  return "Rp " + Math.round(num).toLocaleString("id-ID");
}

/**
 * Parse Indonesian shorthand: "35k" → 35000, "8jt" → 8000000, "1.5rb" → 1500
 */
export function parseIndonesianAmount(input: string): number | null {
  const clean = input.trim().toLowerCase().replace(/[,\s]/g, "");

  // Handle dot as thousand separator (e.g. 1.500.000)
  const dotSeparated = clean.replace(/\./g, "");
  if (/^\d+$/.test(dotSeparated) && clean.includes(".")) {
    return parseInt(dotSeparated, 10);
  }

  // Handle shorthand suffixes
  const match = clean.match(/^(\d+(?:\.\d+)?)(jt|juta|rb|ribu|k|m)?$/);
  if (!match) return null;

  const num = parseFloat(match[1]);
  const suffix = match[2];

  switch (suffix) {
    case "jt":
    case "juta":
      return Math.round(num * 1_000_000);
    case "rb":
    case "ribu":
    case "k":
      return Math.round(num * 1_000);
    case "m":
      return Math.round(num * 1_000_000);
    default:
      return Math.round(num);
  }
}

export function formatPercent(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateShort(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export function getDayGreeting(name: string): string {
  const hour = new Date().getHours();
  if (hour < 12) return `Selamat pagi, ${name}! ☀️`;
  if (hour < 15) return `Selamat siang, ${name}!`;
  if (hour < 18) return `Selamat sore, ${name}! 🌤️`;
  return `Selamat malam, ${name}! 🌙`;
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
