import type { Metadata } from "next";
import { ManualForm } from "@/components/ManualForm";
import { Steps } from "@/components/Steps";

export const metadata: Metadata = { title: "Décrire mon véhicule" };

export default function ManualPage() {
  return (
    <>
      <div className="bg-ink text-white px-4 sm:px-6 py-5"><div className="max-w-[1100px] mx-auto"><Steps current={1} /></div></div>
      <div className="max-w-[820px] mx-auto px-4 sm:px-6 py-10 flex flex-col gap-6">
        <div className="flex flex-col gap-2"><h1 className="m-0 text-3xl font-bold">Décrire mon véhicule</h1><p className="m-0 text-[#4B5563]">Plaque non reconnue ou véhicule immatriculé hors de France : indiquez le véhicule vous-même. Les informations figurent sur la carte grise (cases D.1, D.2, D.3, P.3, B).</p></div>
        <div className="bg-white border border-line rounded-[20px] p-6 sm:p-8"><ManualForm /></div>
      </div>
    </>
  );
}
