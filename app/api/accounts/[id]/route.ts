import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const account = await prisma.account.findFirst({ where: { id: params.id, userId: user.id } });
  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();

  // Balance adjustment — set balance directly and record a transaction
  if (typeof body.balance === "number") {
    const currentBalance = Number(account.balance);
    const newBalance = body.balance;
    const delta = newBalance - currentBalance;

    if (delta === 0) return NextResponse.json({ account: { ...account, balance: currentBalance } });

    await prisma.$transaction(async (db) => {
      // Set exact balance
      await db.account.update({
        where: { id: params.id },
        data: { balance: newBalance },
      });

      // Record adjustment transaction (no secondary balance update)
      await db.transaction.create({
        data: {
          userId: user.id,
          accountId: params.id,
          type: delta > 0 ? "INCOME" : "EXPENSE",
          amount: Math.abs(delta),
          note: "Penyesuaian saldo",
          source: "WEB",
        },
      });
    });

    const updated = await prisma.account.findUnique({ where: { id: params.id } });
    return NextResponse.json({ account: { ...updated, balance: Number(updated!.balance) } });
  }

  // Other fields (name, color, isDefault)
  const { name, color, isDefault } = body;
  const updated = await prisma.account.update({
    where: { id: params.id },
    data: { ...(name && { name }), ...(color && { color }), ...(isDefault !== undefined && { isDefault }) },
  });

  return NextResponse.json({ account: { ...updated, balance: Number(updated.balance) } });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.account.deleteMany({ where: { id: params.id, userId: user.id } });
  return NextResponse.json({ success: true });
}
