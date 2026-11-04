import { describe, expect, it } from "vitest";
import { mapApiPlaqueVehicle, mapFuel, mapGearbox, toIsoDate } from "@/lib/providers/vehicle-apiplaque";
import { decodeVinBasic } from "@/lib/providers/vin-decoder";
import { extractFromText, buildClaims } from "@/lib/providers/listing-fetch";
import { mapRappelConsoRecord } from "@/lib/providers/recalls-rappelconso";
import type { Vehicle } from "@/lib/engine/types";

describe("fournisseur plaque : lecture tolérante", () => {
  it("convertit les énergies et boîtes", () => {
    expect(mapFuel("GAZOLE")).toBe("diesel");
    expect(mapFuel("Essence")).toBe("essence");
    expect(mapFuel("ELECTRIC")).toBe("electrique");
    expect(mapFuel("Hybride rechargeable")).toBe("hybride_rechargeable");
    expect(mapFuel("")).toBe("autre");
    expect(mapGearbox("A")).toBe("automatique");
    expect(mapGearbox("Manuelle")).toBe("manuelle");
    expect(mapGearbox(undefined)).toBe("inconnue");
    expect(toIsoDate("12-03-2019")).toBe("2019-03-12");
    expect(toIsoDate("2019-03-12T00:00:00Z")).toBe("2019-03-12");
  });
  it("lit la réponse documentée du fournisseur (exemple officiel)", () => {
    const sample = { data: { erreur: "", immat: "AA123BC", pays: "FR", marque: "RENAULT", modele: "MEGANE III Coupé", version: "1.9 dCi", date1erCir_us: "2009-04-18", date1erCir_fr: "18/04/2009", co2: "134", energie: "2", energieNGC: "DIESEL", type_moteur: "Diesel", genreVCG: "1", genreVCGNGC: "VP", puisFisc: "7", carrosserie: "Coupé", puisFiscReelKW: "96 KW", puisFiscReelCH: "131 CH", vin: "VF1DZ0N0641118804", boite_vitesse: "M", nr_passagers: "5", couleur: "Noire", ccm: "1870 CM3", code_moteur: "F9Q_870,F9Q_872" }, "api-version": "1.0.0", message: "", code_erreur: 200 };
    const v = mapApiPlaqueVehicle(sample, { kind: "plate", value: "AA-123-BC", country: "FR" });
    expect(v).not.toBeNull();
    expect(v?.make).toBe("Renault");
    expect(v?.model).toBe("MEGANE III Coupé");
    expect(v?.version).toBe("1.9 dCi");
    expect(v?.fuel).toBe("diesel");
    expect(v?.gearbox).toBe("manuelle");
    expect(v?.powerHp).toBe(131);
    expect(v?.powerKw).toBe(96);
    expect(v?.displacementCc).toBe(1870);
    expect(v?.firstRegistration).toBe("2009-04-18");
    expect(v?.vin).toBe("VF1DZ0N0641118804");
    expect(v?.critAir).toBe("3");
    expect(v?.engineCode).toContain("F9Q");
    expect(v?.imported).toBe(false);
  });
  it("renvoie null sur erreur fournisseur et gère les codes énergie", () => {
    expect(mapApiPlaqueVehicle({ data: { erreur: "Immatriculation inconnue" } }, { kind: "plate", value: "AA-123-BC", country: "FR" })).toBeNull();
    expect(mapFuel(undefined, "12")).toBe("electrique");
    expect(mapFuel(undefined, "5")).toBe("hybride");
    expect(mapFuel(undefined, "10")).toBe("hybride_rechargeable");
    expect(mapGearbox("A")).toBe("automatique");
    expect(mapGearbox("X")).toBe("automatique");
  });
  it("renvoie null sans marque ni modèle", () => {
    expect(mapApiPlaqueVehicle({ foo: "bar" }, { kind: "plate", value: "AB-123-CD", country: "FR" })).toBeNull();
  });
});

describe("décodage VIN mondial", () => {
  it("reconnaît des constructeurs de plusieurs continents", () => {
    expect(decodeVinBasic("WVWZZZ1KZBW123456")?.make).toBe("Volkswagen");
    expect(decodeVinBasic("JTDKN3DU0A0123456")?.make).toBe("Toyota");
    expect(decodeVinBasic("5YJ3E7EB0LF123456")?.make).toBe("Tesla");
    expect(decodeVinBasic("KMHDH4AE0DU123456")?.make).toBe("Hyundai");
    expect(decodeVinBasic("LGXCE4CB0K0123456")?.make).toBe("BYD");
    expect(decodeVinBasic("ZZZ00000000000000")?.make).toContain("Constructeur");
    expect(decodeVinBasic("IOQ")).toBeNull();
  });
});

describe("analyse d'annonce", () => {
  const v: Vehicle = { make: "Peugeot", model: "3008", version: "1.5 BlueHDi 130", country: "FR", firstRegistration: "2019-03-12", fuel: "diesel", gearbox: "automatique", powerHp: 131, category: "voiture", imported: true };
  it("extrait prix, kilométrage et mentions", () => {
    const ex = extractFromText("Peugeot 3008 2019 118 000 km, 17 900 € à débattre. Jamais accidentée, première main, carnet d'entretien.");
    expect(ex.price).toBe(17900);
    expect(ex.mileage).toBe(118000);
    expect(ex.flags).toContain("jamais accident");
    expect(ex.flags).toContain("première main");
  });
  it("signale l'import non mentionné et l'écart de kilométrage", () => {
    const claims = buildClaims({ price: 17900, mileage: 100000, flags: [] }, v, 118000);
    expect(claims.some((c) => c.text.includes("Import non mentionné") && c.status === "warning")).toBe(true);
    expect(claims.some((c) => c.text.includes("Kilométrage annoncé") && c.status === "warning")).toBe(true);
  });
  it("gère une annonce sans prix", () => {
    const claims = buildClaims({ flags: [] }, v, 118000);
    expect(claims[0].status).toBe("missing");
  });
});

describe("rappels : lecture des enregistrements", () => {
  it("mappe un enregistrement RappelConso", () => {
    const r = mapRappelConsoRecord({ date_de_publication: "2024-03-02T10:00:00", motif_du_rappel: "Risque de fuite du réservoir AdBlue", numero_de_fiche: "2024-03-0123", risques_encourus_par_le_consommateur: "Incendie" });
    expect(r?.date).toBe("2024-03-02");
    expect(r?.title).toContain("AdBlue");
    expect(r?.reference).toBe("2024-03-0123");
    expect(mapRappelConsoRecord({})).toBeNull();
  });
});
