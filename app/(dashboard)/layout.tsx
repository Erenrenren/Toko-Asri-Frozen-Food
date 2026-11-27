import type { ReactNode } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireRole(["admin", "staff"]);

  return (
    <DashboardShell
      user={{ name: user.name, email: user.email, role: user.role }}
    >
      {children}
    </DashboardShell>
  );
}
