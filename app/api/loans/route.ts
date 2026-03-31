import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";
import { z } from "zod";

const createSchema = z.object({
  personName: z.string().min(1),
  direction: z.enum(["LENT", "BORROWED"]),
  originalAmount: z.number().positive(),
  monthlyAmount: z.number().positive().optional(),
  dueDate: z.string().optional().nullable(),
  notes: z.string().optional(),
});

const paymentSchema = z.object({
  loanId: z.string(),
  amount: z.number().positive(),
  note: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const direction = searchParams.get("direction");

  const loans = await prisma.loan.findMany({
    where: { userId: user.id, ...(direction ? { direction: direction as "LENT" | "BORROWED" } : {}) },
    include: { payments: { orderBy: { date: "desc" } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    loans: loans.map((l) => ({
      ...l,
      originalAmount: Number(l.originalAmount),
      remainingAmount: Number(l.remainingAmount),
      monthlyAmount: l.monthlyAmount ? Number(l.monthlyAmount) : null,
      payments: l.payments.map((p) => ({ ...p, amount: Number(p.amount) })),
      paidPercent: Number(l.originalAmount) > 0
        ? ((Number(l.originalAmount) - Number(l.remainingAmount)) / Number(l.originalAmount)) * 100
        : 0,
    })),
  });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  // Payment action
  if (body.action === "payment") {
    const parsed = paymentSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const loan = await prisma.loan.findFirst({ where: { id: parsed.data.loanId, userId: user.id } });
    if (!loan) return NextResponse.json({ error: "Loan not found" }, { status: 404 });

    const newRemaining = Math.max(0, Number(loan.remainingAmount) - parsed.data.amount);
    const [payment, updatedLoan] = await prisma.$transaction([
      prisma.loanPayment.create({
        data: { loanId: parsed.data.loanId, amount: parsed.data.amount, note: parsed.data.note },
      }),
      prisma.loan.update({
        where: { id: parsed.data.loanId },
        data: { remainingAmount: newRemaining, status: newRemaining === 0 ? "CLEARED" : loan.status },
      }),
    ]);

    return NextResponse.json({ payment: { ...payment, amount: Number(payment.amount) }, loan: updatedLoan });
  }

  // Create loan
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const loan = await prisma.loan.create({
    data: {
      userId: user.id,
      personName: parsed.data.personName,
      direction: parsed.data.direction,
      originalAmount: parsed.data.originalAmount,
      remainingAmount: parsed.data.originalAmount,
      monthlyAmount: parsed.data.monthlyAmount,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      notes: parsed.data.notes,
    },
  });

  return NextResponse.json({
    loan: {
      ...loan,
      originalAmount: Number(loan.originalAmount),
      remainingAmount: Number(loan.remainingAmount),
      monthlyAmount: loan.monthlyAmount ? Number(loan.monthlyAmount) : null,
    },
  }, { status: 201 });
}
