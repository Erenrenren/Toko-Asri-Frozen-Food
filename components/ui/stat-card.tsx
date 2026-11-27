import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/format";

type Tone = "brand" | "green" | "amber" | "rose" | "slate" | "violet";

const tones: Record<Tone, { icon: string; ring: string }> = {
  brand: { icon: "bg-brand-50 text-brand-600", ring: "ring-brand-100" },
  green: { icon: "bg-emerald-50 text-emerald-600", ring: "ring-emerald-100" },
  amber: { icon: "bg-amber-50 text-amber-600", ring: "ring-amber-100" },
  rose: { icon: "bg-rose-50 text-rose-600", ring: "ring-rose-100" },
  slate: { icon: "bg-slate-100 text-slate-600", ring: "ring-slate-200" },
  violet: { icon: "bg-violet-50 text-violet-600", ring: "ring-violet-100" },
};

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: Tone;
  trend?: ReactNode;
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "brand",
  trend,
}: StatCardProps) {
  const config = tones[tone];

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <span
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1",
            config.icon,
            config.ring,
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
      {(hint || trend) && (
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          {trend}
          {hint && <span>{hint}</span>}
        </div>
      )}
    </div>
  );
}
