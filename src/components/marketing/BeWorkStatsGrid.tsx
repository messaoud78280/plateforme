type Props = {
  className?: string;
};

/** Grille d’engagements en bas des pages ressources / tutos BeWork. */
export function BeWorkStatsGrid({ className = "" }: Props) {
  const rootClass = ["mt-14 grid gap-10 border-t border-slate-100 pt-10 sm:grid-cols-2 lg:grid-cols-3", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass}>
      <div>
        <div className="text-2xl font-extrabold leading-snug text-[#1d4ed8] sm:text-3xl">Prise en charge rapide</div>
      </div>
      <div>
        <div className="text-5xl font-extrabold text-[#1d4ed8]">0</div>
        <div className="mt-2 text-xl font-bold uppercase tracking-wide text-slate-900">RECRUTEMENT À FAIRE</div>
      </div>
      <div>
        <div className="text-5xl font-extrabold text-[#1d4ed8]">100 %</div>
        <div className="mt-2 text-xl font-bold uppercase tracking-wide text-slate-900">PILOTÉ EN FRANCE</div>
      </div>
    </div>
  );
}
