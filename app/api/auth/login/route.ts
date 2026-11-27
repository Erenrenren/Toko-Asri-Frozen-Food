import { readJson, handleApiError, ok } from "@/lib/api/response";
import {
  createSessionToken,
  getSessionCookieOptions,
} from "@/lib/auth/session";
import { SESSION_COOKIE } from "@/lib/constants";
import { authenticateUser } from "@/lib/services/user.service";
import { loginSchema } from "@/lib/validators/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = loginSchema.parse(await readJson(request));
    const user = await authenticateUser(body.email, body.password);
    const token = await createSessionToken(user);

    const response = ok(user, undefined, "Login berhasil.");
    response.cookies.set(SESSION_COOKIE, token, getSessionCookieOptions());
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
