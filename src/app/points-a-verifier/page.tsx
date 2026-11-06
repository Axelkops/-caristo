import Link from "next/link";
import { ChecklistExplorer } from "@/components/ChecklistExplorer";

export const metadata = {
  title: "Points à vérifier avant d'acheter une voiture d'occasion",
  description: "La liste des points à contrôler avant l'achat, différente selon le véhicule : essence, diesel, hybride, électrique, boîte manuelle ou automatique, âge et kilométrage.",
};

export default function PointsAVerifier() {
  return (
    <>
      <section className="text-white px-4 sm:px-6 pt-14 sm:pt-20 pb-12" style={{ background: "linear-gradient(180deg, #070F1F 0%, #0A1E3F 100%)" }}>
        <div className="max-w-[1200px] mx-auto flex flex-col gap-6">
          <span className="text-xs font-semibold text-accentsoft uppercase tracking-[1.8px]">Inclus dans chaque rapport</span>
          <h1 className="m-0 text-[36px] sm:text-[52px] leading-[1.04] font-bold max-w-[18ch]">Les points à vérifier avant d&apos;acheter.</h1>
          <p className="m-0 text-lg leading-relaxed text-muteddark max-w-[620px]">Une électrique ne se contrôle pas comme un diesel, et une boîte automatique à double embrayage ne se teste pas comme une boîte manuelle. Caristo construit la liste pour le véhicule exact du rapport : énergie, boîte, âge, kilométrage et pannes connues du modèle. Choisissez un profil ci-dessous pour voir la différence.</p>
        </div>
      </section>
      <section className="bg-ink px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-[1200px] mx-auto flex flex-col gap-10">
          <ChecklistExplorer />
          <div className="rounded-[20px] p-6 sm:p-8 bg-navy2 border border-accent/30 flex flex-wrap items-center justify-between gap-5 text-white">
            <div className="flex flex-col gap-1.5 max-w-[60ch]">
              <span className="display text-xl font-bold">Dans le rapport, la liste est faite pour la plaque saisie.</span>
              <span className="text-sm text-muteddark">Avec en plus les points propres au modèle (pannes connues, rappels constructeur) et les alertes de l&apos;historique officiel. À cocher sur place, et aussi dans le PDF.</span>
            </div>
            <Link href="/#top" className="bg-accent text-white px-6 py-3.5 rounded-xl font-semibold no-underline led">Obtenir le rapport</Link>
          </div>
        </div>
      </section>
    </>
  );
}
