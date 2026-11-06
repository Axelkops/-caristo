import type { ListingAnalysis, Vehicle } from "../engine/types";
import type { ListingProvider } from "./index";
import { estimateValuation } from "../engine/valuation";

/**
 * Analyse d'annonce réelle : récupère la page, extrait prix, kilométrage et affirmations clés.
 * Fonctionne sans IA (règles), et s'enrichit avec l'API Anthropic si ANTHROPIC_API_KEY est définie.
 * Si la page est inaccessible (blocage anti-robot), on le dit au lieu d'inventer.
 */
export function extractFromText(text: string): { price?: number; mileage?: number; flags: string[] } {
  const t = text.replace(/\s+/g, " ");
  const price = firstNumber(t, /(?<![\d])(\d{1,3}(?:[ \u00a0.]\d{3})+|\d{4,6})\s*(?:€|euros?)/gi, 500, 500000);
  const mileage = firstNumber(t, /(?<![\d])(\d{1,3}(?:[ \u00a0.]\d{3})+|\d{4,7})\s*km\b/gi, 100, 1500000);
  const flags: string[] = [];
  const low = t.toLowerCase();
  for (const f of ["jamais accident", "non accident", "première main", "premiere main", "non fumeur", "carnet d'entretien", "import", "garantie", "ct ok", "contrôle technique ok", "révision", "distribution faite", "distribution neuve", "embrayage neuf", "pneus neufs", "urgent", "cause départ", "sans contrôle technique", "pour pièces", "moteur hs", "boîte hs", "véhicule accidenté", "accidentée"]) {
    if (low.includes(f)) flags.push(f);
  }
  return { price, mileage, flags };
}

function firstNumber(t: string, re: RegExp, min: number, max: number): number | undefined {
  for (const m of t.matchAll(re)) {
    const n = Number(m[1].replace(/[\s\u00a0.]/g, ""));
    if (n >= min && n <= max) return n;
  }
  return undefined;
}

export function buildClaims(ex: { price?: number; mileage?: number; flags: string[] }, vehicle: Vehicle, mileage?: number): ListingAnalysis["claims"] {
  const claims: ListingAnalysis["claims"] = [];
  const val = estimateValuation(vehicle, mileage ?? ex.mileage, ex.price);
  if (ex.price) claims.push({ text: `Prix de l'annonce : ${ex.price.toLocaleString("fr-FR")} €`, status: val.verdict === "au_dessus" ? "warning" : "ok", detail: val.verdict === "au_dessus" ? `Le prix est ${(val.deltaToHigh ?? 0).toLocaleString("fr-FR")} € au-dessus de la cote estimée : demander ce qui le justifie.` : undefined });
  else claims.push({ text: "Prix non trouvé dans l'annonce", status: "missing" });
  if (ex.mileage) {
    const diff = mileage ? Math.abs(ex.mileage - mileage) : 0;
    claims.push({ text: `Kilométrage annoncé : ${ex.mileage.toLocaleString("fr-FR")} km`, status: diff > 3000 ? "warning" : "ok", detail: diff > 3000 ? `Écart de ${diff.toLocaleString("fr-FR")} km avec le kilométrage saisi : demander une photo du compteur.` : undefined });
  } else claims.push({ text: "Kilométrage non trouvé dans l'annonce", status: "missing" });
  const has = (s: string) => ex.flags.some((f) => f.includes(s));
  if (has("accident")) claims.push({ text: "« Jamais accidentée »", status: "ok", detail: "À confronter aux sinistres de l'historique officiel." });
  if (vehicle.imported && !has("import")) claims.push({ text: "Import non mentionné", status: "warning", detail: "L'annonce ne précise pas que le véhicule a été immatriculé à l'étranger avant la France. Demander pourquoi." });
  if (has("distribution")) claims.push({ text: "Distribution annoncée faite", status: "ok", detail: "Demander la facture." });
  if (has("pour pièces") || has("hs") || has("accidenté")) claims.push({ text: "Véhicule annoncé endommagé ou hors service", status: "warning", detail: "L'annonce signale un problème majeur." });
  if (has("sans contrôle technique")) claims.push({ text: "Vendu sans contrôle technique", status: "warning", detail: "Un contrôle technique de moins de 6 mois est obligatoire pour vendre à un particulier." });
  if (has("première main") || has("premiere main")) claims.push({ text: "« Première main »", status: "ok", detail: "À confronter au nombre de propriétaires de l'historique officiel." });
  return claims;
}

export const fetchListingProvider: ListingProvider = {
  name: "fetch",
  async analyze(url: string, vehicle: Vehicle, mileage?: number): Promise<ListingAnalysis> {
    let text = "";
    try {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; CaristoBot/1.0)", Accept: "text/html" }, signal: AbortSignal.timeout(10000), redirect: "follow" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      text = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
    } catch {
      return { available: false, url, claims: [{ text: "Annonce inaccessible automatiquement", status: "missing", detail: "Le site de l'annonce a bloqué la lecture. Vérifiez vous-même prix et kilométrage annoncés." }] };
    }
    const ex = extractFromText(text);
    return { available: true, url, askingPrice: ex.price, declaredMileage: ex.mileage, claims: buildClaims(ex, vehicle, mileage) };
  },
};
