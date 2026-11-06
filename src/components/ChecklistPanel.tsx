"use client";
import { useEffect, useState } from "react";
import type { Checklist } from "@/lib/engine/checklist";

/*
 * Points à vérifier avant l'achat : liste à cocher pendant la visite.
 * Les cases cochées sont mémorisées dans le navigateur (par rapport), rien n'est envoyé au serveur.
 */

const C = { ok: "#34D399", warn: "#FBBF24", bad: "#F87171", neutral: "#8E9AAF", info: "#60A5FA" } as const;

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

  const items = checklist.sections.flatMap((s) => s.items).filter((i) => filter === "tous" || i.priority === "essentiel");
  const checked = items.filter((i) => done[i.id]).length;
  const pct = items.length ? Math.round((checked / items.length) * 100) : 0;

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {checklist.sections.map((s) => {
          const list = s.items.filter((i) => filter === "tous" || i.priority === "essentiel");
          if (!list.length) return null;
          return (
            <div key={s.id} className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: "rgba(7,15,31,0.55)", border: "1px solid rgba(147,197,253,0.12)" }}>
              <h3 className="m-0 text-[15px] font-bold text-white flex items-center justify-between gap-2">{s.title}<span className="text-[12px] font-medium text-[#8E9AAF]">{list.filter((i) => done[i.id]).length}/{list.length}</span></h3>
              <ul className="m-0 p-0 list-none flex flex-col gap-2">
                {list.map((i) => (
                  <li key={i.id}>
                    <label className="flex gap-3 items-start cursor-pointer rounded-xl px-2 py-2 -mx-2 hover:bg-white/[0.04]">
                      <input type="checkbox" checked={Boolean(done[i.id])} onChange={() => toggle(i.id)} className="mt-1 w-[18px] h-[18px] shrink-0 accent-[#60A5FA]" aria-label={i.text} />
                      <span className="flex flex-col gap-1 min-w-0">
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
    </div>
  );
}
