import { requireApiUser } from "@/lib/api/auth";
import { badRequest } from "@/lib/api/errors";
import { readPagination, readString } from "@/lib/api/query";
import { created, handleApiError, ok, readJson } from "@/lib/api/response";
import { createSupplier, listSuppliers } from "@/lib/services/scm/supplier.service";
import { supplierCreateSchema } from "@/lib/validators/scm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireApiUser(["admin", "staff"]);
    const { searchParams } = new URL(request.url);
    const { page, pageSize, skip } = readPagination(searchParams);

    const statusRaw = readString(searchParams, "status") ?? "all";
    if (!["active", "inactive", "all"].includes(statusRaw)) {
      throw badRequest("Filter status supplier tidak valid.");
    }

    const result = await listSuppliers({
      search: readString(searchParams, "search"),
      status: statusRaw as "active" | "inactive" | "all",
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
    await requireApiUser(["admin", "staff"]);
    const body = supplierCreateSchema.parse(await readJson(request));
    const supplier = await createSupplier(body);
    return created(supplier, `Supplier ${supplier.name} berhasil ditambahkan.`);
  } catch (error) {
    return handleApiError(error);
  }
}
