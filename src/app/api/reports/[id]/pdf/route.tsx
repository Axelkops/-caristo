import React from "react";
import { NextResponse } from "next/server";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { getReport, UserError } from "@/lib/services/reports";
import type { ReportData } from "@/lib/engine/types";
import { handleError } from "@/lib/http";
import { fmtKm as fmtKm0 } from "@/lib/engine/maintenance";
import { FUEL_LABEL, GEARBOX_LABEL } from "@/components/VehicleCard";

export const runtime = "nodejs";

const s = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica", color: "#111318" },
  header: { backgroundColor: "#070F1F", color: "#FFFFFF", padding: 16, borderRadius: 8, marginBottom: 14 },
  h1: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  h2: { fontSize: 13, fontFamily: "Helvetica-Bold", marginTop: 14, marginBottom: 6, color: "#0A1E3F" },
  small: { fontSize: 8.5, color: "#6B7280" },
  row: { flexDirection: "row", gap: 8, marginBottom: 4 },
  cell: { flex: 1, padding: 6, backgroundColor: "#F3F4F6", borderRadius: 4 },
  label: { fontSize: 8, color: "#6B7280", marginBottom: 2 },
  value: { fontSize: 10, fontFamily: "Helvetica-Bold" },
  tr: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#E5E7EB", paddingVertical: 4 },
  th: { fontFamily: "Helvetica-Bold", fontSize: 8, color: "#6B7280" },
  bad: { color: "#7F1D1D" }, warn: { color: "#92400E" }, ok: { color: "#065F46" },
  box: { borderWidth: 0.5, borderColor: "#E5E7EB", borderRadius: 6, padding: 8, marginBottom: 6 },
  score: { width: 54, height: 54, borderRadius: 27, borderWidth: 4, alignItems: "center", justifyContent: "center", marginLeft: "auto" },
});

/** Helvetica (PDF) ne connaît ni l'espace fine insécable ni « ≈ » : on les remplace. */
const clean = (t: string) => t.replace(/[\u202F\u00A0]/g, " ").replace(/≈/g, "env.");
const fmtKm = (n: number) => clean(fmtKm0(n));
const fd = (iso?: string) => (iso ? iso.split("-").reverse().join("/") : "");
const eur = (n?: number) => (n === undefined ? "" : clean(`${n.toLocaleString("fr-FR")} €`));
const range = (a?: number, b?: number) => (a === undefined && b === undefined ? "" : clean(`${(a ?? 0).toLocaleString("fr-FR")} – ${(b ?? 0).toLocaleString("fr-FR")} €`));

