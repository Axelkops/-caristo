import { describe, expect, it } from "vitest";
import { buildChecklist, detectAutoGearbox } from "@/lib/engine/checklist";
import type { Fuel, Gearbox, Vehicle } from "@/lib/engine/types";

const now = new Date("2026-11-06T12:00:00Z");
const mk = (fuel: Fuel, gearbox: Gearbox, years = 6, version = ""): Vehicle => ({ make: "Test", model: "Modèle", version, country: "FR", firstRegistration: `${2026 - years}-03-01`, fuel, gearbox, category: "voiture" });
const ids = (fuel: Fuel, gearbox: Gearbox, km = 100000, years = 6, version = "") => buildChecklist({ vehicle: mk(fuel, gearbox, years, version), mileage: km, now }).sections.flatMap((s) => s.items.map((i) => i.id));

describe("points à vérifier : listes différentes selon le véhicule", () => {
  it("électrique : batterie et câbles, pas de FAP ni d'embrayage", () => {
    const l = ids("electrique", "automatique");
    expect(l).toContain("ev-soh");
    expect(l).toContain("ev-charge");
    expect(l).not.toContain("fap");
    expect(l).not.toContain("embrayage");
    expect(l).not.toContain("auto-huile");
    expect(l).not.toContain("froid");
  });
  it("diesel manuelle : FAP, AdBlue (Euro 6), embrayage et volant bi-masse", () => {
    const l = ids("diesel", "manuelle");
    for (const k of ["fap", "adblue", "fumee", "embrayage", "bimasse", "froid"]) expect(l).toContain(k);
    expect(l).not.toContain("ev-soh");
    expect(l).not.toContain("auto-passages");
  });
  it("diesel ancien : pas d'AdBlue", () => {
    expect(ids("diesel", "manuelle", 180000, 14)).not.toContain("adblue");
  });
  it("essence automatique double embrayage : test DSG, huile de boîte, pas de bi-masse", () => {
    const l = ids("essence", "automatique", 80000, 5, "1.4 TSI DSG");
    for (const k of ["dsg", "auto-huile", "auto-passages", "turbo-e", "fumee-e"]) expect(l).toContain(k);
    expect(l).not.toContain("embrayage");
    expect(l).not.toContain("bimasse");
    expect(l).not.toContain("fap");
  });
  it("hybride rechargeable : charge pendant la visite", () => {
    const l = ids("hybride_rechargeable", "automatique");
    for (const k of ["phev-charge", "hyb-batt", "hyb-transition", "fumee-e"]) expect(l).toContain(k);
  });
  it("GPL : réservoir et bascule", () => {
    const l = ids("gpl", "manuelle");
    expect(l).toContain("gpl-reservoir");
    expect(l).toContain("gpl-cg");
  });
  it("âge et kilométrage changent la liste", () => {
    const jeune = ids("essence", "manuelle", 15000, 2);
    const vieux = ids("essence", "manuelle", 180000, 12);
    expect(jeune).toContain("garantie");
    expect(jeune).toContain("ct-jeune");
    expect(jeune).not.toContain("dessous");
    expect(vieux).toContain("dessous");
    expect(vieux).toContain("flexibles");
    expect(vieux).toContain("km-eleve");
    expect(vieux).toContain("ct");
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
  it("intègre les pannes connues, rappels et alertes de l'historique", () => {
    const c = buildChecklist({
      vehicle: mk("diesel", "manuelle"), mileage: 120000, now,
      knownIssues: [{ id: "x", title: "Courroie", severity: "high", description: "", whatToCheck: "Demander la facture.", applies: true, inZone: true }],
      recalls: [{ date: "2024-01-01", title: "Airbag", status: "open" }],
      history: { available: true, pledge: true, inspections: [], mileageReadings: [], claims: [] },
    });
    const l = c.sections.flatMap((s) => s.items);
    expect(l.find((i) => i.id === "issue-x")?.priority).toBe("essentiel");
    expect(l.some((i) => i.id.startsWith("recall-"))).toBe(true);
    expect(l.some((i) => i.id === "gage")).toBe(true);
    expect(c.essential).toBeGreaterThan(5);
    expect(c.total).toBe(l.length);
  });
  it("devine la technologie de boîte automatique", () => {
    expect(detectAutoGearbox(mk("essence", "automatique", 3, "2.0 TDI DSG7"))).toBe("double_embrayage");
    expect(detectAutoGearbox(mk("essence", "automatique", 3, "1.2 PureTech EAT8"))).toBe("convertisseur");
    expect(detectAutoGearbox(mk("essence", "automatique", 3, "1.6 Xtronic"))).toBe("cvt");
    expect(detectAutoGearbox(mk("hybride", "automatique", 3, "Toyota Yaris Hybrid"))).toBe("e_cvt");
  });
});
