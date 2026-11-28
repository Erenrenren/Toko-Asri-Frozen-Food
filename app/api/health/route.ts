import { ok } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET() {
  return ok({
    status: "ok",
    app: "Toko Asri Frozen Food",
    stage: 2,
    timestamp: new Date().toISOString(),
  });
}
