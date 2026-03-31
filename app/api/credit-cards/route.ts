import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  bank: z.string().min(1),
  last4: z.string().length(4),
  limit: z.number().positive(),
  billingDate: z.number().min(1).max(31),
  dueDate: z.number().min(1).max(31),
  color: z.string().optional(),
});

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cards = await prisma.creditCard.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    cards: cards.map((c) => ({
      ...c,
      limit: Number(c.limit),
      balance: Number(c.balance),
      utilization: Number(c.limit) > 0 ? (Number(c.balance) / Number(c.limit)) * 100 : 0,
    })),
  });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const card = await prisma.creditCard.create({
    data: { userId: user.id, ...parsed.data, color: parsed.data.color ?? "#1E40AF" },
  });

  return NextResponse.json({
    card: { ...card, limit: Number(card.limit), balance: Number(card.balance), utilization: 0 },
  }, { status: 201 });
}
