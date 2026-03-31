import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBotMessage, formatBotResponse } from "@/lib/bot-parser";
import { formatRupiah, formatDate } from "@/lib/format";
import { broadcastTransaction, broadcastBudgetAlert } from "@/lib/sse";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay } from "date-fns";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function sendMessage(chatId: number, text: string, parseMode = "HTML") {
  if (!BOT_TOKEN) return;
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode }),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = body?.message;
    if (!message) return NextResponse.json({ ok: true });

    const chatId: number = message.chat.id;
    const telegramId: bigint = BigInt(message.from.id);
    const text: string = message.text ?? "";

    if (!text) return NextResponse.json({ ok: true });

    // Find user
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) {
      await sendMessage(chatId, `👋 Halo! Kamu belum terdaftar. Buka <a href="${process.env.NEXT_PUBLIC_APP_URL}/login">celengan.app/login</a> untuk mulai.`);
      return NextResponse.json({ ok: true });
    }

    // Get default account
    const defaultAccount = await prisma.account.findFirst({
      where: { userId: user.id, isDefault: true },
    }) ?? await prisma.account.findFirst({ where: { userId: user.id } });

    if (!defaultAccount) {
      await sendMessage(chatId, "❌ Tidak ada akun. Silakan buat akun di dashboard dulu.");
      return NextResponse.json({ ok: true });
    }

    const parsed = parseBotMessage(text);
    const now = new Date();

    if (parsed.type === "view") {
      switch (parsed.command) {
        case "help":
          await sendMessage(chatId, getHelpText());
          break;
        case "today":
          await handleToday(chatId, user.id, now);
          break;
        case "week":
          await handleWeek(chatId, user.id, now);
          break;
        case "month":
          await handleMonth(chatId, user.id, now);
          break;
        case "budget":
          await handleBudget(chatId, user.id, now);
          break;
        case "goals":
          await handleGoals(chatId, user.id);
          break;
        case "balance":
          await handleBalance(chatId, user.id);
          break;
        case "undo":
          await handleUndo(chatId, user.id);
          break;
        case "report":
          await handleMonth(chatId, user.id, now);
          break;
      }
      return NextResponse.json({ ok: true });
    }

    if (parsed.type === "expense") {
      // Find category
      const category = await prisma.category.findFirst({
        where: { userId: user.id, name: { contains: parsed.category, mode: "insensitive" } },
      });

      const tx = await prisma.transaction.create({
        data: {
          userId: user.id,
          accountId: defaultAccount.id,
          type: "EXPENSE",
          amount: parsed.amount,
          categoryId: category?.id,
          note: parsed.note,
          date: now,
          source: "BOT",
        },
        include: { category: true },
      });

      await prisma.account.update({
        where: { id: defaultAccount.id },
        data: { balance: { decrement: parsed.amount } },
      });

      broadcastTransaction(user.id, { ...tx, amount: Number(tx.amount) });

      const catName = category?.name ?? parsed.category;
      let response = formatBotResponse("success", `${formatRupiah(parsed.amount)} dicatat\n<b>${catName}</b>${parsed.note ? ` — ${parsed.note}` : ""}`);

      // Budget check
      if (category) {
        const budget = await getBudgetStatus(user.id, category.id, now);
        if (budget) {
          const pct = Math.round(budget.percentage);
          if (budget.percentage >= 100) {
            response += `\n\n🚨 Budget ${catName} <b>terlampaui</b>! (${pct}%)`;
            broadcastBudgetAlert(user.id, { categoryId: category.id, percentage: budget.percentage });
          } else if (budget.percentage >= 80) {
            response += `\n\n⚠️ Budget ${catName}: ${pct}% terpakai\nSisa ${formatRupiah(budget.remaining)}`;
          } else {
            response += `\n\nBudget ${catName}: ${pct}% · Sisa ${formatRupiah(budget.remaining)}`;
          }
        }
      }

      await sendMessage(chatId, response);
    }

    if (parsed.type === "income") {
      const tx = await prisma.transaction.create({
        data: {
          userId: user.id,
          accountId: defaultAccount.id,
          type: "INCOME",
          amount: parsed.amount,
          note: `${parsed.source}${parsed.note ? ` — ${parsed.note}` : ""}`,
          date: now,
          source: "BOT",
        },
      });

      await prisma.account.update({
        where: { id: defaultAccount.id },
        data: { balance: { increment: parsed.amount } },
      });

      broadcastTransaction(user.id, { ...tx, amount: Number(tx.amount) });
      await sendMessage(chatId, formatBotResponse("success", `Pemasukan ${formatRupiah(parsed.amount)} dicatat\n<b>${parsed.source}</b>${parsed.note ? ` — ${parsed.note}` : ""}`));
    }

    if (parsed.type === "transfer") {
      const fromAccount = await prisma.account.findFirst({
        where: { userId: user.id, name: { contains: parsed.from, mode: "insensitive" } },
      });
      const toAccount = await prisma.account.findFirst({
        where: { userId: user.id, name: { contains: parsed.to, mode: "insensitive" } },
      });

      if (!fromAccount || !toAccount) {
        await sendMessage(chatId, `❌ Akun tidak ditemukan. Cek nama akun dengan /balance`);
        return NextResponse.json({ ok: true });
      }

      await prisma.$transaction([
        prisma.transaction.create({
          data: {
            userId: user.id, accountId: fromAccount.id, type: "TRANSFER",
            amount: parsed.amount, note: `Transfer ke ${toAccount.name}`,
            transferToId: toAccount.id, source: "BOT",
          },
        }),
        prisma.account.update({ where: { id: fromAccount.id }, data: { balance: { decrement: parsed.amount } } }),
        prisma.account.update({ where: { id: toAccount.id }, data: { balance: { increment: parsed.amount } } }),
      ]);

      await sendMessage(chatId, formatBotResponse("success", `Transfer ${formatRupiah(parsed.amount)}\n<b>${fromAccount.name}</b> → <b>${toAccount.name}</b>`));
    }

    if (parsed.type === "goal_save") {
      const goal = await prisma.savingsGoal.findFirst({
        where: { userId: user.id, name: { contains: parsed.goalName, mode: "insensitive" } },
      });

      if (!goal) {
        await sendMessage(chatId, `❌ Goal "${parsed.goalName}" tidak ditemukan. Cek /goals`);
        return NextResponse.json({ ok: true });
      }

      const newSaved = Number(goal.savedAmount) + parsed.amount;
      const isCompleted = newSaved >= Number(goal.targetAmount);
      await prisma.savingsGoal.update({
        where: { id: goal.id },
        data: { savedAmount: newSaved, isCompleted },
      });

      const pct = Math.round((newSaved / Number(goal.targetAmount)) * 100);
      let msg = formatBotResponse("success", `${formatRupiah(parsed.amount)} ditabung untuk <b>${goal.name}</b>\nProgress: ${pct}%`);
      if (isCompleted) msg += "\n\n🎉 <b>Goal tercapai!</b> Selamat!";
      await sendMessage(chatId, msg);
    }

    if (parsed.type === "unknown") {
      await sendMessage(chatId, `❌ Tidak dapat dipahami: <i>${text}</i>\n\nContoh:\n• makan 35k\n• /expense 50000 food nasi goreng\n• /help untuk semua perintah`);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Bot webhook error:", error);
    return NextResponse.json({ ok: true });
  }
}

