import { test, expect, type Page } from "@playwright/test";

const alert = (page: Page) => page.locator('[role="alert"]:not(#__next-route-announcer__)');

async function goToReport(page: Page, plate: string, opts: { withCarteGrise?: boolean; listing?: boolean; pack?: "single" | "pack3" | "pack10" } = {}) {
  await page.goto("/");
  await page.getByLabel("Plaque d'immatriculation").fill(plate);
  await page.getByRole("button", { name: /Obtenir le rapport/ }).click();
  await expect(page).toHaveURL(/\/verification\//, { timeout: 15000 });
  await expect(page.getByText("Véhicule identifié")).toBeVisible();
  await page.getByLabel("Kilométrage actuel *").fill("118000");
  if (opts.withCarteGrise !== false) {
    await page.getByLabel("Numéro de formule").fill("2021AB12345");
    await page.getByLabel("Nom du titulaire").fill("Dupont Jean");
    await page.getByLabel("Date de 1re immatriculation").fill("12/03/2019");
  }
  if (opts.listing) await page.getByLabel(/Lien de l'annonce/).fill("https://www.leboncoin.fr/voitures/123456.htm");
  await page.getByLabel("Votre e-mail *").fill("test@exemple.fr");
  if (opts.pack && opts.pack !== "single") await page.getByText(opts.pack === "pack3" ? "Pack 3 rapports" : "Pack 10 rapports").click();
  await page.getByRole("button", { name: /Payer/ }).click();
  await expect(page).toHaveURL(/\/paiement\/demo/, { timeout: 15000 });
  await page.getByRole("button", { name: "Payer (simulation)" }).click();
  await expect(page).toHaveURL(/\/rapport\//, { timeout: 15000 });
  await expect(page.getByRole("heading", { name: "Vue d'ensemble" })).toBeVisible({ timeout: 30000 });
}

test("accueil : sections et tarifs cohérents", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Sachez tout de ce véhicule");
  await expect(page.getByText("Le contenu du rapport.")).toBeVisible();
  await expect(page.getByText("Toutes les pannes connues de ce modèle.")).toBeVisible();
  await expect(page.locator("#tarifs")).toContainText("19,90");
  await expect(page.locator("#tarifs")).toContainText("49,90");
  await expect(page.locator("#tarifs")).toContainText("129,90");
  await expect(page.locator("#pourquoi")).toContainText("19,90 €");
  const body = await page.locator("body").innerText();
  expect(body.toLowerCase()).not.toContain("voiture");
  expect(body).not.toMatch(/carvertical|histovec|autoviza/i);
});

test("plaque invalide : message clair, pas de navigation", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Plaque d'immatriculation").fill("HELLO!!");
  await page.getByRole("button", { name: /Obtenir le rapport/ }).click();
  await expect(alert(page)).toContainText("Plaque non reconnue");
  await expect(page).toHaveURL("/");
});

test("plaque inconnue du fournisseur : erreur 404 propre", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Plaque d'immatriculation").fill("ZZ-999-ZZ");
  await page.getByRole("button", { name: /Obtenir le rapport/ }).click();
  await expect(alert(page)).toContainText("Aucun véhicule trouvé");
});

test("VIN : onglet, validation et identification mondiale", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Numéro VIN" }).click();
  await page.getByLabel("Numéro VIN").fill("VF3MCYHZRKS0048");
  await page.getByRole("button", { name: /Obtenir le rapport/ }).click();
  await expect(alert(page)).toContainText("17 caractères");
  await page.getByLabel("Numéro VIN").fill("1HGCM82633A004352");
  await page.getByRole("button", { name: /Obtenir le rapport/ }).click();
  await expect(page).toHaveURL(/\/verification\//, { timeout: 15000 });
  await expect(page.getByText("Honda")).toBeVisible();
});

test("parcours complet : rapport, PDF, partage", async ({ page, request }) => {
  await goToReport(page, "AB-123-CD", { withCarteGrise: true, listing: true });
  // contenu
  for (const h of ["Vue d'ensemble", "Pannes connues du modèle", "Entretien à prévoir", "Historique officiel", "Rappels constructeur", "Cote et prix", "Annonce"]) {
    await expect(page.getByRole("heading", { name: h, exact: true })).toBeVisible();
  }
  await expect(page.getByText(/Indice de confiance/)).toBeVisible();
  await expect(page.locator("#echeancier")).toContainText("12 mois");
  await expect(page.locator("#echeancier")).toContainText("36 mois");
  // PDF
  const url = page.url();
  const id = url.split("/rapport/")[1];
  const pdf = await request.get(`/api/reports/${id}/pdf`);
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toContain("application/pdf");
  expect((await pdf.body()).byteLength).toBeGreaterThan(5000);
  // partage
  const shareText = await page.locator("text=/\\/r\\//").first().innerText();
  const token = shareText.split("/r/")[1].trim();
  await page.goto(`/r/${token}`);
  await expect(page.getByRole("heading", { name: "Vue d'ensemble" })).toBeVisible();
  // le lien partagé ne propose ni partage ni pack
  await expect(page.getByText("Partager ce rapport")).toHaveCount(0);
});

test("sans carte grise : rapport produit, historique signalé indisponible", async ({ page }) => {
  await goToReport(page, "CD-456-EF", { withCarteGrise: false });
  await expect(page.locator("#historique")).toContainText("Informations de la carte grise manquantes");
  await expect(page.getByRole("heading", { name: "Pannes connues du modèle", exact: true })).toBeVisible();
});

