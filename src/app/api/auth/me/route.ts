import { handleError, ok } from "@/lib/http";
import { getSessionEmail } from "@/lib/services/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try { return ok({ email: await getSessionEmail() }, { headers: { "Cache-Control": "private, no-store" } }); } catch (e) { return handleError(e); }
}
