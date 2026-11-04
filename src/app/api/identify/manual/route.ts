import { z } from "zod";
import { customAlphabet } from "nanoid";
import { clientIp, handleError, ok, rateLimit } from "@/lib/http";
import { UserError } from "@/lib/services/reports";
import { getDb, schema } from "@/lib/db";
import { parseDate, parsePlate } from "@/lib/engine/identifiers";
import type { Vehicle } from "@/lib/engine/types";

const nanoid = customAlphabet("0123456789abcdefghijkmnpqrstuvwxyz", 14);

const Body = z.object({
  make: z.string().min(2).max(40),
  model: z.string().min(1).max(60),
  version: z.string().max(80).optional(),
  fuel: z.enum(["diesel", "essence", "hybride", "hybride_rechargeable", "electrique", "gpl", "autre"]),
  gearbox: z.enum(["manuelle", "automatique", "inconnue"]),
  firstRegistration: z.string().max(10),
  powerHp: z.union([z.string(), z.number()]).optional(),
  plate: z.string().max(12).optional(),
  country: z.string().length(2).optional(),
});

/** Saisie manuelle du véhicule (quand la plaque n'est pas reconnue, ou pour un véhicule étranger). */
export async function POST(req: Request) {
  try {
    if (!rateLimit(`identify:${clientIp(req)}`, 30)) throw new UserError("Trop de tentatives. Patientez une minute.", 429);
    const body = Body.safeParse(await req.json().catch(() => ({})));
    if (!body.success) throw new UserError("Saisie invalide : vérifiez marque, modèle, énergie et date.");
    const d = body.data;
    const date = parseDate(d.firstRegistration);
    if (!date) throw new UserError("Date de première immatriculation invalide (JJ/MM/AAAA).");
    const plate = d.plate ? parsePlate(d.plate, d.country ?? "FR") : null;
    const country = plate?.country ?? (d.country ?? "FR").toUpperCase();
    const hp = d.powerHp !== undefined && d.powerHp !== "" ? Number(String(d.powerHp).replace(/[^\d]/g, "")) : undefined;
    const vehicle: Vehicle = {
      make: d.make.trim(), model: d.model.trim(), version: d.version?.trim() || undefined,
      plate: plate?.normalized, country, firstRegistration: date, fuel: d.fuel, gearbox: d.gearbox,
      powerHp: hp && hp > 0 && hp < 2000 ? hp : undefined, category: "voiture", imported: false,
    };
    const db = await getDb();
    const id = nanoid();
    await db.insert(schema.reports).values({ id, shareToken: nanoid(), status: "identified", inputKind: plate ? "plate" : "vin", inputValue: plate?.normalized ?? `MANUEL-${id}`, country, vehicle });
    return ok({ reportId: id, vehicle });
  } catch (e) { return handleError(e); }
}
