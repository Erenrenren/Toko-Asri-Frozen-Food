import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/format";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("input-base", className)} {...props} />;
}
