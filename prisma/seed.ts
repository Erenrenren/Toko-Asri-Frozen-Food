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

function daysAhead(days: number, hour = 10): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
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

  // ============================================================
  // TAHAP 2 — SCM: supplier, PO, batch, dan mutasi stok demo
  // ============================================================

  // Bersihkan data SCM demo secara berurutan agar aman ketika PO seed
  // sudah pernah diterima (receipt/batch/mutasi/jurnal ikut terhapus).
  const seededOrders = await prisma.purchaseOrder.findMany({
    where: { number: { startsWith: "SEED-PO-" } },
    select: {
      id: true,
      number: true,
      receipts: { select: { id: true } },
    },
  });
  const seededOrderIds = seededOrders.map((order) => order.id);
  const seededOrderNumbers = seededOrders.map((order) => order.number);
  const seededReceiptIds = seededOrders.flatMap((order) =>
    order.receipts.map((receipt) => receipt.id),
  );

  await prisma.stockMovement.deleteMany({
    where: {
      OR: [
        { reference: { startsWith: "SEED-" } },
        ...(seededOrderIds.length > 0
          ? [{ purchaseOrderId: { in: seededOrderIds } }]
          : []),
        ...(seededReceiptIds.length > 0
          ? [{ goodsReceiptId: { in: seededReceiptIds } }]
          : []),
      ],
    },
  });
  await prisma.productBatch.deleteMany({
    where: {
      OR: [
        { batchNumber: { startsWith: "SEED-BATCH-" } },
        ...(seededReceiptIds.length > 0
          ? [{ goodsReceiptId: { in: seededReceiptIds } }]
          : []),
      ],
    },
  });
  await prisma.goodsReceipt.deleteMany({
    where: {
      OR: [
        { number: { startsWith: "SEED-GR-" } },
        ...(seededReceiptIds.length > 0
          ? [{ id: { in: seededReceiptIds } }]
          : []),
      ],
    },
  });
  await prisma.purchaseOrder.deleteMany({
    where: { number: { startsWith: "SEED-PO-" } },
  });
  await prisma.financialTransaction.deleteMany({
    where: {
      OR: [
        { code: { startsWith: "SEED-PO-" } },
        ...(seededOrderNumbers.length > 0
          ? [{ externalRef: { in: seededOrderNumbers } }]
          : []),
      ],
    },
  });

  const supplierSeeds = [
    {
      code: "SUP-NUS",
      name: "PT Frozen Nusantara",
      contactName: "Hendra Kusuma",
      phone: "022-555-0101",
      email: "sales@frozennusantara.co.id",
      address: "Jl. Industri Raya No. 18, Kawasan Pergudangan",
      city: "Bandung",
      paymentTermDays: 30,
      leadTimeDays: 2,
      deliveryDays: "senin,kamis",
      minimumOrder: 1_500_000,
      notes: "Supplier utama nugget, sosis, dan kentang. Kirim pagi.",
      isActive: true,
    },
    {
      code: "SUP-SMB",
      name: "CV Sumber Beku",
      contactName: "Ratna Dewi",
      phone: "021-777-2244",
      email: "order@sumberbeku.id",
      address: "Jl. Raya Bekasi KM 22",
      city: "Jakarta Timur",
      paymentTermDays: 14,
      leadTimeDays: 3,
      deliveryDays: "selasa,jumat",
      minimumOrder: 1_000_000,
      notes: "Spesialis dimsum dan ikan fillet.",
      isActive: true,
    },
    {
      code: "SUP-ARK",
      name: "PT Arktik Distribution",
      contactName: "Yusuf Pratama",
      phone: "031-888-1122",
      email: "cs@arktikdist.co.id",
      address: "Jl. Margomulyo No. 7",
      city: "Surabaya",
      paymentTermDays: 45,
      leadTimeDays: 5,
      deliveryDays: "rabu",
      minimumOrder: 2_000_000,
      notes: "Sedang evaluasi kontrak; status nonaktif untuk demo.",
      isActive: false,
    },
  ];

  const supplierByCode: Record<string, { id: string; name: string }> = {};

  for (const seed of supplierSeeds) {
    const supplier = await prisma.supplier.upsert({
      where: { code: seed.code },
      update: { ...seed },
      create: { ...seed },
    });
    supplierByCode[seed.code] = { id: supplier.id, name: supplier.name };
  }

  const suppliedProductMap = [
    { code: "SUP-NUS", skus: ["NGT-001", "NGT-002", "SGS-001", "KTG-001"] },
    { code: "SUP-SMB", skus: ["DMS-001", "DMS-002", "IKN-001"] },
    { code: "SUP-ARK", skus: ["DGG-001"] },
  ];

  await prisma.supplierProduct.deleteMany({
    where: {
      supplierId: { in: Object.values(supplierByCode).map((item) => item.id) },
    },
  });

  const supplierByProductSku: Record<string, string> = {};

  for (const mapping of suppliedProductMap) {
    const supplier = supplierByCode[mapping.code];
    if (!supplier) continue;

    for (const sku of mapping.skus) {
      const product = bySku[sku];
      if (!product) continue;
      supplierByProductSku[sku] = supplier.id;
      await prisma.supplierProduct.create({
        data: {
          supplierId: supplier.id,
          productId: product.id,
          lastPrice: product.costPrice,
          isPreferred: true,
        },
      });
    }
  }

  for (const product of products) {
    if (product.stockQty <= 0) continue;

    const shelfLife = product.shelfLifeDays ?? 180;
    const supplierId = supplierByProductSku[product.sku] ?? null;

    const batchSpecs: Array<{
      suffix: string;
      quantity: number;
      productionDate: Date;
      expiryDate: Date;
    }> =
      product.sku === "DMS-002"
        ? [
            {
              suffix: "EXP",
              quantity: 1,
              productionDate: daysAgo(shelfLife + 2),
              expiryDate: daysAgo(2),
            },
            {
              suffix: "A",
              quantity: 3,
              productionDate: daysAgo(shelfLife - 12),
              expiryDate: daysAhead(12),
            },
            {
              suffix: "B",
              quantity: product.stockQty - 4,
              productionDate: daysAgo(5),
              expiryDate: daysAhead(100),
            },
          ]
        : product.sku === "IKN-001"
          ? [
              {
                suffix: "A",
                quantity: 3,
                productionDate: daysAgo(shelfLife - 18),
                expiryDate: daysAhead(18),
              },
              {
                suffix: "B",
                quantity: product.stockQty - 3,
                productionDate: daysAgo(5),
                expiryDate: daysAhead(150),
              },
            ]
          : (() => {
              const first = Math.max(1, Math.ceil(product.stockQty * 0.6));
              return [
                {
                  suffix: "A",
                  quantity: first,
                  productionDate: daysAgo(20),
                  expiryDate: daysAhead(Math.max(30, shelfLife - 20)),
                },
                {
                  suffix: "B",
                  quantity: product.stockQty - first,
                  productionDate: daysAgo(5),
                  expiryDate: daysAhead(Math.max(60, shelfLife)),
                },
              ];
            })();

    for (const spec of batchSpecs) {
      if (spec.quantity <= 0) continue;
      await prisma.productBatch.create({
        data: {
          batchNumber: `SEED-BATCH-${product.sku}-${spec.suffix}`,
          productId: product.id,
          supplierId,
          productionDate: spec.productionDate,
          expiryDate: spec.expiryDate,
          receivedQty: spec.quantity,
          remainingQty: spec.quantity,
          unitCost: product.costPrice,
          status: "active",
        },
      });
    }

    const outQuantity =
      product.sku === "DMS-002" ? 4 : product.sku === "IKN-001" ? 3 : 0;
    const initialQuantity = product.stockQty + outQuantity;

    await prisma.stockMovement.create({
      data: {
        reference: `SEED-MOV-IN-${product.sku}`,
        productId: product.id,
        type: "in",
        reason: "initial_stock",
        quantity: initialQuantity,
        stockBefore: 0,
        stockAfter: initialQuantity,
        unitCost: product.costPrice,
        note: "Saldo awal stok demo Tahap 2",
        occurredAt: daysAgo(15),
        createdById: admin.id,
      },
    });

    if (outQuantity > 0) {
      await prisma.stockMovement.create({
        data: {
          reference: `SEED-MOV-OUT-${product.sku}`,
          productId: product.id,
          type: "out",
          reason: product.sku === "DMS-002" ? "sale" : "expired",
          quantity: -outQuantity,
          stockBefore: initialQuantity,
          stockAfter: product.stockQty,
          unitCost: product.costPrice,
          note:
            product.sku === "DMS-002"
              ? "Penjualan harian (FIFO batch)"
              : "Pemusnahan barang kedaluwarsa",
          occurredAt: daysAgo(2),
          createdById: staff.id,
        },
      });
    }
  }

  async function createPurchaseOrderSeed(options: {
    number: string;
    supplierCode: string;
    status: "draft" | "ordered";
    orderDaysAgo: number;
    expectedDaysAhead: number;
    shippingCost: number;
    notes: string;
    items: Array<{ sku: string; quantity: number; unitCost: number }>;
  }) {
    const supplier = supplierByCode[options.supplierCode];
    if (!supplier) return;

    const items = options.items
      .map((item) => {
        const product = bySku[item.sku];
        return product
          ? {
              productId: product.id,
              quantity: item.quantity,
              unitCost: item.unitCost,
              subtotal: item.quantity * item.unitCost,
            }
          : null;
      })
      .filter(
        (
          item,
        ): item is {
          productId: string;
          quantity: number;
          unitCost: number;
          subtotal: number;
        } => item !== null,
      );

    if (items.length === 0) return;

    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

    await prisma.purchaseOrder.create({
      data: {
        number: options.number,
        supplierId: supplier.id,
        status: options.status,
        orderDate: daysAgo(options.orderDaysAgo),
        expectedDate: daysAhead(options.expectedDaysAhead),
        subtotal,
        shippingCost: options.shippingCost,
        totalAmount: subtotal + options.shippingCost,
        notes: options.notes,
        createdById: admin.id,
        items: { create: items },
      },
    });
  }

  await createPurchaseOrderSeed({
    number: "SEED-PO-001",
    supplierCode: "SUP-NUS",
    status: "ordered",
    orderDaysAgo: 2,
    expectedDaysAhead: 1,
    shippingCost: 75_000,
    notes: "Restock rutin nugget & sosis. Sudah dikirim supplier.",
    items: [
      { sku: "NGT-001", quantity: 24, unitCost: 27_500 },
      { sku: "SGS-001", quantity: 18, unitCost: 25_000 },
      { sku: "KTG-001", quantity: 12, unitCost: 24_000 },
    ],
  });

  await createPurchaseOrderSeed({
    number: "SEED-PO-002",
    supplierCode: "SUP-SMB",
    status: "draft",
    orderDaysAgo: 0,
    expectedDaysAhead: 3,
    shippingCost: 50_000,
    notes: "Draft restock dimsum dan ikan, menunggu approval pemilik.",
    items: [
      { sku: "DMS-001", quantity: 20, unitCost: 22_000 },
      { sku: "IKN-001", quantity: 15, unitCost: 35_000 },
    ],
  });

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
