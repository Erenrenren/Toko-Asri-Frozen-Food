import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/format";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("input-base min-h-[6rem]", className)} {...props} />;
}
