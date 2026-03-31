import { parseIndonesianAmount } from "./format";

export type ParsedBotCommand =
  | { type: "expense"; amount: number; category: string; note: string }
  | { type: "income"; amount: number; source: string; note: string }
  | { type: "transfer"; from: string; to: string; amount: number }
  | { type: "cc"; card: string; amount: number; category: string; note: string }
  | { type: "goal_save"; goalName: string; amount: number }
  | { type: "loan_add"; amount: number; direction: "to" | "from"; personName: string; termMonths: number }
  | { type: "loan_pay"; personName: string; amount: number }
  | { type: "view"; command: "today" | "week" | "month" | "budget" | "goals" | "balance" | "report" | "undo" | "help" }
  | { type: "unknown"; raw: string };

// Category keyword mapping (Indonesian)
const CATEGORY_KEYWORDS: Record<string, string> = {
  makan: "Food & Beverage",
  food: "Food & Beverage",
  makanan: "Food & Beverage",
  nasi: "Food & Beverage",
  gofood: "Food & Beverage",
  grabfood: "Food & Beverage",
  kopi: "Food & Beverage",
  cafe: "Food & Beverage",
  warteg: "Food & Beverage",
  jajan: "Food & Beverage",
  lunch: "Food & Beverage",
  dinner: "Food & Beverage",
  breakfast: "Food & Beverage",
  sarapan: "Food & Beverage",
  grab: "Transport",
  gojek: "Transport",
  ojol: "Transport",
  transport: "Transport",
  bensin: "Transport",
  bbm: "Transport",
  parkir: "Transport",
  mrt: "Transport",
  krl: "Transport",
  taxi: "Transport",
  kos: "Housing",
  kontrakan: "Housing",
  rent: "Housing",
  listrik: "Housing",
  pln: "Housing",
  air: "Housing",
  internet: "Housing",
  wifi: "Housing",
  tokopedia: "Shopping",
  shopee: "Shopping",
  belanja: "Shopping",
  shopping: "Shopping",
  baju: "Shopping",
  fashion: "Shopping",
  netflix: "Entertainment",
  spotify: "Entertainment",
  bioskop: "Entertainment",
  cgv: "Entertainment",
  game: "Entertainment",
  hiburan: "Entertainment",
  bpjs: "Health",
  dokter: "Health",
  apotek: "Health",
  obat: "Health",
  gym: "Health",
  klinik: "Health",
  health: "Health",
  sekolah: "Education",
  course: "Education",
  buku: "Education",
  pulsa: "Communication",
  paket: "Communication",
  data: "Communication",
  kondangan: "Social & Gifts",
  arisan: "Social & Gifts",
  angpao: "Social & Gifts",
  zakat: "Social & Gifts",
  infaq: "Social & Gifts",
  sedekah: "Social & Gifts",
  asuransi: "Insurance",
  insurance: "Insurance",
  prudential: "Insurance",
  reksadana: "Investment",
  saham: "Investment",
  crypto: "Investment",
  emas: "Investment",
  deposito: "Investment",
  investasi: "Investment",
  laundry: "Miscellaneous",
  barber: "Miscellaneous",
  salon: "Miscellaneous",
  lainnya: "Miscellaneous",
};

function guessCategory(text: string): string {
  const lower = text.toLowerCase();
  for (const [keyword, category] of Object.entries(CATEGORY_KEYWORDS)) {
    if (lower.includes(keyword)) return category;
  }
  return "Miscellaneous";
}

