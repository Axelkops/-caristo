import Link from "next/link";
export default function NotFound() {
  return (
    <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-24 flex flex-col gap-4 text-center items-center">
      <h1 className="m-0 text-4xl font-bold">Page introuvable</h1>
      <p className="m-0 text-[#4B5563]">Ce rapport n&apos;existe pas, a expiré, ou le lien est incomplet.</p>
      <Link href="/" className="bg-navy text-white px-5 py-3 rounded-xl font-semibold no-underline">Retour à l&apos;accueil</Link>
    </div>
  );
}
