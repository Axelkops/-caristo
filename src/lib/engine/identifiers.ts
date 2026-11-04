/**
 * Validation et normalisation des identifiants : plaques (France + Europe) et VIN (monde).
 * Tout est en pur TypeScript, testé unitairement.
 */

export interface PlateInfo {
  normalized: string; // ex. AB-123-CD
  country: string; // code ISO
  format: string; // ex. FR_SIV
}

const PLATE_FORMATS: { country: string; format: string; re: RegExp; fmt: (m: RegExpMatchArray) => string }[] = [
  // France SIV : AA-123-AA (depuis 2009)
  { country: "FR", format: "FR_SIV", re: /^([A-HJ-NP-TV-Z]{2})[- ]?(\d{3})[- ]?([A-HJ-NP-TV-Z]{2})$/, fmt: (m) => `${m[1]}-${m[2]}-${m[3]}` },
  // France FNI : 123 ABC 45 / 1234 AB 56 (avant 2009)
  { country: "FR", format: "FR_FNI", re: /^(\d{1,4})[- ]?([A-Z]{1,3})[- ]?(0[1-9]|[1-8]\d|9[0-5]|97[1-6]|2A|2B)$/, fmt: (m) => `${m[1]} ${m[2]} ${m[3]}` },
  // Allemagne : B-AB 1234, M-XY 12
  { country: "DE", format: "DE", re: /^([A-ZÄÖÜ]{1,3})[- ]([A-Z]{1,2})[- ]?(\d{1,4})[EH]?$/, fmt: (m) => `${m[1]}-${m[2]} ${m[3]}` },
  // Espagne : 1234 BCD
  { country: "ES", format: "ES", re: /^(\d{4})[- ]?([BCDFGHJKLMNPRSTVWXYZ]{3})$/, fmt: (m) => `${m[1]} ${m[2]}` },
  // Italie : AB 123 CD
  { country: "IT", format: "IT", re: /^([A-Z]{2})[- ]?(\d{3})[- ]?([A-Z]{2})$/, fmt: (m) => `${m[1]}${m[2]}${m[3]}` },
  // Belgique : 1-ABC-123 / 2-ABC-123
  { country: "BE", format: "BE", re: /^([1-9])[- ]?([A-Z]{3})[- ]?(\d{3})$/, fmt: (m) => `${m[1]}-${m[2]}-${m[3]}` },
  // Pays-Bas : AB-12-CD, 12-ABC-3, etc. (approximation : 3 groupes)
  { country: "NL", format: "NL", re: /^([A-Z0-9]{1,3})[- ]([A-Z0-9]{1,3})[- ]([A-Z0-9]{1,3})$/, fmt: (m) => `${m[1]}-${m[2]}-${m[3]}` },
  // Portugal : AA-12-34, 12-AA-34, 12-34-AA
  { country: "PT", format: "PT", re: /^([A-Z0-9]{2})[- ]([A-Z0-9]{2})[- ]([A-Z0-9]{2})$/, fmt: (m) => `${m[1]}-${m[2]}-${m[3]}` },
  // Royaume-Uni : AB12 CDE
  { country: "GB", format: "GB", re: /^([A-Z]{2}\d{2})[- ]?([A-Z]{3})$/, fmt: (m) => `${m[1]} ${m[2]}` },
  // Suisse : ZH 123456
  { country: "CH", format: "CH", re: /^([A-Z]{2})[- ]?(\d{1,6})$/, fmt: (m) => `${m[1]} ${m[2]}` },
  // Luxembourg : AB 1234
  { country: "LU", format: "LU", re: /^([A-Z]{2})[- ]?(\d{4})$/, fmt: (m) => `${m[1]} ${m[2]}` },
];

