import { z } from "zod";
import { handleError, ok } from "@/lib/http";
import { addMaintenanceEntry, UserError } from "@/lib/services/reports";

const Body = z.object({ date: z.string().max(10), mileage: z.union([z.string(), z.number()]).optional(), label: z.string().max(160), cost: z.union([z.string(), z.number()]).optional(), kind: z.enum(["invoice", "inspection", "recall", "note"]).optional() });

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = Body.safeParse(await req.json().catch(() => ({})));
    if (!body.success) throw new UserError("Saisie invalide.");
    await addMaintenanceEntry(id, body.data);
    return ok({ ok: true });
  } catch (e) { return handleError(e); }
}
