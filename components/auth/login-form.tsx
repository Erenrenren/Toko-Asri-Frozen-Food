"use client";

import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { defaultRouteForRole } from "@/lib/auth/rbac";
import type { ApiResponse } from "@/types/api";
import type { UserDTO } from "@/types/domain";

interface LoginFormProps {
  nextPath?: string;
}

export function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const payload = (await response.json()) as ApiResponse<UserDTO>;

      if (!response.ok || !payload.success) {
        setError(
          payload.success
            ? "Login gagal. Silakan coba lagi."
            : payload.error.message,
        );
        return;
      }

      const destination =
        nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
          ? nextPath
          : defaultRouteForRole(payload.data.role);

      router.replace(destination);
      router.refresh();
    } catch {
      setError("Tidak dapat menghubungi server. Periksa koneksi Anda.");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(demoEmail: string, demoPassword: string) {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError(null);
  }

  return (
    <div>
      <div className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
          Masuk ke akun
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Selamat datang kembali
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Kelola katalog, transaksi, dan operasional Toko Asri Frozen Food dari
          satu dashboard.
        </p>
      </div>

      {error && (
        <Alert tone="danger" className="mb-5">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="label-base">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="nama@tokosasri.id"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="mb-0 block text-sm font-medium text-slate-700">
              Password
            </label>
            <span className="text-xs text-slate-400">Min. 8 karakter</span>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Masukkan password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="pr-11"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-400 hover:text-slate-700"
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Memproses...
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" /> Masuk
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-4">
        <p className="text-xs font-semibold text-slate-700">Akun demo Tahap 1</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fillDemo("admin@tokosasri.id", "Admin123!")}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => fillDemo("staff@tokosasri.id", "Staff123!")}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
          >
            Staff
          </button>
          <button
            type="button"
            onClick={() => fillDemo("pelanggan@tokosasri.id", "Customer123!")}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
          >
            Pelanggan
          </button>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
          Klik salah satu peran untuk mengisi kredensial demo secara otomatis.
        </p>
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        Belum punya akun?{" "}
        <Link
          href="/register"
          className="font-semibold text-brand-700 hover:text-brand-800 hover:underline"
        >
          Daftar sebagai pelanggan
        </Link>
      </p>
    </div>
  );
}
