"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

interface LogoutButtonProps {
  className?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "accent";
  label?: string;
}

export function LogoutButton({
  className,
  variant = "outline",
  label = "Keluar",
}: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant={variant}
      size="sm"
      className={className}
      onClick={handleLogout}
      disabled={loading}
    >
      {loading ? "Keluar..." : label}
    </Button>
  );
}
