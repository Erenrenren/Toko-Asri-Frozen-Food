import { ok } from "@/lib/api/response";
import { getSessionCookieOptions } from "@/lib/auth/session";
import { SESSION_COOKIE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = ok({ loggedOut: true }, undefined, "Logout berhasil.");
  response.cookies.set(SESSION_COOKIE, "", {
    ...getSessionCookieOptions(),
    maxAge: 0,
  });
  return response;
}
