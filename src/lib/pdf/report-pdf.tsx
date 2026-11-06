import React from "react";
import path from "node:path";
import { Document, Page, Text, View, StyleSheet, Font, Svg, Path, Circle, Line, Rect, Polyline, Text as SvgText, renderToBuffer } from "@react-pdf/renderer";
import type { ReportData, Inspection } from "../engine/types";
import { buildChecklist, PARTY_LABEL, type Checklist } from "../engine/checklist";
import { approxCost } from "../engine/maintenance";
import { FUEL_LABEL, GEARBOX_LABEL } from "../engine/labels";
import { SITE } from "../site";


/* ------------------------------------------------------------------ */
/* Polices : Inter (texte) et Manrope (titres), embarquées dans le dépôt */
/* ------------------------------------------------------------------ */
const FONT_DIR = path.join(process.cwd(), "src/assets/fonts");
let fontsReady = false;
function registerFonts() {
  if (fontsReady) return;
  Font.register({ family: "Inter", fonts: [400, 500, 600, 700].map((w) => ({ src: path.join(FONT_DIR, `inter-latin-${w}-normal.woff`), fontWeight: w })) });
  Font.register({ family: "Manrope", fonts: [600, 700, 800].map((w) => ({ src: path.join(FONT_DIR, `manrope-latin-${w}-normal.woff`), fontWeight: w })) });
  Font.registerHyphenationCallback((word) => [word]);
  fontsReady = true;
}

/* ------------------------------------------------------------------ */
/* Palette et styles                                                    */
/* ------------------------------------------------------------------ */
const INK = "#070F1F", NAVY = "#0A1E3F", ACCENT = "#2563EB", OK = "#10B981", WARN = "#F59E0B", BAD = "#DC2626", INFO = "#3B82F6", MUTED = "#6B7280", MUTED2 = "#9AA3B2", LINE = "#E5E7EB", GROUND = "#F5F7FA", TEXT = "#111318";
type Tone = "ok" | "warn" | "bad" | "info" | "neutral";
const TONE: Record<Tone, string> = { ok: OK, warn: WARN, bad: BAD, info: INFO, neutral: MUTED2 };
const TINT: Record<Tone, string> = { ok: "#ECFDF5", warn: "#FFFBEB", bad: "#FEF2F2", info: "#EFF6FF", neutral: "#F3F4F6" };

const PAGE_W = 595.28, M = 40, CW = PAGE_W - 2 * M;

const s = StyleSheet.create({
  page: { paddingTop: 54, paddingBottom: 58, paddingHorizontal: M, fontSize: 9.5, fontFamily: "Inter", color: TEXT },
  cover: { paddingTop: 0, paddingBottom: 58, paddingHorizontal: 0, fontSize: 9.5, fontFamily: "Inter", color: TEXT },
  topbar: { height: 34, marginBottom: 20, backgroundColor: INK, flexDirection: "row", alignItems: "center", paddingHorizontal: M },
  topbarText: { color: "#AEB6C4", fontSize: 8, fontWeight: 500 },
  footer: { position: "absolute", bottom: 22, left: M, right: M, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 0.6, borderTopColor: LINE, paddingTop: 8 },
  footerText: { fontSize: 7.5, color: MUTED },
  h1: { fontFamily: "Manrope", fontWeight: 800, fontSize: 28, color: "#FFFFFF" },
  h2: { fontFamily: "Manrope", fontWeight: 800, fontSize: 16, color: NAVY },
  h3: { fontFamily: "Manrope", fontWeight: 700, fontSize: 11, color: NAVY },
  sub: { fontSize: 8.5, color: MUTED, marginTop: 2 },
  section: { marginTop: 18 },
  sectionHead: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 10, paddingBottom: 6, borderBottomWidth: 1.2, borderBottomColor: NAVY },
  tag: { fontSize: 7.5, fontWeight: 600, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 9 },
  card: { borderWidth: 0.8, borderColor: LINE, borderRadius: 8, padding: 10, backgroundColor: "#FFFFFF" },
  tile: { flex: 1, borderRadius: 8, padding: 9, minHeight: 50 },
  tileLabel: { fontSize: 7.5, color: MUTED, marginBottom: 3 },
  tileValue: { fontSize: 10.5, fontWeight: 700, fontFamily: "Manrope" },
  tr: { flexDirection: "row", borderBottomWidth: 0.6, borderBottomColor: LINE, paddingVertical: 5, alignItems: "flex-start" },
  trHead: { flexDirection: "row", backgroundColor: GROUND, paddingVertical: 5, borderRadius: 4, marginBottom: 2 },
  th: { fontSize: 7.5, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: 0.4, paddingHorizontal: 5 },
  td: { fontSize: 8.8, paddingHorizontal: 5 },
  small: { fontSize: 8, color: MUTED },
  chip: { fontSize: 8, color: "#C8D0DC", backgroundColor: "#1B2A44", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, marginRight: 5, marginBottom: 5 },
  check: { width: 9.5, height: 9.5, borderWidth: 0.9, borderColor: "#9AA3B2", borderRadius: 2.5, marginRight: 7, marginTop: 2 },
});

/* ------------------------------------------------------------------ */
/* Utilitaires                                                          */
/* ------------------------------------------------------------------ */
const clean = (t: string) => t.replace(/[\u202F\u00A0]/g, " ").replace(/≈\s?/g, "env. ");
const nf = (n: number) => clean(n.toLocaleString("fr-FR"));
const km = (n: number) => `${nf(n)} km`;
const fd = (iso?: string) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "");
const eur = (n?: number) => (n === undefined ? "" : `${nf(n)} €`);
const range = (a?: number, b?: number) => (a === undefined && b === undefined ? "" : a === b ? eur(a) : `${nf(a ?? 0)} – ${nf(b ?? 0)} €`);
const plural = (n: number, one: string, many?: string) => `${n} ${n > 1 ? (many ?? one + "s") : one}`;
const KIND: Record<Inspection["kind"], string> = { periodique: "Périodique", contre_visite: "Contre-visite", import: "Import", autre: "Autre" };
const RESULT: Record<Inspection["result"], string> = { favorable: "Favorable", defavorable: "Défavorable", contre_visite: "Contre-visite", inconnu: "—" };

