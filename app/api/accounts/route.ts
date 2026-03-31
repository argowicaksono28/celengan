import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["BANK", "EWALLET", "CASH", "INVESTMENT"]),
  balance: z.number().default(0),
  color: z.string().optional(),
  icon: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accounts = await prisma.account.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance), 0);

  return NextResponse.json({
    accounts: accounts.map((a) => ({ ...a, balance: Number(a.balance) })),
    totalBalance,
  });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const account = await prisma.account.create({
    data: { userId: user.id, ...parsed.data },
  });

  return NextResponse.json({ account: { ...account, balance: Number(account.balance) } }, { status: 201 });
}
