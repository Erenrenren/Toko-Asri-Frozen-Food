import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { signSessionToken, verifySessionToken, type SessionPayload } from "@/lib/auth/jwt";
import { defaultRouteForRole } from "@/lib/auth/rbac";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/constants";
import type { Role, UserDTO } from "@/types/domain";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  isActive: boolean;
  createdAt: Date;
}

function isLocalAppUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const hostname = new URL(value).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

export function getSessionCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  const isLocal = isLocalAppUrl(process.env.NEXT_PUBLIC_APP_URL);

  return {
    httpOnly: true,
    sameSite: "lax" as const,
    // Tetap Secure di production, tetapi izinkan `npm start` lokal via http.
    secure: isProduction && !isLocal,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export async function createSessionToken(user: {
  id: string;
  name: string;
  email: string;
  role: Role;
}): Promise<string> {
  return signSessionToken({
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Mengambil user terbaru dari database. Ini memastikan perubahan role atau
 * penonaktifan akun langsung berlaku tanpa menunggu token kedaluwarsa.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!user || !user.isActive) return null;

  return {
    ...user,
    role: user.role as Role,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireRole(allowed: readonly Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!allowed.includes(user.role)) {
    redirect(defaultRouteForRole(user.role));
  }
  return user;
}

export function toUserDTO(user: SessionUser): UserDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
  };
}