const Tag = ({ tone, children }: { tone: Tone; children: React.ReactNode }) => <Text style={[s.tag, { color: TONE[tone], backgroundColor: TINT[tone] }]}>{children}</Text>;
const Led = ({ tone, size = 6 }: { tone: Tone; size?: number }) => <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: TONE[tone] }} />;

function SectionHead({ title, sub, badge }: { title: string; sub?: string; badge?: React.ReactNode }) {
  return (
    <View style={s.sectionHead} minPresenceAhead={150}>
      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text style={s.h2}>{title}</Text>
        {sub && <Text style={s.sub}>{clean(sub)}</Text>}
      </View>
      {badge}
    </View>
  );
}

/* Jauge demi-anneau : segments colorés rouge → ambre → vert, repère blanc, pourcentage au centre. */
function Gauge({ percent, tone }: { percent: number; tone: Tone }) {
  const cx = 100, cy = 92, R = 70, segs = 48;
  const pt = (deg: number, r: number) => [cx + r * Math.cos((deg * Math.PI) / 180), cy + r * Math.sin((deg * Math.PI) / 180)] as const;
  const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);
  const colorAt = (t: number) => {
    const [r1, g1, b1] = t < 0.5 ? [248, 113, 113] : [251, 191, 36];
    const [r2, g2, b2] = t < 0.5 ? [251, 191, 36] : [52, 211, 153];
    const u = t < 0.5 ? t * 2 : (t - 0.5) * 2;
    return `rgb(${lerp(r1, r2, u)},${lerp(g1, g2, u)},${lerp(b1, b2, u)})`;
  };
  const ang = -180 + (180 * Math.max(2, Math.min(98, percent))) / 100;
  const [mx, my] = pt(ang, R);
  return (
    <Svg width="200" height="112" viewBox="0 0 200 112">
      {Array.from({ length: segs }, (_, i) => {
        const a0 = -180 + (180 * i) / segs, a1 = -180 + (180 * (i + 1)) / segs + 0.8;
        const [x0, y0] = pt(a0, R), [x1, y1] = pt(a1, R);
        const lit = a1 <= ang + 2;
        return <Path key={i} d={`M${x0.toFixed(2)} ${y0.toFixed(2)} A${R} ${R} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`} stroke={colorAt(i / segs)} strokeWidth={10} strokeOpacity={lit ? 1 : 0.22} fill="none" strokeLinecap="butt" />;
      })}
      <Circle cx={mx} cy={my} r={9} fill={TONE[tone]} fillOpacity={0.35} />
      <Circle cx={mx} cy={my} r={5} fill="#FFFFFF" />
      <SvgText x={cx} y={cy - 4} textAnchor="middle" style={{ fontFamily: "Manrope", fontWeight: 800, fontSize: 30, fill: "#F3F6FA" }}>{`${percent} %`}</SvgText>
      <SvgText x={cx - R - 2} y={cy + 14} textAnchor="middle" style={{ fontFamily: "Inter", fontSize: 7.5, fill: "#5B6779" }}>0</SvgText>
      <SvgText x={cx + R + 2} y={cy + 14} textAnchor="middle" style={{ fontFamily: "Inter", fontSize: 7.5, fill: "#5B6779" }}>100</SvgText>
    </Svg>
  );
}

/* Plaque française stylisée */
function Plate({ value }: { value: string }) {
  return (
    <View style={{ flexDirection: "row", borderRadius: 4, overflow: "hidden", borderWidth: 1, borderColor: "#C9D3E3" }}>
      <View style={{ backgroundColor: "#0B3BB0", paddingHorizontal: 4, justifyContent: "flex-end", paddingBottom: 3 }}><View style={{ width: 6, height: 6, borderRadius: 3, borderWidth: 1, borderColor: "#FFD400", marginBottom: 2, alignSelf: "center" }} /><Text style={{ color: "#FFFFFF", fontSize: 7, fontWeight: 700 }}>F</Text></View>
      <View style={{ backgroundColor: "#F5F7FA", paddingHorizontal: 8, paddingVertical: 3, justifyContent: "center" }}><Text style={{ fontFamily: "Manrope", fontWeight: 800, fontSize: 14, letterSpacing: 2.2, color: TEXT }}>{value}</Text></View>
    </View>
  );
}