function Pdf({ r }: { r: ReportData }) {
  const v = r.vehicle, h = r.history;
  const ring = r.score <= "B" ? "#10B981" : r.score === "C" ? "#F59E0B" : "#DC2626";
  return (
    <Document title={`Rapport Caristo ${r.reference}`} author="Caristo">
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 8, color: "#93C5FD", marginBottom: 4 }}>RAPPORT {r.reference} · ÉMIS LE {new Date(r.issuedAt).toLocaleDateString("fr-FR")}</Text>
              <Text style={s.h1}>{v.make} {v.model} {v.version ?? ""}</Text>
              <Text style={{ fontSize: 9, color: "#AEB6C4" }}>{[v.plate, FUEL_LABEL[v.fuel], GEARBOX_LABEL[v.gearbox], v.powerHp ? `${v.powerHp} ch` : "", v.firstRegistration ? `1re immat. ${fd(v.firstRegistration)}` : "", r.mileage ? fmtKm(r.mileage) : ""].filter(Boolean).join(" · ")}</Text>
            </View>
            <View style={[s.score, { borderColor: ring }]}><Text style={{ fontSize: 15, fontFamily: "Helvetica-Bold", color: "#FFFFFF" }}>{r.scorePercent}%</Text></View>
          </View>
          <Text style={{ fontSize: 10, marginTop: 8, fontFamily: "Helvetica-Bold" }}>Indice de confiance {r.scorePercent} % · {r.scoreLabel}</Text>
          <Text style={{ fontSize: 9, color: "#AEB6C4" }}>{clean(r.scoreReasons.join(" "))}</Text>
        </View>

        <Text style={s.h2}>Synthèse</Text>
        <View style={s.row}>
          <View style={s.cell}><Text style={s.label}>Kilométrage</Text><Text style={s.value}>{r.mileageCheck.consistent === false ? "Incohérent" : r.mileageCheck.consistent ? "Cohérent" : "Non vérifiable"}</Text></View>
          <View style={s.cell}><Text style={s.label}>Administratif</Text><Text style={s.value}>{!h.available ? "Non disponible" : h.stolen ? "Déclaré volé" : h.pledge || h.opposition ? "Gage / opposition" : "Libre"}</Text></View>
          <View style={s.cell}><Text style={s.label}>Sinistres</Text><Text style={s.value}>{!h.available ? "Non disponible" : h.claims.length || h.damagedProcedure ? `${h.claims.length || 1} enregistré${(h.claims.length || 1) > 1 ? "s" : ""}` : "Aucun"}</Text></View>
          <View style={s.cell}><Text style={s.label}>Origine</Text><Text style={s.value}>{v.imported ? "Importé" : v.country === "FR" ? "France" : v.country}</Text></View>
        </View>
        <Text style={{ marginTop: 4 }}>{clean(r.mileageCheck.comment)}</Text>

        {h.available && h.inspections.length > 0 && (
          <>
            <Text style={s.h2}>Contrôles techniques</Text>
            <View style={s.tr}><Text style={[s.th, { flex: 1 }]}>Date</Text><Text style={[s.th, { flex: 1 }]}>Type</Text><Text style={[s.th, { flex: 1 }]}>Kilométrage</Text><Text style={[s.th, { flex: 1 }]}>Résultat</Text><Text style={[s.th, { flex: 2 }]}>Défaillances</Text></View>
            {[...h.inspections].sort((a, b) => b.date.localeCompare(a.date)).map((i, k) => (
              <View key={k} style={s.tr}><Text style={{ flex: 1 }}>{fd(i.date)}</Text><Text style={{ flex: 1 }}>{i.kind}</Text><Text style={{ flex: 1 }}>{i.mileage ? fmtKm(i.mileage) : "—"}</Text><Text style={[{ flex: 1 }, i.result === "favorable" ? s.ok : s.warn]}>{i.result}</Text><Text style={{ flex: 2 }}>{i.defects ?? "—"}</Text></View>
            ))}
          </>
        )}

        <Text style={s.h2}>Pannes connues du modèle</Text>
        <Text style={s.small}>Faiblesses fréquentes du modèle, pas un diagnostic de ce véhicule : à contrôler sur place.</Text>
        {r.knownIssues.length === 0 && <Text>Aucune faiblesse particulière répertoriée.</Text>}
        {r.knownIssues.map((i) => (
          <View key={i.id} style={s.box} wrap={false}>
            <View style={{ flexDirection: "row" }}><Text style={[{ fontFamily: "Helvetica-Bold", flex: 1 }, i.severity === "high" && i.inZone ? s.bad : {}]}>{i.title}</Text><Text style={[s.small, i.severity === "high" && i.inZone ? s.bad : {}]}>{i.severity === "high" && i.inZone ? "À vérifier en priorité" : i.inZone ? "Fréquent à ce stade" : "Pas encore concerné"}</Text></View>
            <Text style={{ marginTop: 2 }}>{clean(i.description)}</Text>
            <Text style={s.small}>{i.costMin || i.costMax ? `Réparation : ${range(i.costMin, i.costMax)}` : "Vérification sans frais"} · Quoi vérifier : {clean(i.whatToCheck)}</Text>
          </View>
        ))}
      </Page>

      <Page size="A4" style={s.page}>
        <Text style={s.h2}>Échéancier d&apos;entretien</Text>
        <View style={s.row}>{r.maintenance.horizons.map((hz) => <View key={hz.key} style={s.cell}><Text style={s.label}>{hz.key === "now" ? "Maintenant" : `${hz.key} mois, env. ${fmtKm(hz.projectedKm)}`}</Text><Text style={s.value}>{hz.items.length ? `env. ${range(hz.costMin, hz.costMax)}` : "—"}</Text><Text style={s.small}>{hz.items.join(", ")}</Text></View>)}</View>
        <View style={s.tr}><Text style={[s.th, { flex: 2 }]}>Intervention</Text><Text style={[s.th, { flex: 2 }]}>Préconisation</Text><Text style={[s.th, { flex: 2 }]}>Prochaine échéance</Text><Text style={[s.th, { flex: 1 }]}>Coût estimé</Text></View>
        {r.maintenance.items.map((m) => (
          <View key={m.label} style={s.tr}><Text style={{ flex: 2, fontFamily: "Helvetica-Bold" }}>{m.label}</Text><Text style={{ flex: 2 }}>{clean(m.rule)}</Text><Text style={{ flex: 2 }}>{m.horizon === "now" ? "Maintenant" : [m.dueKm ? fmtKm(m.dueKm) : "", m.dueDate ? fd(m.dueDate) : ""].filter(Boolean).join(", ") || "—"}</Text><Text style={{ flex: 1 }}>{range(m.costMin, m.costMax)}</Text></View>
        ))}
        <Text style={s.small}>{clean(r.maintenance.note)}</Text>

        {r.valuation && (<><Text style={s.h2}>Cote et prix</Text><Text>Fourchette estimée : {range(r.valuation.low, r.valuation.high)}{r.valuation.askingPrice ? ` · Prix demandé : ${eur(r.valuation.askingPrice)} (${r.valuation.verdict === "au_dessus" ? `${eur(r.valuation.deltaToHigh)} au-dessus` : r.valuation.verdict === "sous_la_cote" ? "sous la cote" : "dans la cote"})` : ""}</Text><Text style={s.small}>{clean(r.valuation.basis)}</Text></>)}

        <Text style={s.h2}>Rappels constructeur</Text>
        {r.recalls.length === 0 ? <Text>Aucun rappel trouvé pour ce modèle.</Text> : r.recalls.map((x, i) => <Text key={i}>• {fd(x.date)} · {x.title} ({x.status === "done" ? "fait" : x.status === "open" ? "à faire" : "à vérifier"})</Text>)}



        <Text style={s.h2}>À savoir</Text>
        {r.limits.map((l) => <Text key={l} style={s.small}>• {clean(l)}</Text>)}
        <Text style={[s.small, { marginTop: 8 }]}>Ce rapport restitue les données enregistrées sur ce véhicule à la date d&apos;émission. Il ne constitue ni une expertise ni une garantie sur l&apos;état mécanique. Caristo · Édité par Digikom Group.</Text>
      </Page>
    </Document>
  );
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const r = await getReport(id);
    if (!r || r.status !== "ready" || !r.report) throw new UserError("Rapport introuvable ou non finalisé.", 404);
    const report = r.report as ReportData;
    const buf = await renderToBuffer(<Pdf r={report} />);
    return new NextResponse(new Uint8Array(buf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="caristo-${report.reference}.pdf"`, "Cache-Control": "private, no-store" } });
  } catch (e) { return handleError(e); }
}
