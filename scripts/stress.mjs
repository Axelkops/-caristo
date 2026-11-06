// Campagne de tests de robustesse contre un serveur Caristo en mode démonstration.
// Usage : BASE=http://127.0.0.1:3100 node scripts/stress.mjs
const BASE = process.env.BASE ?? "http://127.0.0.1:3100";
const problems = [];
const stats = {};
let ipCounter = 0;
const ip = () => `10.${(ipCounter >> 16) & 255}.${(ipCounter >> 8) & 255}.${ipCounter++ & 255}`;
const bump = (k) => (stats[k] = (stats[k] ?? 0) + 1);

async function call(method, path, body, headers = {}) {
  const res = await fetch(BASE + path, { method, headers: { "Content-Type": "application/json", "x-forwarded-for": ip(), ...headers }, body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body), redirect: "manual" });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = undefined; }
  bump(`${method} ${path.replace(/\/[a-z0-9]{14}(?=\/|$)/g, "/:id").replace(/\?.*/, "")} ${res.status}`);
  if (res.status >= 500) problems.push({ method, path, body, status: res.status, text: text.slice(0, 300) });
  return { status: res.status, json, text, headers: res.headers };
}

const L = "ABCDEFGHJKLMNPQRSTVWXYZ";
const r = (n) => Math.floor(Math.random() * n);
const pick = (a) => a[r(a.length)];
const plateFR = () => `${L[r(23)]}${L[r(23)]}-${String(r(999) + 1).padStart(3, "0")}-${L[r(23)]}${L[r(23)]}`;
const vinChars = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789";
const vin = () => Array.from({ length: 17 }, () => vinChars[r(vinChars.length)]).join("");
const weird = ["", " ", "AB", "ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMN", "<script>alert(1)</script>", "' OR 1=1 --", "AB-123-CD; DROP TABLE reports", "🚗🚗🚗", "AA-000-AA", "IO-123-OQ", "12-ABC-34", "1234 AB 56", "WVWZZZ1KZBW12345", "WVWZZZ1KZBW1234567", "VF1RJA00X6123456O", "B-AB 1234", "AB 123 CD", "ab123cd", "\u0000\u0001", "%00", "null", "undefined", "../../etc/passwd"];

async function phaseIdentify(n) {
  const ids = [];
  for (let i = 0; i < n; i++) {
    const kind = r(10);
    let body;
    if (kind < 5) body = { input: plateFR() };
    else if (kind < 7) body = { input: vin(), kind: "vin" };
    else if (kind < 9) body = { input: pick(weird) };
    else body = pick([{}, { input: 123 }, { input: plateFR(), kind: "xxx" }, { input: plateFR(), country: "ZZZ" }, "pas du json", { input: plateFR(), country: pick(["DE", "ES", "IT", "BE", "GB"]) }]);
    const res = await call("POST", "/api/identify", body);
    if (res.status === 200) {
      if (!res.json?.reportId || !(res.json?.vehicle?.make || res.json?.vehicle?.pending)) problems.push({ what: "identify 200 sans véhicule", body, json: res.json });
      else ids.push({ id: res.json.reportId, country: res.json.country });
    } else if (![400, 404, 429].includes(res.status)) problems.push({ what: "identify statut inattendu", body, status: res.status });
    else if (res.status !== 429 && !res.json?.error) problems.push({ what: "erreur sans message", body, status: res.status });
  }
  return ids;
}

const formulas = () => pick(["2021AB12345", "2019XY99999", `20${10 + r(15)}${L[r(23)]}${L[r(23)]}${String(r(99999)).padStart(5, "0")}`, "1234", "", "ABCD", "2021AB1234", "2021-AB-12345", "2021ab12345", "<b>x</b>"]);
const dates = () => pick(["12/03/2019", "01/01/2000", "31/02/2019", "29/02/2020", "29/02/2019", "", "2019-03-12", "32/13/2019", "12/03/2099", "1/1/2019", "00/00/0000"]);
const kms = () => pick(["118000", "0", "1", "999999", "1 500 000", "-5", "abc", "", "120 000", "45000.5", "12e4", 95000]);
const emails = () => pick(["test@exemple.fr", "a@b.co", "pasunemail", "", "x@y", "TEST@EXEMPLE.FR", "  test@exemple.fr  ", "a".repeat(250) + "@x.fr"]);

