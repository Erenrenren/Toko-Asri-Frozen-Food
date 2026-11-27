import { formatCompactCurrency } from "@/lib/format";
import type { DashboardSummary } from "@/types/domain";

interface SalesChartProps {
  data: DashboardSummary["salesTrend"];
}

export function SalesChart({ data }: SalesChartProps) {
  const max = Math.max(...data.map((item) => item.revenue), 1);
  const total = data.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500">Total 7 hari terakhir</p>
          <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">
            {formatCompactCurrency(total)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-slate-400">Transaksi</p>
          <p className="text-sm font-semibold text-slate-700">
            {data.reduce((sum, item) => sum + item.transactions, 0)}
          </p>
        </div>
      </div>

      <div className="mt-6 flex h-40 items-end gap-2 sm:gap-3">
        {data.map((item) => {
          const height = item.revenue > 0 ? Math.max(6, (item.revenue / max) * 100) : 2;
          return (
            <div key={item.date} className="group flex flex-1 flex-col items-center gap-2">
              <div className="relative flex h-32 w-full items-end">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-brand-600 to-brand-300 transition group-hover:from-brand-700 group-hover:to-brand-400"
                  style={{ height: `${height}%` }}
                  title={`${item.label}: ${formatCompactCurrency(item.revenue)}`}
                />
              </div>
              <span className="text-[10px] font-medium text-slate-400">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
