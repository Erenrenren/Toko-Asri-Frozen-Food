import { randomBytes } from "crypto";

import type { Prisma } from "@prisma/client";

import { formatDateInput } from "@/lib/format";
import type { BatchStatus, PurchaseOrderStatus } from "@/types/domain";

export type ScmTx = Prisma.TransactionClient;

/**
 * Nomor dokumen SCM, mis. PO-20261127-A1B2C3.
 * Memakai suffix acak agar aman dari bentrok saat beberapa user bekerja paralel.
 */
export function generateDocumentNumber(prefix: string, date = new Date()): string {
  const datePart = formatDateInput(date).replaceAll("-", "");
  const randomPart = randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}-${datePart}-${randomPart}`;
}

export function parseDateInput(
  value?: string | null,
  fallback: Date | null = null,
): Date | null {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}T12:00:00+07:00`);
  }
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

export function startOfMonth(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

export function endOfMonth(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1, 0, 0, 0, -1);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function daysUntil(date: Date | null, from = new Date()): number | null {
  if (!date) return null;
  const diff = date.getTime() - from.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Status batch efektif untuk ditampilkan. Status di database hanya menyimpan
 * active/depleted/disposed; kondisi kedaluwarsa dihitung dari tanggal agar
 * tidak perlu cron job.
 */
export function effectiveBatchStatus(
  storedStatus: string,
  remainingQty: number,
  expiryDate: Date | null,
  now = new Date(),
): BatchStatus {
  if (storedStatus === "disposed") return "disposed";
  if (remainingQty <= 0) return "depleted";
  if (expiryDate && expiryDate.getTime() < now.getTime()) return "expired";
  return "active";
}

export function isOpenPurchaseOrderStatus(status: PurchaseOrderStatus): boolean {
  return status === "ordered" || status === "partially_received";
}

/**
 * Mengurangi batch aktif secara FIFO (expiry terdekat lebih dulu).
 * Stok produk tetap menjadi sumber kebenaran; kekurangan batch (mis. stok
 * warisan Tahap 1 yang belum punya batch) tidak memblokir mutasi keluar.
 */
export async function consumeBatchesFifo(
  tx: ScmTx,
  productId: string,
  quantity: number,
): Promise<Array<{ batchId: string; batchNumber: string; quantity: number }>> {
  if (quantity <= 0) return [];

  const batches = await tx.productBatch.findMany({
    where: { productId, remainingQty: { gt: 0 }, status: "active" },
  });

  batches.sort((a, b) => {
    const aTime = a.expiryDate?.getTime() ?? Number.POSITIVE_INFINITY;
    const bTime = b.expiryDate?.getTime() ?? Number.POSITIVE_INFINITY;
    if (aTime !== bTime) return aTime - bTime;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  const consumed: Array<{ batchId: string; batchNumber: string; quantity: number }> =
    [];
  let remaining = quantity;

  for (const batch of batches) {
    if (remaining <= 0) break;
    const take = Math.min(batch.remainingQty, remaining);
    if (take <= 0) continue;

    const nextRemaining = batch.remainingQty - take;
    await tx.productBatch.update({
      where: { id: batch.id },
      data: {
        remainingQty: nextRemaining,
        status: nextRemaining <= 0 ? "depleted" : "active",
      },
    });

    consumed.push({
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      quantity: take,
    });
    remaining -= take;
  }

  return consumed;
}

export function buildPagination(page: number, pageSize: number, total: number) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export function normalizeDeliveryDays(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((day) => day.trim())
    .filter(Boolean);
}

export function serializeDeliveryDays(days: string[]): string | null {
  const unique = Array.from(new Set(days.filter(Boolean)));
  return unique.length > 0 ? unique.join(",") : null;
}