async function phaseDetails(ids) {
  const valid = [];
  for (const { id, country } of ids) {
    const body = { mileage: kms(), listingPrice: pick(["", "13200", "9 900", "abc", "-5", "12e3", 15000, "1 000 000 000"]), formulaNumber: formulas(), holderName: pick(["DUPONT MARIE", "", "X", "Jean-Édouard L'Hôte", "<img src=x>"]), firstRegDate: dates(), email: emails(), offer: pick(["single", "pack3", "pack10", "single", "gratuit"]) };
    const res = await call("POST", `/api/reports/${id}/details`, body);
    if (res.status === 200) {
      if (!res.json?.next) problems.push({ what: "details 200 sans next", body, json: res.json });
      else valid.push({ id, next: res.json.next, body, country });
    } else if (res.status !== 400) problems.push({ what: "details statut inattendu", id, body, status: res.status, json: res.json });
    // règle : carte grise facultative, mais jamais partielle
    const cgCount = [body.formulaNumber, body.holderName, body.firstRegDate].filter((x) => String(x ?? "").trim()).length;
    if (res.status === 200 && country === "FR" && cgCount > 0 && cgCount < 3) problems.push({ what: "FR accepté avec une carte grise partielle", body });
  }
  return valid;
}

async function waitReady(id) {
  for (let i = 0; i < 60; i++) {
    const s = await call("GET", `/api/reports/${id}/status`);
    if (s.json?.status === "ready") return true;
    if (s.json?.status === "failed") { problems.push({ what: "génération échouée", id, json: s.json }); return false; }
    await new Promise((ok) => setTimeout(ok, 250));
  }
  problems.push({ what: "rapport jamais prêt", id });
  return false;
}

async function phaseFull(valid, max) {
  let ready = 0;
  for (const v of valid.slice(0, max)) {
    const pay = await call("POST", "/api/demo/pay", { reportId: v.id });
    if (pay.status !== 200) { problems.push({ what: "paiement simulé KO", id: v.id, status: pay.status, json: pay.json }); continue; }
    if (!(await waitReady(v.id))) continue;
    ready++;
    const page = await call("GET", `/rapport/${v.id}`);
    if (page.status !== 200 || !page.text.includes("Vue d")) problems.push({ what: "page rapport KO", id: v.id, status: page.status });
    if (/NaN|undefined|\[object Object\]|Invalid Date/.test(page.text.replace(/<script[\s\S]*?<\/script>/g, ""))) problems.push({ what: "valeur cassée dans le rapport", id: v.id, sample: page.text.match(/.{60}(NaN|undefined|\[object Object\]|Invalid Date).{60}/)?.[0] });
    const pdf = await fetch(`${BASE}/api/reports/${v.id}/pdf`);
    const buf = Buffer.from(await pdf.arrayBuffer());
    if (pdf.status !== 200 || buf.subarray(0, 4).toString() !== "%PDF") problems.push({ what: "PDF KO", id: v.id, status: pdf.status, head: buf.subarray(0, 80).toString() });
    bump(`PDF ${pdf.status}`);
    const token = page.text.match(/\/r\/([a-z0-9]{14})/)?.[1];
    if (!token) problems.push({ what: "lien de partage absent", id: v.id });
    else {
      const sh = await call("GET", `/r/${token}`);
      if (sh.status !== 200) problems.push({ what: "page partagée KO", token, status: sh.status });
      if (sh.text.includes(v.id)) problems.push({ what: "la page partagée révèle l'identifiant privé", token });
    }
    // double paiement : doit rester idempotent
    const again = await call("POST", "/api/demo/pay", { reportId: v.id });
    if (again.status !== 200) problems.push({ what: "second paiement simulé KO", id: v.id, status: again.status });
    // re-soumission des détails après paiement : refus attendu
    const resub = await call("POST", `/api/reports/${v.id}/details`, v.body);
    if (resub.status !== 409) problems.push({ what: "détails modifiables après paiement", id: v.id, status: resub.status });
  }
  return ready;
}

