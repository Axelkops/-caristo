import { describe, expect, it } from "vitest";
import { findKnownIssues } from "@/lib/engine/known-issues";
import { GENERIC_ISSUES } from "@/lib/data/known-issues";
import type { Fuel, Gearbox, Vehicle } from "@/lib/engine/types";

/*
 * Couverture de la base de pannes sur des versions courantes du marché de l'occasion en France
 * (libellés tels que renvoyés par l'identification par plaque). Sert de garde-fou : la couverture ne doit pas régresser.
 */
const NOW = new Date("2026-11-07T12:00:00Z");
type Row = [make: string, model: string, version: string, fuel: Fuel, gearbox: Gearbox, cc: number | undefined, hp: number, year: number];
const FLEET: Row[] = [
  ["Renault", "Clio", "1.5 dCi 90 Energy Intens", "diesel", "manuelle", 1461, 90, 2016],
  ["Renault", "Clio", "0.9 TCe 90 Limited", "essence", "manuelle", 898, 90, 2017],
  ["Renault", "Clio", "1.0 TCe 90 Evolution", "essence", "manuelle", 999, 91, 2021],
  ["Renault", "Clio", "E-Tech 145 Techno", "hybride", "automatique", 1598, 143, 2022],
  ["Citroën", "C3", "1.2 PureTech 82 Feel", "essence", "manuelle", 1199, 82, 2018],
  ["Citroën", "C3", "1.6 BlueHDi 100 Shine", "diesel", "manuelle", 1560, 99, 2017],
  ["Citroën", "C3", "1.4 HDi 70 Confort", "diesel", "manuelle", 1398, 68, 2010],
  ["Peugeot", "208", "1.2 PureTech 110 S&S Allure", "essence", "manuelle", 1199, 110, 2020],
  ["Peugeot", "208", "1.5 BlueHDi 100 Active", "diesel", "manuelle", 1499, 102, 2021],
  ["Peugeot", "208", "1.6 e-HDi 92 Active", "diesel", "manuelle", 1560, 92, 2013],
  ["Volkswagen", "Golf", "2.0 TDI 150 Carat DSG", "diesel", "automatique", 1968, 150, 2016],
  ["Volkswagen", "Golf", "1.4 TSI 122 Confortline", "essence", "manuelle", 1390, 122, 2011],
  ["Volkswagen", "Golf", "1.9 TDI 105 Confort", "diesel", "manuelle", 1896, 105, 2006],
  ["Peugeot", "308", "1.6 HDi 110 Premium", "diesel", "manuelle", 1560, 109, 2009],
  ["Peugeot", "308", "1.2 PureTech 130 S&S EAT8 GT Line", "essence", "automatique", 1199, 131, 2019],
  ["Renault", "Twingo", "1.0 SCe 70 Zen", "essence", "manuelle", 999, 71, 2017],
  ["Renault", "Mégane", "1.5 dCi 110 Bose", "diesel", "manuelle", 1461, 110, 2014],
  ["Renault", "Mégane", "1.5 dCi 105 Dynamique", "diesel", "manuelle", 1461, 106, 2006],
  ["Volkswagen", "Polo", "1.2 TSI 90 Confortline", "essence", "manuelle", 1197, 90, 2015],
  ["Volkswagen", "Polo", "1.0 TSI 95 Lounge", "essence", "manuelle", 999, 95, 2019],
  ["Peugeot", "2008", "1.2 PureTech 110 Allure", "essence", "manuelle", 1199, 110, 2016],
  ["Peugeot", "207", "1.4 HDi 70 Urban", "diesel", "manuelle", 1398, 68, 2009],
  ["Peugeot", "207", "1.6 VTi 120 Premium", "essence", "manuelle", 1598, 120, 2008],
  ["Renault", "Captur", "1.2 TCe 120 EDC Intens", "essence", "automatique", 1197, 118, 2015],
  ["Renault", "Captur", "1.3 TCe 130 Intens", "essence", "manuelle", 1333, 131, 2020],
  ["Peugeot", "206", "1.4 HDi 70 X-Line", "diesel", "manuelle", 1398, 68, 2005],
  ["Peugeot", "3008", "1.6 HDi 112 FAP Confort", "diesel", "manuelle", 1560, 112, 2010],
  ["Peugeot", "3008", "1.5 BlueHDi 130 EAT8 Allure", "diesel", "automatique", 1499, 131, 2019],
  ["Dacia", "Sandero", "1.5 dCi 90 Stepway", "diesel", "manuelle", 1461, 90, 2016],
  ["Dacia", "Sandero", "1.0 TCe 90 Stepway", "essence", "manuelle", 999, 91, 2022],
  ["Dacia", "Sandero", "1.0 ECO-G 100 Stepway", "gpl", "manuelle", 999, 101, 2022],
  ["Renault", "Scénic", "1.5 dCi 110 Bose", "diesel", "manuelle", 1461, 110, 2013],
  ["Fiat", "500", "1.2 8V 69 Lounge", "essence", "manuelle", 1242, 69, 2014],
  ["Fiat", "500", "0.9 TwinAir 85 Lounge", "essence", "manuelle", 875, 85, 2013],
  ["Citroën", "C4", "1.6 HDi 110 Exclusive", "diesel", "manuelle", 1560, 109, 2011],
  ["Dacia", "Duster", "1.5 dCi 110 4x2 Prestige", "diesel", "manuelle", 1461, 109, 2015],
  ["Toyota", "Yaris", "1.5 Hybride 100 Dynamic", "hybride", "automatique", 1497, 100, 2016],
  ["Toyota", "Yaris", "1.33 VVT-i 99 Dynamic", "essence", "manuelle", 1329, 99, 2012],
  ["BMW", "Série 1", "118d 143 Sport", "diesel", "manuelle", 1995, 143, 2010],
  ["BMW", "Série 1", "116i 136 Lounge", "essence", "manuelle", 1598, 136, 2013],
  ["Mini", "Mini", "Cooper 1.6 122", "essence", "manuelle", 1598, 122, 2009],
  ["Mercedes-Benz", "Classe A", "180 CDI BlueEfficiency", "diesel", "manuelle", 1461, 109, 2014],
  ["Mercedes-Benz", "Classe A", "200 CDI Sensation", "diesel", "manuelle", 2143, 136, 2014],
  ["BMW", "Série 3", "320d 184 Luxury", "diesel", "automatique", 1995, 184, 2013],
  ["Opel", "Corsa", "1.2 Twinport 80 Enjoy", "essence", "manuelle", 1229, 80, 2010],
  ["Nissan", "Qashqai", "1.5 dCi 110 Acenta", "diesel", "manuelle", 1461, 110, 2015],
  ["Nissan", "Qashqai", "1.2 DIG-T 115 N-Connecta", "essence", "manuelle", 1197, 115, 2016],
  ["Peugeot", "5008", "1.6 HDi 112 Premium", "diesel", "manuelle", 1560, 112, 2011],
  ["Peugeot", "307", "1.6 HDi 110 Navteq", "diesel", "manuelle", 1560, 109, 2006],
  ["Ford", "Fiesta", "1.0 EcoBoost 100 Titanium", "essence", "manuelle", 999, 100, 2016],
  ["Ford", "Fiesta", "1.4 TDCi 70 Trend", "diesel", "manuelle", 1399, 68, 2010],
  ["Citroën", "C4 Picasso", "1.6 e-HDi 115 Exclusive", "diesel", "manuelle", 1560, 114, 2014],
  ["Audi", "A3", "2.0 TDI 140 Ambition", "diesel", "manuelle", 1968, 140, 2007],
  ["Volkswagen", "Tiguan", "2.0 TDI 140 Carat 4Motion", "diesel", "manuelle", 1968, 140, 2012],
  ["Mercedes-Benz", "Classe C", "220 CDI BlueEfficiency", "diesel", "automatique", 2143, 170, 2012],
  ["Citroën", "C1", "1.0 VTi 68 Feel", "essence", "manuelle", 998, 69, 2016],
  ["Renault", "Zoé", "R110 Zen", "electrique", "automatique", undefined, 108, 2020],
  ["Toyota", "Aygo", "1.0 VVT-i 69 x-play", "essence", "manuelle", 998, 69, 2017],
  ["Peugeot", "108", "1.0 VTi 72 Active", "essence", "manuelle", 998, 72, 2018],
  ["Ford", "Focus", "1.6 TDCi 115 Titanium", "diesel", "manuelle", 1560, 114, 2012],
  ["Renault", "Kangoo", "1.5 dCi 90 Grand Confort", "diesel", "manuelle", 1461, 90, 2014],
  ["Citroën", "Berlingo", "1.6 BlueHDi 100 Feel", "diesel", "manuelle", 1560, 99, 2017],
  ["Renault", "Kadjar", "1.5 dCi 110 Intens", "diesel", "manuelle", 1461, 110, 2016],
  ["Citroën", "Xsara Picasso", "2.0 HDi 90 Exclusive", "diesel", "manuelle", 1997, 90, 2004],
  ["Peugeot", "508", "2.0 BlueHDi 150 Allure", "diesel", "manuelle", 1997, 150, 2016],
  ["Opel", "Astra", "1.7 CDTI 110 Cosmo", "diesel", "manuelle", 1686, 110, 2011],
  ["Citroën", "C4 Cactus", "1.2 PureTech 110 Shine", "essence", "manuelle", 1199, 110, 2017],
  ["Nissan", "Juke", "1.5 dCi 110 Acenta", "diesel", "manuelle", 1461, 110, 2014],
  ["Toyota", "C-HR", "122h Dynamic", "hybride", "automatique", 1798, 122, 2018],
  ["Nissan", "Micra", "1.2 80 Visia", "essence", "manuelle", 1198, 80, 2012],
  ["Seat", "Ibiza", "1.2 TSI 90 Style", "essence", "manuelle", 1197, 90, 2014],
  ["Ford", "Kuga", "2.0 TDCi 150 Titanium", "diesel", "manuelle", 1997, 150, 2016],
  ["Tesla", "Model 3", "Long Range Dual Motor", "electrique", "automatique", undefined, 351, 2020],
  ["Peugeot", "e-208", "136 GT", "electrique", "automatique", undefined, 136, 2021],
  ["Dacia", "Spring", "Electric 45 Comfort", "electrique", "automatique", undefined, 44, 2022],
  ["Kia", "Sportage", "1.6 CRDi 136 Active", "diesel", "manuelle", 1598, 136, 2019],
  ["Hyundai", "Tucson", "1.6 T-GDi 177 Executive", "essence", "automatique", 1591, 177, 2019],
];

