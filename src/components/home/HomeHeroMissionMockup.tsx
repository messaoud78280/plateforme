const BLUE = "#2563eb";

const STATS: { label: string; value: string }[] = [
  { label: "Prochaine échéance", value: "3 août" },
  { label: "Documents reçus", value: "12" },
  { label: "Documents à récupérer", value: "4" },
  { label: "Fournisseurs à relancer", value: "2" },
];

const ACTIVITY = [
  "Relance envoyée au fournisseur",
  "Notices classées",
  "Tableau DOE mis à jour",
  "Pièces plomberie encore manquantes",
] as const;

/**
 * Mockup réaliste d’une mission BeWork — colonne droite du hero.
 * Statuts et libellés alignés sur l’espace de mission réel (pas de cycle contractuel fictif).
 */
export function HomeHeroMissionMockup() {
  return (
    <div className="mx-auto w-full max-w-[26rem]">
      <div className="rounded-[22px] border border-slate-200/90 bg-white p-5 shadow-[0_24px_60px_-16px_rgba(15,23,42,0.14)] ring-1 ring-slate-100 md:p-6">
        {/* En-tête mission */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="min-w-0">
            <p className="text-[15px] font-bold leading-snug tracking-tight text-[#0f172a] md:text-base">
              Préparation du DOE – Résidence des Tilleuls
            </p>
            <p className="mt-1 text-sm text-slate-600">Mission de suivi documentaire</p>
          </div>
          <span
            className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
            style={{ backgroundColor: "#dbeafe", color: BLUE }}
          >
            En cours
          </span>
        </div>

        {/* Stats mission */}
        <dl className="mt-4 grid grid-cols-2 gap-2.5">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{s.label}</dt>
              <dd className="mt-0.5 text-base font-bold text-[#0f172a]">{s.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2.5 text-xs text-slate-500">Dernière mise à jour&nbsp;: aujourd&apos;hui</p>

        {/* Action attendue */}
        <div className="mt-4 rounded-xl border border-[#d97706]/30 bg-[#fffbeb] px-4 py-3.5">
          <p className="text-xs font-bold uppercase tracking-wide text-[#b45309]">Action attendue de votre part</p>
          <p className="mt-1.5 text-sm font-medium leading-snug text-[#0f172a] md:text-[0.9375rem]">
            Confirmer la référence du produit réellement posé.
          </p>
        </div>

        {/* Activité BeWork */}
        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Activité BeWork</p>
          <ul className="mt-2 space-y-1.5">
            {ACTIVITY.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm leading-snug text-slate-700">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-3 text-center text-xs leading-relaxed text-slate-500 md:text-[0.8125rem]">
        Chaque mission dispose d&apos;un espace de suivi pour les échanges, les documents, les échéances et la
        prochaine action attendue.
      </p>
    </div>
  );
}
