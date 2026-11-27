import Link from "next/link";
import { RotateCcw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PRODUCT_CATEGORIES, PRODUCT_CATEGORY_LABELS } from "@/lib/constants";

interface ProductFiltersProps {
  search?: string;
  category?: string;
  status?: string;
}

export function ProductFilters({ search, category, status }: ProductFiltersProps) {
  return (
    <form
      action="/dashboard/products"
      method="get"
      className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_auto]"
    >
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          name="search"
          placeholder="Cari nama atau SKU..."
          defaultValue={search}
          className="pl-9"
          aria-label="Cari produk"
        />
      </div>

      <Select name="category" defaultValue={category ?? ""} aria-label="Filter kategori">
        <option value="">Semua kategori</option>
        {PRODUCT_CATEGORIES.map((item) => (
          <option key={item} value={item}>
            {PRODUCT_CATEGORY_LABELS[item]}
          </option>
        ))}
      </Select>

      <Select name="status" defaultValue={status ?? "all"} aria-label="Filter status">
        <option value="all">Semua status</option>
        <option value="active">Aktif</option>
        <option value="inactive">Nonaktif</option>
      </Select>

      <div className="flex items-center gap-2">
        <Button type="submit" variant="secondary" className="flex-1 md:flex-none">
          Terapkan
        </Button>
        <Link
          href="/dashboard/products"
          className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          title="Reset filter"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </Link>
      </div>
    </form>
  );
}
