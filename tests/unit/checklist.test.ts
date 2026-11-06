import { describe, expect, it } from "vitest";
import { buildChecklist, detectAutoGearbox } from "@/lib/engine/checklist";
import type { Fuel, Gearbox, Vehicle } from "@/lib/engine/types";

const now = new Date("2026-11-06T12:00:00Z");
const mk = (fuel: Fuel, gearbox: Gearbox, years = 6, version = ""): Vehicle => ({ make: "Test", model: "Modèle", version, country: "FR", firstRegistration: `${2026 - years}-03-01`, fuel, gearbox, category: "voiture" });
const build = (fuel: Fuel, gearbox: Gearbox, km = 100000, years = 6, version = "") => buildChecklist({ vehicle: mk(fuel, gearbox, years, version), mileage: km, now });
const ids = (...a: Parameters<typeof build>) => build(...a).sections.flatMap((s) => s.items.map((i) => i.id));

describe("points à vérifier : trois parties courtes, différentes selon le véhicule", () => {
  it("a toujours trois parties : papiers, vendeur, acheteur", () => {
    const c = build("essence", "manuelle");
    expect(c.sections.map((s) => s.id)).toEqual(["papiers", "vendeur", "acheteur"]);
    for (const s of c.sections) expect(s.items.length).toBeGreaterThan(0);
  });
  it("reste courte : au plus 30 points, phrases brèves", () => {
    for (const [f, g, km, y, v] of [["diesel", "manuelle", 180000, 12, ""], ["electrique", "automatique", 40000, 3, ""], ["essence", "automatique", 90000, 5, "1.4 TSI DSG"], ["hybride_rechargeable", "automatique", 60000, 4, ""]] as const) {
      const c = build(f, g, km, y, v);
      expect(c.total, `${f} ${g}`).toBeLessThanOrEqual(30);
      for (const i of c.sections.flatMap((s) => s.items)) expect(i.text.length, i.id).toBeLessThanOrEqual(120);
    }
  });
  it("électrique : batterie et charge, pas de FAP ni d'embrayage", () => {
    const l = ids("electrique", "automatique");
    for (const k of ["batt-certif", "ev-charge", "ev-garantie", "ev-autonomie"]) expect(l).toContain(k);
    for (const k of ["fap", "embrayage", "auto-huile", "froid", "fumee"]) expect(l).not.toContain(k);
  });
  it("diesel manuelle : FAP, AdBlue (Euro 6), fumées, embrayage et volant bi-masse", () => {
    const l = ids("diesel", "manuelle");
    for (const k of ["fap", "adblue", "fumee", "embrayage", "bimasse", "froid"]) expect(l).toContain(k);
    expect(l).not.toContain("batt-certif");
    expect(l).not.toContain("auto-passages");
  });
  it("diesel ancien : pas d'AdBlue, mais dessous de caisse", () => {
    const l = ids("diesel", "manuelle", 180000, 14);
    expect(l).not.toContain("adblue");
    expect(l).toContain("dessous");
    expect(l).toContain("km-eleve");
  });
  it("essence automatique double embrayage : test DSG, huile de boîte, consommation d'huile", () => {
    const l = ids("essence", "automatique", 80000, 5, "1.4 TSI DSG");
    for (const k of ["dsg", "auto-huile", "auto-passages", "huile-conso", "fumee-e"]) expect(l).toContain(k);
    for (const k of ["embrayage", "bimasse", "fap"]) expect(l).not.toContain(k);
  });
  it("hybride rechargeable : charge pendant la visite, transition", () => {
    const l = ids("hybride_rechargeable", "automatique");
    for (const k of ["phev-charge", "batt-certif", "hyb-transition", "cables"]) expect(l).toContain(k);
  });
  it("GPL : réservoir, carte grise et bascule", () => {
    const l = ids("gpl", "manuelle");
    for (const k of ["gpl-reservoir", "gpl-cg", "gpl-bascule"]) expect(l).toContain(k);
  });
  it("âge et kilométrage changent la liste", () => {
    const jeune = ids("essence", "manuelle", 15000, 2);
    const vieux = ids("essence", "manuelle", 180000, 12);
    for (const k of ["garantie", "ct-jeune"]) expect(jeune).toContain(k);
    expect(jeune).not.toContain("dessous");
    expect(jeune).not.toContain("distribution");
    for (const k of ["dessous", "km-eleve", "ct", "distribution", "embrayage-vendeur"]) expect(vieux).toContain(k);
  });
  it("deux profils différents n'ont jamais la même liste", () => {
    const combos: [Fuel, Gearbox, string][] = [["essence", "manuelle", ""], ["essence", "automatique", "EAT8"], ["diesel", "manuelle", ""], ["diesel", "automatique", "DSG"], ["hybride", "automatique", "e-CVT"], ["electrique", "automatique", ""], ["gpl", "manuelle", ""]];
    const seen = new Set<string>();
    for (const [f, g, v] of combos) {
      const key = ids(f, g, 100000, 6, v).join("|");
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });
  it("intègre les pannes connues (acheteur), rappels (vendeur) et alertes de l'historique (papiers)", () => {
    const c = buildChecklist({
      vehicle: mk("diesel", "manuelle"), mileage: 120000, now,
      knownIssues: [{ id: "x", title: "Courroie", severity: "high", description: "", whatToCheck: "Demander la facture.", applies: true, inZone: true }, { id: "y", title: "Loin", severity: "high", description: "", whatToCheck: "…", applies: true, inZone: false }],
      recalls: [{ date: "2024-01-01", title: "Airbag", status: "open" }],
      history: { available: true, pledge: true, inspections: [], mileageReadings: [], claims: [] },
    });
    const by = (id: string) => c.sections.find((s) => s.id === id)!.items.map((i) => i.id);
    expect(by("acheteur")).toContain("issue-x");
    expect(by("acheteur")).not.toContain("issue-y");
    expect(by("vendeur").some((i) => i.startsWith("recall-"))).toBe(true);
    expect(c.sections.find((s) => s.id === "vendeur")!.party).toBe("acheteur");
    expect(c.sections.find((s) => s.id === "papiers")!.party).toBe("vendeur");
    expect(by("papiers")).toContain("gage");
    expect(c.total).toBe(c.sections.flatMap((s) => s.items).length);
    expect(c.essential).toBeGreaterThan(5);
  });
  it("devine la technologie de boîte automatique", () => {
    expect(detectAutoGearbox(mk("essence", "automatique", 3, "2.0 TDI DSG7"))).toBe("double_embrayage");
    expect(detectAutoGearbox(mk("essence", "automatique", 3, "1.2 PureTech EAT8"))).toBe("convertisseur");
    expect(detectAutoGearbox(mk("essence", "automatique", 3, "1.6 Xtronic"))).toBe("cvt");
    expect(detectAutoGearbox(mk("hybride", "automatique", 3, "Toyota Yaris Hybrid"))).toBe("e_cvt");
  });
});
