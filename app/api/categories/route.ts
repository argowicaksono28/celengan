import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";
import { z } from "zod";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const categories = await prisma.category.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ categories });
}

const createSchema = z.object({
  name: z.string().min(1).max(50),
  icon: z.string().min(1).max(10),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const category = await prisma.category.create({
    data: { ...parsed.data, userId: user.id, isDefault: false },
  });

  return NextResponse.json({ category }, { status: 201 });
}
