"use client";

import {
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ReceiptText,
  ShieldCheck,
  Snowflake,
  Truck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NAV_ITEMS, ROLE_LABELS } from "@/lib/constants";
import { cn, getInitials } from "@/lib/format";
import type { Role } from "@/types/domain";

const iconMap: Record<string, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  package: Package,
  receipt: ReceiptText,
  truck: Truck,
  users: Users,
  "credit-card": CreditCard,
  shield: ShieldCheck,
};

interface DashboardShellProps {
  user: {
    name: string;
    email: string;
    role: Role;
  };
  children: ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const allowedItems = NAV_ITEMS.filter((item) =>
    (item.roles as readonly Role[]).includes(user.role),
  );

  const activeItem = allowedItems.find((item) =>
    item.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(item.href),
  );

  const erpItems = allowedItems.filter((item) =>
    ["Dashboard", "Produk", "Transaksi"].includes(item.label),
  );
  const moduleItems = allowedItems.filter((item) =>
    ["SCM", "CRM", "Pembayaran"].includes(item.label),
  );
  const adminItems = allowedItems.filter((item) => item.label === "Pengguna");

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  function renderNav(items: typeof allowedItems) {
    return items.map((item) => {
      const Icon = iconMap[item.icon] ?? Package;
      const isActive =
        item.href === "/dashboard"
          ? pathname === "/dashboard"
          : pathname.startsWith(item.href);

      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setSidebarOpen(false)}
          className={cn(
            "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
            isActive
              ? "bg-white/10 text-white shadow-inner ring-1 ring-white/10"
              : "text-slate-300 hover:bg-white/5 hover:text-white",
          )}
        >
          <Icon
            className={cn(
              "h-[18px] w-[18px] shrink-0",
              isActive ? "text-brand-300" : "text-slate-400 group-hover:text-brand-300",
            )}
          />
          <span className="flex-1">{item.label}</span>
          {isActive && <ChevronRight className="h-4 w-4 text-brand-300" />}
        </Link>
      );
    });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Tutup menu"
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-navy-950 text-white transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
          <Logo variant="light" />
          <button
            type="button"
            className="rounded-lg p-2 text-slate-300 hover:bg-white/10 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Tutup sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="subtle-scrollbar flex-1 space-y-6 overflow-y-auto px-4 py-5">
          <div>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              ERP Inti
            </p>
            <div className="space-y-1">{renderNav(erpItems)}</div>
          </div>

          <div>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Modul Lanjutan
            </p>
            <div className="space-y-1">{renderNav(moduleItems)}</div>
          </div>

          {adminItems.length > 0 && (
            <div>
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Administrasi
              </p>
              <div className="space-y-1">{renderNav(adminItems)}</div>
            </div>
          )}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
            <div className="flex items-center gap-2">
              <Snowflake className="h-4 w-4 text-brand-300" />
              <p className="text-xs font-semibold text-white">Tahap 1 · Fondasi ERP</p>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
              Auth, katalog produk, jurnal kas, dan dashboard siap dikembangkan ke
              SCM, CRM, serta pembayaran.
            </p>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/85 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Buka sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Toko Asri Frozen Food
            </p>
            <p className="truncate text-sm font-semibold text-slate-800">
              {activeItem?.label ?? "Dashboard"}
            </p>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <Badge tone={user.role === "admin" ? "violet" : "brand"}>
              {ROLE_LABELS[user.role]}
            </Badge>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-200 pl-2 sm:pl-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white">
              {getInitials(user.name)}
            </div>
            <div className="hidden leading-tight md:block">
              <p className="max-w-[140px] truncate text-xs font-semibold text-slate-800">
                {user.name}
              </p>
              <p className="max-w-[140px] truncate text-[11px] text-slate-500">
                {user.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="ml-1 px-2"
              onClick={handleLogout}
              disabled={loggingOut}
              aria-label="Keluar"
              title="Keluar"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
