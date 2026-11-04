export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <article className="max-w-[820px] mx-auto px-4 sm:px-6 py-14 flex flex-col gap-6">
      <header className="flex flex-col gap-2"><h1 className="m-0 text-4xl font-bold">{title}</h1><span className="text-sm text-muted">Dernière mise à jour : {updated}</span></header>
      <div className="bg-warnbg border border-[#FDD9A8] rounded-xl px-4 py-3 text-sm text-warntext">Document de travail à faire valider par un avocat avant la mise en ligne.</div>
      <div className="prose-legal flex flex-col gap-4 text-[15px] leading-relaxed text-[#374151] [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-0 [&_p]:m-0 [&_ul]:m-0 [&_ul]:pl-5">{children}</div>
    </article>
  );
}
