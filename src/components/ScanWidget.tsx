"use client";
import { useEffect, useRef, useState } from "react";

/*
 * Widget animé de l'accueil : une plaque fictive se saisit, chaque vérification s'allume l'une
 * après l'autre, puis l'indice de confiance s'affiche. Boucle toutes les ~12 s, un clic relance.
 * Les styles sont dans globals.css (préfixe .sw-).
 */

const ROWS = [
  { k: "Identification", v: "Peugeot 3008 · 2019", c: "ok" },
  { k: "Kilométrage", v: "118 215 km · cohérent", c: "ok" },
  { k: "Gage · opposition · vol", v: "Rien à signaler", c: "ok" },
  { k: "Sinistres", v: "Aucun enregistré", c: "ok" },
  { k: "Pannes connues", v: "1 point à vérifier", c: "warn" },
  { k: "Entretien à prévoir", v: "≈ 900 € sous 12 mois", c: "warn" },
  { k: "Prix de l'annonce", v: "500 € au-dessus de la cote", c: "warn" },
  { k: "Cote estimée", v: "12 000 – 13 500 €", c: "ok" },
] as const;
const PLATE = "ZZ-999-ZZ";
const SCORE = 81;
const LABEL = "Bon véhicule, 1 point à contrôler";
const CIRC = 150.8;

type Phase = "idle" | "scan" | "done";

export function ScanWidget() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [typed, setTyped] = useState(PLATE.length); // rendu complet côté serveur et sans animation
  const [vehicle, setVehicle] = useState(true);
  const [rowState, setRowState] = useState<("todo" | "scan" | "done")[]>(ROWS.map(() => "done"));
  const [score, setScore] = useState(SCORE);
  const [bar, setBar] = useState(100);
  const [fade, setFade] = useState(false);
  const [beamY, setBeamY] = useState(0);
  const rowsRef = useRef<HTMLUListElement>(null);
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    if (mq.matches) { setPhase("done"); return; }
    let cancelled = false;
    let run = 0;
    const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
    const ease = (p: number) => 1 - Math.pow(1 - p, 3);

    async function play() {
      const my = ++run;
      const alive = () => my === run && !cancelled;
      setFade(true); await wait(420); if (!alive()) return;
      setPhase("idle"); setTyped(0); setVehicle(false); setRowState(ROWS.map(() => "todo")); setScore(0); setBar(0); setBeamY(0);
      setFade(false);
      await wait(520); if (!alive()) return;
      for (let i = 1; i <= PLATE.length; i++) { setTyped(i); await wait(70); if (!alive()) return; }
      await wait(180); if (!alive()) return;
      setPhase("scan"); setBar(8);
      await wait(380); if (!alive()) return;
      for (let i = 0; i < ROWS.length; i++) {
        const li = rowsRef.current?.children[i] as HTMLElement | undefined;
        if (li) setBeamY(li.offsetTop + li.offsetHeight - 1);
        setRowState((st) => st.map((x, k) => (k === i ? "scan" : x)));
        await wait(i === 0 ? 640 : 520); if (!alive()) return;
        setRowState((st) => st.map((x, k) => (k === i ? "done" : x)));
        setBar(8 + ((i + 1) / ROWS.length) * 84);
        if (i === 0) setVehicle(true);
        await wait(140); if (!alive()) return;
      }
      if (rowsRef.current) setBeamY(rowsRef.current.offsetHeight + 8);
      await wait(200); if (!alive()) return;
      setPhase("done"); setBar(100);
      const t0 = performance.now();
      await new Promise<void>((res) => { const step = (t: number) => { const p = Math.min(1, (t - t0) / 1000); setScore(Math.round(SCORE * ease(p))); if (p < 1 && alive()) requestAnimationFrame(step); else res(); }; requestAnimationFrame(step); });
      await wait(3800); if (!alive()) return;
      play();
    }
    const onClick = () => play();
    const el = rowsRef.current?.parentElement;
    el?.addEventListener("click", onClick);
    play();
    return () => { cancelled = true; run++; el?.removeEventListener("click", onClick); };
  }, []);

  const warns = ROWS.filter((r) => r.c === "warn").length;
  return (
    <div className={`sw ${fade ? "sw-fade" : ""}`} data-phase={phase} aria-label="Exemple animé de rapport Caristo" data-testid="scan-widget">
      <div className="sw-bar"><i style={{ width: `${bar}%` }} /></div>
      <div className="sw-sheen" aria-hidden="true" />
      <div className="sw-inner">
        <div className="sw-head">
          <span className="sw-plate" aria-label={`Immatriculation ${PLATE}`}>
            <span className="sw-eu"><i />F</span>
            <span className="sw-n">{[...PLATE].map((ch, i) => <span key={i} className={`sw-c ${i < typed ? "on" : ""}`}>{ch}</span>)}{typed < PLATE.length && <span className="sw-caret" />}</span>
          </span>
          <span className="sw-status">
            <span className="sw-ic">
              <svg className="sw-dot" viewBox="0 0 14 14"><circle cx="7" cy="7" r="3.2" /></svg>
              <svg className="sw-spin" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M7 1.5a5.5 5.5 0 1 1-5.5 5.5" /></svg>
              <svg className="sw-check" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 7.5l3 3 6-6" /></svg>
            </span>
            <span>{phase === "done" ? "Rapport prêt" : phase === "scan" ? "Analyse" : "En attente"}</span>
          </span>
        </div>
        <div className={`sw-vehicle ${vehicle ? "on" : ""}`}><span className="sw-t">Peugeot 3008 1.5 BlueHDi 130</span><span className="sw-s">Mise en circulation 12/03/2019 · Diesel · Boîte automatique</span></div>
        <ul className="sw-rows" ref={rowsRef}>
          {ROWS.map((r, i) => (
            <li key={r.k} className={`sw-row ${rowState[i]}`} style={{ "--c": r.c === "warn" ? "var(--sw-warn)" : "var(--sw-ok)" } as React.CSSProperties}>
              <span className="sw-led" /><span className="sw-lbl">{r.k}</span>
              <span className="sw-val"><span className="sw-txt">{r.v}</span><span className="sw-dots" aria-hidden="true"><i /><i /><i /></span></span>
            </li>
          ))}
          <span className="sw-beam" aria-hidden="true" style={{ transform: `translateY(${beamY}px)` }} />
        </ul>
        <div className="sw-foot">
          <div className="sw-ring">
            <svg viewBox="0 0 58 58"><circle className="sw-ring-bg" cx="29" cy="29" r="24" /><circle className="sw-ring-fg" cx="29" cy="29" r="24" style={{ strokeDashoffset: phase === "done" ? CIRC * (1 - SCORE / 100) : CIRC }} /></svg>
            <div className="sw-num">{phase === "done" ? <>{score}<small>%</small></> : "—"}</div>
          </div>
          <div className="sw-score"><span className="sw-k">Indice de confiance</span><span className="sw-v">{phase === "done" ? LABEL : "Analyse en cours"}</span></div>
          <span className="sw-cta">Voir le rapport</span>
        </div>
      </div>
      {reduced && <span className="sr-only">{`${warns} points à vérifier sur l'exemple`}</span>}
    </div>
  );
}
