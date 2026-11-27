import { Snowflake } from "lucide-react";

import { cn } from "@/lib/format";

interface LogoProps {
  variant?: "light" | "dark";
  compact?: boolean;
  className?: string;
}

export function Logo({ variant = "dark", compact = false, className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-400 via-brand-500 to-brand-700 text-white shadow-lg shadow-brand-900/20">
        <Snowflake className="h-5 w-5" strokeWidth={2.2} />
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent-400 ring-2 ring-white" />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span
            className={cn(
              "block text-sm font-bold tracking-tight",
              variant === "light" ? "text-white" : "text-slate-900",
            )}
          >
            Toko Asri
          </span>
          <span
            className={cn(
              "block text-[11px] font-medium uppercase tracking-[0.16em]",
              variant === "light" ? "text-brand-200" : "text-brand-700",
            )}
          >
            Frozen Food
          </span>
        </span>
      )}
    </div>
  );
}
