import { formatEurFrBpu } from "@/lib/be-work-devis-format";
import type { BibliothequeStats } from "@/lib/be-work-devis-search";

type Props = {
  stats: BibliothequeStats;
};

export function BibliothequeStatsStrip({ stats }: Props) {
  const annexes =
    stats.etudeControleCount + stats.administratifCount + stats.garantieCount + stats.fraisAnnexeCount;

  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-6">
      <Stat label="Ouvrages (liste)" value={String(stats.totalRows)} />
      <Stat label="Ouvrages techniques" value={String(stats.technicalCount)} />
      <Stat label="Études / contrôles" value={String(stats.etudeControleCount)} />
      <Stat label="Administratif" value={String(stats.administratifCount)} />
      <Stat label="Garanties / assurances" value={String(stats.garantieCount)} />
      <Stat label="Frais annexes" value={String(stats.fraisAnnexeCount)} />
      <Stat label="Prestations annexes (total)" value={String(annexes)} className="lg:col-span-2" />
      <Stat label="Prix observés (lignes)" value={String(stats.totalPriceEntries)} />
      <Stat
        label="Prix moyen global HT (pondéré)"
        value={stats.globalAvgUnitHt != null ? formatEurFrBpu(stats.globalAvgUnitHt) : "—"}
        className="lg:col-span-2"
      />
    </div>
  );
}

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-slate-900">{value}</p>
    </div>
  );
}
