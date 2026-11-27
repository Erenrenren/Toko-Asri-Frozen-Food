import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/format";

type AlertTone = "info" | "success" | "warning" | "danger";

const styles: Record<
  AlertTone,
  { wrapper: string; icon: typeof Info }
> = {
  info: {
    wrapper: "border-sky-200 bg-sky-50 text-sky-800",
    icon: Info,
  },
  success: {
    wrapper: "border-emerald-200 bg-emerald-50 text-emerald-800",
    icon: CheckCircle2,
  },
  warning: {
    wrapper: "border-amber-200 bg-amber-50 text-amber-800",
    icon: TriangleAlert,
  },
  danger: {
    wrapper: "border-rose-200 bg-rose-50 text-rose-800",
    icon: AlertCircle,
  },
};

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  tone?: AlertTone;
  title?: string;
}

export function Alert({
  tone = "info",
  title,
  className,
  children,
  ...props
}: AlertProps) {
  const config = styles[tone];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
        config.wrapper,
        className,
      )}
      role={tone === "danger" ? "alert" : "status"}
      {...props}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        <div className={cn(title && "mt-0.5", "leading-relaxed")}>{children}</div>
      </div>
    </div>
  );
}
