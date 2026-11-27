import { RotateCcw, Search } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  TRANSACTION_CATEGORIES,
  TRANSACTION_CATEGORY_LABELS,
  TRANSACTION_TYPE_LABELS,
  TRANSACTION_TYPES,
} from "@/lib/constants";

interface TransactionFiltersProps {
  search?: string;
  type?: string;
  category?: string;
  from?: string;
  to?: string;
}

export function TransactionFilters({
  search,
  type,
  category,
  from,
  to,
}: TransactionFiltersProps) {
  return (
    <form
      action="/dashboard/transactions"
      method="get"
      className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.3fr_0.9fr_1fr_1fr_1fr_auto]"
    >
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          name="search"
          placeholder="Cari kode / keterangan..."
          defaultValue={search}
          className="pl-9"
          aria-label="Cari transaksi"
        />
      </div>

      <Select name="type" defaultValue={type ?? ""} aria-label="Filter jenis">
        <option value="">Semua jenis</option>
        {TRANSACTION_TYPES.map((item) => (
          <option key={item} value={item}>
            {TRANSACTION_TYPE_LABELS[item]}
          </option>
        ))}
      </Select>

      <Select name="category" defaultValue={category ?? ""} aria-label="Filter kategori">
        <option value="">Semua kategori</option>
        {TRANSACTION_CATEGORIES.map((item) => (
          <option key={item} value={item}>
            {TRANSACTION_CATEGORY_LABELS[item]}
          </option>
        ))}
      </Select>

      <Input
        name="from"
        type="date"
        defaultValue={from}
        aria-label="Dari tanggal"
        title="Dari tanggal"
      />
      <Input
        name="to"
        type="date"
        defaultValue={to}
        aria-label="Sampai tanggal"
        title="Sampai tanggal"
      />

      <div className="flex items-center gap-2">
        <Button type="submit" variant="secondary" className="flex-1">
          Terapkan
        </Button>
        <Link
          href="/dashboard/transactions"
          className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          title="Reset filter"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Link>
      </div>
    </form>
  );
}
