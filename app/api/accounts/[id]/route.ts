import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().optional(),
  color: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const account = await prisma.account.findFirst({ where: { id: params.id, userId: user.id } });
  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.account.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json({ account: { ...updated, balance: Number(updated.balance) } });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.account.deleteMany({ where: { id: params.id, userId: user.id } });
  return NextResponse.json({ success: true });
}
