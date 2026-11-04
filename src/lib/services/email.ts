import type { Vehicle } from "../engine/types";

import { siteUrl } from "./payments";

export async function sendReportReadyEmail(args: { to: string; reportId: string; shareToken: string; reference: string; vehicle: Vehicle; packCode?: string; packCredits?: number }): Promise<void> {
  const link = `${siteUrl()}/rapport/${args.reportId}`;
  const share = `${siteUrl()}/r/${args.shareToken}`;
  const subject = `Votre rapport Caristo ${args.reference} est prêt`;
  const lines = [
    `Bonjour,`,
    ``,
    `Votre rapport pour ${args.vehicle.make} ${args.vehicle.model}${args.vehicle.plate ? ` (${args.vehicle.plate})` : ""} est prêt.`,
    `Consulter le rapport : ${link}`,
    `Lien de partage (valable 12 mois) : ${share}`,
  ];
  if (args.packCode) lines.push(``, `Votre code de pack : ${args.packCode} (${args.packCredits ?? 0} rapport(s) restant(s)). Saisissez-le lors de votre prochain rapport pour ne pas repayer.`);
  lines.push(``, `Caristo · Édité par Digikom Group`);
  const text = lines.join("\n");
  const key = process.env.RESEND_API_KEY;
  if (!key) { console.log(`[email → ${args.to}] ${subject}\n${text}`); return; }
  const { Resend } = await import("resend");
  const resend = new Resend(key);
  await resend.emails.send({ from: process.env.EMAIL_FROM ?? "Caristo <onboarding@resend.dev>", to: args.to, subject, text });
}
