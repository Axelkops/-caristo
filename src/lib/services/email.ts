import type { Vehicle } from "../engine/types";

import { siteUrl } from "./payments";

/** Envoie un e-mail texte via Resend. Sans clé configurée, l'e-mail est affiché dans les journaux. Retourne true si réellement envoyé. */
export async function sendEmail(args: { to: string; subject: string; text: string }): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) { console.log(`[email → ${args.to}] ${args.subject}\n${args.text}`); return false; }
  const { Resend } = await import("resend");
  const resend = new Resend(key);
  const res = await resend.emails.send({ from: process.env.EMAIL_FROM ?? "Caristo <onboarding@resend.dev>", to: args.to, subject: args.subject, text: args.text });
  if (res.error) throw new Error(`Envoi e-mail impossible : ${res.error.message}`);
  return true;
}

export async function sendReportReadyEmail(args: { to: string; reportId: string; shareToken: string; reference: string; vehicle: Vehicle; packRemaining?: number }): Promise<void> {
  const link = `${siteUrl()}/rapport/${args.reportId}`;
  const share = `${siteUrl()}/r/${args.shareToken}`;
  const subject = `Votre rapport Caristo ${args.reference} est prêt`;
  const lines = [
    `Bonjour,`,
    ``,
    `Votre rapport pour ${args.vehicle.make} ${args.vehicle.model}${args.vehicle.plate ? ` (${args.vehicle.plate})` : ""} est prêt.`,
    `Consulter le rapport : ${link}`,
    `Lien de partage (valable 12 mois) : ${share}`,
    ``,
    `Retrouvez tous vos rapports à tout moment dans votre espace : ${siteUrl()}/mes-rapports (connexion par code envoyé à cette adresse, sans mot de passe).`,
  ];
  if (args.packRemaining !== undefined) lines.push(``, `Votre pack : ${args.packRemaining} rapport${args.packRemaining > 1 ? "s" : ""} restant${args.packRemaining > 1 ? "s" : ""}. Connectez-vous à votre espace avant de lancer le prochain rapport : le crédit sera utilisé automatiquement.`);
  lines.push(``, `Caristo · Édité par Digikom Group`);
  await sendEmail({ to: args.to, subject, text: lines.join("\n") });
}

export async function sendLoginCodeEmail(args: { to: string; code: string }): Promise<boolean> {
  const text = [
    `Bonjour,`,
    ``,
    `Votre code de connexion Caristo : ${args.code}`,
    ``,
    `Il est valable 10 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.`,
    ``,
    `Caristo · Édité par Digikom Group`,
  ].join("\n");
  return sendEmail({ to: args.to, subject: `${args.code} est votre code de connexion Caristo`, text });
}
