import { test, expect, type Page } from "@playwright/test";

const alert = (page: Page) => page.locator('[role="alert"]:not(#__next-route-announcer__)');

async function goToReport(page: Page, plate: string, opts: { withCarteGrise?: boolean; listing?: boolean; pack?: "single" | "pack3" | "pack10"; email?: string } = {}) {
  await page.goto("/");
  await page.getByLabel("Plaque d'immatriculation").fill(plate);
  await page.getByRole("button", { name: /Obtenir le rapport/ }).click();
  await expect(page).toHaveURL(/\/verification\//, { timeout: 15000 });
  await expect(page.getByText("Plaque valide")).toBeVisible();
  await page.getByLabel("Kilométrage actuel *").fill("118000");
  if (opts.withCarteGrise !== false) {
    await page.getByLabel("Numéro de formule").fill("2021AB12345");
    await page.getByLabel("Nom du titulaire").fill("Dupont Jean");
    await page.getByLabel("Date de 1re immatriculation").fill("12/03/2019");
  }
  await page.getByLabel("Votre e-mail *").fill(opts.email ?? "test@exemple.fr");
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

test("plaque sans véhicule : identifiée après paiement, remboursement automatique", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Plaque d'immatriculation").fill("ZZ-999-ZZ");
  await page.getByRole("button", { name: /Obtenir le rapport/ }).click();
  await expect(page).toHaveURL(/\/verification\//, { timeout: 15000 });
  await expect(page.getByTestId("vehicle-pending")).toContainText("ZZ-999-ZZ");
  await page.getByLabel("Kilométrage actuel *").fill("80000");
  await page.getByLabel("Numéro de formule").fill("2021AB12345");
  await page.getByLabel("Nom du titulaire").fill("Dupont Jean");
  await page.getByLabel("Date de 1re immatriculation").fill("12/03/2019");
  await page.getByLabel("Votre e-mail *").fill("test@exemple.fr");
  await page.getByRole("button", { name: /Payer/ }).click();
  await page.getByRole("button", { name: "Payer (simulation)" }).click();
  await expect(page.getByTestId("refunded")).toContainText("Aucun véhicule ne correspond", { timeout: 30000 });
});

test("date de carte grise : avertissement seulement si elle diffère du véhicule", async ({ page }) => {
  // PQ-456-RS → véhicule de démonstration immatriculé le 12/03/2019 : même date que celle saisie, pas d'avertissement
  await goToReport(page, "PQ-456-RS");
  await expect(page.getByTestId("report-warning")).toHaveCount(0);
  // AB-123-CD → véhicule immatriculé le 14/04/2022 : date saisie différente, avertissement en tête
  await goToReport(page, "AB-123-CD");
  await expect(page.getByTestId("report-warning")).toContainText("ne correspond pas");
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
  await expect(page.getByTestId("vehicle-pending")).toContainText("1HGCM82633A004352");
});

test("parcours complet : rapport, PDF, partage", async ({ page, request }) => {
  await goToReport(page, "AB-123-CD", { withCarteGrise: true });
  // contenu
  for (const h of ["Vue d'ensemble", "Pannes connues du modèle", "Entretien à prévoir", "Historique officiel", "Rappels constructeur", "Cote estimée du véhicule", "À vérifier avant l'achat"]) {
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

test("sans carte grise : impossible de payer pour un véhicule français", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Plaque d'immatriculation").fill("CD-456-EF");
  await page.getByRole("button", { name: /Obtenir le rapport/ }).click();
  await expect(page).toHaveURL(/\/verification\//, { timeout: 15000 });
  await page.getByLabel("Kilométrage actuel *").fill("80000");
  await page.getByLabel("Votre e-mail *").fill("test@exemple.fr");
  await page.getByRole("button", { name: /Payer/ }).click();
  await expect(alert(page)).toContainText("carte grise");
  await expect(page).toHaveURL(/\/verification\//);
});

async function login(page: Page, email: string) {
  await page.goto("/connexion");
  await page.getByLabel("Votre e-mail").fill(email);
  await page.getByRole("button", { name: "Recevoir mon code" }).click();
  const info = await page.getByText(/Mode démonstration : votre code est/).innerText({ timeout: 15000 });
  const code = info.match(/(\d{6})/)![1];
  await page.getByLabel("Code à 6 chiffres").fill(code);
  await page.getByRole("button", { name: "Me connecter" }).click();
  await expect(page).toHaveURL(/\/mes-rapports/, { timeout: 15000 });
}

test("connexion par code : espace Mes rapports, erreurs et déconnexion", async ({ page }, testInfo) => {
  const email = `login-${testInfo.project.name}-${Date.now()}@exemple.fr`;
  await goToReport(page, "WX-444-YZ", { email });
  // mauvaise adresse → espace vide ; bon code → le rapport est listé
  await page.goto("/connexion");
  await page.getByLabel("Votre e-mail").fill("pas-un-email");
  await page.getByRole("button", { name: "Recevoir mon code" }).click();
  await expect(alert(page)).toContainText("invalide");
  await page.getByLabel("Votre e-mail").fill(email);
  await page.getByRole("button", { name: "Recevoir mon code" }).click();
  await expect(page.getByText(/Mode démonstration/)).toBeVisible({ timeout: 15000 });
  await page.getByLabel("Code à 6 chiffres").fill("000000");
  await page.getByRole("button", { name: "Me connecter" }).click();
  await expect(alert(page)).toContainText(/incorrect|Code/);
  const info = await page.getByText(/Mode démonstration : votre code est/).innerText();
  await page.getByLabel("Code à 6 chiffres").fill(info.match(/(\d{6})/)![1]);
  await page.getByRole("button", { name: "Me connecter" }).click();
  await expect(page).toHaveURL(/\/mes-rapports/, { timeout: 15000 });
  await expect(page.getByText(`Connecté avec ${email}`)).toBeVisible();
  await expect(page.getByTestId("report-row").first()).toContainText("WX-444-YZ");
  await expect(page.getByRole("link", { name: "Mes rapports" }).first()).toBeVisible();
  // la page de connexion redirige quand on est déjà connecté
  await page.goto("/connexion");
  await expect(page).toHaveURL(/\/mes-rapports/);
  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(page).toHaveURL(/\/$/, { timeout: 15000 });
  await page.goto("/mes-rapports");
  await expect(page).toHaveURL(/\/connexion/);
});

test("pack 3 : crédits utilisés automatiquement depuis le compte, puis épuisés", async ({ page }, testInfo) => {
  const email = `pack-${testInfo.project.name}-${Date.now()}@exemple.fr`;
  await goToReport(page, "EF-789-GH", { pack: "pack3", email });
  await expect(page.getByTestId("pack-box")).toContainText("2 rapports restants");
  await login(page, email);
  await expect(page.getByTestId("pack-card").first()).toContainText("2");
  // 2e et 3e rapport : connecté, le crédit est utilisé sans paiement
  for (const plate of ["JK-111-LM", "MN-222-PQ"]) {
    await page.goto("/");
    await page.getByLabel("Plaque d'immatriculation").fill(plate);
    await page.getByRole("button", { name: /Obtenir le rapport/ }).click();
    await expect(page).toHaveURL(/\/verification\//, { timeout: 15000 });
    await expect(page.getByTestId("account-pack")).toContainText("restant");
    await page.getByLabel("Kilométrage actuel *").fill("80000");
    await page.getByLabel("Numéro de formule").fill("2021AB12345");
    await page.getByLabel("Nom du titulaire").fill("Dupont Jean");
    await page.getByLabel("Date de 1re immatriculation").fill("12/03/2019");
    await page.getByRole("button", { name: /Utiliser un crédit/ }).click();
    await expect(page).toHaveURL(/\/rapport\//, { timeout: 15000 });
    await expect(page.getByRole("heading", { name: "Vue d'ensemble" })).toBeVisible({ timeout: 30000 });
  }
  await expect(page.getByTestId("pack-box")).toContainText("0 rapport restant");
  // 4e : plus de crédit → les offres payantes sont proposées
  await page.goto("/");
  await page.getByLabel("Plaque d'immatriculation").fill("RS-333-TV");
  await page.getByRole("button", { name: /Obtenir le rapport/ }).click();
  await expect(page).toHaveURL(/\/verification\//, { timeout: 15000 });
  await expect(page.getByTestId("account-pack")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Payer/ })).toBeVisible();
  // l'espace liste bien les 3 rapports du pack + packs
  await page.goto("/mes-rapports");
  await expect(page.getByTestId("report-row")).toHaveCount(3);
  await expect(page.getByTestId("pack-card").first()).toContainText("0");
});

test("erreurs de saisie carte grise", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Plaque d'immatriculation").fill("GH-321-JK");
  await page.getByRole("button", { name: /Obtenir le rapport/ }).click();
  await expect(page).toHaveURL(/\/verification\//, { timeout: 15000 });
  await page.getByLabel("Kilométrage actuel *").fill("118000");
  await page.getByLabel("Numéro de formule").fill("1234");
  await page.getByLabel("Nom du titulaire").fill("Dupont Jean");
  await page.getByLabel("Date de 1re immatriculation").fill("12/03/2019");
  await page.getByLabel("Votre e-mail *").fill("test@exemple.fr");
  await page.getByRole("button", { name: /Payer/ }).click();
  await expect(alert(page)).toContainText("Numéro de formule invalide");
  await page.getByLabel("Numéro de formule").fill("2021AB12345");
  await page.getByLabel("Date de 1re immatriculation").fill("31/02/2019");
  await page.getByRole("button", { name: /Payer/ }).click();
  await expect(alert(page)).toContainText("Date de première immatriculation invalide");
  await page.getByLabel("Date de 1re immatriculation").fill("12/03/2019");
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

test("API : validation des entrées", async ({ request }) => {
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
  await page.getByLabel("Numéro de formule").fill("2019AB12345");
  await page.getByLabel("Nom du titulaire").fill("Dupont Jean");
  await page.getByLabel("Date de 1re immatriculation").fill("15/06/2019");
  await page.getByLabel("Votre e-mail *").fill("test@exemple.fr");
  await page.getByRole("button", { name: /Payer/ }).click();
  await page.getByRole("button", { name: "Payer (simulation)" }).click();
  await expect(page.getByRole("heading", { name: "Vue d'ensemble" })).toBeVisible({ timeout: 30000 });
  await expect(page.locator("#pannes")).toContainText("Courroie de distribution");
});
