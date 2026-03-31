import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";
import { startOfMonth, endOfMonth, subMonths, format, getDay, getHours } from "date-fns";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);
  const prevStart = startOfMonth(subMonths(now, 1));
  const prevEnd = endOfMonth(subMonths(now, 1));

  const [currentTx, prevTx, budgets, goals] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: user.id, date: { gte: start, lte: end } },
      include: { category: true },
    }),
    prisma.transaction.findMany({
      where: { userId: user.id, date: { gte: prevStart, lte: prevEnd }, type: { in: ["INCOME", "EXPENSE"] } },
      include: { category: true },
    }),
    prisma.budget.findMany({
      where: { userId: user.id, month: now.getMonth() + 1, year: now.getFullYear() },
      include: { category: true },
    }),
    prisma.savingsGoal.findMany({ where: { userId: user.id, isCompleted: false } }),
  ]);

  const income = currentTx.filter((t) => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0);
  const expense = currentTx.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0);
  const prevIncome = prevTx.filter((t) => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0);
  const prevExpense = prevTx.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0);

  // Category spending
  const catSpend: Record<string, { name: string; color: string; amount: number }> = {};
  for (const tx of currentTx.filter((t) => t.type === "EXPENSE" && t.category)) {
    const cat = tx.category!;
    if (!catSpend[cat.id]) catSpend[cat.id] = { name: cat.name, color: cat.color, amount: 0 };
    catSpend[cat.id].amount += Number(tx.amount);
  }
  const topCategories = Object.values(catSpend).sort((a, b) => b.amount - a.amount).slice(0, 3);

  // Generate rule-based recommendations
  const recommendations: Array<{
    type: "tip" | "warning" | "alert";
    emoji: string;
    title: string;
    description: string;
    action?: string;
  }> = [];

  // Food spending alert
  const foodSpend = catSpend["Food & Beverage"]?.amount ?? 0;
  if (income > 0 && foodSpend / income > 0.35) {
    recommendations.push({
      type: "warning",
      emoji: "🍜",
      title: "Pengeluaran Makanan Tinggi",
      description: `Pengeluaran makananmu ${Math.round((foodSpend / income) * 100)}% dari penghasilan bulan ini. Coba masak sendiri 3x seminggu bisa hemat ~Rp 500.000.`,
      action: "Lihat rincian Food",
    });
  }

  // Budget exceeded
  for (const b of budgets) {
    const spent = currentTx.filter((t) => t.type === "EXPENSE" && t.categoryId === b.categoryId).reduce((s, t) => s + Number(t.amount), 0);
    const pct = Number(b.amount) > 0 ? spent / Number(b.amount) : 0;
    if (pct > 1) {
      recommendations.push({
        type: "alert",
        emoji: "🚨",
        title: `Budget ${b.category.name} Terlampaui`,
        description: `Kamu sudah melebihi budget ${b.category.name} sebesar ${Math.round((pct - 1) * 100)}%. Sisa bulan ini lebih berhati-hati ya.`,
      });
    } else if (pct > 0.8) {
      recommendations.push({
        type: "warning",
        emoji: "⚠️",
        title: `Budget ${b.category.name} Hampir Habis`,
        description: `Budget ${b.category.name} sudah terpakai ${Math.round(pct * 100)}%. Masih ada ${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate()} hari lagi.`,
      });
    }
  }

  // Savings rate tip
  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;
  if (savingsRate < 20 && income > 0) {
    recommendations.push({
      type: "tip",
      emoji: "💰",
      title: "Tingkatkan Tabunganmu",
      description: `Savings rate-mu ${Math.round(savingsRate)}% — target idealnya 20-30% dari penghasilan. Coba metode 50/30/20: 50% kebutuhan, 30% keinginan, 20% tabungan.`,
    });
  } else if (savingsRate >= 30) {
    recommendations.push({
      type: "tip",
      emoji: "🌟",
      title: "Savings Rate Excellent!",
      description: `Keren! Savings rate-mu ${Math.round(savingsRate)}% bulan ini. Pertimbangkan investasikan sebagian ke reksa dana atau saham untuk pertumbuhan lebih baik.`,
    });
  }

  // Investment tip
  const investSpend = catSpend["Investment"]?.amount ?? 0;
  if (investSpend === 0 && income > 0) {
    recommendations.push({
      type: "tip",
      emoji: "📈",
      title: "Mulai Investasi Sekarang",
      description: `Kamu belum investasi bulan ini. Mulai dari reksa dana pasar uang dengan risiko rendah. Bahkan Rp 100.000/bulan sudah membuat perbedaan besar dalam 10 tahun.`,
    });
  }

  // Goals check
  for (const goal of goals) {
    if (goal.deadline) {
      const daysLeft = Math.ceil((goal.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const remaining = Number(goal.targetAmount) - Number(goal.savedAmount);
      const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30));
      const monthlyNeeded = remaining / monthsLeft;
      if (daysLeft > 0 && daysLeft < 90 && remaining > 0) {
        recommendations.push({
          type: "warning",
          emoji: "🎯",
          title: `Goal "${goal.name}" Butuh Perhatian`,
          description: `Deadline ${Math.round(daysLeft / 30)} bulan lagi. Perlu menabung Rp ${Math.round(monthlyNeeded).toLocaleString("id-ID")}/bulan untuk mencapai target.`,
        });
      }
    }
  }

  // Spending heatmap: day-of-week × time-of-day
  const heatmap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const tx of currentTx.filter((t) => t.type === "EXPENSE")) {
    const dow = getDay(tx.date);
    const hour = getHours(tx.date);
    heatmap[dow][hour] += Number(tx.amount);
  }

  return NextResponse.json({
    monthlyReport: {
      month: format(now, "MMMM yyyy"),
      income,
      expense,
      savingsRate,
      prevIncome,
      prevExpense,
      topCategories,
      incomeChange: prevIncome > 0 ? ((income - prevIncome) / prevIncome) * 100 : 0,
      expenseChange: prevExpense > 0 ? ((expense - prevExpense) / prevExpense) * 100 : 0,
    },
    recommendations,
    heatmap,
  });
}
