import { ArrowRight, Plus, ReceiptText } from "lucide-react";
import Link from "next/link";

import {
  TransactionCategoryBadge,
  TransactionTypeBadge,
} from "@/components/transactions/transaction-badge";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { TransactionRowActions } from "@/components/transactions/transaction-row-actions";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { requireUser } from "@/lib/auth/session";
import {
  TRANSACTION_CATEGORIES,
  TRANSACTION_TYPES,
} from "@/lib/constants";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";
import { listTransactions } from "@/lib/services/transaction.service";
import type {
  TransactionCategory,
  TransactionType,
} from "@/types/domain";

export const dynamic = "force-dynamic";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const user = await requireUser();

  const rawSearch = typeof params.search === "string" ? params.search : undefined;
  const rawType = typeof params.type === "string" ? params.type : undefined;
  const rawCategory =
    typeof params.category === "string" ? params.category : undefined;
  const rawFrom = typeof params.from === "string" ? params.from : undefined;
  const rawTo = typeof params.to === "string" ? params.to : undefined;
  const rawPage = typeof params.page === "string" ? Number(params.page) : 1;

  const type = (TRANSACTION_TYPES as readonly string[]).includes(rawType ?? "")
    ? (rawType as TransactionType)
    : undefined;
  const category = (TRANSACTION_CATEGORIES as readonly string[]).includes(
    rawCategory ?? "",
  )
    ? (rawCategory as TransactionCategory)
    : undefined;

  const from = rawFrom ? new Date(`${rawFrom}T00:00:00+07:00`) : undefined;
  const to = rawTo ? new Date(`${rawTo}T23:59:59+07:00`) : undefined;
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;

  const result = await listTransactions({
    search: rawSearch,
    type,
    category,
    from: from && !Number.isNaN(from.getTime()) ? from : undefined,
    to: to && !Number.isNaN(to.getTime()) ? to : undefined,
    page,
    pageSize: 12,
    skip: (page - 1) * 12,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Keuangan"
        title="Jurnal transaksi"
        description="Catat pemasukan penjualan dan pengeluaran operasional. HPP disimpan sebagai snapshot saat transaksi dibuat."
        action={
          <Link href="/dashboard/transactions/new" className={buttonClasses()}>
            <Plus className="h-4 w-4" /> Catat transaksi
          </Link>
        }
      />

      <Card>
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <TransactionFilters
            search={rawSearch}
            type={type}
            category={category}
            from={rawFrom}
            to={rawTo}
          />
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <Badge tone="slate">{formatNumber(result.meta.total)} transaksi</Badge>
            <span>·</span>
            <span>Transaksi void tidak dihitung pada ringkasan dashboard.</span>
          </div>
        </div>

        {result.items.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="Belum ada transaksi"
            description="Catat penjualan pertama atau pengeluaran operasional toko."
            action={
              <Link
                href="/dashboard/transactions/new"
                className={buttonClasses({ size: "sm" })}
              >
                <Plus className="h-3.5 w-3.5" /> Catat transaksi
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Transaksi</th>
                  <th>Jenis</th>
                  <th>Kategori</th>
                  <th className="text-right">Nominal</th>
                  <th>Dicatat oleh</th>
                  <th>Status</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="whitespace-nowrap text-xs text-slate-500">
                      {formatDateTime(transaction.occurredAt)}
                    </td>
                    <td>
                      <p className="max-w-[240px] truncate text-sm font-medium text-slate-800">
                        {transaction.description}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {transaction.code}
                        {transaction.product ? ` · ${transaction.product.name}` : ""}
                      </p>
                    </td>
                    <td>
                      <TransactionTypeBadge type={transaction.type} />
                    </td>
                    <td>
                      <TransactionCategoryBadge category={transaction.category} />
                    </td>
                    <td
                      className={
                        transaction.status === "void"
                          ? "whitespace-nowrap text-right text-sm font-semibold text-slate-400 line-through"
                          : transaction.type === "income"
                            ? "whitespace-nowrap text-right text-sm font-semibold text-emerald-700"
                            : "whitespace-nowrap text-right text-sm font-semibold text-rose-700"
                      }
                    >
                      {transaction.type === "income" ? "+" : "−"}
                      {formatCurrency(transaction.amount)}
                      {transaction.quantity && transaction.unitPrice && (
                        <p className="text-[11px] font-normal text-slate-400">
                          {formatNumber(transaction.quantity)} ×{" "}
                          {formatCurrency(transaction.unitPrice)}
                        </p>
                      )}
                    </td>
                    <td className="whitespace-nowrap text-xs text-slate-500">
                      {transaction.createdBy?.name ?? "—"}
                    </td>
                    <td>
                      {transaction.status === "void" ? (
                        <Badge tone="slate">Dibatalkan</Badge>
                      ) : (
                        <Badge tone="green">Posted</Badge>
                      )}
                    </td>
                    <td>
                      <TransactionRowActions
                        transaction={transaction}
                        canVoid={user.role === "admin"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          meta={result.meta}
          basePath="/dashboard/transactions"
          query={{
            search: rawSearch,
            type,
            category,
            from: rawFrom,
            to: rawTo,
          }}
        />
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-3 text-xs text-brand-900">
        <span>
          Ingin melihat rekap omzet, HPP, dan laba kotor? Semua tersedia di
          dashboard.
        </span>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 font-semibold text-brand-800 hover:text-brand-900"
        >
          Buka dashboard <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
