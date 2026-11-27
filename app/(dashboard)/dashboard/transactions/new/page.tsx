import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { TransactionForm } from "@/components/transactions/transaction-form";
import { buttonClasses } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { listProductOptions } from "@/lib/services/product.service";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Catat Transaksi",
};

export default async function NewTransactionPage() {
  const products = await listProductOptions();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Keuangan"
        title="Catat transaksi"
        description="Tambahkan pemasukan penjualan atau pengeluaran operasional ke jurnal kas."
        action={
          <Link
            href="/dashboard/transactions"
            className={buttonClasses({ variant: "outline" })}
          >
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
        }
      />
      <TransactionForm products={products} />
    </div>
  );
}
