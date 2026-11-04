export type Offer = "single" | "pack3" | "pack10";

export const OFFERS: Record<Offer, { label: string; priceCents: number; credits: number; validityMonths: number; perReportCents: number }> = {
  single: { label: "Rapport unique", priceCents: 1990, credits: 1, validityMonths: 12, perReportCents: 1990 },
  pack3: { label: "Pack 3 rapports", priceCents: 4990, credits: 3, validityMonths: 12, perReportCents: 1663 },
  pack10: { label: "Pack 10 rapports", priceCents: 12990, credits: 10, validityMonths: 24, perReportCents: 1299 },
};

export function isOffer(v: unknown): v is Offer {
  return v === "single" || v === "pack3" || v === "pack10";
}

export function formatEuros(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}
