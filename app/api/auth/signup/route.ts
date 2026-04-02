import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { getSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: { name, email, passwordHash },
    });

    // Default categories
    await prisma.category.createMany({
      data: [
        { userId: user.id, name: "Food & Beverage", icon: "🍜", color: "#EF4444", isDefault: true },
        { userId: user.id, name: "Transport", icon: "🚗", color: "#3B82F6", isDefault: true },
        { userId: user.id, name: "Housing", icon: "🏠", color: "#8B5CF6", isDefault: true },
        { userId: user.id, name: "Shopping", icon: "🛍️", color: "#EC4899", isDefault: true },
        { userId: user.id, name: "Entertainment", icon: "🎬", color: "#F59E0B", isDefault: true },
        { userId: user.id, name: "Health", icon: "🏥", color: "#10B981", isDefault: true },
        { userId: user.id, name: "Education", icon: "📚", color: "#06B6D4", isDefault: true },
        { userId: user.id, name: "Communication", icon: "📱", color: "#6366F1", isDefault: true },
        { userId: user.id, name: "Social & Gifts", icon: "🎁", color: "#D946EF", isDefault: true },
        { userId: user.id, name: "Insurance", icon: "🛡️", color: "#14B8A6", isDefault: true },
        { userId: user.id, name: "Investment", icon: "📈", color: "#A855F7", isDefault: true },
        { userId: user.id, name: "Miscellaneous", icon: "📦", color: "#78716C", isDefault: true },
      ],
    });

    // Default account
    await prisma.account.create({
      data: { userId: user.id, name: "Kas Utama", type: "CASH", balance: 0, isDefault: true },
    });

    const session = await getSession();
    session.user = { id: user.id, email: user.email, name: user.name, plan: user.plan };
    await session.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
