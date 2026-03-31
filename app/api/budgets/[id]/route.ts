import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";
import { z } from "zod";

const updateSchema = z.object({ amount: z.number().positive() });

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const budget = await prisma.budget.findFirst({ where: { id: params.id, userId: user.id } });
  if (!budget) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.budget.update({
    where: { id: params.id },
    data: { amount: parsed.data.amount },
    include: { category: true },
  });

  return NextResponse.json({ budget: { ...updated, amount: Number(updated.amount) } });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.budget.deleteMany({ where: { id: params.id, userId: user.id } });
  return NextResponse.json({ success: true });
}
