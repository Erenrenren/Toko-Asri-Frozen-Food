"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SCM_NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/format";

export function ScmNav() {
  const pathname = usePathname();

  return (
    <nav className="subtle-scrollbar -mx-1 flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-card">
      {SCM_NAV_ITEMS.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition sm:text-sm",
              isActive
                ? "bg-brand-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-brand-50 hover:text-brand-800",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
