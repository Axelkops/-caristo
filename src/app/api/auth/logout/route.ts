import { handleError, ok } from "@/lib/http";
import { logout } from "@/lib/services/auth";

export async function POST() {
  try { await logout(); return ok({ done: true }); } catch (e) { return handleError(e); }
}
