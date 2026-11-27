"use client";

import { Loader2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { ROLES, ROLE_LABELS } from "@/lib/constants";
import type { ApiResponse } from "@/types/api";
import type { Role, UserDTO } from "@/types/domain";

interface UserRoleEditorProps {
  user: Pick<UserDTO, "id" | "name" | "role" | "isActive">;
  currentUserId: string;
}

export function UserRoleEditor({ user, currentUserId }: UserRoleEditorProps) {
  const router = useRouter();
  const [role, setRole] = useState<Role>(user.role);
  const [isActive, setIsActive] = useState(user.isActive);
  const [loading, setLoading] = useState(false);
  const isSelf = user.id === currentUserId;

  async function patch(body: { role?: Role; isActive?: boolean }) {
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as ApiResponse<UserDTO>;

      if (!response.ok || !payload.success) {
        window.alert(
          payload.success ? "Gagal memperbarui akun." : payload.error.message,
        );
        setRole(user.role);
        setIsActive(user.isActive);
        return;
      }

      router.refresh();
    } catch {
      window.alert("Tidak dapat menghubungi server.");
      setRole(user.role);
      setIsActive(user.isActive);
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(nextRole: Role) {
    if (nextRole === role) return;
    setRole(nextRole);
    await patch({ role: nextRole });
  }

  async function handleToggleActive() {
    if (
      isActive &&
      !window.confirm(`Nonaktifkan akun ${user.name}? Pengguna tidak bisa login.`)
    ) {
      return;
    }
    const next = !isActive;
    setIsActive(next);
    await patch({ isActive: next });
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
      <Select
        value={role}
        onChange={(event) => handleRoleChange(event.target.value as Role)}
        disabled={isSelf || loading}
        className="h-8 w-[150px] rounded-lg px-2 py-1 text-xs"
        aria-label={`Peran ${user.name}`}
      >
        {ROLES.map((item) => (
          <option key={item} value={item}>
            {ROLE_LABELS[item]}
          </option>
        ))}
      </Select>

      <button
        type="button"
        onClick={handleToggleActive}
        disabled={isSelf || loading}
        title={
          isSelf
            ? "Tidak dapat menonaktifkan akun sendiri"
            : isActive
              ? "Nonaktifkan akun"
              : "Aktifkan akun"
        }
        className="disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Badge tone={isActive ? "green" : "slate"}>
          {isActive ? "Aktif" : "Nonaktif"}
        </Badge>
      </button>

      {isSelf && (
        <span title="Akun Anda" className="text-brand-500">
          <ShieldCheck className="h-4 w-4" />
        </span>
      )}
    </div>
  );
}
