import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";

import { SESSION_MAX_AGE_SECONDS } from "@/lib/constants";
import { isRole } from "@/lib/auth/rbac";
import type { Role } from "@/types/domain";

export interface SessionPayload {
  sub: string;
  name: string;
  email: string;
  role: Role;
}

const DEV_FALLBACK_SECRET =
  "toko-asri-development-secret-change-me-32-characters";

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV !== "production") {
      return new TextEncoder().encode(DEV_FALLBACK_SECRET);
    }
    throw new Error(
      "AUTH_SECRET belum diset atau kurang dari 32 karakter. Periksa file .env.",
    );
  }

  return new TextEncoder().encode(secret);
}

export async function signSessionToken(
  payload: SessionPayload,
): Promise<string> {
  return new SignJWT({
    name: payload.name,
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });

    if (
      typeof payload.sub !== "string" ||
      typeof payload.name !== "string" ||
      typeof payload.email !== "string" ||
      !isRole(payload.role)
    ) {
      return null;
    }

    return {
      sub: payload.sub,
      name: payload.name,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
}
