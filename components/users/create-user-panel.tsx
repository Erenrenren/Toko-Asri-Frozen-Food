"use client";

import { Loader2, Plus, UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ROLES, ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/lib/constants";
import type { ApiResponse } from "@/types/api";
import type { Role, UserDTO } from "@/types/domain";

function extractErrorMessage(payload: ApiResponse<unknown>): string {
  if (payload.success) return "Terjadi kesalahan. Silakan coba lagi.";
  const details = payload.error.details;
  if (details && typeof details === "object" && "fieldErrors" in details) {
    const fieldErrors = (details as { fieldErrors?: Record<string, string[]> })
      .fieldErrors;
    if (fieldErrors) {
      for (const messages of Object.values(fieldErrors)) {
        if (messages.length > 0) return messages[0];
      }
    }
  }
  return payload.error.message;
}

export function CreateUserPanel() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "staff" as Role,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          password: form.password,
          role: form.role,
        }),
      });
      const payload = (await response.json()) as ApiResponse<UserDTO>;

      if (!response.ok || !payload.success) {
        setError(extractErrorMessage(payload));
        return;
      }

      setForm({ name: "", email: "", phone: "", password: "", role: "staff" });
      setOpen(false);
      router.refresh();
    } catch {
      setError("Tidak dapat menghubungi server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button onClick={() => setOpen((current) => !current)}>
        {open ? (
          <>
            <X className="h-4 w-4" /> Tutup form
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" /> Tambah akun
          </>
        )}
      </Button>

      {open && (
        <div className="mt-4 rounded-2xl border border-brand-100 bg-brand-50/40 p-5">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-100 text-brand-700">
              <UserPlus className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Buat akun pengguna baru
              </p>
              <p className="text-xs text-slate-500">
                Admin dapat membuat akun staff atau customer tanpa registrasi publik.
              </p>
            </div>
          </div>

          {error && (
            <Alert tone="danger" className="mt-4">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="new-name" className="label-base">
                Nama lengkap
              </label>
              <Input
                id="new-name"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Nama pengguna"
                required
              />
            </div>
            <div>
              <label htmlFor="new-email" className="label-base">
                Email
              </label>
              <Input
                id="new-email"
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="nama@tokosasri.id"
                required
              />
            </div>
            <div>
              <label htmlFor="new-phone" className="label-base">
                No. telepon (opsional)
              </label>
              <Input
                id="new-phone"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="0812xxxxxxx"
              />
            </div>
            <div>
              <label htmlFor="new-password" className="label-base">
                Password awal
              </label>
              <Input
                id="new-password"
                type="password"
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                placeholder="Min. 8 karakter, huruf & angka"
                required
              />
            </div>
            <div>
              <label htmlFor="new-role" className="label-base">
                Peran
              </label>
              <Select
                id="new-role"
                value={form.role}
                onChange={(event) => updateField("role", event.target.value)}
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </Select>
              <p className="mt-1 text-[11px] text-slate-500">
                {ROLE_DESCRIPTIONS[form.role]}
              </p>
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Membuat...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" /> Buat akun
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
