import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const card = await prisma.creditCard.findFirst({ where: { id: params.id, userId: user.id } });
  if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();

  // Balance adjustment — update CC balance and record a transaction
  if (typeof body.balance === "number") {
    const currentBalance = Number(card.balance);
    const newBalance = body.balance;
    const delta = newBalance - currentBalance;

    if (delta === 0) return NextResponse.json({ card: { ...card, balance: currentBalance } });

    // Find a reference account for the transaction record
    const defaultAccount = await prisma.account.findFirst({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });

    await prisma.$transaction(async (db) => {
      await db.creditCard.update({
        where: { id: params.id },
        data: { balance: newBalance },
      });

      if (defaultAccount) {
        // Record transaction without updating account balance (adjustment only)
        await db.transaction.create({
          data: {
            userId: user.id,
            accountId: defaultAccount.id,
            type: delta > 0 ? "EXPENSE" : "INCOME",
            amount: Math.abs(delta),
            creditCardId: params.id,
            note: `Penyesuaian tagihan ${card.name}`,
            source: "WEB",
          },
        });
        // Keep account balance unchanged — this is a CC-only adjustment
        // The account balance effect is intentional (charge/refund from linked account)
        if (delta > 0) {
          await db.account.update({
            where: { id: defaultAccount.id },
            data: { balance: { decrement: Math.abs(delta) } },
          });
        } else {
          await db.account.update({
            where: { id: defaultAccount.id },
            data: { balance: { increment: Math.abs(delta) } },
          });
        }
      }
    });

    const updated = await prisma.creditCard.findUnique({ where: { id: params.id } });
    return NextResponse.json({
      card: {
        ...updated,
        limit: Number(updated!.limit),
        balance: Number(updated!.balance),
        utilization: Number(updated!.limit) > 0 ? (Number(updated!.balance) / Number(updated!.limit)) * 100 : 0,
      },
    });
  }

  // Other fields (name, color, etc.)
  const updated = await prisma.creditCard.update({
    where: { id: params.id },
    data: body,
  });
  return NextResponse.json({ card: { ...updated, limit: Number(updated.limit), balance: Number(updated.balance) } });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const card = await prisma.creditCard.findFirst({ where: { id: params.id, userId: user.id } });
  if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Fetch all transactions linked to this CC so we can reverse account balances
  const linkedTxs = await prisma.transaction.findMany({ where: { creditCardId: params.id } });

  await prisma.$transaction(async (db) => {
    // Reverse account balance for each linked transaction
    for (const tx of linkedTxs) {
      if (tx.type === "EXPENSE") {
        await db.account.update({ where: { id: tx.accountId }, data: { balance: { increment: tx.amount } } });
      } else if (tx.type === "INCOME") {
        await db.account.update({ where: { id: tx.accountId }, data: { balance: { decrement: tx.amount } } });
      }
    }

    // Delete all linked transactions
    await db.transaction.deleteMany({ where: { creditCardId: params.id } });

    // Delete the credit card
    await db.creditCard.delete({ where: { id: params.id } });
  });

  return NextResponse.json({ success: true });
}
