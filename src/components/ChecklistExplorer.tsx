"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { buildChecklist, PARTY_LABEL, type ChecklistParty } from "@/lib/engine/checklist";
import type { Fuel, Gearbox, Vehicle } from "@/lib/engine/types";

/*
 * Explorateur public : la même liste que dans le rapport, pilotée par quelques réglages,
 * pour montrer qu'elle change vraiment selon le véhicule.
 */

const FUELS: { v: Fuel; l: string }[] = [
  { v: "essence", l: "Essence" }, { v: "diesel", l: "Diesel" }, { v: "hybride", l: "Hybride" }, { v: "hybride_rechargeable", l: "Hybride rechargeable" }, { v: "electrique", l: "Électrique" }, { v: "gpl", l: "GPL" },
];
const GEARS: { v: Gearbox; l: string; version: string }[] = [
  { v: "manuelle", l: "Manuelle", version: "" }, { v: "automatique", l: "Auto. double embrayage", version: "DSG" }, { v: "automatique", l: "Auto. convertisseur", version: "EAT8" }, { v: "automatique", l: "Auto. CVT", version: "CVT" },
];
const AGES = [1, 3, 6, 10, 15];
const PARTY_STYLE: Record<ChecklistParty, { color: string; tint: string; edge: string }> = {
  vendeur: { color: "#FBBF24", tint: "rgba(251,191,36,0.08)", edge: "rgba(251,191,36,0.35)" },
  acheteur: { color: "#60A5FA", tint: "rgba(96,165,250,0.08)", edge: "rgba(96,165,250,0.35)" },
};
const KMS = [15000, 60000, 110000, 170000, 240000];

export function ChecklistExplorer({ compact = false }: { compact?: boolean }) {
  const [fuel, setFuel] = useState<Fuel>("diesel");
  const [gear, setGear] = useState(0);
  const [age, setAge] = useState(6);
  const [km, setKm] = useState(110000);

  const checklist = useMemo(() => {
    const now = new Date();
    const first = new Date(now); first.setFullYear(first.getFullYear() - age);
    const g = fuel === "electrique" ? { v: "automatique" as Gearbox, version: "" } : GEARS[gear];
    const vehicle: Vehicle = { make: "Exemple", model: "", version: g.version, country: "FR", firstRegistration: first.toISOString().slice(0, 10), fuel, gearbox: g.v, category: "voiture" };
    return buildChecklist({ vehicle, mileage: km, now });
  }, [fuel, gear, age, km]);

  const Pill = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button type="button" onClick={onClick} className="text-[13px] font-semibold px-3.5 py-2 rounded-full cursor-pointer transition-colors" style={{ background: on ? "#2563EB" : "rgba(255,255,255,0.06)", color: on ? "#fff" : "#C8D0DC", border: `1px solid ${on ? "#2563EB" : "rgba(147,197,253,0.2)"}` }}>{children}</button>
  );


  return (
    <div className="flex flex-col gap-6 text-white" data-testid="checklist-explorer">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2 items-center"><span className="text-[12px] text-[#8E9AAF] w-20">Énergie</span>{FUELS.map((f) => <Pill key={f.v} on={fuel === f.v} onClick={() => setFuel(f.v)}>{f.l}</Pill>)}</div>
        {fuel !== "electrique" && <div className="flex flex-wrap gap-2 items-center"><span className="text-[12px] text-[#8E9AAF] w-20">Boîte</span>{GEARS.map((g, i) => <Pill key={g.l} on={gear === i} onClick={() => setGear(i)}>{g.l}</Pill>)}</div>}
        <div className="flex flex-wrap gap-2 items-center"><span className="text-[12px] text-[#8E9AAF] w-20">Âge</span>{AGES.map((a) => <Pill key={a} on={age === a} onClick={() => setAge(a)}>{a} an{a > 1 ? "s" : ""}</Pill>)}</div>
        <div className="flex flex-wrap gap-2 items-center"><span className="text-[12px] text-[#8E9AAF] w-20">Kilométrage</span>{KMS.map((k) => <Pill key={k} on={km === k} onClick={() => setKm(k)}>{k.toLocaleString("fr-FR")} km</Pill>)}</div>
      </div>

      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex flex-wrap gap-2">{checklist.profile.map((p) => <span key={p} className="text-[12px] font-semibold px-3 py-1.5 rounded-full" style={{ background: "rgba(96,165,250,0.10)", color: "#60A5FA", border: "1px solid rgba(96,165,250,0.35)" }}>{p}</span>)}</div>
        <span className="text-[13px] text-[#AEB6C4]" data-testid="explorer-count">{checklist.essential} essentiels · {checklist.total} points</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
        {(["vendeur", "acheteur"] as const).map((party) => {
          const P = PARTY_STYLE[party];
          const secs = checklist.sections.filter((s) => s.party === party);
          const count = secs.reduce((n, s) => n + s.items.length, 0);
          return (
            <section key={party} className="rounded-2xl overflow-hidden flex flex-col" style={{ border: `1px solid ${P.edge}`, background: "rgba(255,255,255,0.03)" }}>
              <header className="flex items-center justify-between gap-3 px-5 py-4" style={{ background: P.tint, borderBottom: `1px solid ${P.edge}` }}>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold tracking-[1.6px] uppercase" style={{ color: P.color }}>{party}</span>
                  <span className="text-[16px] font-bold leading-tight">{PARTY_LABEL[party].title}</span>
                </div>
                <span className="text-[13px] font-semibold" style={{ color: P.color }}>{count} point{count > 1 ? "s" : ""}</span>
              </header>
              <p className="m-0 px-5 pt-4 text-[13px] text-[#8E9AAF]">{PARTY_LABEL[party].sub}</p>
              <div className="flex flex-col gap-5 p-5">
                {secs.map((s) => {
                  const list = compact ? s.items.slice(0, 4) : s.items;
                  return (
                    <div key={s.id} className="flex flex-col gap-2">
                      {secs.length > 1 && <h3 className="m-0 text-[14px] font-bold flex items-center gap-2"><span aria-hidden="true" className="w-1.5 h-1.5 rounded-full" style={{ background: P.color }} />{s.title}</h3>}
                      <ul className="m-0 p-0 list-none flex flex-col gap-2">
                        {list.map((i) => (
                          <li key={i.id} className="flex gap-3 items-start">
                            <span aria-hidden="true" className="mt-[5px] w-[14px] h-[14px] rounded-[4px] border shrink-0" style={{ borderColor: P.edge }} />
                            <span className="flex flex-col gap-0.5 min-w-0">
                              <span className="text-[14px] leading-snug text-[#E5E9F0]">{i.text}</span>
                              {!compact && i.how && <span className="text-[12.5px] leading-snug text-[#8E9AAF]">{i.how}</span>}
                              <span className="flex flex-wrap gap-1.5"><span className="text-[11px] font-semibold" style={{ color: i.priority === "essentiel" ? "#FBBF24" : "#8E9AAF" }}>{i.priority === "essentiel" ? "Essentiel" : "Conseillé"}</span>{i.because && <span className="text-[11px] text-[#AEB6C4]">· {i.because}</span>}</span>
                            </span>
                          </li>
                        ))}
                        {compact && s.items.length > 4 && <li className="text-[12px] text-[#8E9AAF]">+ {s.items.length - 4} autres points dans le rapport</li>}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
      {compact && <Link href="/points-a-verifier" className="self-start text-sm font-semibold text-accentsoft no-underline hover:underline">Voir la liste complète pour ce profil →</Link>}
    </div>
  );
}
