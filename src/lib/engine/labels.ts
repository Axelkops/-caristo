import type { Vehicle } from "./types";

export const FUEL_LABEL: Record<Vehicle["fuel"], string> = { diesel: "Diesel", essence: "Essence", hybride: "Hybride", hybride_rechargeable: "Hybride rechargeable", electrique: "Électrique", gpl: "GPL", autre: "Énergie non précisée" };
export const GEARBOX_LABEL: Record<Vehicle["gearbox"], string> = { manuelle: "Boîte manuelle", automatique: "Boîte automatique", inconnue: "" };

export function fmtDateFr(iso?: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
