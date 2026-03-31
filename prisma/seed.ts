import { PrismaClient, TransactionType, AccountType, LoanDirection, TxSource } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean up
  await prisma.loanPayment.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.savingsGoal.deleteMany();
  await prisma.creditCard.deleteMany();
  await prisma.account.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // Create demo user
  const user = await prisma.user.create({
    data: {
      telegramId: BigInt(123456789),
      username: "demo_user",
      firstName: "Budi",
      lastName: "Santoso",
      plan: "PRO",
    },
  });

  // Create default categories
  const categories = await Promise.all([
    prisma.category.create({ data: { userId: user.id, name: "Food & Beverage", icon: "🍜", color: "#EF4444", isDefault: true } }),
    prisma.category.create({ data: { userId: user.id, name: "Transport", icon: "🚗", color: "#3B82F6", isDefault: true } }),
    prisma.category.create({ data: { userId: user.id, name: "Housing", icon: "🏠", color: "#8B5CF6", isDefault: true } }),
    prisma.category.create({ data: { userId: user.id, name: "Shopping", icon: "🛍️", color: "#EC4899", isDefault: true } }),
    prisma.category.create({ data: { userId: user.id, name: "Entertainment", icon: "🎬", color: "#F59E0B", isDefault: true } }),
    prisma.category.create({ data: { userId: user.id, name: "Health", icon: "🏥", color: "#10B981", isDefault: true } }),
    prisma.category.create({ data: { userId: user.id, name: "Education", icon: "📚", color: "#06B6D4", isDefault: true } }),
    prisma.category.create({ data: { userId: user.id, name: "Communication", icon: "📱", color: "#6366F1", isDefault: true } }),
    prisma.category.create({ data: { userId: user.id, name: "Social & Gifts", icon: "🎁", color: "#D946EF", isDefault: true } }),
    prisma.category.create({ data: { userId: user.id, name: "Insurance", icon: "🛡️", color: "#14B8A6", isDefault: true } }),
    prisma.category.create({ data: { userId: user.id, name: "Investment", icon: "📈", color: "#A855F7", isDefault: true } }),
    prisma.category.create({ data: { userId: user.id, name: "Miscellaneous", icon: "📦", color: "#78716C", isDefault: true } }),
  ]);

  const [food, transport, housing, shopping, entertainment, health, education, communication, social, insurance, investment, misc] = categories;

  // Create accounts
  const accounts = await Promise.all([
    prisma.account.create({ data: { userId: user.id, name: "BCA Tabungan", type: AccountType.BANK, balance: 12500000, color: "#3B82F6", icon: "building-2", isDefault: true } }),
    prisma.account.create({ data: { userId: user.id, name: "GoPay", type: AccountType.EWALLET, balance: 450000, color: "#10B981", icon: "wallet" } }),
    prisma.account.create({ data: { userId: user.id, name: "OVO", type: AccountType.EWALLET, balance: 125000, color: "#8B5CF6", icon: "wallet" } }),
    prisma.account.create({ data: { userId: user.id, name: "Kas Tunai", type: AccountType.CASH, balance: 350000, color: "#F59E0B", icon: "banknote" } }),
    prisma.account.create({ data: { userId: user.id, name: "Reksa Dana", type: AccountType.INVESTMENT, balance: 5000000, color: "#A855F7", icon: "trending-up" } }),
  ]);

  const [bca, gopay, ovo, cash, reksadana] = accounts;

  // Create credit card
  const bcaVisa = await prisma.creditCard.create({
    data: {
      userId: user.id,
      name: "BCA Visa Platinum",
      bank: "BCA",
      last4: "4521",
      limit: 15000000,
      balance: 3200000,
      billingDate: 25,
      dueDate: 5,
      color: "#1E40AF",
    },
  });

  // Create savings goals
  await Promise.all([
    prisma.savingsGoal.create({
      data: {
        userId: user.id,
        name: "Emergency Fund",
        targetAmount: 30000000,
        savedAmount: 18500000,
        deadline: new Date("2026-12-31"),
        color: "#10B981",
        icon: "shield",
      },
    }),
    prisma.savingsGoal.create({
      data: {
        userId: user.id,
        name: "Liburan Bali",
        targetAmount: 8000000,
        savedAmount: 3200000,
        deadline: new Date("2026-07-01"),
        color: "#06B6D4",
        icon: "plane",
      },
    }),
    prisma.savingsGoal.create({
      data: {
        userId: user.id,
        name: "MacBook Pro",
        targetAmount: 25000000,
        savedAmount: 7500000,
        deadline: new Date("2026-09-30"),
        color: "#8B5CF6",
        icon: "laptop",
      },
    }),
  ]);

  // Create loans
  const loanAhmad = await prisma.loan.create({
    data: {
      userId: user.id,
      personName: "Ahmad Fauzi",
      direction: LoanDirection.LENT,
      originalAmount: 5000000,
      remainingAmount: 3000000,
      monthlyAmount: 500000,
      dueDate: new Date("2026-09-01"),
      status: "ACTIVE",
      notes: "Pinjaman untuk nikahan",
    },
  });

  await prisma.loanPayment.createMany({
    data: [
      { loanId: loanAhmad.id, amount: 500000, date: new Date("2026-01-05"), note: "Cicilan 1" },
      { loanId: loanAhmad.id, amount: 500000, date: new Date("2026-02-05"), note: "Cicilan 2" },
      { loanId: loanAhmad.id, amount: 500000, date: new Date("2026-03-05"), note: "Cicilan 3" },
      { loanId: loanAhmad.id, amount: 500000, date: new Date("2026-03-05"), note: "Cicilan 4" },
    ],
  });

  const loanKoperasi = await prisma.loan.create({
    data: {
      userId: user.id,
      personName: "Koperasi Kantor",
      direction: LoanDirection.BORROWED,
      originalAmount: 10000000,
      remainingAmount: 6000000,
      monthlyAmount: 1000000,
      dueDate: new Date("2026-10-01"),
      status: "ACTIVE",
      notes: "KTA untuk renovasi kos",
    },
  });

  await prisma.loanPayment.createMany({
    data: [
      { loanId: loanKoperasi.id, amount: 1000000, date: new Date("2026-01-25") },
      { loanId: loanKoperasi.id, amount: 1000000, date: new Date("2026-02-25") },
      { loanId: loanKoperasi.id, amount: 1000000, date: new Date("2026-03-20") },
      { loanId: loanKoperasi.id, amount: 1000000, date: new Date("2026-03-20") },
    ],
  });

  // Create budgets for March 2026
  await Promise.all([
    prisma.budget.create({ data: { userId: user.id, categoryId: food.id, amount: 2000000, month: 3, year: 2026 } }),
    prisma.budget.create({ data: { userId: user.id, categoryId: transport.id, amount: 800000, month: 3, year: 2026 } }),
    prisma.budget.create({ data: { userId: user.id, categoryId: housing.id, amount: 3500000, month: 3, year: 2026 } }),
    prisma.budget.create({ data: { userId: user.id, categoryId: shopping.id, amount: 1000000, month: 3, year: 2026 } }),
    prisma.budget.create({ data: { userId: user.id, categoryId: entertainment.id, amount: 500000, month: 3, year: 2026 } }),
    prisma.budget.create({ data: { userId: user.id, categoryId: health.id, amount: 300000, month: 3, year: 2026 } }),
    prisma.budget.create({ data: { userId: user.id, categoryId: communication.id, amount: 200000, month: 3, year: 2026 } }),
    prisma.budget.create({ data: { userId: user.id, categoryId: social.id, amount: 500000, month: 3, year: 2026 } }),
  ]);

  // Helper to create date in March 2026
  const d = (day: number) => new Date(`2026-03-${String(day).padStart(2, "0")}T08:00:00.000Z`);

  // Create 30 days of realistic transactions
  const txData = [
    // Day 1
    { accountId: bca.id, type: TransactionType.INCOME, amount: 8500000, categoryId: null, note: "Gaji Maret", date: d(1), source: TxSource.BOT },
    { accountId: gopay.id, type: TransactionType.EXPENSE, amount: 35000, categoryId: food.id, note: "GoFood nasi goreng", date: d(1), source: TxSource.BOT },
    // Day 2
    { accountId: gopay.id, type: TransactionType.EXPENSE, amount: 25000, categoryId: transport.id, note: "Gojek ke kantor", date: d(2), source: TxSource.BOT },
    { accountId: gopay.id, type: TransactionType.EXPENSE, amount: 28000, categoryId: food.id, note: "Makan siang warteg", date: d(2), source: TxSource.BOT },
    // Day 3
    { accountId: bca.id, type: TransactionType.EXPENSE, amount: 2800000, categoryId: housing.id, note: "Bayar kos bulan Maret", date: d(3), source: TxSource.BOT },
    { accountId: bca.id, type: TransactionType.EXPENSE, amount: 350000, categoryId: housing.id, note: "Listrik PLN token", date: d(3), source: TxSource.BOT },
    // Day 4
    { accountId: gopay.id, type: TransactionType.EXPENSE, amount: 45000, categoryId: food.id, note: "Kopi dan snack cafe", date: d(4), source: TxSource.BOT },
    { accountId: cash.id, type: TransactionType.EXPENSE, amount: 15000, categoryId: transport.id, note: "Parkir motor", date: d(4), source: TxSource.BOT },
    // Day 5
    { accountId: bca.id, type: TransactionType.EXPENSE, amount: 150000, categoryId: communication.id, note: "Paket data Telkomsel 30GB", date: d(5), source: TxSource.BOT },
    { accountId: gopay.id, type: TransactionType.EXPENSE, amount: 32000, categoryId: food.id, note: "GrabFood ayam geprek", date: d(5), source: TxSource.BOT },
    // Day 6
    { accountId: bca.id, type: TransactionType.INCOME, amount: 500000, categoryId: null, note: "Freelance desain logo", date: d(6), source: TxSource.BOT },
    { accountId: cash.id, type: TransactionType.EXPENSE, amount: 80000, categoryId: social.id, note: "Kondangan Pak RT", date: d(6), source: TxSource.BOT },
    // Day 7
    { accountId: gopay.id, type: TransactionType.EXPENSE, amount: 55000, categoryId: food.id, note: "Makan bersama keluarga", date: d(7), source: TxSource.BOT },
    { accountId: bca.id, type: TransactionType.EXPENSE, amount: 160000, categoryId: entertainment.id, note: "Netflix + Spotify bulanan", date: d(7), source: TxSource.BOT },
    // Day 8
    { accountId: gopay.id, type: TransactionType.EXPENSE, amount: 28000, categoryId: transport.id, note: "Ojol ke stasiun", date: d(8), source: TxSource.BOT },
    { accountId: gopay.id, type: TransactionType.EXPENSE, amount: 22000, categoryId: food.id, note: "Sarapan nasi uduk", date: d(8), source: TxSource.BOT },
    // Day 10
    { accountId: bca.id, type: TransactionType.EXPENSE, amount: 250000, categoryId: health.id, note: "BPJS Kesehatan", date: d(10), source: TxSource.BOT },
    { accountId: gopay.id, type: TransactionType.EXPENSE, amount: 45000, categoryId: food.id, note: "Lunch GoFood pizza", date: d(10), source: TxSource.BOT },
    // Day 11
    { accountId: bca.id, type: TransactionType.EXPENSE, amount: 350000, categoryId: shopping.id, note: "Shopee skincare", date: d(11), source: TxSource.BOT },
    { accountId: cash.id, type: TransactionType.EXPENSE, amount: 20000, categoryId: food.id, note: "Jajan bakso gerobak", date: d(11), source: TxSource.BOT },
    // Day 12
    { accountId: gopay.id, type: TransactionType.EXPENSE, amount: 35000, categoryId: transport.id, note: "Grab Motor kantor", date: d(12), source: TxSource.BOT },
    { accountId: bca.id, type: TransactionType.INCOME, amount: 750000, categoryId: null, note: "Project copywriting", date: d(12), source: TxSource.BOT },
    // Day 13
    { accountId: gopay.id, type: TransactionType.EXPENSE, amount: 60000, categoryId: food.id, note: "Dinner sama teman", date: d(13), source: TxSource.BOT },
    { accountId: bca.id, type: TransactionType.EXPENSE, amount: 195000, categoryId: entertainment.id, note: "Bioskop CGV + popcorn", date: d(13), source: TxSource.BOT },
    // Day 14
    { accountId: bca.id, type: TransactionType.EXPENSE, amount: 500000, categoryId: investment.id, note: "Top up Reksa Dana Bibit", date: d(14), source: TxSource.BOT },
    { accountId: gopay.id, type: TransactionType.EXPENSE, amount: 38000, categoryId: food.id, note: "GoFood mie ayam", date: d(14), source: TxSource.BOT },
    // Day 15
    { accountId: bca.id, type: TransactionType.EXPENSE, amount: 200000, categoryId: misc.id, note: "Laundry kiloan 10kg", date: d(15), source: TxSource.BOT },
    { accountId: gopay.id, type: TransactionType.EXPENSE, amount: 25000, categoryId: transport.id, note: "GoCar ke mall", date: d(15), source: TxSource.BOT },
    // Day 16
    { accountId: gopay.id, type: TransactionType.EXPENSE, amount: 30000, categoryId: food.id, note: "Kopi kekinian", date: d(16), source: TxSource.BOT },
    { accountId: bca.id, type: TransactionType.EXPENSE, amount: 450000, categoryId: shopping.id, note: "Tokopedia baju kerja", date: d(16), source: TxSource.BOT },
    // Day 17
    { accountId: gopay.id, type: TransactionType.EXPENSE, amount: 25000, categoryId: transport.id, note: "Gojek kantor", date: d(17), source: TxSource.BOT },
    { accountId: gopay.id, type: TransactionType.EXPENSE, amount: 40000, categoryId: food.id, note: "Makan siang restoran", date: d(17), source: TxSource.BOT },
    // Day 18
    { accountId: bca.id, type: TransactionType.INCOME, amount: 200000, categoryId: null, note: "Komisi referral", date: d(18), source: TxSource.BOT },
    { accountId: cash.id, type: TransactionType.EXPENSE, amount: 100000, categoryId: social.id, note: "Arisan RT bulan ini", date: d(18), source: TxSource.BOT },
    // Day 19
    { accountId: gopay.id, type: TransactionType.EXPENSE, amount: 55000, categoryId: food.id, note: "Breakfast + lunch kantor", date: d(19), source: TxSource.BOT },
    { accountId: bca.id, type: TransactionType.EXPENSE, amount: 120000, categoryId: health.id, note: "Apotek vitamin C dan multivitamin", date: d(19), source: TxSource.BOT },
    // Day 20
    { accountId: bca.id, type: TransactionType.EXPENSE, amount: 1200000, categoryId: null, note: "BCA Visa Visa payment", date: d(20), source: TxSource.BOT, creditCardId: bcaVisa.id },
    { accountId: gopay.id, type: TransactionType.EXPENSE, amount: 42000, categoryId: food.id, note: "GoFood soto betawi", date: d(20), source: TxSource.BOT },
    // Day 21
    { accountId: gopay.id, type: TransactionType.EXPENSE, amount: 30000, categoryId: transport.id, note: "Grab home dari mall", date: d(21), source: TxSource.BOT },
    { accountId: bca.id, type: TransactionType.EXPENSE, amount: 300000, categoryId: education.id, note: "Udemy course Python", date: d(21), source: TxSource.BOT },
    // Day 22
    { accountId: gopay.id, type: TransactionType.EXPENSE, amount: 28000, categoryId: food.id, note: "Sarapan bubur ayam", date: d(22), source: TxSource.BOT },
    { accountId: gopay.id, type: TransactionType.EXPENSE, amount: 35000, categoryId: transport.id, note: "Ojol weekend", date: d(22), source: TxSource.BOT },
    // Day 23
    { accountId: bca.id, type: TransactionType.EXPENSE, amount: 200000, categoryId: social.id, note: "Zakat infaq masjid", date: d(23), source: TxSource.BOT },
    { accountId: cash.id, type: TransactionType.EXPENSE, amount: 45000, categoryId: food.id, note: "Makan bakso keluarga", date: d(23), source: TxSource.BOT },
    // Day 24
    { accountId: gopay.id, type: TransactionType.EXPENSE, amount: 22000, categoryId: transport.id, note: "KRL commuter line", date: d(24), source: TxSource.BOT },
    { accountId: gopay.id, type: TransactionType.EXPENSE, amount: 35000, categoryId: food.id, note: "Makan siang warteg", date: d(24), source: TxSource.BOT },
    // Day 25
    { accountId: bca.id, type: TransactionType.EXPENSE, amount: 500000, categoryId: investment.id, note: "Nabung emas Antam", date: d(25), source: TxSource.BOT },
    { accountId: gopay.id, type: TransactionType.EXPENSE, amount: 48000, categoryId: food.id, note: "Dinner nasi padang", date: d(25), source: TxSource.BOT },
    // Day 26
    { accountId: bca.id, type: TransactionType.EXPENSE, amount: 145000, categoryId: misc.id, note: "Potong rambut + cukur", date: d(26), source: TxSource.BOT },
    { accountId: gopay.id, type: TransactionType.EXPENSE, amount: 32000, categoryId: food.id, note: "Kopi dan roti kantor", date: d(26), source: TxSource.BOT },
    // Day 27
    { accountId: cash.id, type: TransactionType.EXPENSE, amount: 40000, categoryId: food.id, note: "Jajan pasar tradisional", date: d(27), source: TxSource.BOT },
    { accountId: gopay.id, type: TransactionType.EXPENSE, amount: 25000, categoryId: transport.id, note: "Gojek motor", date: d(27), source: TxSource.BOT },
    // Day 28
    { accountId: bca.id, type: TransactionType.EXPENSE, amount: 190000, categoryId: insurance.id, note: "Asuransi jiwa Prudential", date: d(28), source: TxSource.BOT },
    { accountId: gopay.id, type: TransactionType.EXPENSE, amount: 55000, categoryId: food.id, note: "Makan bersama teman lama", date: d(28), source: TxSource.BOT },
    // Day 29
    { accountId: bca.id, type: TransactionType.INCOME, amount: 300000, categoryId: null, note: "Bonus performa Q1", date: d(29), source: TxSource.BOT },
    { accountId: gopay.id, type: TransactionType.EXPENSE, amount: 38000, categoryId: food.id, note: "GoFood nasi box", date: d(29), source: TxSource.BOT },
  ];

  for (const tx of txData) {
    await prisma.transaction.create({ data: { userId: user.id, ...tx } });
  }

  // Transfer: BCA to GoPay top up
  await prisma.transaction.create({
    data: {
      userId: user.id,
      accountId: bca.id,
      type: TransactionType.TRANSFER,
      amount: 200000,
      note: "Top up GoPay",
      date: d(9),
      transferToId: gopay.id,
      source: TxSource.BOT,
    },
  });

  console.log("✅ Seeding complete!");
  console.log(`   User: ${user.firstName} ${user.lastName}`);
  console.log(`   Accounts: ${accounts.length}`);
  console.log(`   Categories: ${categories.length}`);
  console.log(`   Transactions: ${txData.length + 1}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
