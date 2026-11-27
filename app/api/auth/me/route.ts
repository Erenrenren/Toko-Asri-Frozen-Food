import { requireApiUser } from "@/lib/api/auth";
import { handleApiError, ok } from "@/lib/api/response";
import { toUserDTO } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireApiUser();
    return ok(toUserDTO(user));
  } catch (error) {
    return handleApiError(error);
  }
}
