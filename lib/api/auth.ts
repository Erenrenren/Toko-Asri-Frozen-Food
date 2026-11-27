import { forbidden, unauthorized } from "@/lib/api/errors";
import { getCurrentUser, type SessionUser } from "@/lib/auth/session";
import type { Role } from "@/types/domain";

export async function requireApiUser(
  allowedRoles?: readonly Role[],
): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw unauthorized("Sesi tidak valid atau sudah berakhir. Silakan login.");
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw forbidden("Peran Anda tidak memiliki akses ke resource ini.");
  }

  return user;
}
