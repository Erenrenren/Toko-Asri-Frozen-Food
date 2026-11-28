import { requireApiUser } from "@/lib/api/auth";
import { handleApiError, ok } from "@/lib/api/response";
import { getScmOverview } from "@/lib/services/scm/overview.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireApiUser(["admin", "staff"]);
    const overview = await getScmOverview();
    return ok(overview);
  } catch (error) {
    return handleApiError(error);
  }
}
