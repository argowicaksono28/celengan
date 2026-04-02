import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";
import { z } from "zod";

const updateSchema = z.object({
  note: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  date: z.string().optional(),
  amount: z.number().positive().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tx = await prisma.transaction.findFirst({ where: { id: params.id, userId: user.id } });
  if (!tx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.transaction.update({
    where: { id: params.id },
    data: {
      ...(parsed.data.note !== undefined ? { note: parsed.data.note } : {}),
      ...(parsed.data.categoryId !== undefined ? { categoryId: parsed.data.categoryId } : {}),
      ...(parsed.data.date ? { date: new Date(parsed.data.date) } : {}),
    },
    include: { category: true, account: true },
  });

  return NextResponse.json({ transaction: { ...updated, amount: Number(updated.amount) } });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tx = await prisma.transaction.findFirst({ where: { id: params.id, userId: user.id } });
  if (!tx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.$transaction(async (db) => {
    // Reverse account balance
    if (tx.type === "INCOME") {
      await db.account.update({ where: { id: tx.accountId }, data: { balance: { decrement: tx.amount } } });
    } else if (tx.type === "EXPENSE") {
      await db.account.update({ where: { id: tx.accountId }, data: { balance: { increment: tx.amount } } });
    } else if (tx.type === "TRANSFER") {
      await db.account.update({ where: { id: tx.accountId }, data: { balance: { increment: tx.amount } } });
      if (tx.transferToId) {
        await db.account.update({ where: { id: tx.transferToId }, data: { balance: { decrement: tx.amount } } });
      }
    }

    // Reverse credit card balance if this was a CC adjustment transaction
    if (tx.creditCardId) {
      // EXPENSE on CC = tagihan naik, so deleting it should decrease tagihan
      // INCOME on CC = tagihan turun, so deleting it should increase tagihan
      if (tx.type === "EXPENSE") {
        await db.creditCard.update({ where: { id: tx.creditCardId }, data: { balance: { decrement: tx.amount } } });
      } else if (tx.type === "INCOME") {
        await db.creditCard.update({ where: { id: tx.creditCardId }, data: { balance: { increment: tx.amount } } });
      }
    }

    await db.transaction.delete({ where: { id: params.id } });
  });

  return NextResponse.json({ success: true });
}
