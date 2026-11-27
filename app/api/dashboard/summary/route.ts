import { requireApiUser } from "@/lib/api/auth";
import { handleApiError, ok } from "@/lib/api/response";
import { getDashboardSummary } from "@/lib/services/dashboard.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireApiUser(["admin", "staff"]);
    const summary = await getDashboardSummary();
    return ok(summary);
  } catch (error) {
    return handleApiError(error);
  }
}
