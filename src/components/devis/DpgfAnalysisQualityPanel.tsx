import type { DpgfAnalysisQualityMetrics } from "@/lib/dpgf-analysis/types";

type Props = {
  metrics: DpgfAnalysisQualityMetrics;
  globalTotal?: number;
};

export function DpgfAnalysisQualityPanel({ metrics, globalTotal }: Props) {
  const items: {
    label: string;
    value: number;
    tone?: "neutral" | "amber" | "emerald" | "rose" | "slate";
    hint?: string;
  }[] = [
    {
      label: "Fiches affichées",
      value: metrics.filteredCount,
      hint: globalTotal != null && globalTotal !== metrics.filteredCount ? `${globalTotal} au total en base` : undefined,
    },
    { label: "Lots couverts", value: metrics.lotsCovered },
    { label: "À vérifier", value: metrics.toVerify, tone: "amber" },
    { label: "Validées", value: metrics.validated, tone: "emerald" },
    { label: "Sans N° DPGF", value: metrics.withoutDpgfNumber, tone: metrics.withoutDpgfNumber > 0 ? "rose" : "neutral" },
    { label: "N° DPGF en doublon", value: metrics.duplicateDpgfNumbers, tone: metrics.duplicateDpgfNumbers > 0 ? "rose" : "neutral" },
    { label: "Familles avec trous", value: metrics.familiesWithGaps, tone: metrics.familiesWithGaps > 0 ? "amber" : "neutral" },
    { label: "Incomplètes / brouillon", value: metrics.incompleteCount, tone: metrics.incompleteCount > 0 ? "amber" : "neutral" },
  ];

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1e3a5f]/70">Contrôle qualité</p>
          <h2 className="font-heading text-sm font-bold text-slate-900">Vue d&apos;ensemble des fiches</h2>
        </div>
        {(metrics.withoutDpgfNumber > 0 || metrics.familiesWithGaps > 0 || metrics.duplicateDpgfNumbers > 0) && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-900">
            Anomalies détectées — vérifiez l&apos;import ou complétez les N° DPGF
          </p>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        {items.map((item) => (
          <QualityStat key={item.label} {...item} />
        ))}
      </div>
    </section>
  );
}

function QualityStat({
  label,
  value,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: number;
  tone?: "neutral" | "amber" | "emerald" | "rose" | "slate";
  hint?: string;
}) {
  const valueCls = {
    neutral: "text-slate-900",
    amber: "text-amber-900",
    emerald: "text-emerald-800",
    rose: "text-rose-800",
    slate: "text-slate-700",
  }[tone];

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-0.5 font-mono text-lg font-bold tabular-nums ${valueCls}`}>
        {value.toLocaleString("fr-FR")}
      </p>
      {hint ? <p className="mt-0.5 text-[10px] text-slate-500">{hint}</p> : null}
    </div>
  );
}
