import { afterEach, describe, expect, it, vi } from "vitest";
import { buildPayload, histovecHistoryProvider, looksLikeCompany, mapResponse, splitHolder, toIsoDate, type HistovecResponse } from "@/lib/providers/history-histovec";
import type { Vehicle } from "@/lib/engine/types";

const vehicle = { country: "FR", plate: "FP-428-CB", make: "Peugeot", model: "e-208" } as unknown as Vehicle;
const input = { vehicle, plate: "FP-428-CB", holderName: "Douillard Axel", formulaNumber: "2025FF98058", firstRegDate: "2020-02-27" };

const sample: HistovecResponse = {
  vehicule: {
    date_mise_a_jour: "2026-11-01",
    etat: { nombre_de_titulaires: 2, vole: false, procedures_ve: { nombre_de_procedures_ve: 1, date_derniere_procedure_ve: "2022-05-10", date_fin_derniere_procedure_ve: "2022-07-01", apte_a_circuler: true, procedure_ve_en_cours: false } },
    situation_administrative: { gages: [{ date: "2021-01-01", nom_creancier: "BANQUE" }], opposition: { oves: [], oveis: [], otcis: [{ date: "2023-01-01" }], otcis_pv: [] }, suspensions: [], declarations_valant_saisie: [] },
  },
  controles_techniques: {
    donnee_disponible: true,
    date_mise_a_jour: "2026-10-30",
    historique: [
      { date: "2024-03-01", nature: "VTP", nature_libelle: "Contrôle Technique Périodique", resultat: "S", resultat_libelle: "Défavorable pour défaillances majeures", km: 61234 },
      { date: "2024-03-20", nature: "CV", nature_libelle: "Contre-Visite", resultat: "A", resultat_libelle: "Favorable", km: 61400 },
      { date: "2026-03-05", nature: "VTP", nature_libelle: "Contrôle Technique Périodique", resultat: "A", resultat_libelle: "Favorable", km: "98 500" },
    ],
  },
};

describe("HistoVec : préparation de la requête", () => {
  it("découpe le titulaire (nom d'abord, comme sur la carte grise)", () => {
    expect(splitHolder("Douillard Axel")).toEqual({ nom: "DOUILLARD", prenoms: ["AXEL"] });
    expect(splitHolder("Axel Douillard", true)).toEqual({ nom: "DOUILLARD", prenoms: ["AXEL"] });
    expect(splitHolder("DUPONT")).toEqual({ nom: "DUPONT", prenoms: [] });
  });
  it("détecte une personne morale", () => {
    expect(looksLikeCompany("GARAGE DU CENTRE SARL")).toBe(true);
    expect(looksLikeCompany("DOUILLARD AXEL")).toBe(false);
  });
  it("construit le corps SIV avec formule normalisée", () => {
    const p = buildPayload({ ...input, formulaNumber: "2025 ff 98058" }, "particulier") as { vehicule: { certificat_immatriculation: Record<string, unknown> }; options: Record<string, unknown> };
    expect(p.vehicule.certificat_immatriculation.numero_immatriculation).toBe("FP-428-CB");
    expect(p.vehicule.certificat_immatriculation.numero_formule).toBe("2025FF98058");
    expect(p.vehicule.certificat_immatriculation.titulaire).toEqual({ particulier: { nom: "DOUILLARD", prenoms: ["AXEL"] } });
    expect(p.options).toEqual({ controles_techniques: true, ignore_utac_cache: false });
  });
  it("refuse une formule hors format", () => {
    expect(buildPayload({ ...input, formulaNumber: "2025FF9805870" }, "particulier")).toBeNull();
  });
  it("utilise la date pour une plaque FNI", () => {
    const p = buildPayload({ ...input, plate: "1234 AB 56" }, "particulier") as { vehicule: { certificat_immatriculation: Record<string, unknown> } };
    expect(p.vehicule.certificat_immatriculation.date_emission_certificat_immatriculation).toBe("2020-02-27");
    expect(p.vehicule.certificat_immatriculation.numero_formule).toBeUndefined();
  });
  it("convertit les dates", () => {
    expect(toIsoDate("2024-03-01T00:00:00.000Z")).toBe("2024-03-01");
    expect(toIsoDate("01/03/2024")).toBe("2024-03-01");
    expect(toIsoDate("")).toBeUndefined();
  });
});