export function parseBotMessage(text: string): ParsedBotCommand {
  const raw = text.trim();
  const lower = raw.toLowerCase();

  // View commands
  if (/^\/today/i.test(raw)) return { type: "view", command: "today" };
  if (/^\/week/i.test(raw)) return { type: "view", command: "week" };
  if (/^\/month/i.test(raw)) return { type: "view", command: "month" };
  if (/^\/budget/i.test(raw)) return { type: "view", command: "budget" };
  if (/^\/goals/i.test(raw)) return { type: "view", command: "goals" };
  if (/^\/balance/i.test(raw)) return { type: "view", command: "balance" };
  if (/^\/report/i.test(raw)) return { type: "view", command: "report" };
  if (/^\/undo/i.test(raw)) return { type: "view", command: "undo" };
  if (/^\/help/i.test(raw)) return { type: "view", command: "help" };

  // /expense [amount] [category] [note]
  const expenseMatch = raw.match(/^\/expense\s+(\S+)\s+(\S+)?\s*(.*)?$/i);
  if (expenseMatch) {
    const amount = parseIndonesianAmount(expenseMatch[1]);
    if (amount) {
      return {
        type: "expense",
        amount,
        category: expenseMatch[2] ? guessCategory(expenseMatch[2]) : "Miscellaneous",
        note: expenseMatch[3]?.trim() ?? "",
      };
    }
  }

  // /income [amount] [source] [note]
  const incomeMatch = raw.match(/^\/income\s+(\S+)\s+(\S+)?\s*(.*)?$/i);
  if (incomeMatch) {
    const amount = parseIndonesianAmount(incomeMatch[1]);
    if (amount) {
      return {
        type: "income",
        amount,
        source: incomeMatch[2] ?? "other",
        note: incomeMatch[3]?.trim() ?? "",
      };
    }
  }

  // /transfer [from] [to] [amount]
  const transferMatch = raw.match(/^\/transfer\s+(\S+)\s+(\S+)\s+(\S+)$/i);
  if (transferMatch) {
    const amount = parseIndonesianAmount(transferMatch[3]);
    if (amount) {
      return { type: "transfer", from: transferMatch[1], to: transferMatch[2], amount };
    }
  }

  // /cc [card] [amount] [cat] [note]
  const ccMatch = raw.match(/^\/cc\s+(\S+)\s+(\S+)\s+(\S+)?\s*(.*)?$/i);
  if (ccMatch) {
    const amount = parseIndonesianAmount(ccMatch[2]);
    if (amount) {
      return {
        type: "cc",
        card: ccMatch[1],
        amount,
        category: ccMatch[3] ? guessCategory(ccMatch[3]) : "Shopping",
        note: ccMatch[4]?.trim() ?? "",
      };
    }
  }

  // /goal save [name] [amount]
  const goalMatch = raw.match(/^\/goal\s+save\s+(\S+)\s+(\S+)$/i);
  if (goalMatch) {
    const amount = parseIndonesianAmount(goalMatch[2]);
    if (amount) {
      return { type: "goal_save", goalName: goalMatch[1], amount };
    }
  }

  // /loan add [amount] [to/from] [name] [term]
  const loanAddMatch = raw.match(/^\/loan\s+add\s+(\S+)\s+(to|from)\s+(\S+)\s+(\d+)m?$/i);
  if (loanAddMatch) {
    const amount = parseIndonesianAmount(loanAddMatch[1]);
    if (amount) {
      return {
        type: "loan_add",
        amount,
        direction: loanAddMatch[2].toLowerCase() as "to" | "from",
        personName: loanAddMatch[3],
        termMonths: parseInt(loanAddMatch[4], 10),
      };
    }
  }

  // /loan pay [name] [amount]
  const loanPayMatch = raw.match(/^\/loan\s+pay\s+(\S+)\s+(\S+)$/i);
  if (loanPayMatch) {
    const amount = parseIndonesianAmount(loanPayMatch[2]);
    if (amount) {
      return { type: "loan_pay", personName: loanPayMatch[1], amount };
    }
  }

  // Natural language: "lunch 35k", "grab 25rb", "salary masuk 8jt"
  // Pattern: [description] [amount] or [amount] [description]
  const naturalMatch = lower.match(/^(.+?)\s+(\d+(?:\.\d+)?(?:k|rb|jt|juta|ribu|m)?)\s*$/) ||
    lower.match(/^(\d+(?:\.\d+)?(?:k|rb|jt|juta|ribu|m)?)\s+(.+)$/);

  if (naturalMatch) {
    // Try amount first
    let amountStr = naturalMatch[2] ?? naturalMatch[1];
    let description = naturalMatch[1] ?? naturalMatch[2];

    // Check if first group is amount
    const amountFirst = parseIndonesianAmount(naturalMatch[1] ?? "");
    if (amountFirst !== null) {
      amountStr = naturalMatch[1]!;
      description = naturalMatch[2]!;
    }

    const amount = parseIndonesianAmount(amountStr);
    if (amount !== null && amount > 0) {
      // Guess if income or expense
      const incomeKeywords = ["gaji", "salary", "masuk", "income", "pemasukan", "bonus", "freelance", "transfer masuk", "dapat"];
      const isIncome = incomeKeywords.some((kw) => description.includes(kw));

      if (isIncome) {
        return { type: "income", amount, source: "other", note: description };
      }
      return { type: "expense", amount, category: guessCategory(description), note: description };
    }
  }

  return { type: "unknown", raw };
}

export function formatBotResponse(
  type: "success" | "warning" | "error",
  message: string
): string {
  const icons = { success: "✅", warning: "⚠️", error: "❌" };
  return `${icons[type]} ${message}`;
}
