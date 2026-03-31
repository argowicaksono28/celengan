import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  icon: z.string().min(1).max(10).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const category = await prisma.category.findFirst({ where: { id: params.id, userId: user.id } });
  if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.category.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json({ category: updated });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const category = await prisma.category.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Nullify transactions referencing this category before deleting
  await prisma.transaction.updateMany({
    where: { categoryId: params.id, userId: user.id },
    data: { categoryId: null },
  });

  await prisma.budget.deleteMany({ where: { categoryId: params.id, userId: user.id } });
  await prisma.category.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
