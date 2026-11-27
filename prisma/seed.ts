import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function daysAgo(days: number, hour = 10): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

async function main() {
  console.log("🌱 Seeding database Toko Asri Frozen Food...");

  const passwordAdmin = await bcrypt.hash("Admin123!", 10);
  const passwordStaff = await bcrypt.hash("Staff123!", 10);
  const passwordCustomer = await bcrypt.hash("Customer123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@tokosasri.id" },
    update: { name: "Asri Wijaya", role: "admin", isActive: true },
    create: {
      name: "Asri Wijaya",
      email: "admin@tokosasri.id",
      phone: "0812-3456-7890",
      passwordHash: passwordAdmin,
      role: "admin",
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff@tokosasri.id" },
    update: { name: "Budi Santoso", role: "staff", isActive: true },
    create: {
      name: "Budi Santoso",
      email: "staff@tokosasri.id",
      phone: "0812-9876-5432",
      passwordHash: passwordStaff,
      role: "staff",
    },
  });

  await prisma.user.upsert({
    where: { email: "pelanggan@tokosasri.id" },
    update: { name: "Sinta Pelanggan", role: "customer", isActive: true },
    create: {
      name: "Sinta Pelanggan",
      email: "pelanggan@tokosasri.id",
      phone: "0813-1111-2222",
      passwordHash: passwordCustomer,
      role: "customer",
    },
  });

  const productSeeds = [
    {
      sku: "NGT-001",
      name: "Nugget Ayam Premium 500g",
      category: "nugget",
      description: "Nugget ayam berbumbu, cocok untuk stok harian keluarga.",
      storageTemperature: -18,
      shelfLifeDays: 180,
      costPrice: 28000,
      sellPrice: 38000,
      unit: "pack",
      packSize: 1,
      stockQty: 48,
      minStockQty: 12,
    },
    {
      sku: "NGT-002",
      name: "Nugget Spicy Crispy 500g",
      category: "nugget",
      description: "Nugget pedas dengan lapisan tepung crispy.",
      storageTemperature: -18,
      shelfLifeDays: 180,
      costPrice: 30000,
      sellPrice: 41000,
      unit: "pack",
      packSize: 1,
      stockQty: 26,
      minStockQty: 10,
    },
    {
      sku: "SGS-001",
      name: "Sosis Ayam Cocktail 500g",
      category: "sosis",
      description: "Sosis cocktail ayam siap goreng atau rebus.",
      storageTemperature: -18,
      shelfLifeDays: 150,
      costPrice: 25000,
      sellPrice: 34000,
      unit: "pack",
      packSize: 1,
      stockQty: 32,
      minStockQty: 12,
    },
    {
      sku: "DMS-001",
      name: "Dimsum Ayam Mentai 250g",
      category: "dimsum",
      description: "Dimsum ayam dengan saus mentai, 10 pcs per pack.",
      storageTemperature: -18,
      shelfLifeDays: 120,
      costPrice: 22000,
      sellPrice: 32000,
      unit: "pack",
      packSize: 10,
      stockQty: 19,
      minStockQty: 8,
    },
    {
      sku: "DMS-002",
      name: "Dimsum Udang Hakau 250g",
      category: "dimsum",
      description: "Hakau udang premium, 8 pcs per pack.",
      storageTemperature: -18,
      shelfLifeDays: 120,
      costPrice: 27000,
      sellPrice: 39000,
      unit: "pack",
      packSize: 8,
      stockQty: 6,
      minStockQty: 8,
    },
    {
      sku: "IKN-001",
      name: "Ikan Dori Fillet 500g",
      category: "ikan",
      description: "Fillet dori beku tanpa tulang.",
      storageTemperature: -20,
      shelfLifeDays: 240,
      costPrice: 35000,
      sellPrice: 46000,
      unit: "pack",
      packSize: 1,
      stockQty: 7,
      minStockQty: 10,
    },
    {
      sku: "DGG-001",
      name: "Daging Sapi Giling 500g",
      category: "daging",
      description: "Daging sapi giling segar beku.",
      storageTemperature: -20,
      shelfLifeDays: 180,
      costPrice: 48000,
      sellPrice: 62000,
      unit: "pack",
      packSize: 1,
      stockQty: 14,
      minStockQty: 6,
    },
    {
      sku: "KTG-001",
      name: "Kentang Goreng Shoestring 1kg",
      category: "kentang",
      description: "Kentang shoestring siap goreng untuk usaha kuliner.",
      storageTemperature: -18,
      shelfLifeDays: 365,
      costPrice: 24000,
      sellPrice: 34000,
      unit: "pack",
      packSize: 1,
      stockQty: 36,
      minStockQty: 12,
    },
  ];

  const products = [];
  for (const seed of productSeeds) {
    const product = await prisma.product.upsert({
      where: { sku: seed.sku },
      update: { ...seed, isActive: true },
      create: { ...seed, isActive: true },
    });
    products.push(product);
  }

  const bySku = Object.fromEntries(products.map((p) => [p.sku, p]));

  // Hapus transaksi seed lama agar seed dapat dijalankan berulang.
  await prisma.financialTransaction.deleteMany({
    where: { code: { startsWith: "SEED-" } },
  });

  const salesSeed = [
    { sku: "NGT-001", qty: 3, day: 0 },
    { sku: "SGS-001", qty: 2, day: 0 },
    { sku: "DMS-001", qty: 2, day: 1 },
    { sku: "KTG-001", qty: 4, day: 1 },
    { sku: "IKN-001", qty: 1, day: 2 },
    { sku: "DGG-001", qty: 2, day: 3 },
    { sku: "NGT-002", qty: 3, day: 4 },
    { sku: "DMS-002", qty: 2, day: 5 },
    { sku: "NGT-001", qty: 5, day: 6 },
    { sku: "SGS-001", qty: 4, day: 7 },
    { sku: "KTG-001", qty: 6, day: 8 },
    { sku: "DMS-001", qty: 3, day: 9 },
  ];

  let counter = 1;
  for (const sale of salesSeed) {
    const product = bySku[sale.sku];
    if (!product) continue;
    await prisma.financialTransaction.create({
      data: {
        code: `SEED-SALE-${String(counter).padStart(3, "0")}`,
        type: "income",
        category: "sales",
        amount: product.sellPrice * sale.qty,
        quantity: sale.qty,
        unitPrice: product.sellPrice,
        unitCost: product.costPrice,
        description: `Penjualan ${product.name} (${sale.qty} ${product.unit})`,
        occurredAt: daysAgo(sale.day, 9 + (counter % 8)),
        source: "manual",
        status: "posted",
        productId: product.id,
        createdById: counter % 2 === 0 ? staff.id : admin.id,
      },
    });
    counter += 1;
  }

  const expensesSeed = [
    {
      code: "SEED-EXP-001",
      category: "purchase",
      amount: 1250000,
      description: "Restock nugget & sosis dari supplier utama",
      day: 8,
    },
    {
      code: "SEED-EXP-002",
      category: "operational",
      amount: 350000,
      description: "Token listrik cold storage dan kebersihan toko",
      day: 6,
    },
    {
      code: "SEED-EXP-003",
      category: "operational",
      amount: 180000,
      description: "Biaya pengiriman pesanan pelanggan",
      day: 3,
    },
    {
      code: "SEED-EXP-004",
      category: "operational",
      amount: 95000,
      description: "Pembelian plastik kemasan dan label harga",
      day: 1,
    },
  ];

  for (const expense of expensesSeed) {
    await prisma.financialTransaction.create({
      data: {
        code: expense.code,
        type: "expense",
        category: expense.category,
        amount: expense.amount,
        description: expense.description,
        occurredAt: daysAgo(expense.day, 14),
        source: "manual",
        status: "posted",
        createdById: admin.id,
      },
    });
  }

  console.log("✅ Seed selesai.");
  console.log("   admin@tokosasri.id / Admin123!");
  console.log("   staff@tokosasri.id / Staff123!");
  console.log("   pelanggan@tokosasri.id / Customer123!");
}

main()
  .catch((error) => {
    console.error("❌ Seed gagal:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
