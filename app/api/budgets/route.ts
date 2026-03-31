import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";
import { z } from "zod";
import { startOfMonth, endOfMonth } from "date-fns";

const createSchema = z.object({
  categoryId: z.string(),
  amount: z.number().positive(),
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2050),
});

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const now = new Date();
  const month = parseInt(searchParams.get("month") ?? String(now.getMonth() + 1));
  const year = parseInt(searchParams.get("year") ?? String(now.getFullYear()));

  const start = startOfMonth(new Date(year, month - 1, 1));
  const end = endOfMonth(new Date(year, month - 1, 1));

  const budgets = await prisma.budget.findMany({
    where: { userId: user.id, month, year },
    include: { category: true },
  });

  // Get spent amounts per category
  const expenses = await prisma.transaction.findMany({
    where: { userId: user.id, type: "EXPENSE", date: { gte: start, lte: end } },
    select: { categoryId: true, amount: true },
  });

  const spentByCategory: Record<string, number> = {};
  for (const e of expenses) {
    if (e.categoryId) {
      spentByCategory[e.categoryId] = (spentByCategory[e.categoryId] ?? 0) + Number(e.amount);
    }
  }

  const result = budgets.map((b) => {
    const spent = spentByCategory[b.categoryId] ?? 0;
    const amount = Number(b.amount);
    return {
      id: b.id,
      category: b.category,
      amount,
      spent,
      remaining: amount - spent,
      percentage: amount > 0 ? (spent / amount) * 100 : 0,
      month,
      year,
    };
  });

  return NextResponse.json({ budgets: result.sort((a, b) => b.percentage - a.percentage), month, year });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { categoryId, amount, month, year } = parsed.data;

  const budget = await prisma.budget.upsert({
    where: { userId_categoryId_month_year: { userId: user.id, categoryId, month, year } },
    update: { amount },
    create: { userId: user.id, categoryId, amount, month, year },
    include: { category: true },
  });

  return NextResponse.json({ budget: { ...budget, amount: Number(budget.amount) } }, { status: 201 });
}
