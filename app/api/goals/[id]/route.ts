import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().optional(),
  targetAmount: z.number().positive().optional(),
  deadline: z.string().optional().nullable(),
  color: z.string().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const goal = await prisma.savingsGoal.findFirst({ where: { id: params.id, userId: user.id } });
  if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.savingsGoal.update({
    where: { id: params.id },
    data: {
      ...(parsed.data.name ? { name: parsed.data.name } : {}),
      ...(parsed.data.targetAmount ? { targetAmount: parsed.data.targetAmount } : {}),
      ...(parsed.data.deadline !== undefined ? { deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : null } : {}),
      ...(parsed.data.color ? { color: parsed.data.color } : {}),
    },
  });

  return NextResponse.json({
    goal: {
      ...updated,
      targetAmount: Number(updated.targetAmount),
      savedAmount: Number(updated.savedAmount),
      percentage: Number(updated.targetAmount) > 0 ? (Number(updated.savedAmount) / Number(updated.targetAmount)) * 100 : 0,
    },
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.savingsGoal.deleteMany({ where: { id: params.id, userId: user.id } });
  return NextResponse.json({ success: true });
}