async function getBudgetStatus(userId: string, categoryId: string, now: Date) {
  const budget = await prisma.budget.findFirst({
    where: { userId, categoryId, month: now.getMonth() + 1, year: now.getFullYear() },
  });
  if (!budget) return null;

  const start = startOfMonth(now);
  const end = endOfMonth(now);
  const spent = await prisma.transaction.aggregate({
    where: { userId, categoryId, type: "EXPENSE", date: { gte: start, lte: end } },
    _sum: { amount: true },
  });

  const spentAmount = Number(spent._sum.amount ?? 0);
  const budgetAmount = Number(budget.amount);
  return {
    spent: spentAmount,
    remaining: budgetAmount - spentAmount,
    percentage: budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0,
  };
}

async function handleToday(chatId: number, userId: string, now: Date) {
  const start = startOfDay(now);
  const end = endOfDay(now);
  const txs = await prisma.transaction.findMany({
    where: { userId, date: { gte: start, lte: end } },
    include: { category: true },
    orderBy: { date: "desc" },
    take: 5,
  });

  const income = txs.filter((t) => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0);
  const expense = txs.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0);

  const lines = txs.slice(0, 5).map((t) => {
    const sign = t.type === "INCOME" ? "+" : t.type === "EXPENSE" ? "-" : "↔";
    return `${sign} ${formatRupiah(Number(t.amount))} ${t.category?.icon ?? ""} ${t.note ?? ""}`;
  });

  const msg = `📅 <b>Hari ini</b>\n\n` +
    `💚 Masuk: ${formatRupiah(income)}\n` +
    `❤️ Keluar: ${formatRupiah(expense)}\n` +
    `📊 Net: ${formatRupiah(income - expense)}\n\n` +
    (lines.length ? `<b>Transaksi terakhir:</b>\n${lines.join("\n")}` : "Belum ada transaksi hari ini.");

  await sendMessage(chatId, msg);
}