describe("HistoVec : lecture de la réponse", () => {
  it("convertit la réponse en historique officiel", () => {
    const h = mapResponse(sample);
    expect(h.available).toBe(true);
    expect(h.ownersCount).toBe(2);
    expect(h.pledge).toBe(true);
    expect(h.opposition).toBe(true);
    expect(h.stolen).toBe(false);
    expect(h.damagedProcedure).toBe(true);
    expect(h.inspections).toHaveLength(3);
    expect(h.inspections[0]).toMatchObject({ kind: "periodique", result: "defavorable", mileage: 61234 });
    expect(h.inspections[0].defects).toContain("majeures");
    expect(h.inspections[1]).toMatchObject({ kind: "contre_visite", result: "favorable" });
    expect(h.inspections[2].mileage).toBe(98500);
    expect(h.mileageReadings.map((m) => m.mileage)).toEqual([61234, 61400, 98500]);
    expect(h.claims[0].kind).toContain("véhicule endommagé");
    expect(h.retrievedAt).toBe("2026-11-01");
  });
  it("tolère une réponse vide", () => {
    const h = mapResponse({ vehicule: {} });
    expect(h.available).toBe(true);
    expect(h.inspections).toEqual([]);
    expect(h.pledge).toBe(false);
  });
});

describe("HistoVec : appel réseau", () => {
  afterEach(() => vi.unstubAllGlobals());
  const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  const reply403 = async () => reply(403, {}); const reply404 = async () => reply(404, {}); const reply500 = async () => reply(500, {});

  it("renvoie l'historique quand le service répond", async () => {
    const fetchMock = vi.fn().mockResolvedValue(reply(200, sample));
    vi.stubGlobal("fetch", fetchMock);
    const h = await histovecHistoryProvider.fetchHistory(input);
    expect(h.available).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("/report_by_data");
  });
  it("tente l'ordre inverse puis personne morale avant d'abandonner", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => reply(404, { message: "not found" }));
    vi.stubGlobal("fetch", fetchMock);
    const h = await histovecHistoryProvider.fetchHistory(input);
    expect(h.available).toBe(false);
    expect(h.reason).toContain("ne reconnaît pas");
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const bodies = fetchMock.mock.calls.map((c) => JSON.parse(c[1].body).vehicule.certificat_immatriculation.titulaire);
    expect(bodies[0]).toEqual({ particulier: { nom: "DOUILLARD", prenoms: ["AXEL"] } });
    expect(bodies[1]).toEqual({ particulier: { nom: "AXEL", prenoms: ["DOUILLARD"] } });
    expect(bodies[2]).toEqual({ personne_morale: { raison_sociale: "DOUILLARD AXEL", siren: "000000000" } });
  });
  it("explique un refus du service", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(reply(403, {})));
    const h = await histovecHistoryProvider.fetchHistory(input);
    expect(h.available).toBe(false);
    expect(h.reason).toContain("pas pu être consulté");
  });
  it("explique une panne réseau", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    const h = await histovecHistoryProvider.fetchHistory(input);
    expect(h.available).toBe(false);
    expect(h.reason).toContain("n'a pas répondu");
  });
  it("ne cite jamais le nom du service dans les messages destinés au client", async () => {
    for (const reply of [() => reply403(), () => Promise.reject(new TypeError("fetch failed")), () => reply500(), () => reply404()]) {
      vi.stubGlobal("fetch", vi.fn().mockImplementation(reply));
      const h = await histovecHistoryProvider.fetchHistory(input);
      expect(h.reason ?? "").not.toMatch(/histovec/i);
    }
  });
  it("ne consulte pas pour un véhicule étranger", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const h = await histovecHistoryProvider.fetchHistory({ ...input, vehicle: { ...vehicle, country: "DE" } });
    expect(h.available).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
