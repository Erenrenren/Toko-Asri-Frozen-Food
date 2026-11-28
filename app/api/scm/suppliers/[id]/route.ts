import { requireApiUser } from "@/lib/api/auth";
import { handleApiError, ok, readJson } from "@/lib/api/response";
import {
  getSupplierById,
  updateSupplier,
} from "@/lib/services/scm/supplier.service";
import { supplierUpdateSchema } from "@/lib/validators/scm";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireApiUser(["admin", "staff"]);
    const { id } = await params;
    const supplier = await getSupplierById(id);
    return ok(supplier);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireApiUser(["admin", "staff"]);
    const { id } = await params;
    const body = supplierUpdateSchema.parse(await readJson(request));
    const supplier = await updateSupplier(id, body);
    return ok(supplier, undefined, `Supplier ${supplier.name} berhasil diperbarui.`);
  } catch (error) {
    return handleApiError(error);
  }
}
