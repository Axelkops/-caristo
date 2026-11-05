export function LegalPage({ title, updated, intro, toc, children }: { title: string; updated: string; intro?: string; toc?: { id: string; label: string }[]; children: React.ReactNode }) {
  return (
    <article className="max-w-[820px] mx-auto px-4 sm:px-6 py-14 flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="m-0 text-4xl font-bold">{title}</h1>
        <span className="text-sm text-muted">Dernière mise à jour : {updated}</span>
        {intro && <p className="m-0 text-[15px] text-[#4B5563] leading-relaxed">{intro}</p>}
      </header>
      {toc && (
        <nav aria-label="Sommaire" className="bg-white border border-line rounded-2xl px-5 py-4">
          <ol className="m-0 pl-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
            {toc.map((t) => <li key={t.id}><a href={`#${t.id}`} className="text-navy">{t.label}</a></li>)}
          </ol>
        </nav>
      )}
      <div className="flex flex-col gap-4 text-[15px] leading-relaxed text-[#374151] [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-0 [&_h2]:scroll-mt-6 [&_p]:m-0 [&_ul]:m-0 [&_ul]:pl-5 [&_ul]:list-disc [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm [&_th]:text-left [&_th]:font-semibold [&_th]:px-3 [&_th]:py-2 [&_th]:border-b [&_th]:border-line [&_td]:px-3 [&_td]:py-2 [&_td]:border-b [&_td]:border-line [&_td]:align-top [&_a]:text-navy">{children}</div>
    </article>
  );
}