async function phaseMisc() {
  for (const p of ["/rapport/nexistepas", "/rapport/../../etc", "/verification/nexistepas", "/r/nexistepas", "/api/reports/nexistepas/pdf", "/api/reports/nexistepas/status", "/paiement/demo", "/paiement/demo?report=nexistepas", "/mes-rapports", "/connexion?next=//evil.com", "/connexion?next=https://evil.com"]) {
    const res = await call("GET", p);
    if (res.status >= 500) problems.push({ what: "page en erreur 500", p });
    if (p.includes("evil") && (res.headers.get("location") ?? "").includes("evil")) problems.push({ what: "redirection ouverte", p });
  }
  // webhook sans signature
  const wh = await call("POST", "/api/stripe/webhook", { type: "checkout.session.completed" });
  if (wh.status !== 400) problems.push({ what: "webhook accepté sans signature", status: wh.status });
  // cron sans secret
  const cron = await call("GET", "/api/cron/cleanup");
  if (cron.status !== 401) problems.push({ what: "nettoyage accessible sans secret", status: cron.status });
  // auth : mauvais codes, limite d'essais
  const email = `stress-${Date.now()}@exemple.fr`;
  const rc = await call("POST", "/api/auth/request-code", { email });
  if (rc.status !== 200) problems.push({ what: "demande de code KO", status: rc.status, json: rc.json });
  let locked = false;
  for (let i = 0; i < 7; i++) {
    const v = await call("POST", "/api/auth/verify", { email, code: "000000" });
    if (v.status === 200) problems.push({ what: "mauvais code accepté" });
    if (v.json?.error?.includes("Trop d'essais")) locked = true;
  }
  if (!locked) problems.push({ what: "pas de blocage après 5 mauvais codes" });
  if (rc.json?.devCode) {
    const good = await call("POST", "/api/auth/verify", { email, code: rc.json.devCode });
    if (good.status === 200) problems.push({ what: "bon code accepté après blocage (devrait exiger un nouveau code)" });
  }
  const again = await call("POST", "/api/auth/request-code", { email });
  if (again.status !== 429) problems.push({ what: "pas d'anti-spam sur les codes (2 demandes en moins d'une minute)", status: again.status });
  for (const bad of [{}, { email: "x" }, { email: "a@b.fr", code: "abc" }, { email: "a@b.fr", code: "1234567890123" }]) {
    const res = await call("POST", "/api/auth/verify", bad);
    if (res.status >= 500) problems.push({ what: "verify 500", bad });
  }
  // ajout de carte grise : refusé sur un rapport inexistant ou non payé
  const cgBad = await call("POST", "/api/reports/nexistepas/carte-grise", { formulaNumber: "2021AB12345", holderName: "X", firstRegDate: "12/03/2019" });
  if (cgBad.status !== 404) problems.push({ what: "ajout carte grise accepté sur rapport inexistant", status: cgBad.status });
  // utilisation d'un pack sans être connecté
  const id = (await call("POST", "/api/identify", { input: plateFR() })).json?.reportId;
  if (id) {
    const res = await call("POST", `/api/reports/${id}/details`, { mileage: "90000", formulaNumber: "2021AB12345", holderName: "DUPONT", firstRegDate: "12/03/2019", email: "x@exemple.fr", offer: "single", useAccountPack: true });
    if (res.status !== 401) problems.push({ what: "pack utilisable sans connexion", status: res.status, json: res.json });
  }
}

const t0 = Date.now();
const N = Number(process.env.N ?? 3000);
const ids = await phaseIdentify(N);
console.log(`identifiés : ${ids.length}/${N}`);
const valid = await phaseDetails(ids);
console.log(`détails acceptés : ${valid.length}/${ids.length}`);
const ready = await phaseFull(valid, Number(process.env.FULL ?? 300));
console.log(`rapports complets (paiement → rapport → PDF → partage) : ${ready}`);
await phaseMisc();
console.log(`durée : ${Math.round((Date.now() - t0) / 1000)} s`);
console.log("statuts :", JSON.stringify(Object.fromEntries(Object.entries(stats).sort()), null, 0));
console.log(`PROBLÈMES : ${problems.length}`);
const seen = new Map();
for (const p of problems) { const k = p.what ?? `${p.method} ${p.status}`; if (!seen.has(k)) seen.set(k, { n: 0, ex: p }); seen.get(k).n++; }
for (const [k, v] of seen) console.log(`- ${k} ×${v.n} :`, JSON.stringify(v.ex).slice(0, 400));
