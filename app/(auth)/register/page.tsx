import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Daftar",
  description: "Buat akun pelanggan Toko Asri Frozen Food.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
