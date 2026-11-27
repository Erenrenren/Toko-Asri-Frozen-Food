import { readJson, created, handleApiError } from "@/lib/api/response";
import {
  createSessionToken,
  getSessionCookieOptions,
} from "@/lib/auth/session";
import { SESSION_COOKIE } from "@/lib/constants";
import { registerCustomer } from "@/lib/services/user.service";
import { registerSchema } from "@/lib/validators/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = registerSchema.parse(await readJson(request));
    const user = await registerCustomer(body);
    const token = await createSessionToken(user);

    const response = created(user, "Registrasi berhasil. Selamat datang!");
    response.cookies.set(SESSION_COOKIE, token, getSessionCookieOptions());
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
