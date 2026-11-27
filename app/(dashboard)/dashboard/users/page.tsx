import { RotateCcw, Search, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";

import { CreateUserPanel } from "@/components/users/create-user-panel";
import { UserRoleEditor } from "@/components/users/user-role-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { requireRole } from "@/lib/auth/session";
import { ROLES, ROLE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { listUsers } from "@/lib/services/user.service";
import type { Role } from "@/types/domain";

export const dynamic = "force-dynamic";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const currentUser = await requireRole(["admin"]);
  const params = await searchParams;

  const rawSearch = typeof params.search === "string" ? params.search : undefined;
  const rawRole = typeof params.role === "string" ? params.role : undefined;
  const rawStatus = typeof params.status === "string" ? params.status : "all";
  const rawPage = typeof params.page === "string" ? Number(params.page) : 1;

  const role = (ROLES as readonly string[]).includes(rawRole ?? "")
    ? (rawRole as Role)
    : undefined;
  const status = ["active", "inactive", "all"].includes(rawStatus)
    ? (rawStatus as "active" | "inactive" | "all")
    : "all";
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;

  const result = await listUsers({
    search: rawSearch,
    role,
    status,
    page,
    pageSize: 10,
    skip: (page - 1) * 10,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administrasi"
        title="Pengguna & peran"
        description="Kelola akun admin, staff, dan pelanggan. Perubahan peran langsung berlaku pada permintaan berikutnya."
        action={<CreateUserPanel />}
      />

      <Card>
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <form
            action="/dashboard/users"
            method="get"
            className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_auto]"
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                name="search"
                placeholder="Cari nama atau email..."
                defaultValue={rawSearch}
                className="pl-9"
                aria-label="Cari pengguna"
              />
            </div>
            <Select name="role" defaultValue={role ?? ""} aria-label="Filter peran">
              <option value="">Semua peran</option>
              {ROLES.map((item) => (
                <option key={item} value={item}>
                  {ROLE_LABELS[item]}
                </option>
              ))}
            </Select>
            <Select
              name="status"
              defaultValue={status}
              aria-label="Filter status"
            >
              <option value="all">Semua status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </Select>
            <div className="flex items-center gap-2">
              <Button type="submit" variant="secondary" className="flex-1">
                Terapkan
              </Button>
              <Link
                href="/dashboard/users"
                className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                title="Reset filter"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Link>
            </div>
          </form>
        </div>

        {result.items.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Pengguna tidak ditemukan"
            description="Ubah filter atau buat akun pengguna baru."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Pengguna</th>
                  <th>Peran & status</th>
                  <th>Terdaftar</th>
                  <th className="text-right">Kelola</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white">
                          {user.name
                            .split(" ")
                            .slice(0, 2)
                            .map((part) => part[0])
                            .join("")
                            .toUpperCase()}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {user.name}
                            {user.id === currentUser.id && (
                              <Badge tone="brand" className="ml-2">
                                Anda
                              </Badge>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {user.email}
                            {user.phone ? ` · ${user.phone}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Badge
                          tone={
                            user.role === "admin"
                              ? "violet"
                              : user.role === "staff"
                                ? "brand"
                                : "slate"
                          }
                        >
                          {ROLE_LABELS[user.role]}
                        </Badge>
                        <Badge tone={user.isActive ? "green" : "rose"}>
                          {user.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </div>
                    </td>
                    <td className="whitespace-nowrap text-xs text-slate-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td>
                      <UserRoleEditor user={user} currentUserId={currentUser.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          meta={result.meta}
          basePath="/dashboard/users"
          query={{ search: rawSearch, role, status }}
        />
      </Card>

      <div className="flex items-start gap-2 rounded-xl border border-violet-100 bg-violet-50/60 px-4 py-3 text-xs text-violet-900">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Sistem mencegah admin menonaktifkan atau menurunkan peran akun sendiri,
          serta memastikan selalu ada minimal satu admin aktif.
        </p>
      </div>
    </div>
  );
}
