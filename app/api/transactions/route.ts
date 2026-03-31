import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";
import { z } from "zod";

const createSchema = z.object({
  accountId: z.string(),
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  amount: z.number().positive(),
  categoryId: z.string().optional().nullable(),
  note: z.string().optional(),
  date: z.string().optional(),
  transferToId: z.string().optional().nullable(),
  creditCardId: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const type = searchParams.get("type");
  const categoryId = searchParams.get("categoryId");
  const accountId = searchParams.get("accountId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = { userId: user.id };
  if (type) where.type = type;
  if (categoryId) where.categoryId = categoryId;
  if (accountId) where.accountId = accountId;
  if (dateFrom || dateTo) {
    where.date = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo + "T23:59:59Z") } : {}),
    };
  }
  if (search) where.note = { contains: search, mode: "insensitive" };

  const [total, transactions] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      include: { category: true, account: true },
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  // Summary totals for filtered view
  const allFiltered = await prisma.transaction.findMany({ where, select: { type: true, amount: true } });
  const totalIncome = allFiltered.filter((t) => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = allFiltered.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0);

  return NextResponse.json({
    transactions: transactions.map((t) => ({ ...t, amount: Number(t.amount) })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
    summary: { totalIncome, totalExpense, net: totalIncome - totalExpense },
  });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;

  // Verify account belongs to user
  const account = await prisma.account.findFirst({ where: { id: data.accountId, userId: user.id } });
  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  const tx = await prisma.$transaction(async (db) => {
    const transaction = await db.transaction.create({
      data: {
        userId: user.id,
        accountId: data.accountId,
        type: data.type,
        amount: data.amount,
        categoryId: data.categoryId,
        note: data.note,
        date: data.date ? new Date(data.date) : new Date(),
        transferToId: data.transferToId,
        creditCardId: data.creditCardId,
        source: "WEB",
      },
      include: { category: true, account: true },
    });

    // Update account balance
    if (data.type === "INCOME") {
      await db.account.update({ where: { id: data.accountId }, data: { balance: { increment: data.amount } } });
    } else if (data.type === "EXPENSE") {
      await db.account.update({ where: { id: data.accountId }, data: { balance: { decrement: data.amount } } });
    } else if (data.type === "TRANSFER" && data.transferToId) {
      await db.account.update({ where: { id: data.accountId }, data: { balance: { decrement: data.amount } } });
      await db.account.update({ where: { id: data.transferToId }, data: { balance: { increment: data.amount } } });
    }

    return transaction;
  });

  return NextResponse.json({ transaction: { ...tx, amount: Number(tx.amount) } }, { status: 201 });
}
