"""Valide et nettoie les fiches de pannes produites par la recherche.
Usage : python3 -I validate.py <entrée.json> <sortie.json>
Affiche les problèmes ; écrit une version nettoyée (champs inconnus retirés, textes coupés signalés).
"""
import json, re, sys, unicodedata

FUELS = {"essence", "diesel", "hybride", "hybride_rechargeable", "electrique", "gpl"}
SEV = {"high", "medium", "low", "info"}
JARGON = re.compile(r"\b(EGR|FAP|DPF|DCT|DSG7?|CVT|BVA|BVM|PCV|ECU)\b")

def deaccent(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")

src, dst = sys.argv[1], sys.argv[2]
data = json.load(open(src))
problems, out, ids = [], [], set()
for f in data:
    fid = f.get("id", "?")
    fam = {k: f[k] for k in ("id", "label", "makes", "fuel", "years", "cc", "powerHp", "keywords", "models", "gearbox", "issues", "sources") if k in f}
    fam["makes"] = [deaccent(m.lower()).strip() for m in fam.get("makes", [])]
    fam["keywords"] = [deaccent(k.lower()).strip() for k in fam.get("keywords", []) if k.strip()]
    if "models" in fam: fam["models"] = [deaccent(m.lower()).strip() for m in fam["models"] if m.strip()]
    for x in fam.get("fuel", []):
        if x not in FUELS: problems.append(f"{fid}: carburant inconnu {x}")
    if "cc" in fam:
        a, b = fam["cc"]
        if not (50 < a <= b < 7000): problems.append(f"{fid}: cylindrée suspecte {fam['cc']}")
    if "gearbox" in fam and fam["gearbox"] not in ("automatique", "manuelle"): problems.append(f"{fid}: boîte {fam['gearbox']}")
    y = fam.get("years", {})
    if y and y.get("from") and y.get("to") and y["from"] > y["to"]: problems.append(f"{fid}: années inversées")
    if not fam["keywords"] and "cc" not in fam and not fam.get("models"): problems.append(f"{fid}: aucune règle d'identification")
    if fid in ids: problems.append(f"{fid}: id de fiche en double")
    ids.add(fid)
    if len(fam.get("sources", [])) < 2: problems.append(f"{fid}: moins de 2 sources")
    clean_issues = []
    for i in fam.get("issues", []):
        iid = i.get("id", "?")
        if iid in ids: problems.append(f"{fid}/{iid}: id en double")
        ids.add(iid)
        if i.get("severity") not in SEV: problems.append(f"{iid}: gravité {i.get('severity')}")
        for k in ("title", "description", "whatToCheck"):
            if not i.get(k): problems.append(f"{iid}: {k} manquant")
        if len(i.get("title", "")) > 70: problems.append(f"{iid}: titre long ({len(i['title'])})")
        for k in ("description", "whatToCheck"):
            if len(i.get(k, "")) > 200: problems.append(f"{iid}: {k} long ({len(i[k])})")
        for k in ("title", "description", "whatToCheck"):
            m = JARGON.search(i.get(k, ""))
            if m: problems.append(f"{iid}: jargon « {m.group(0)} » dans {k}")
        cmin, cmax = i.get("costMin", 0), i.get("costMax", 0)
        if cmin > cmax: problems.append(f"{iid}: coût inversé")
        clean_issues.append({k: i[k] for k in ("id", "title", "severity", "fromKm", "peakKm", "fromYears", "description", "costMin", "costMax", "whatToCheck") if k in i})
    fam["issues"] = clean_issues
    out.append(fam)
json.dump(out, open(dst, "w"), ensure_ascii=False, indent=1)
n_iss = sum(len(f["issues"]) for f in out)
print(f"{src}: {len(out)} fiches, {n_iss} pannes, {len(problems)} remarques")
for p in problems: print("  -", p)
