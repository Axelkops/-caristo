"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { buildChecklist } from "@/lib/engine/checklist";
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

  const sections = compact ? checklist.sections.filter((s) => ["moteur", "boite"].includes(s.id)) : checklist.sections;

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

      <div className={`grid grid-cols-1 ${compact ? "md:grid-cols-2" : "lg:grid-cols-2"} gap-4`}>
        {sections.map((s) => (
          <div key={s.id} className="rounded-2xl p-5 flex flex-col gap-3 bg-white/[0.04] border border-white/10">
            <h3 className="m-0 text-[15px] font-bold">{s.title} <span className="text-[12px] font-medium text-[#8E9AAF]">· {s.items.length}</span></h3>
            <ul className="m-0 p-0 list-none flex flex-col gap-2">
              {(compact ? s.items.slice(0, 5) : s.items).map((i) => (
                <li key={i.id} className="flex gap-3 items-start">
                  <span aria-hidden="true" className="mt-[5px] w-[14px] h-[14px] rounded-[4px] border border-[#8E9AAF]/60 shrink-0" />
                  <span className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[14px] leading-snug text-[#E5E9F0]">{i.text}</span>
                    {!compact && i.how && <span className="text-[12.5px] leading-snug text-[#8E9AAF]">{i.how}</span>}
                    <span className="flex flex-wrap gap-1.5"><span className="text-[11px] font-semibold" style={{ color: i.priority === "essentiel" ? "#FBBF24" : "#8E9AAF" }}>{i.priority === "essentiel" ? "Essentiel" : "Conseillé"}</span>{i.because && <span className="text-[11px] text-[#AEB6C4]">· {i.because}</span>}</span>
                  </span>
                </li>
              ))}
              {compact && s.items.length > 5 && <li className="text-[12px] text-[#8E9AAF]">+ {s.items.length - 5} autres points dans le rapport</li>}
            </ul>
          </div>
        ))}
      </div>
      {compact && <Link href="/points-a-verifier" className="self-start text-sm font-semibold text-accentsoft no-underline hover:underline">Voir la liste complète pour ce profil →</Link>}
    </div>
  );
}
