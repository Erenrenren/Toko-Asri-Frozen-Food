import { Snowflake } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { LogoutButton } from "@/components/layout/logout-button";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/constants";
import { getInitials } from "@/lib/format";
import type { SessionUser } from "@/lib/auth/session";

interface PortalHeaderProps {
  user: SessionUser;
}

export function PortalHeader({ user }: PortalHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/portal" aria-label="Portal pelanggan Toko Asri">
          <Logo />
        </Link>

        <div className="flex items-center gap-3">
          <Badge tone="brand" className="hidden sm:inline-flex">
            {ROLE_LABELS[user.role]}
          </Badge>
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white">
              {getInitials(user.name)}
            </div>
            <div className="hidden leading-tight sm:block">
              <p className="max-w-[160px] truncate text-xs font-semibold text-slate-800">
                {user.name}
              </p>
              <p className="max-w-[160px] truncate text-[11px] text-slate-500">
                {user.email}
              </p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </div>
      <div className="border-t border-brand-100 bg-brand-50/60">
        <div className="container-page flex items-center gap-2 py-1.5 text-[11px] font-medium text-brand-800">
          <Snowflake className="h-3.5 w-3.5" />
          Portal pelanggan · katalog frozen food Toko Asri
        </div>
      </div>
    </header>
  );
}
