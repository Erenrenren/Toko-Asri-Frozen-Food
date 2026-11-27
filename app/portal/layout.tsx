import type { ReactNode } from "react";

import { PortalHeader } from "@/components/layout/portal-header";
import { requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const user = await requireRole(["customer"]);

  return (
    <div className="min-h-screen bg-slate-50">
      <PortalHeader user={user} />
      <main className="container-page py-8 lg:py-10">{children}</main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-6 text-center text-xs text-slate-500 sm:flex-row sm:text-left">
          <p>
            © {new Date().getFullYear()} Toko Asri Frozen Food · Portal pelanggan.
          </p>
          <p>Pesanan & pembayaran online tersedia pada Tahap 4.</p>
        </div>
      </footer>
    </div>
  );
}
