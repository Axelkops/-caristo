"use client";
import { useEffect, useState } from "react";
import { PARTY_LABEL, type Checklist, type ChecklistParty, type ChecklistSection } from "@/lib/engine/checklist";

/*
 * Points à vérifier avant l'achat : deux blocs bien distincts, « Côté vendeur » et « Côté acheteur »,
 * à cocher pendant la visite. Les cases cochées sont mémorisées dans le navigateur (par rapport).
 */

const C = { ok: "#34D399", warn: "#FBBF24", bad: "#F87171", neutral: "#8E9AAF", info: "#60A5FA" } as const;
const PARTY: Record<ChecklistParty, { color: string; tint: string; edge: string; icon: React.ReactNode }> = {
  vendeur: { color: "#FBBF24", tint: "rgba(251,191,36,0.08)", edge: "rgba(251,191,36,0.35)", icon: <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg> },
  acheteur: { color: "#60A5FA", tint: "rgba(96,165,250,0.08)", edge: "rgba(96,165,250,0.35)", icon: <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg> },
};

export function ChecklistPanel({ checklist, storageKey }: { checklist: Checklist; storageKey: string }) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<"tous" | "essentiel">("tous");
  const key = `caristo-checklist-${storageKey}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setDone(JSON.parse(raw));
    } catch { /* stockage indisponible : la liste reste utilisable sans mémoire */ }
  }, [key]);

  const toggle = (id: string) => {
    setDone((d) => {
      const next = { ...d, [id]: !d[id] };
      try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* ignoré */ }
      return next;
    });
  };

  const visible = (s: ChecklistSection) => s.items.filter((i) => filter === "tous" || i.priority === "essentiel");
  const items = checklist.sections.flatMap(visible);
  const checked = items.filter((i) => done[i.id]).length;
  const pct = items.length ? Math.round((checked / items.length) * 100) : 0;

  const Party = ({ party }: { party: ChecklistParty }) => {
    const sections = checklist.sections.filter((s) => s.party === party);
    const list = sections.flatMap(visible);
    const n = list.filter((i) => done[i.id]).length;
    const P = PARTY[party];
    return (
      <section className="rounded-2xl overflow-hidden flex flex-col" style={{ border: `1px solid ${P.edge}`, background: "rgba(7,15,31,0.55)" }} data-testid={`checklist-${party}`}>
        <header className="flex items-center justify-between gap-3 px-5 py-4" style={{ background: P.tint, borderBottom: `1px solid ${P.edge}` }}>
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: P.tint, color: P.color, border: `1px solid ${P.edge}`, boxShadow: `0 0 16px ${P.tint}` }}>{P.icon}</span>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold tracking-[1.6px] uppercase" style={{ color: P.color }}>{party}</span>
              <span className="text-[16px] font-bold text-white leading-tight">{PARTY_LABEL[party].title}</span>
            </div>
          </div>
          <span className="text-[13px] font-semibold whitespace-nowrap" style={{ color: P.color }}>{n} / {list.length}</span>
        </header>
        <p className="m-0 px-5 pt-4 text-[13px] text-[#8E9AAF]">{PARTY_LABEL[party].sub}</p>
        <div className="flex flex-col gap-5 p-5">
          {sections.map((s) => {
            const l = visible(s);
            if (!l.length) return null;
            return (
              <div key={s.id} className="flex flex-col gap-2">
                {sections.length > 1 && <h3 className="m-0 text-[14px] font-bold text-white flex items-center gap-2"><span aria-hidden="true" className="w-1.5 h-1.5 rounded-full" style={{ background: P.color }} />{s.title}<span className="text-[12px] font-medium text-[#8E9AAF]">· {s.sub}</span></h3>}
                <ul className="m-0 p-0 list-none flex flex-col gap-1.5">
                  {l.map((i) => (
                    <li key={i.id}>
                      <label className="flex gap-3 items-start cursor-pointer rounded-xl px-2 py-2 -mx-2 hover:bg-white/[0.04]">
                        <input type="checkbox" checked={Boolean(done[i.id])} onChange={() => toggle(i.id)} className="mt-1 w-[18px] h-[18px] shrink-0" style={{ accentColor: P.color }} aria-label={i.text} />
                        <span className="flex flex-col gap-0.5 min-w-0">
                          <span className={`text-[14px] leading-snug ${done[i.id] ? "line-through text-[#6B7689]" : "text-[#E5E9F0]"}`}>{i.text}</span>
                          {i.how && <span className="text-[12.5px] leading-snug text-[#8E9AAF]">{i.how}</span>}
                          <span className="flex flex-wrap gap-1.5">
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ color: i.priority === "essentiel" ? C.warn : C.neutral, background: i.priority === "essentiel" ? "rgba(251,191,36,0.10)" : "rgba(142,154,175,0.08)" }}>{i.priority === "essentiel" ? "Essentiel" : "Conseillé"}</span>
                            {i.because && <span className="text-[11px] px-2 py-0.5 rounded-full text-[#AEB6C4]" style={{ background: "rgba(255,255,255,0.06)" }}>{i.because}</span>}
                          </span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <div className="flex flex-col gap-6" data-testid="checklist">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex flex-wrap gap-2">
          {checklist.profile.map((p) => <span key={p} className="text-[12px] font-semibold px-3 py-1.5 rounded-full" style={{ background: "rgba(96,165,250,0.10)", color: C.info, border: "1px solid rgba(96,165,250,0.35)" }}>{p}</span>)}
        </div>
        <div className="flex items-center gap-2 no-print" role="group" aria-label="Filtrer les points">
          {(["tous", "essentiel"] as const).map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)} className="text-[12px] font-semibold px-3 py-1.5 rounded-full cursor-pointer" style={{ background: filter === f ? "rgba(255,255,255,0.14)" : "transparent", color: filter === f ? "#fff" : "#8E9AAF", border: "1px solid rgba(147,197,253,0.2)" }}>
              {f === "tous" ? `Tous (${checklist.total})` : `Essentiels (${checklist.essential})`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${pct}%`, background: pct === 100 ? C.ok : C.info, boxShadow: `0 0 10px ${pct === 100 ? C.ok : C.info}` }} />
        </div>
        <span className="text-[13px] text-[#AEB6C4] whitespace-nowrap" data-testid="checklist-progress">{checked} / {items.length} vérifié{checked > 1 ? "s" : ""}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <Party party="vendeur" />
        <Party party="acheteur" />
      </div>
    </div>
  );
}
