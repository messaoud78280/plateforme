import type { DpgfAnalysisStats } from "@/lib/dpgf-analysis/types";

type Props = { stats: DpgfAnalysisStats };

export function DpgfAnalysisStatsStrip({ stats }: Props) {
  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
      <Stat label="Fiches d'analyse" value={stats.totalSheets.toLocaleString("fr-FR")} />
      <Stat label="Lots couverts" value={stats.lotsCovered.toLocaleString("fr-FR")} />
      <Stat label="À vérifier" value={stats.toVerify.toLocaleString("fr-FR")} accent="amber" />
      <Stat label="Validées" value={stats.validated.toLocaleString("fr-FR")} accent="emerald" />
      <Stat
        label="Niveaux"
        value={`${stats.levelDebutant} / ${stats.levelIntermediaire} / ${stats.levelConfirme}`}
        hint="débutant · intermédiaire · confirmé"
        className="lg:col-span-1"
      />
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  accent,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "amber" | "emerald";
  className?: string;
}) {
  const valueClass =
    accent === "amber" ? "text-amber-900" : accent === "emerald" ? "text-emerald-900" : "text-slate-900";
  return (
    <div className={`rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5 ${className ?? ""}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 font-mono text-lg font-semibold tabular-nums ${valueClass}`}>{value}</p>
      {hint ? <p className="mt-0.5 text-[10px] text-slate-500">{hint}</p> : null}
    </div>
  );
}
