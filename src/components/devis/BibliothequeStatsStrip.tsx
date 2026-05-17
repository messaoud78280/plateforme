import { formatEurFrBpu } from "@/lib/be-work-devis-format";
import { BIBLIOTHEQUE_LIST_FETCH_LIMIT, type BibliothequeStats } from "@/lib/be-work-devis-search";

type Props = {
  stats: BibliothequeStats;
};

export function BibliothequeStatsStrip({ stats }: Props) {
  const annexes =
    stats.etudeControleCount + stats.administratifCount + stats.garantieCount + stats.fraisAnnexeCount;
  const listeHint =
    stats.listTruncated && stats.displayedRows != null
      ? `${stats.displayedRows.toLocaleString("fr-FR")} affichés`
      : undefined;

  return (
    <div className="space-y-2">
      {stats.listTruncated ? (
        <p className="rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {stats.totalRows.toLocaleString("fr-FR")} ouvrage(s) correspondent aux filtres, mais seuls{" "}
          {stats.displayedRows?.toLocaleString("fr-FR") ?? "—"} sont chargés dans la liste (plafond{" "}
          {BIBLIOTHEQUE_LIST_FETCH_LIMIT.toLocaleString("fr-FR")}). Affinez les filtres ou augmentez{" "}
          <code className="rounded bg-amber-100/80 px-1 text-xs">BEWORK_BIBLIOTHEQUE_MAX_ROWS</code> si besoin.
        </p>
      ) : null}
      <div className="grid gap-3 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-6">
        <Stat label="Ouvrages (liste)" value={stats.totalRows.toLocaleString("fr-FR")} hint={listeHint} />
        <Stat label="Ouvrages techniques" value={stats.technicalCount.toLocaleString("fr-FR")} />
        <Stat label="Études / contrôles" value={stats.etudeControleCount.toLocaleString("fr-FR")} />
        <Stat label="Administratif" value={stats.administratifCount.toLocaleString("fr-FR")} />
        <Stat label="Garanties / assurances" value={stats.garantieCount.toLocaleString("fr-FR")} />
        <Stat label="Frais annexes" value={stats.fraisAnnexeCount.toLocaleString("fr-FR")} />
        <Stat label="Prestations annexes (total)" value={annexes.toLocaleString("fr-FR")} className="lg:col-span-2" />
        <Stat label="Prix observés (lignes)" value={stats.totalPriceEntries.toLocaleString("fr-FR")} />
        <Stat
          label="Prix moyen global HT (pondéré)"
          value={stats.globalAvgUnitHt != null ? formatEurFrBpu(stats.globalAvgUnitHt) : "—"}
          className="lg:col-span-2"
        />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-slate-900">{value}</p>
      {hint ? <p className="mt-0.5 text-[10px] text-amber-800">{hint}</p> : null}
    </div>
  );
}
