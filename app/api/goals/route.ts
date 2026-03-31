import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  targetAmount: z.number().positive(),
  deadline: z.string().optional().nullable(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

const depositSchema = z.object({ amount: z.number().positive() });

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const goals = await prisma.savingsGoal.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    goals: goals.map((g) => ({
      ...g,
      targetAmount: Number(g.targetAmount),
      savedAmount: Number(g.savedAmount),
      percentage: Number(g.targetAmount) > 0 ? (Number(g.savedAmount) / Number(g.targetAmount)) * 100 : 0,
    })),
  });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  // Deposit action
  if (body.action === "deposit") {
    const parsed = depositSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const goalId = body.goalId as string;

    const goal = await prisma.savingsGoal.findFirst({ where: { id: goalId, userId: user.id } });
    if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

    const newSaved = Number(goal.savedAmount) + parsed.data.amount;
    const isCompleted = newSaved >= Number(goal.targetAmount);

    const updated = await prisma.savingsGoal.update({
      where: { id: goalId },
      data: { savedAmount: newSaved, isCompleted },
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

  // Create goal
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const goal = await prisma.savingsGoal.create({
    data: {
      userId: user.id,
      name: parsed.data.name,
      targetAmount: parsed.data.targetAmount,
      deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : null,
      color: parsed.data.color ?? "#8B5CF6",
      icon: parsed.data.icon ?? "piggy-bank",
    },
  });

  return NextResponse.json({
    goal: { ...goal, targetAmount: Number(goal.targetAmount), savedAmount: Number(goal.savedAmount), percentage: 0 },
  }, { status: 201 });
}