/* Courbe des kilométrages relevés */
function KmChart({ readings, mileage }: { readings: { date: string; mileage: number }[]; mileage?: number }) {
  const W = CW, H = 124, L = 42, R = 44, T = 16, B = 26;
  const pts = [...readings].sort((a, b) => a.date.localeCompare(b.date));
  const xs = pts.map((p) => new Date(p.date).getTime());
  const minX = Math.min(...xs), maxX = Math.max(...xs, minX + 1);
  const maxY = Math.max(mileage ?? 0, ...pts.map((p) => p.mileage)) * 1.08 || 1;
  const X = (t: number) => L + ((t - minX) / (maxX - minX)) * (W - L - R);
  const Y = (v: number) => T + (1 - v / maxY) * (H - T - B);
  const poly = pts.map((p) => `${X(new Date(p.date).getTime()).toFixed(1)},${Y(p.mileage).toFixed(1)}`).join(" ");
  const grid = [0.25, 0.5, 0.75, 1].map((f) => Math.round((maxY * f) / 1000) * 1000);
  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {grid.map((g) => (
        <React.Fragment key={g}>
          <Line x1={L} y1={Y(g)} x2={W - R} y2={Y(g)} stroke={LINE} strokeWidth={0.6} />
          <SvgText x={L - 4} y={Y(g) + 2.5} textAnchor="end" style={{ fontFamily: "Inter", fontSize: 6.5, fill: MUTED }}>{`${Math.round(g / 1000)}k`}</SvgText>
        </React.Fragment>
      ))}
      <Polyline points={poly} fill="none" stroke={ACCENT} strokeWidth={1.8} strokeLinejoin="round" />
      {pts.map((p, i) => {
        const x = X(new Date(p.date).getTime()), y = Y(p.mileage);
        const back = i > 0 && p.mileage < pts[i - 1].mileage;
        return (
          <React.Fragment key={p.date + i}>
            <Circle cx={x} cy={y} r={3.2} fill={back ? BAD : ACCENT} stroke="#FFFFFF" strokeWidth={1} />
            <SvgText x={x} y={i % 2 ? y + 12 : y - 7} textAnchor={i === 0 ? "start" : i === pts.length - 1 ? "end" : "middle"} style={{ fontFamily: "Inter", fontSize: 6.5, fill: back ? BAD : TEXT }}>{km(p.mileage)}</SvgText>
            <SvgText x={x} y={H - 10} textAnchor={i === 0 ? "start" : i === pts.length - 1 ? "end" : "middle"} style={{ fontFamily: "Inter", fontSize: 6.5, fill: MUTED }}>{fd(p.date)}</SvgText>
          </React.Fragment>
        );
      })}
      {mileage !== undefined && (
        <React.Fragment>
          <Line x1={L} y1={Y(mileage)} x2={W - R} y2={Y(mileage)} stroke={WARN} strokeWidth={0.8} strokeDasharray="3 2" />
          <SvgText x={W - R + 3} y={Y(mileage) + 2.5} textAnchor="start" style={{ fontFamily: "Inter", fontSize: 6.5, fill: WARN }}>{`Saisi`}</SvgText>
        </React.Fragment>
      )}
    </Svg>
  );
}

/* Barre de cote avec curseur du prix demandé */
function PriceBar({ low, high, asking }: { low: number; high: number; asking?: number }) {
  const W = CW, H = 46;
  const span = Math.max(1, high - low);
  const minV = low - span * 0.6, maxV = high + span * 0.6;
  const X = (v: number) => ((v - minV) / (maxV - minV)) * W;
  const ax = asking !== undefined ? Math.min(W - 2, Math.max(2, X(asking))) : 0;
  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Rect x={0} y={16} width={W} height={8} rx={4} fill={GROUND} />
      <Rect x={X(low)} y={16} width={X(high) - X(low)} height={8} rx={4} fill={OK} fillOpacity={0.85} />
      <Line x1={X(low)} y1={10} x2={X(low)} y2={30} stroke={NAVY} strokeWidth={1.2} />
      <Line x1={X(high)} y1={10} x2={X(high)} y2={30} stroke={NAVY} strokeWidth={1.2} />
      <SvgText x={X(low)} y={41} textAnchor="middle" style={{ fontFamily: "Inter", fontSize: 7.5, fill: TEXT }}>{eur(low)}</SvgText>
      <SvgText x={X(high)} y={41} textAnchor="middle" style={{ fontFamily: "Inter", fontSize: 7.5, fill: TEXT }}>{eur(high)}</SvgText>
      <SvgText x={(X(low) + X(high)) / 2} y={8} textAnchor="middle" style={{ fontFamily: "Inter", fontSize: 7, fill: MUTED }}>Cote estimée</SvgText>
      {asking !== undefined && (
        <React.Fragment>
          <Line x1={ax} y1={6} x2={ax} y2={34} stroke={WARN} strokeWidth={2.2} />
          <SvgText x={ax > W - 90 ? ax - 5 : ax + 5} y={8} textAnchor={ax > W - 90 ? "end" : "start"} style={{ fontFamily: "Inter", fontSize: 7.5, fontWeight: 700, fill: WARN }}>{`Demandé : ${eur(asking)}`}</SvgText>
        </React.Fragment>
      )}
    </Svg>
  );
}

/* Barre « zone de panne » : apparition → pic, repère du véhicule */
function IssueBar({ fromKm, peakKm, vehicleKm, tone }: { fromKm?: number; peakKm?: number; vehicleKm: number; tone: Tone }) {
  const W = 150, H = 10;
  const max = Math.max(vehicleKm, peakKm ?? 0, fromKm ?? 0, 1) * 1.15;
  const X = (v: number) => (v / max) * W;
  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Rect x={0} y={3} width={W} height={4} rx={2} fill={GROUND} />
      {fromKm !== undefined && <Rect x={X(fromKm)} y={3} width={Math.max(2, X(peakKm ?? max) - X(fromKm))} height={4} rx={2} fill={TONE[tone]} fillOpacity={0.8} />}
      <Rect x={Math.max(0, X(vehicleKm) - 1)} y={0} width={2} height={H} fill={NAVY} />
    </Svg>
  );
}

/* Barres fixes : en-tête et pied de page */
const TopBar = ({ r }: { r: ReportData }) => (
  <View fixed render={({ pageNumber }) => pageNumber > 1 ? (
    <View style={s.topbar}>
      <Text style={[s.topbarText, { color: "#FFFFFF", fontFamily: "Manrope", fontWeight: 800, fontSize: 10, marginRight: 10 }]}>Caristo</Text>
      <Text style={s.topbarText}>{`Rapport ${r.reference}  ·  ${r.vehicle.make} ${r.vehicle.model}${r.vehicle.plate ? `  ·  ${r.vehicle.plate}` : ""}`}</Text>
    </View>
  ) : <View />} />
);
const Footer = () => (
  <View style={s.footer} fixed>
    <Text style={s.footerText}>{`${SITE.name} · ${SITE.domain}`}</Text>
    <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
  </View>
);