const genericIds = new Set(GENERIC_ISSUES.map((g) => g.issue.id));
const toVehicle = ([make, model, version, fuel, gearbox, cc, hp, year]: Row): Vehicle => ({ make, model, version, country: "FR", firstRegistration: `${year}-06-15`, fuel, gearbox, displacementCc: cc, powerHp: hp, category: "voiture" });

describe("couverture de la base de pannes", () => {
  const rows = FLEET.map((r) => {
    const v = toVehicle(r);
    const specific = findKnownIssues(v, (2026 - r[7]) * 13000, NOW).filter((i) => !genericIds.has(i.id));
    return { label: `${r[0]} ${r[1]} ${r[2]} (${r[7]})`, n: specific.length, ids: specific.map((i) => i.id) };
  });
  it("trouve des pannes précises pour la grande majorité des versions courantes", () => {
    const covered = rows.filter((r) => r.n > 0).length;
    const pct = Math.round((covered / rows.length) * 100);
    console.log(`Couverture : ${covered}/${rows.length} versions (${pct} %)`);
    if (process.env.COVERAGE_DETAIL) for (const r of rows) console.log(r.label, "=>", r.ids.join(", "));
    for (const r of rows.filter((x) => x.n === 0)) console.log("  sans fiche :", r.label);
    expect(pct).toBeGreaterThanOrEqual(80);
  });
  it("ne mélange pas les générations d'un même moteur", () => {
    const golf = rows.find((r) => r.label.includes("Golf 1.4 TSI"))!;
    expect(golf.ids.some((i) => i.startsWith("ea111") || i.includes("ea111"))).toBe(true);
    for (const r of rows) {
      const fams = new Set(r.ids);
      expect(fams.size, r.label).toBe(r.ids.length);
    }
  });
});
