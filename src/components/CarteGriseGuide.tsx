/**
 * Schéma simplifié d'une carte grise française (certificat d'immatriculation SIV)
 * avec les trois informations demandées mises en évidence.
 */
export function CarteGriseGuide() {
  const line = "#C9D3E3";
  const ink = "#4B5563";
  const hl = "#2563EB";
  return (
    <div className="bg-ground border border-line rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row gap-5 items-start">
      <svg viewBox="0 0 420 250" width="420" height="250" role="img" aria-label="Où trouver les informations sur la carte grise" className="w-full max-w-[420px] h-auto shrink-0">
        {/* document */}
        <rect x="6" y="6" width="408" height="238" rx="10" fill="#FFFFFF" stroke={line} strokeWidth="1.5" />
        {/* partie gauche : certificat */}
        <text x="22" y="30" fontSize="11" fontWeight="700" fill="#111318" fontFamily="Inter, sans-serif">CERTIFICAT D&apos;IMMATRICULATION</text>
        <text x="22" y="44" fontSize="8" fill={ink} fontFamily="Inter, sans-serif">République française</text>

        {/* numéro de formule : en gras sous le titre */}
        <rect x="18" y="52" width="118" height="20" rx="5" fill="#EFF6FF" stroke={hl} strokeWidth="1.5" />
        <text x="26" y="66" fontSize="11" fontWeight="700" fill="#111318" fontFamily="ui-monospace, monospace" letterSpacing="1">2021AB12345</text>
        <circle cx="146" cy="62" r="9" fill={hl} /><text x="146" y="66" fontSize="10" fontWeight="700" fill="#fff" textAnchor="middle" fontFamily="Inter, sans-serif">1</text>

        {/* lignes de champs */}
        {[
          ["A", "AB-123-CD", 92, false],
          ["B", "27/02/2020", 110, true],
          ["C.1", "DUPONT MARIE", 128, true],
          ["C.4a", "EST LE PROPRIÉTAIRE DU VÉHICULE", 146, false],
          ["D.1", "PEUGEOT", 164, false],
          ["D.2", "208 II", 182, false],
          ["E", "VR3UHZKXZKT127447", 200, false],
        ].map(([k, v, y, on]) => (
          <g key={String(k)}>
            {on && <rect x="18" y={Number(y) - 12} width="230" height="17" rx="4" fill="#EFF6FF" stroke={hl} strokeWidth="1.5" />}
            <text x="24" y={Number(y)} fontSize="9" fontWeight="700" fill={on ? hl : ink} fontFamily="Inter, sans-serif">{k}</text>
            <text x="58" y={Number(y)} fontSize="9" fill="#111318" fontFamily="ui-monospace, monospace">{v}</text>
          </g>
        ))}
        <circle cx="258" cy="105" r="9" fill={hl} /><text x="258" y="109" fontSize="10" fontWeight="700" fill="#fff" textAnchor="middle" fontFamily="Inter, sans-serif">3</text>
        <circle cx="258" cy="123" r="9" fill={hl} /><text x="258" y="127" fontSize="10" fontWeight="700" fill="#fff" textAnchor="middle" fontFamily="Inter, sans-serif">2</text>

        {/* coupon détachable à droite */}
        <line x1="290" y1="14" x2="290" y2="236" stroke={line} strokeWidth="1.5" strokeDasharray="4 4" />
        <text x="302" y="30" fontSize="8" fontWeight="700" fill={ink} fontFamily="Inter, sans-serif">COUPON DÉTACHABLE</text>
        {[48, 62, 76, 90, 104, 118].map((y) => <rect key={y} x="302" y={y} width={y % 28 === 0 ? 70 : 96} height="5" rx="2" fill="#E5E7EB" />)}
        <text x="302" y="222" fontSize="8" fill={ink} fontFamily="Inter, sans-serif">N° de formule</text>
        <rect x="300" y="226" width="104" height="14" rx="4" fill="#EFF6FF" stroke={hl} strokeWidth="1.5" />
        <text x="306" y="237" fontSize="9" fontWeight="700" fill="#111318" fontFamily="ui-monospace, monospace" letterSpacing="0.5">2021AB12345</text>
      </svg>
      <ol className="m-0 p-0 list-none flex flex-col gap-3 text-sm text-[#374151]">
        <li className="flex gap-3 items-start"><span className="w-6 h-6 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center shrink-0">1</span><span><strong className="text-fg">Numéro de formule</strong> : en gras, juste sous le titre « Certificat d&apos;immatriculation », en haut à gauche (et rappelé en bas du coupon détachable). 11 caractères : l&apos;année, 2 lettres, 5 chiffres, par exemple <span className="font-mono">2021AB12345</span>.</span></li>
        <li className="flex gap-3 items-start"><span className="w-6 h-6 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center shrink-0">2</span><span><strong className="text-fg">Nom du titulaire</strong> : case <strong>C.1</strong>, le nom en majuscules suivi du prénom (ou le nom de la société). Saisissez-le tel quel.</span></li>
        <li className="flex gap-3 items-start"><span className="w-6 h-6 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center shrink-0">3</span><span><strong className="text-fg">Date de 1re immatriculation</strong> : case <strong>B</strong>, juste sous la plaque (case A), au format JJ/MM/AAAA.</span></li>
      </ol>
    </div>
  );
}