/** Analyse une plaque. Retourne null si aucun format connu. */
export function parsePlate(raw: string, preferredCountry = "FR"): PlateInfo | null {
  const cleaned = raw.trim().toUpperCase().replace(/\s+/g, " ").replace(/[^A-Z0-9ÄÖÜ\- ]/g, "");
  if (!cleaned) return null;
  const ordered = [...PLATE_FORMATS].sort((a, b) => (a.country === preferredCountry ? -1 : 0) - (b.country === preferredCountry ? -1 : 0));
  for (const f of ordered) {
    const m = cleaned.match(f.re);
    if (m) return { normalized: f.fmt(m), country: f.country, format: f.format };
  }
  return null;
}

/** Vérifie et normalise un VIN (17 caractères, sans I, O, Q). */
export function parseVin(raw: string): { vin: string; valid: boolean; wmi: string; region: string; modelYear?: number } | null {
  const vin = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (vin.length !== 17) return null;
  if (/[IOQ]/.test(vin)) return { vin, valid: false, wmi: vin.slice(0, 3), region: vinRegion(vin[0]) };
  const valid = /^[A-HJ-NPR-Z0-9]{17}$/.test(vin);
  return { vin, valid, wmi: vin.slice(0, 3), region: vinRegion(vin[0]), modelYear: vinModelYear(vin[9]) };
}

export function vinRegion(firstChar: string): string {
  const c = firstChar.toUpperCase();
  if (/[A-C]/.test(c)) return "Afrique";
  if (/[J-R]/.test(c)) return "Asie";
  if (/[S-Z]/.test(c)) return "Europe";
  if (/[1-5]/.test(c)) return "Amérique du Nord";
  if (/[6-7]/.test(c)) return "Océanie";
  if (/[8-9]/.test(c)) return "Amérique du Sud";
  return "Inconnue";
}

/** Année modèle d'après le 10e caractère (convention nord-américaine ; indicative en Europe). */
export function vinModelYear(c: string): number | undefined {
  const table = "ABCDEFGHJKLMNPRSTVWXY123456789";
  const idx = table.indexOf(c.toUpperCase());
  if (idx < 0) return undefined;
  // Cycle 2010 → 2039
  const year = 2010 + idx;
  return year > new Date().getFullYear() + 1 ? year - 30 : year;
}

/** Contrôle de la clé du VIN (algorithme nord-américain). Retourne null si non applicable (Europe). */
export function vinCheckDigit(vin: string): boolean | null {
  const region = vinRegion(vin[0]);
  if (region !== "Amérique du Nord") return null;
  const map: Record<string, number> = { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9, S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9 };
  const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const ch = vin[i];
    const v = /\d/.test(ch) ? Number(ch) : map[ch] ?? 0;
    sum += v * weights[i];
  }
  const check = sum % 11;
  const expected = check === 10 ? "X" : String(check);
  return vin[8] === expected;
}

/** Numéro de formule d'une carte grise française : AAAA + 2 lettres + 5 chiffres (ex. 2021AB12345). */
export function parseFormulaNumber(raw: string): string | null {
  const v = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  // 4 chiffres (année), 2 lettres, puis 5 chiffres (quelques cartes grises en affichent jusqu'à 8)
  return /^(19|20)\d{2}[A-Z]{2}\d{5,8}$/.test(v) ? v : null;
}

/** Date au format JJ/MM/AAAA ou AAAA-MM-JJ → AAAA-MM-JJ, ou null. */
export function parseDate(raw: string): string | null {
  const v = raw.trim();
  let m = v.match(/^(\d{2})[\/.-](\d{2})[\/.-](\d{4})$/);
  if (m) return isoIfValid(`${m[3]}-${m[2]}-${m[1]}`);
  m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return isoIfValid(v);
  return null;
}

function isoIfValid(iso: string): string | null {
  const d = new Date(iso + "T00:00:00Z");
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== iso) return null;
  if (d.getUTCFullYear() < 1950 || d.getTime() > Date.now()) return null;
  return iso;
}

export function parseMileage(raw: string | number): number | null {
  const digits = typeof raw === "number" ? String(raw) : String(raw).replace(/[^\d-]/g, "");
  if (digits === "" || digits === "-") return null;
  const n = Number(digits);
  if (!Number.isFinite(n) || n < 0 || n > 2_000_000) return null;
  return Math.round(n);
}