/* ------------------------------------------------------------------ */
/* Le document                                                          */
/* ------------------------------------------------------------------ */
export function Pdf({ r }: { r: ReportData }) {
  const v = r.vehicle, h = r.history;
  const issued = new Date(r.issuedAt);
  const scoreTone: Tone = r.score <= "B" ? "ok" : r.score === "C" ? "warn" : "bad";
  const readings = [...h.mileageReadings].sort((a, b) => a.date.localeCompare(b.date));
  const inZoneHigh = r.knownIssues.filter((i) => i.severity === "high" && i.inZone);
  const inZone = r.knownIssues.filter((i) => i.inZone);
  const openRecalls = r.recalls.filter((x) => x.status === "open");
  const checklist = r.checklist ?? buildChecklist({ vehicle: v, mileage: r.mileage, history: h, knownIssues: r.knownIssues, recalls: r.recalls, now: issued });
  const specs = [FUEL_LABEL[v.fuel], GEARBOX_LABEL[v.gearbox], v.powerHp ? `${v.powerHp} ch` : "", v.fiscalPower ? `${v.fiscalPower} CV` : "", v.firstRegistration ? `Mise en circulation ${fd(v.firstRegistration)}` : "", r.mileage !== undefined ? km(r.mileage) : "", v.critAir ? `Crit'Air ${v.critAir}` : "", v.color ?? ""].filter(Boolean);

  const lights: { label: string; value: string; tone: Tone; sub?: string }[] = [
    { label: "Kilométrage", value: r.mileageCheck.consistent === false ? "Incohérent" : r.mileageCheck.consistent ? "Cohérent" : "Non vérifiable", tone: r.mileageCheck.consistent === false ? "bad" : r.mileageCheck.consistent ? "ok" : "neutral", sub: readings.length ? plural(readings.length, "relevé officiel", "relevés officiels") : r.mileage ? `${km(r.mileage)} saisis` : undefined },
    { label: "Gage, opposition, vol", value: !h.available ? "Non vérifié" : h.stolen ? "Déclaré volé" : h.opposition ? "Opposition" : h.pledge ? "Gage inscrit" : "Rien à signaler", tone: !h.available ? "neutral" : h.stolen || h.opposition ? "bad" : h.pledge ? "warn" : "ok" },
    { label: "Sinistres", value: !h.available ? "Non vérifié" : h.claims.length || h.damagedProcedure ? plural(h.claims.length || 1, "enregistré") : "Aucun enregistré", tone: !h.available ? "neutral" : h.claims.length || h.damagedProcedure ? "warn" : "ok" },
    { label: "Pannes connues", value: inZoneHigh.length ? `${inZoneHigh.length} à vérifier en priorité` : inZone.length ? `${plural(inZone.length, "point")} à contrôler` : "Rien de notable", tone: inZoneHigh.length ? "bad" : inZone.length ? "warn" : "ok" },
    { label: "Origine", value: v.imported ? "Importé" : v.country === "FR" ? "France depuis l'origine" : `Immatriculé : ${v.country}`, tone: v.imported ? "warn" : "ok", sub: v.imported && v.firstRegistrationInCountry ? `En France depuis ${fd(v.firstRegistrationInCountry)}` : undefined },
    { label: "Cote estimée", value: r.valuation?.verdict === "au_dessus" ? `${eur(r.valuation.deltaToHigh)} au-dessus` : r.valuation?.verdict === "sous_la_cote" ? "Sous la cote" : r.valuation?.verdict === "dans_la_cote" ? "Dans la cote" : range(r.valuation?.low, r.valuation?.high), tone: r.valuation?.verdict === "au_dessus" ? "warn" : r.valuation?.verdict ? "ok" : "info", sub: r.valuation?.askingPrice ? `Annonce : ${eur(r.valuation.askingPrice)}` : "Cote estimée" },
  ];

  const issueCard = (i: ReportData["knownIssues"][number]) => {
    const tone: Tone = i.severity === "high" && i.inZone ? "bad" : i.inZone ? "warn" : i.severity === "info" ? "info" : "neutral";
    return (
      <View key={i.id} style={[s.card, { marginBottom: 6, borderLeftWidth: 3, borderLeftColor: TONE[tone] }]} wrap={false}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontFamily: "Manrope", fontWeight: 700, fontSize: 10, flex: 1 }}>{clean(i.title)}</Text>
          <Tag tone={tone}>{i.severity === "high" && i.inZone ? "À vérifier en priorité" : i.inZone ? "Fréquent à ce stade" : "Pas encore concerné"}</Tag>
        </View>
        <Text style={{ fontSize: 8.8, marginTop: 3, color: "#374151" }}>{clean(i.description)}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
          {(i.fromKm !== undefined || i.peakKm !== undefined) && r.mileage !== undefined && (
            <View style={{ flexDirection: "row", alignItems: "center" }}><IssueBar fromKm={i.fromKm} peakKm={i.peakKm} vehicleKm={r.mileage} tone={tone} /><Text style={[s.small, { marginLeft: 6 }]}>{i.fromKm ? `dès ${km(i.fromKm)}` : ""}{i.peakKm ? ` · pic ${km(i.peakKm)}` : ""}</Text></View>
          )}
          <Text style={[s.small, { marginLeft: "auto" }]}>{i.costMin || i.costMax ? `Réparation : ${range(i.costMin, i.costMax)}` : "Vérification sans frais"}</Text>
        </View>
        <View style={{ flexDirection: "row", marginTop: 5, backgroundColor: GROUND, borderRadius: 5, padding: 6 }}><Text style={{ fontSize: 8, fontWeight: 600, color: NAVY, marginRight: 5 }}>À faire :</Text><Text style={{ fontSize: 8.5, flex: 1 }}>{clean(i.whatToCheck)}</Text></View>
      </View>
    );
  };

  const recallCard = (x: ReportData["recalls"][number], i: number) => (
            <View key={i} style={[s.card, { marginBottom: 5, borderLeftWidth: 3, borderLeftColor: x.status === "done" ? OK : x.status === "open" ? WARN : MUTED2 }]} wrap={false}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}><Text style={{ fontWeight: 600, fontSize: 9, flex: 1 }}>{clean(x.title)}</Text><Text style={[s.small, { marginLeft: 8 }]}>{fd(x.date)} · {x.status === "done" ? "fait" : x.status === "open" ? "à faire" : "à vérifier"}</Text></View>
              {x.description && <Text style={[s.small, { marginTop: 2 }]}>{clean(x.description)}</Text>}
            </View>
  );

  const checkItem = (i: Checklist["sections"][number]["items"][number]) => (
              <View key={i.id} style={{ flexDirection: "row", marginBottom: 4.5, paddingLeft: 9 }} wrap={false}>
                <View style={s.check} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 9, fontWeight: i.priority === "essentiel" ? 600 : 400 }}>{clean(i.text)}</Text>
                  {i.how && <Text style={{ fontSize: 8, color: MUTED, marginTop: 1 }}>{clean(i.how)}</Text>}
                  <Text style={{ fontSize: 7.3, marginTop: 1.5, color: i.priority === "essentiel" ? "#B45309" : MUTED2, fontWeight: 600 }}>{i.priority === "essentiel" ? "ESSENTIEL" : "CONSEILLÉ"}{i.because ? `  ·  ${clean(i.because)}` : ""}</Text>
                </View>
              </View>
  );

  return (
    <Document title={`Rapport Caristo ${r.reference}`} author="Caristo" subject={`${v.make} ${v.model}`} creator="Caristo" producer="Caristo">
      {/* ===================== Page 1 : couverture + vue d'ensemble ===================== */}
      <Page size="A4" style={s.cover}>
        <TopBar r={r} />
        <View style={{ backgroundColor: INK, paddingTop: 34, paddingBottom: 28, paddingHorizontal: M }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: ACCENT, marginRight: 7, alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#fff", fontFamily: "Manrope", fontWeight: 800, fontSize: 12 }}>C</Text></View>
              <Text style={{ color: "#FFFFFF", fontFamily: "Manrope", fontWeight: 800, fontSize: 16 }}>Caristo</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ color: "#93C5FD", fontSize: 7.5, letterSpacing: 1.2, fontWeight: 600 }}>{`RAPPORT ${r.reference}`}</Text>
              <Text style={{ color: "#8E9AAF", fontSize: 8 }}>Établi le {issued.toLocaleDateString("fr-FR")}</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text style={s.h1}>{v.make} {v.model}</Text>
              {v.version && <Text style={{ color: "#AEB6C4", fontSize: 11, marginTop: 3 }}>{v.version}</Text>}
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12 }}>
                {v.plate && <Plate value={v.plate} />}
                {v.vin && <Text style={{ color: "#8E9AAF", fontSize: 8, letterSpacing: 1.2, marginLeft: 10 }}>VIN {v.vin}</Text>}
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 12 }}>{specs.map((c) => <Text key={c} style={s.chip}>{clean(c)}</Text>)}</View>
            </View>
            <View style={{ width: 210, alignItems: "center", borderRadius: 14, paddingVertical: 10, backgroundColor: "#0F1B33", borderWidth: 0.8, borderColor: "#2A3D5F" }}>
              <Text style={{ color: "#8E9AAF", fontSize: 8 }}>Indice de confiance</Text>
              <Gauge percent={r.scorePercent} tone={scoreTone} />
              <Text style={{ color: TONE[scoreTone], fontFamily: "Manrope", fontWeight: 700, fontSize: 11, marginTop: -4 }}>{r.scoreLabel}</Text>
              <Text style={{ color: "#8E9AAF", fontSize: 7.5, textAlign: "center", marginTop: 3, paddingHorizontal: 10 }}>{clean(r.scoreReasons[0] ?? "")}</Text>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: M }}>
          {r.warnings?.length ? (
            <View style={{ marginTop: 14, backgroundColor: TINT.warn, borderRadius: 8, padding: 10, borderLeftWidth: 3, borderLeftColor: WARN }}>
              {r.warnings.map((w) => <Text key={w} style={{ color: "#92400E", fontSize: 9 }}>{clean(w)}</Text>)}
            </View>
          ) : null}

          <View style={s.section}>
            <SectionHead title="Vue d'ensemble" sub="Les six voyants du rapport. Vert : rien à signaler. Orange : à contrôler. Rouge : bloquant ou à éclaircir avant d'acheter." />
            {[lights.slice(0, 3), lights.slice(3)].map((row, ri) => (
              <View key={ri} style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                {row.map((l) => (
                  <View key={l.label} style={[s.tile, { backgroundColor: TINT[l.tone], borderWidth: 0.8, borderColor: TONE[l.tone] }]}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}><Text style={s.tileLabel}>{l.label}</Text><Led tone={l.tone} /></View>
                    <Text style={[s.tileValue, { color: l.tone === "neutral" ? "#374151" : TONE[l.tone] }]}>{clean(l.value)}</Text>
                    {l.sub && <Text style={{ fontSize: 7.5, color: MUTED, marginTop: 2 }}>{clean(l.sub)}</Text>}
                  </View>
                ))}
              </View>
            ))}
            {r.scoreReasons.length > 1 && (
              <View style={{ marginTop: 4 }}>{r.scoreReasons.slice(1).map((x) => <View key={x} style={{ flexDirection: "row", marginBottom: 2 }}><Text style={{ color: ACCENT, marginRight: 5 }}>•</Text><Text style={{ fontSize: 9, flex: 1 }}>{clean(x)}</Text></View>)}</View>
            )}
            <Text style={{ fontSize: 9, marginTop: 6, color: "#374151" }}>{clean(r.mileageCheck.comment)}</Text>
          </View>

          <View style={s.section}>
            <SectionHead title="Sources consultées" />
            {r.sources.map((src) => (
              <View key={src.label} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 3.5, borderBottomWidth: 0.5, borderBottomColor: LINE }}>
                <Led tone={src.status === "ok" ? "ok" : src.status === "partial" ? "warn" : "neutral"} />
                <Text style={{ fontSize: 8.8, marginLeft: 7, flex: 1 }}>{clean(src.label)}</Text>
                <Text style={{ fontSize: 8, color: MUTED, maxWidth: 220, textAlign: "right" }}>{clean(src.detail ?? (src.status === "ok" ? "Consultée" : src.status === "partial" ? "Partielle" : "Non disponible"))}</Text>
              </View>
            ))}
          </View>

        <View style={s.section}>
        <View wrap={false}>
        <SectionHead title="Historique officiel" sub="Contrôles techniques, kilométrages relevés, sinistres, situation administrative, propriétaires." badge={<Tag tone={h.available ? "ok" : "neutral"}>{h.available ? `Consulté le ${fd(h.retrievedAt)}` : "Non disponible"}</Tag>} />
        {!h.available ? (
          <View style={[s.card, { backgroundColor: GROUND }]}><Text style={{ fontSize: 9 }}>{clean(h.reason ?? "Historique officiel indisponible.")}</Text><Text style={[s.small, { marginTop: 4 }]}>Demander au vendeur le dernier procès-verbal de contrôle technique et un certificat de situation administrative de moins de 15 jours.</Text></View>
        ) : (
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
              {([
                { l: "Propriétaires", v: h.ownersCount !== undefined ? String(h.ownersCount) : "—", t: ((h.ownersCount ?? 0) >= 4 ? "warn" : "ok") as Tone },
                { l: "Gage", v: h.pledge ? "Inscrit" : "Aucun", t: (h.pledge ? "warn" : "ok") as Tone },
                { l: "Opposition", v: h.opposition ? "Oui" : "Aucune", t: (h.opposition ? "bad" : "ok") as Tone },
                { l: "Vol", v: h.stolen ? "Déclaré volé" : "Non", t: (h.stolen ? "bad" : "ok") as Tone },
                { l: "Procédure VE", v: h.damagedProcedure ? "Oui" : "Aucune", t: (h.damagedProcedure ? "warn" : "ok") as Tone },
              ]).map((x) => (
                <View key={x.l} style={[s.tile, { backgroundColor: TINT[x.t], minHeight: 40 }]}><Text style={s.tileLabel}>{x.l}</Text><Text style={[s.tileValue, { color: TONE[x.t], fontSize: 10 }]}>{x.v}</Text></View>
              ))}
            </View>
        )}
        </View>
        {h.available && (
          <>
            {readings.length >= 2 && (<><Text style={s.h3}>Kilométrages relevés</Text><KmChart readings={readings} mileage={r.mileage} /></>)}
            {h.inspections.length > 0 ? (
              <View style={{ marginTop: 8 }}>
                <Text style={[s.h3, { marginBottom: 4 }]}>Contrôles techniques</Text>
                <View style={s.trHead}><Text style={[s.th, { width: 60 }]}>Date</Text><Text style={[s.th, { width: 80 }]}>Type</Text><Text style={[s.th, { width: 70 }]}>Kilométrage</Text><Text style={[s.th, { width: 70 }]}>Résultat</Text><Text style={[s.th, { flex: 1 }]}>Observations</Text></View>
                {[...h.inspections].sort((a, b) => b.date.localeCompare(a.date)).map((i, k) => (
                  <View key={k} style={s.tr} wrap={false}><Text style={[s.td, { width: 60 }]}>{fd(i.date)}</Text><Text style={[s.td, { width: 80 }]}>{KIND[i.kind]}</Text><Text style={[s.td, { width: 70 }]}>{i.mileage ? km(i.mileage) : "—"}</Text><Text style={[s.td, { width: 70, fontWeight: 600, color: i.result === "favorable" ? OK : i.result === "inconnu" ? MUTED : BAD }]}>{RESULT[i.result]}</Text><Text style={[s.td, { flex: 1, color: "#374151" }]}>{clean(i.defects ?? "—")}</Text></View>
                ))}
              </View>
            ) : <Text style={[s.small, { marginTop: 6 }]}>Aucun contrôle technique enregistré{r.limits.some((l) => l.includes("moins de 4 ans")) ? " (véhicule de moins de 4 ans)" : ""}.</Text>}
            {h.claims.length > 0 && (
              <View style={{ marginTop: 10 }}>
                <Text style={[s.h3, { marginBottom: 4 }]}>Sinistres et procédures</Text>
                {h.claims.map((c, i) => <View key={i} style={[s.card, { marginBottom: 5, borderLeftWidth: 3, borderLeftColor: WARN }]} wrap={false}><Text style={{ fontWeight: 600, fontSize: 9 }}>{c.date ? `${fd(c.date)} · ` : ""}{clean(c.kind)}</Text>{c.description && <Text style={s.small}>{clean(c.description)}</Text>}</View>)}
              </View>
            )}
          </>
        )}
        </View>

        <View style={s.section}>
          <View wrap={false}>
          <SectionHead title="Pannes connues du modèle" sub="Faiblesses fréquentes sur ce modèle, pas un diagnostic de ce véhicule : à contrôler sur place." badge={<Tag tone={inZoneHigh.length ? "bad" : inZone.length ? "warn" : "ok"}>{inZoneHigh.length ? `${inZoneHigh.length} à vérifier en priorité` : plural(r.knownIssues.length, "point")}</Tag>} />
          {r.knownIssues.length === 0 && <Text style={s.small}>Aucune faiblesse particulière répertoriée pour ce modèle.</Text>}
          {r.knownIssues.slice(0, 1).map(issueCard)}
          </View>
          {r.knownIssues.slice(1).map(issueCard)}
        </View>

        <View style={s.section}>
        <View wrap={false}>
        <SectionHead title="Entretien à prévoir" sub={`Ce qu'il faudra faire et à peu près combien ça coûte, sur la base de ${nf(r.maintenance.annualKm)} km par an.`} />
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
          {r.maintenance.horizons.map((hz) => (
            <View key={hz.key} style={[s.tile, { backgroundColor: hz.key === "now" && hz.items.length ? TINT.warn : GROUND }]}>
              <Text style={s.tileLabel}>{hz.key === "now" ? "Maintenant" : `Dans ${hz.key} mois`}</Text>
              <Text style={[s.tileValue, { color: hz.items.length ? NAVY : MUTED2 }]}>{hz.items.length ? `env. ${eur(approxCost(hz.costMin, hz.costMax))}` : "Rien de prévu"}</Text>
              {hz.items.length > 0 && <Text style={{ fontSize: 7.5, color: MUTED, marginTop: 2 }}>{clean(hz.items.length === 1 ? hz.items[0] : `${hz.items.length} interventions : ${hz.items.slice(0, 2).map((x) => x.toLowerCase()).join(", ")}${hz.items.length > 2 ? "…" : ""}`)}</Text>}
            </View>
          ))}
        </View>
        <View style={s.trHead}><Text style={[s.th, { flex: 2 }]}>Intervention</Text><Text style={[s.th, { flex: 2 }]}>Quand</Text><Text style={[s.th, { width: 90, textAlign: "right" }]}>Coût environ</Text></View>
        </View>
        {r.maintenance.items.map((m) => (
          <View key={m.label} style={s.tr} wrap={false}>
            <Text style={[s.td, { flex: 2, fontWeight: 600 }]}>{clean(m.label)}</Text>
            <View style={{ flex: 2, paddingHorizontal: 5 }}>
              <Text style={{ fontSize: 8.8, fontWeight: 600, color: m.status === "todo" ? BAD : m.status === "check" ? WARN : TEXT }}>{clean(m.when ?? (m.horizon === "now" ? "Maintenant" : [m.dueKm ? km(m.dueKm) : "", m.dueDate ? fd(m.dueDate) : ""].filter(Boolean).join(", ") || "—"))}</Text>
              {m.whenDetail && <Text style={{ fontSize: 7.5, color: MUTED }}>{clean(m.whenDetail)}</Text>}
            </View>
            <Text style={[s.td, { width: 90, textAlign: "right" }]}>{approxCost(m.costMin, m.costMax) !== undefined ? `env. ${eur(approxCost(m.costMin, m.costMax))}` : "—"}</Text>
          </View>
        ))}
        <Text style={[s.small, { marginTop: 6 }]}>{clean(r.maintenance.note)}</Text>
        </View>

        {r.valuation && (
          <View style={s.section} wrap={false}>
            <SectionHead title="Cote estimée du véhicule" badge={<Tag tone={r.valuation.verdict === "au_dessus" ? "warn" : r.valuation.verdict ? "ok" : "info"}>{r.valuation.verdict === "au_dessus" ? "Au-dessus de la cote" : r.valuation.verdict === "sous_la_cote" ? "Sous la cote" : r.valuation.verdict === "dans_la_cote" ? "Dans la cote" : "Estimation"}</Tag>} />
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
              <View style={[s.tile, { backgroundColor: GROUND }]}><Text style={s.tileLabel}>Fourchette estimée</Text><Text style={[s.tileValue, { color: NAVY }]}>{range(r.valuation.low, r.valuation.high)}</Text></View>
              <View style={[s.tile, { backgroundColor: GROUND }]}><Text style={s.tileLabel}>Cote moyenne</Text><Text style={[s.tileValue, { color: NAVY }]}>{eur(r.valuation.mid)}</Text></View>
              {r.valuation.askingPrice ? <View style={[s.tile, { backgroundColor: TINT[r.valuation.verdict === "au_dessus" ? "warn" : "ok"] }]}><Text style={s.tileLabel}>Prix de l&apos;annonce</Text><Text style={[s.tileValue, { color: r.valuation.askingPrice ? TONE[r.valuation.verdict === "au_dessus" ? "warn" : "ok"] : MUTED2 }]}>{r.valuation.askingPrice ? eur(r.valuation.askingPrice) : "Non renseigné"}</Text>{r.valuation.verdict === "au_dessus" && r.valuation.deltaToHigh ? <Text style={{ fontSize: 7.5, color: MUTED, marginTop: 2 }}>{eur(r.valuation.deltaToHigh)} au-dessus du haut de la cote</Text> : null}</View> : null}
            </View>
            <PriceBar low={r.valuation.low} high={r.valuation.high} asking={r.valuation.askingPrice} />
            <Text style={[s.small, { marginTop: 4 }]}>{clean(r.valuation.basis)}</Text>
          </View>
        )}

        {r.listing.available && r.listing.claims.length > 0 && (
          <View style={s.section} wrap={false}>
            <SectionHead title="L'annonce face au rapport" sub="Ce que dit l'annonce, confronté aux données officielles et à la cote estimée." badge={<Tag tone={r.listing.claims.some((c) => c.status === "warning") ? "warn" : "ok"}>{r.listing.claims.some((c) => c.status === "warning") ? "À éclaircir" : "Cohérente"}</Tag>} />
            {r.listing.claims.map((c, i) => {
              const tone: Tone = c.status === "warning" ? "warn" : c.status === "missing" ? "neutral" : "ok";
              return (
                <View key={i} style={[s.card, { marginBottom: 5, borderLeftWidth: 3, borderLeftColor: TONE[tone] }]}>
                  <Text style={{ fontWeight: 600, fontSize: 9, color: tone === "neutral" ? TEXT : TONE[tone] }}>{clean(c.text)}</Text>
                  {c.detail && <Text style={[s.small, { marginTop: 2 }]}>{clean(c.detail)}</Text>}
                </View>
              );
            })}
            {r.listing.url && <Text style={[s.small, { marginTop: 2 }]}>{r.listing.url}</Text>}
          </View>
        )}

        <View style={s.section}>
          <View wrap={false}>
          <SectionHead title="Rappels constructeur" badge={<Tag tone={openRecalls.length ? "warn" : "ok"}>{openRecalls.length ? `${openRecalls.length} à faire` : r.recalls.length ? plural(r.recalls.length, "trouvé") : "Aucun rappel trouvé"}</Tag>} />
          {r.recalls.length === 0 && <Text style={s.small}>Aucun rappel trouvé pour ce modèle dans les bases consultées. Une vérification gratuite reste possible en concession avec le numéro de série.</Text>}
          {r.recalls.slice(0, 1).map(recallCard)}
          </View>
          {r.recalls.slice(1).map(recallCard)}
        </View>

        <View style={s.section}>
        <View wrap={false}>
        <SectionHead title="À vérifier avant l'achat" sub="Liste construite pour ce véhicule : énergie, boîte, âge, kilométrage et points connus du modèle. À cocher pendant la visite et l'essai." badge={<Tag tone="info">{checklist.essential} essentiels · {checklist.total} points</Tag>} />
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 6 }}>{checklist.profile.map((p) => <Text key={p} style={[s.tag, { color: INFO, backgroundColor: TINT.info, marginRight: 5, marginBottom: 5 }]}>{clean(p)}</Text>)}</View>
        </View>
        {(["vendeur", "acheteur"] as const).map((party) => {
          const color = party === "vendeur" ? WARN : INFO;
          const tint = party === "vendeur" ? TINT.warn : TINT.info;
          const secs = checklist.sections.filter((x) => x.party === party);
          return (
            <View key={party} style={{ marginTop: 12, borderWidth: 0.8, borderColor: color, borderRadius: 8, overflow: "hidden" }}>
              <View wrap={false}>
                <View style={{ backgroundColor: tint, paddingVertical: 7, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View>
                    <Text style={{ fontSize: 7, fontWeight: 700, letterSpacing: 1.2, color: party === "vendeur" ? "#B45309" : "#1D4ED8", textTransform: "uppercase" }}>{party}</Text>
                    <Text style={{ fontFamily: "Manrope", fontWeight: 800, fontSize: 12, color: NAVY }}>{PARTY_LABEL[party].title}</Text>
                  </View>
                  <Text style={{ fontSize: 8, color: MUTED, maxWidth: 240, textAlign: "right" }}>{clean(PARTY_LABEL[party].sub)}</Text>
                </View>
                {secs.slice(0, 1).map((sec) => (
                  <View key={sec.id} style={{ paddingHorizontal: 10, paddingTop: 8 }}>
                    {secs.length > 1 && <Text style={[s.h3, { marginBottom: 4, fontSize: 10 }]}>{sec.title}</Text>}
                    {sec.items.slice(0, 1).map(checkItem)}
                  </View>
                ))}
              </View>
              {secs.map((sec, k) => (
                <View key={sec.id} style={{ paddingHorizontal: 10, paddingTop: k === 0 ? 0 : 6, paddingBottom: k === secs.length - 1 ? 6 : 0 }}>
                  {k > 0 && <View wrap={false}>{secs.length > 1 && <Text style={[s.h3, { marginBottom: 4, fontSize: 10 }]}>{sec.title}</Text>}{sec.items.slice(0, 1).map(checkItem)}</View>}
                  {sec.items.slice(1).map(checkItem)}
                </View>
              ))}
            </View>
          );
        })}
        </View>

        <View style={s.section}>
          <View wrap={false}><SectionHead title="À savoir" />{r.limits.slice(0, 1).map((l) => <View key={l} style={{ flexDirection: "row", marginBottom: 2 }}><Text style={{ color: ACCENT, marginRight: 5, fontSize: 8.5 }}>•</Text><Text style={[s.small, { flex: 1 }]}>{clean(l)}</Text></View>)}</View>
          {r.limits.slice(1).map((l) => <View key={l} style={{ flexDirection: "row", marginBottom: 2 }}><Text style={{ color: ACCENT, marginRight: 5, fontSize: 8.5 }}>•</Text><Text style={[s.small, { flex: 1 }]}>{clean(l)}</Text></View>)}
          <Text style={[s.small, { marginTop: 10 }]}>Ce rapport restitue les données enregistrées sur ce véhicule à la date d&apos;émission. Il ne constitue ni une expertise ni une garantie sur l&apos;état mécanique. Contact : {SITE.contactEmail}.</Text>
        </View>
        </View>
        <Footer />
      </Page>
    </Document>
  );
}


export async function renderReportPdf(report: ReportData): Promise<Buffer> {
  registerFonts();
  return renderToBuffer(<Pdf r={report} />);
}
