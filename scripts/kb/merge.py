"""Fusionne les fiches vérifiées (au moins 2 sites différents) dans la base du projet."""
import json, sys
import os
order = [f for f in ["stellantis", "renault-nissan", "vag", "premium-ford-opel", "asia", "asia2", "engines2", "ev-hybrid", "models-fr", "models-fr2", "models-intl", "models-intl-verified"] if os.path.exists(f"kbclean/{f}.json")]
MANUAL_ONLY = {"mfr2-captur1-boite", "mfr-206-boite-manuelle", "mfr2-twingo2-boite-5e", "mfr2-308i-boite", "mfr2-308ii-boite", "mfr2-espace4-boite-6", "mfr2-sandero2-boite-5e", "mint-polo4-gearbox", "mint-touran1-gearbox", "mint-focus3-clutch", "mint-corsad-gearbox", "as-1kr1-embrayage", "as-1kr2-embrayage", "mfr2-kangoo2-embrayage", "mfr2-duster1-embrayage", "mfr2-c3ii-embrayage", "mint-cmax2-clutch"}
AUTO_ONLY = {"as2-micra4-rappel-cvt", "as2-mghs-boite"}
out, pending = [], []
for f in order:
    for x in json.load(open(f"kbclean/{f}.json")):
        domains = {s.split("/")[2].removeprefix("www.") for s in x.get("sources", []) if "//" in s}
        if len(domains) < 2:
            pending.append(x); continue
        if x["id"].startswith(("mfr-", "mint-")) or x["id"] in ("vag-golf8-electronique", "vag-habitacle-2000-2013"):
            x["keywords"] = []  # fiche « modèle » : reconnue par le nom exact du modèle
        if x["id"] == "vag-habitacle-2000-2013":
            x["models"] = ["golf plus", "bora", "jetta", "a3", "leon"]  # Golf, Polo, Touran, Tiguan : fiches modèle dédiées
        if x["id"] == "as-toyota-psa-boite-robotisee":
            x["fuel"] = ["essence", "diesel"]  # les hybrides ont une transmission sans embrayage
        if x["id"] == "stl-dv6-16-hdi-8v-bluehdi":
            x["makes"] += ["ford", "volvo", "mazda"]  # même moteur 1.6 diesel chez Ford, Volvo et Mazda
        if x["id"] == "rn-etech-16-hybride":
            x["keywords"] = [k for k in x["keywords"] if k not in ("hev", "phev")]
            x["models"] = ["clio", "captur", "arkana", "megane", "jogger", "duster", "bigster", "symbioz", "asx", "colt"]
        if x["id"] == "rn-clio5-captur2-electronique":
            x["models"], x["keywords"] = ["clio", "captur"], []
        if x["id"] == "en2-psa-boite-bmp-etg":
            x["keywords"] += ["bvmp6", "boite pilotee"]
        if x["id"] == "mfr2-citroen-c4-picasso-1-bmp6":
            # à-coups et usure d'embrayage déjà décrits par la fiche boîte robotisée PSA
            x["issues"] = [i for i in x["issues"] if "à-coups" not in i["title"]]
        # la boîte M32 de l'Astra J est couverte par la fiche boîte dédiée (en2-opel-boite-m32)
        x["issues"] = [i for i in x["issues"] if i["id"] != "mint-astraj-m32"]
        for i in x["issues"]:
            if i["id"] in MANUAL_ONLY or "boîte manuelle" in i["title"].lower():
                i["gearbox"] = "manuelle"  # ne s'affiche pas sur une boîte automatique
            if i["id"] in AUTO_ONLY:
                i["gearbox"] = "automatique"
            if i["id"] == "adblue-cover":
                i["title"] = "AdBlue : prise en charge du constructeur"
            # une panne qui culmine à un kilométrage devient fréquente vers 60 % de ce kilométrage
            if i.get("peakKm") and i.get("fromKm") is None:
                i["fromKm"] = round(i["peakKm"] * 0.6 / 10000) * 10000
        out.append(x)
json.dump(out, open(sys.argv[1], "w"), ensure_ascii=False, indent=1)
json.dump(pending, open("kbclean/pending-single-source.json", "w"), ensure_ascii=False, indent=1)
print(len(out), "fiches,", sum(len(x["issues"]) for x in out), "pannes ; en attente :", len(pending), "fiches,", sum(len(x["issues"]) for x in pending), "pannes")
ids = [i["id"] for x in out for i in x["issues"]] + [x["id"] for x in out]
assert len(ids) == len(set(ids)), "id en double"
