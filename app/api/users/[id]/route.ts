import { requireApiUser } from "@/lib/api/auth";
import { handleApiError, ok, readJson } from "@/lib/api/response";
import { updateUser } from "@/lib/services/user.service";
import { updateUserSchema } from "@/lib/validators/user";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const actor = await requireApiUser(["admin"]);
    const { id } = await context.params;
    const body = updateUserSchema.parse(await readJson(request));
    const user = await updateUser(id, body, actor);
    return ok(user, undefined, "Akun berhasil diperbarui.");
  } catch (error) {
    return handleApiError(error);
  }
}
