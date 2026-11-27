import { badRequest } from "@/lib/api/errors";
import { requireApiUser } from "@/lib/api/auth";
import { readPagination, readString } from "@/lib/api/query";
import { created, handleApiError, ok, readJson } from "@/lib/api/response";
import { createUser, listUsers } from "@/lib/services/user.service";
import { ROLES } from "@/types/domain";
import type { Role } from "@/types/domain";
import { createUserSchema } from "@/lib/validators/user";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireApiUser(["admin"]);
    const { searchParams } = new URL(request.url);
    const { page, pageSize, skip } = readPagination(searchParams);

    const roleRaw = readString(searchParams, "role");
    if (roleRaw && !(ROLES as readonly string[]).includes(roleRaw)) {
      throw badRequest("Filter peran tidak valid.");
    }

    const statusRaw = readString(searchParams, "status");
    if (statusRaw && !["active", "inactive", "all"].includes(statusRaw)) {
      throw badRequest("Filter status tidak valid.");
    }

    const result = await listUsers({
      search: readString(searchParams, "search"),
      role: roleRaw as Role | undefined,
      status: (statusRaw as "active" | "inactive" | "all" | undefined) ?? "all",
      page,
      pageSize,
      skip,
    });

    return ok(result.items, result.meta);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireApiUser(["admin"]);
    const body = createUserSchema.parse(await readJson(request));
    const user = await createUser(body);
    return created(user, `Akun ${user.name} berhasil dibuat.`);
  } catch (error) {
    return handleApiError(error);
  }
}
