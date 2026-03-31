import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");

  const now = new Date();
  const month = monthParam ? parseInt(monthParam) : now.getMonth() + 1;
  const year = yearParam ? parseInt(yearParam) : now.getFullYear();

  const startCurrent = startOfMonth(new Date(year, month - 1, 1));
  const endCurrent = endOfMonth(new Date(year, month - 1, 1));
  const startPrev = startOfMonth(subMonths(startCurrent, 1));
  const endPrev = endOfMonth(subMonths(startCurrent, 1));

  // Current month transactions
  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id, date: { gte: startCurrent, lte: endCurrent } },
    include: { category: true, account: true },
    orderBy: { date: "desc" },
  });

  // Previous month for comparison
  const prevTransactions = await prisma.transaction.findMany({
    where: { userId: user.id, date: { gte: startPrev, lte: endPrev }, type: { in: ["INCOME", "EXPENSE"] } },
  });

  // Aggregate current month
  const totalIncome = transactions.filter((t) => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0);
  const netFlow = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (netFlow / totalIncome) * 100 : 0;

  // Previous month comparison
  const prevIncome = prevTransactions.filter((t) => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0);
  const prevExpense = prevTransactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0);

  // Daily breakdown for chart
  const dailyData: Record<string, { income: number; expense: number }> = {};
  const daysInMonth = endCurrent.getDate();
  for (let i = 1; i <= daysInMonth; i++) {
    const key = `${year}-${String(month).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    dailyData[key] = { income: 0, expense: 0 };
  }
  for (const tx of transactions) {
    const key = tx.date.toISOString().slice(0, 10);
    if (dailyData[key]) {
      if (tx.type === "INCOME") dailyData[key].income += Number(tx.amount);
      if (tx.type === "EXPENSE") dailyData[key].expense += Number(tx.amount);
    }
  }

  // Category breakdown
  const categoryMap: Record<string, { name: string; color: string; icon: string; amount: number }> = {};
  for (const tx of transactions.filter((t) => t.type === "EXPENSE" && t.category)) {
    const cat = tx.category!;
    if (!categoryMap[cat.id]) {
      categoryMap[cat.id] = { name: cat.name, color: cat.color, icon: cat.icon, amount: 0 };
    }
    categoryMap[cat.id].amount += Number(tx.amount);
  }

  // Budgets with spent amounts
  const budgets = await prisma.budget.findMany({
    where: { userId: user.id, month, year },
    include: { category: true },
  });

  const budgetsWithSpent = budgets.map((b) => {
    const spent = transactions
      .filter((t) => t.type === "EXPENSE" && t.categoryId === b.categoryId)
      .reduce((s, t) => s + Number(t.amount), 0);
    return {
      id: b.id,
      category: b.category,
      amount: Number(b.amount),
      spent,
      remaining: Number(b.amount) - spent,
      percentage: Number(b.amount) > 0 ? (spent / Number(b.amount)) * 100 : 0,
    };
  });

  // Savings goals
  const goals = await prisma.savingsGoal.findMany({
    where: { userId: user.id, isCompleted: false },
    orderBy: { deadline: "asc" },
  });

  // Accounts
  const accounts = await prisma.account.findMany({
    where: { userId: user.id },
    orderBy: { isDefault: "desc" },
  });

  // Recent transactions
  const recent = transactions.slice(0, 10);

  return NextResponse.json({
    kpi: {
      totalIncome,
      totalExpense,
      netFlow,
      savingsRate,
      prevIncome,
      prevExpense,
      incomeChange: prevIncome > 0 ? ((totalIncome - prevIncome) / prevIncome) * 100 : 0,
      expenseChange: prevExpense > 0 ? ((totalExpense - prevExpense) / prevExpense) * 100 : 0,
    },
    dailyChart: Object.entries(dailyData).map(([date, vals]) => ({ date, ...vals })),
    categoryChart: Object.values(categoryMap).sort((a, b) => b.amount - a.amount),
    budgets: budgetsWithSpent.sort((a, b) => b.percentage - a.percentage),
    goals: goals.map((g) => ({
      ...g,
      targetAmount: Number(g.targetAmount),
      savedAmount: Number(g.savedAmount),
      percentage: Number(g.targetAmount) > 0 ? (Number(g.savedAmount) / Number(g.targetAmount)) * 100 : 0,
    })),
    accounts: accounts.map((a) => ({ ...a, balance: Number(a.balance) })),
    recentTransactions: recent.map((t) => ({
      ...t,
      amount: Number(t.amount),
      category: t.category,
      account: t.account,
    })),
    month,
    year,
  });
}
