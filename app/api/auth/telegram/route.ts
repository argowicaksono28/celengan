import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTelegramAuth } from "@/lib/auth";
import { getSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, first_name, last_name, username, photo_url, auth_date, hash } = body;

    if (!id || !first_name || !hash) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const isValid = verifyTelegramAuth({ id, first_name, last_name, username, photo_url, auth_date, hash });
    if (!isValid) {
      return NextResponse.json({ error: "Invalid Telegram auth data" }, { status: 401 });
    }

    // Upsert user
    const user = await prisma.user.upsert({
      where: { telegramId: BigInt(id) },
      update: {
        firstName: first_name,
        lastName: last_name,
        username,
        photoUrl: photo_url,
      },
      create: {
        telegramId: BigInt(id),
        firstName: first_name,
        lastName: last_name,
        username,
        photoUrl: photo_url,
      },
    });

    // Create default categories if new user
    const existingCategories = await prisma.category.count({ where: { userId: user.id } });
    if (existingCategories === 0) {
      await createDefaultCategories(user.id);
    }

    // Create default account if none exist
    const existingAccounts = await prisma.account.count({ where: { userId: user.id } });
    if (existingAccounts === 0) {
      await prisma.account.create({
        data: { userId: user.id, name: "Kas Utama", type: "CASH", balance: 0, isDefault: true },
      });
    }

    // Set session
    const session = await getSession();
    session.user = {
      id: user.id,
      telegramId: user.telegramId.toString(),
      firstName: user.firstName,
      lastName: user.lastName ?? undefined,
      username: user.username ?? undefined,
      photoUrl: user.photoUrl ?? undefined,
      plan: user.plan,
    };
    await session.save();

    return NextResponse.json({ success: true, user: session.user });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getSession();
  session.destroy();
  return NextResponse.json({ success: true });
}

async function createDefaultCategories(userId: string) {
  const defaults = [
    { name: "Food & Beverage", icon: "🍜", color: "#EF4444" },
    { name: "Transport", icon: "🚗", color: "#3B82F6" },
    { name: "Housing", icon: "🏠", color: "#8B5CF6" },
    { name: "Shopping", icon: "🛍️", color: "#EC4899" },
    { name: "Entertainment", icon: "🎬", color: "#F59E0B" },
    { name: "Health", icon: "🏥", color: "#10B981" },
    { name: "Education", icon: "📚", color: "#06B6D4" },
    { name: "Communication", icon: "📱", color: "#6366F1" },
    { name: "Social & Gifts", icon: "🎁", color: "#D946EF" },
    { name: "Insurance", icon: "🛡️", color: "#14B8A6" },
    { name: "Investment", icon: "📈", color: "#A855F7" },
    { name: "Miscellaneous", icon: "📦", color: "#78716C" },
  ];
  await prisma.category.createMany({
    data: defaults.map((d) => ({ ...d, userId, isDefault: true })),
  });
}
