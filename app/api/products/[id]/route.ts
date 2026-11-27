import { requireApiUser } from "@/lib/api/auth";
import { handleApiError, ok, readJson } from "@/lib/api/response";
import {
  deactivateProduct,
  getProductById,
  updateProduct,
} from "@/lib/services/product.service";
import { productUpdateSchema } from "@/lib/validators/product";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireApiUser(["admin", "staff"]);
    const { id } = await context.params;
    const product = await getProductById(id);
    return ok(product);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireApiUser(["admin", "staff"]);
    const { id } = await context.params;
    const body = productUpdateSchema.parse(await readJson(request));
    const product = await updateProduct(id, body);
    return ok(product, undefined, "Produk berhasil diperbarui.");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireApiUser(["admin", "staff"]);
    const { id } = await context.params;
    const product = await deactivateProduct(id);
    return ok(product, undefined, "Produk berhasil dinonaktifkan.");
  } catch (error) {
    return handleApiError(error);
  }
}