async function handleWeek(chatId: number, userId: string, now: Date) {
  const start = startOfWeek(now, { weekStartsOn: 1 });
  const end = endOfWeek(now, { weekStartsOn: 1 });
  const txs = await prisma.transaction.findMany({
    where: { userId, date: { gte: start, lte: end }, type: "EXPENSE" },
    include: { category: true },
  });

  const catMap: Record<string, { name: string; icon: string; amount: number }> = {};
  for (const tx of txs) {
    const key = tx.categoryId ?? "misc";
    if (!catMap[key]) catMap[key] = { name: tx.category?.name ?? "Lainnya", icon: tx.category?.icon ?? "📦", amount: 0 };
    catMap[key].amount += Number(tx.amount);
  }

  const total = txs.reduce((s, t) => s + Number(t.amount), 0);
  const lines = Object.values(catMap).sort((a, b) => b.amount - a.amount).map(
    (c) => `${c.icon} ${c.name}: ${formatRupiah(c.amount)}`
  );

  await sendMessage(chatId, `📅 <b>Minggu ini</b>\n\nTotal keluar: ${formatRupiah(total)}\n\n${lines.join("\n")}`);
}

async function handleMonth(chatId: number, userId: string, now: Date) {
  const start = startOfMonth(now);
  const end = endOfMonth(now);
  const txs = await prisma.transaction.findMany({
    where: { userId, date: { gte: start, lte: end } },
  });

  const income = txs.filter((t) => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0);
  const expense = txs.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0);
  const net = income - expense;
  const rate = income > 0 ? Math.round((net / income) * 100) : 0;

  await sendMessage(chatId,
    `📅 <b>${now.toLocaleString("id-ID", { month: "long", year: "numeric" })}</b>\n\n` +
    `💚 Pemasukan: ${formatRupiah(income)}\n` +
    `❤️ Pengeluaran: ${formatRupiah(expense)}\n` +
    `📊 Net: ${formatRupiah(net)}\n` +
    `💰 Savings Rate: ${rate}%\n\n` +
    `Lihat detail di dashboard 👉 ${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
  );
}

async function handleBudget(chatId: number, userId: string, now: Date) {
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const start = startOfMonth(now);
  const end = endOfMonth(now);

  const budgets = await prisma.budget.findMany({
    where: { userId, month, year },
    include: { category: true },
  });

  if (!budgets.length) {
    await sendMessage(chatId, "Belum ada budget. Atur budget di dashboard.");
    return;
  }

  const expenses = await prisma.transaction.findMany({
    where: { userId, type: "EXPENSE", date: { gte: start, lte: end } },
    select: { categoryId: true, amount: true },
  });

  const spent: Record<string, number> = {};
  for (const e of expenses) if (e.categoryId) spent[e.categoryId] = (spent[e.categoryId] ?? 0) + Number(e.amount);

  const lines = budgets.map((b) => {
    const s = spent[b.categoryId] ?? 0;
    const pct = Number(b.amount) > 0 ? Math.round((s / Number(b.amount)) * 100) : 0;
    const bar = pct >= 100 ? "🔴" : pct >= 80 ? "🟡" : "🟢";
    return `${bar} ${b.category.icon} ${b.category.name}: ${pct}% (${formatRupiah(s)} / ${formatRupiah(Number(b.amount))})`;
  });

  await sendMessage(chatId, `💼 <b>Budget Bulan Ini</b>\n\n${lines.join("\n")}`);
}

async function handleGoals(chatId: number, userId: string) {
  const goals = await prisma.savingsGoal.findMany({ where: { userId, isCompleted: false }, orderBy: { createdAt: "asc" } });
  if (!goals.length) {
    await sendMessage(chatId, "Belum ada goals. Buat di /goals di dashboard.");
    return;
  }

  const lines = goals.map((g) => {
    const pct = Number(g.targetAmount) > 0 ? Math.round((Number(g.savedAmount) / Number(g.targetAmount)) * 100) : 0;
    const bar = "█".repeat(Math.min(Math.floor(pct / 10), 10)) + "░".repeat(10 - Math.min(Math.floor(pct / 10), 10));
    return `🎯 <b>${g.name}</b>\n[${bar}] ${pct}%\n${formatRupiah(Number(g.savedAmount))} / ${formatRupiah(Number(g.targetAmount))}`;
  });

  await sendMessage(chatId, `🎯 <b>Savings Goals</b>\n\n${lines.join("\n\n")}`);
}

async function handleBalance(chatId: number, userId: string) {
  const accounts = await prisma.account.findMany({ where: { userId }, orderBy: { isDefault: "desc" } });
  const total = accounts.reduce((s, a) => s + Number(a.balance), 0);
  const lines = accounts.map((a) => `• ${a.name}: ${formatRupiah(Number(a.balance))}`);
  await sendMessage(chatId, `💳 <b>Saldo Rekening</b>\n\n${lines.join("\n")}\n\n<b>Total: ${formatRupiah(total)}</b>`);
}

async function handleUndo(chatId: number, userId: string) {
  const last = await prisma.transaction.findFirst({
    where: { userId, source: "BOT" },
    orderBy: { createdAt: "desc" },
    include: { category: true },
  });

  if (!last) {
    await sendMessage(chatId, "Tidak ada transaksi untuk di-undo.");
    return;
  }

  await prisma.$transaction(async (db) => {
    if (last.type === "INCOME") await db.account.update({ where: { id: last.accountId }, data: { balance: { decrement: last.amount } } });
    else if (last.type === "EXPENSE") await db.account.update({ where: { id: last.accountId }, data: { balance: { increment: last.amount } } });
    await db.transaction.delete({ where: { id: last.id } });
  });

  await sendMessage(chatId, formatBotResponse("success", `Transaksi dihapus:\n${formatRupiah(Number(last.amount))} — ${last.note ?? "tanpa catatan"} (${formatDate(last.date)})`));
}

function getHelpText(): string {
  return `🤖 <b>Celengan Bot — Perintah</b>

<b>📝 Catat Transaksi:</b>
• <code>makan 35k</code> — catat pengeluaran
• <code>gaji masuk 8jt</code> — catat pemasukan
• <code>/expense 35000 food nasi goreng</code>
• <code>/income 8000000 salary</code>
• <code>/transfer bca gopay 200000</code>
• <code>/cc bca 500000 shopping</code>
• <code>/goal save iPhone 500000</code>

<b>📊 Lihat Data:</b>
• <code>/today</code> — ringkasan hari ini
• <code>/week</code> — minggu ini per kategori
• <code>/month</code> — ringkasan bulan ini
• <code>/budget</code> — status budget semua kategori
• <code>/goals</code> — progress savings goals
• <code>/balance</code> — saldo semua rekening
• <code>/undo</code> — hapus transaksi terakhir

Semua data tersedia di dashboard 👉 ${process.env.NEXT_PUBLIC_APP_URL}`;
}