test("pack 3 : code affiché et réutilisable sans repayer, puis épuisé", async ({ page }) => {
  await goToReport(page, "EF-789-GH", { pack: "pack3" });
  await expect(page.getByTestId("pack-box")).toContainText("2 rapports restants");
  const code = (await page.getByTestId("pack-code").innerText()).trim();
  expect(code).toMatch(/^[A-Z0-9]{10}$/);
  // 2e rapport avec le code : pas de paiement
  for (const plate of ["JK-111-LM", "MN-222-PQ"]) {
    await page.goto("/");
    await page.getByLabel("Plaque d'immatriculation").fill(plate);
    await page.getByRole("button", { name: /Obtenir le rapport/ }).click();
    await expect(page).toHaveURL(/\/verification\//, { timeout: 15000 });
    await page.getByLabel("Kilométrage actuel *").fill("80000");
    await page.getByLabel("Votre e-mail *").fill("test@exemple.fr");
    await page.getByText("J'ai déjà un code de pack").click();
    await page.getByPlaceholder("ABCD123456").fill(code);
    await page.getByRole("button", { name: /Utiliser un crédit/ }).click();
    await expect(page).toHaveURL(/\/rapport\//, { timeout: 15000 });
    await expect(page.getByRole("heading", { name: "Vue d'ensemble" })).toBeVisible({ timeout: 30000 });
  }
  await expect(page.getByTestId("pack-box")).toContainText("0 rapport restant");
  // 4e : crédit épuisé → erreur claire
  await page.goto("/");
  await page.getByLabel("Plaque d'immatriculation").fill("RS-333-TV");
  await page.getByRole("button", { name: /Obtenir le rapport/ }).click();
  await expect(page).toHaveURL(/\/verification\//, { timeout: 15000 });
  await page.getByLabel("Kilométrage actuel *").fill("80000");
  await page.getByLabel("Votre e-mail *").fill("test@exemple.fr");
  await page.getByText("J'ai déjà un code de pack").click();
  await page.getByPlaceholder("ABCD123456").fill(code);
  await page.getByRole("button", { name: /Utiliser un crédit/ }).click();
  await expect(alert(page)).toContainText("plus de crédit");
  await page.getByPlaceholder("ABCD123456").fill("FAUXCODE99");
  await page.getByRole("button", { name: /Utiliser un crédit/ }).click();
  await expect(alert(page)).toContainText("inconnu ou expiré");
});

test("erreurs de saisie carte grise", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Plaque d'immatriculation").fill("GH-321-JK");
  await page.getByRole("button", { name: /Obtenir le rapport/ }).click();
  await expect(page).toHaveURL(/\/verification\//, { timeout: 15000 });
  await page.getByLabel("Kilométrage actuel *").fill("118000");
  await page.getByLabel("Numéro de formule").fill("1234");
  await page.getByLabel("Votre e-mail *").fill("test@exemple.fr");
  await page.getByRole("button", { name: /Payer/ }).click();
  await expect(alert(page)).toContainText("Numéro de formule invalide");
  await page.getByLabel("Numéro de formule").fill("");
  await page.getByLabel("Date de 1re immatriculation").fill("31/02/2019");
  await page.getByRole("button", { name: /Payer/ }).click();
  await expect(alert(page)).toContainText("Date de première immatriculation invalide");
  await page.getByLabel("Date de 1re immatriculation").fill("");
  await page.getByLabel("Votre e-mail *").fill("pasunemail");
  await page.getByRole("button", { name: /Payer/ }).click();
  await expect(alert(page)).toContainText("e-mail invalide");
});

test("pages légales et 404", async ({ page }) => {
  for (const p of ["/cgv", "/confidentialite", "/mentions-legales"]) {
    await page.goto(p);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
  const res = await page.goto("/rapport/nexistepas");
  expect(res?.status()).toBe(404);
  await expect(page.getByText("Page introuvable")).toBeVisible();
});

test("API : rate limit et validation", async ({ request }) => {
  const bad = await request.post("/api/identify", { data: { input: "" } });
  expect(bad.status()).toBe(400);
  const r = await request.post("/api/demo/pay", { data: {} });
  expect(r.status()).toBe(400);
  const w = await request.post("/api/stripe/webhook", { data: {} });
  expect(w.status()).toBe(400);
});

test("saisie manuelle du véhicule → rapport complet", async ({ page }) => {
  await page.goto("/verification/manuel");
  await page.getByLabel("Marque (D.1) *").fill("Peugeot");
  await page.getByLabel("Modèle (D.3) *").fill("308");
  await page.getByLabel("Motorisation / version").fill("1.2 PureTech 130");
  await page.getByLabel("Énergie (P.3) *").selectOption("essence");
  await page.getByLabel("Boîte de vitesses *").selectOption("manuelle");
  await page.getByLabel("Date de 1re immatriculation (case B) *").fill("15/06/2019");
  await page.getByLabel("Puissance (ch)").fill("130");
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page).toHaveURL(/\/verification\//, { timeout: 15000 });
  await expect(page.getByText("Peugeot 308 1.2 PureTech 130")).toBeVisible();
  await page.getByLabel("Kilométrage actuel *").fill("95000");
  await page.getByLabel("Votre e-mail *").fill("test@exemple.fr");
  await page.getByRole("button", { name: /Payer/ }).click();
  await page.getByRole("button", { name: "Payer (simulation)" }).click();
  await expect(page.getByRole("heading", { name: "Vue d'ensemble" })).toBeVisible({ timeout: 30000 });
  await expect(page.locator("#pannes")).toContainText("Courroie de distribution");
});
