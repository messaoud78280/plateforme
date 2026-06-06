import { BEWORK_VALUE_PILLARS } from "@/lib/bework-value-pillars";

type Props = {
  className?: string;
};

/** Grille d’engagements en bas des pages ressources / tutos BeWork. */
export function BeWorkStatsGrid({ className = "" }: Props) {
  const productivity = BEWORK_VALUE_PILLARS.find((p) => p.label.startsWith("Gain de productivité"));
  const france = BEWORK_VALUE_PILLARS.find((p) => p.label.startsWith("100 %"));
  const compliance = BEWORK_VALUE_PILLARS.find((p) => p.label.startsWith("Conformité"));

  const rootClass = ["mt-14 grid gap-8 border-t border-slate-100 pt-10 sm:grid-cols-3", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass}>
      <div>
        <div className="text-5xl font-extrabold text-[#1d4ed8]">×10</div>
        <div className="mt-2 text-xl font-bold uppercase tracking-wide text-slate-900">Productivité</div>
        {productivity ? (
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{productivity.detail}</p>
        ) : null}
      </div>
      <div>
        <div className="text-5xl font-extrabold text-[#1d4ed8]">100 %</div>
        <div className="mt-2 text-xl font-bold uppercase tracking-wide text-slate-900">Supervisé en France</div>
        {france ? <p className="mt-2 text-sm leading-relaxed text-slate-600">{france.detail}</p> : null}
      </div>
      <div>
        <div className="text-3xl font-extrabold leading-tight text-[#1d4ed8] sm:text-4xl">Conformité</div>
        <div className="mt-2 text-xl font-bold uppercase tracking-wide text-slate-900">Juridique garantie</div>
        {compliance ? (
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{compliance.detail}</p>
        ) : null}
      </div>
    </div>
  );
}
