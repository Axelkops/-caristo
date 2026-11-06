import { z } from "zod";
import { handleError, ok } from "@/lib/http";
import { saveDetails, UserError } from "@/lib/services/reports";
import { createCheckout } from "@/lib/services/payments";
import { getSessionEmail } from "@/lib/services/auth";

const Body = z.object({
  mileage: z.union([z.string(), z.number()]),
  holderName: z.string().max(120).optional(),
  formulaNumber: z.string().max(20).optional(),
  firstRegDate: z.string().max(10).optional(),
  listingUrl: z.string().max(500).optional(),
  listingPrice: z.union([z.string().max(20), z.number()]).optional(),
  email: z.string().max(200),
  offer: z.enum(["single", "pack3", "pack10"]),
  packCode: z.string().max(20).optional(),
  useAccountPack: z.boolean().optional(),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = Body.safeParse(await req.json().catch(() => ({})));
    if (!body.success) throw new UserError("Saisie invalide : " + body.error.issues.map((i) => i.path.join(".")).join(", "));
    const r = await saveDetails(id, body.data, body.data.useAccountPack ? await getSessionEmail() : null);
    if (!r.needsPayment) return ok({ next: `/rapport/${id}` });
    const origin = req.headers.get("origin") ?? new URL(req.url).origin;
    const checkout = await createCheckout(id, body.data.offer, body.data.email, origin);
    return ok({ next: checkout.url });
  } catch (e) { return handleError(e); }
}
