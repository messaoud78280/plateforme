import { KpiTile } from "@/components/ui/KpiTile";
import type { DpgfAnalysisStats } from "@/lib/dpgf-analysis/types";

type Props = { stats: DpgfAnalysisStats };

export function DpgfAnalysisStatsStrip({ stats }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <KpiTile label="Fiches d'analyse" value={stats.totalSheets.toLocaleString("fr-FR")} />
      <KpiTile label="Lots couverts" value={stats.lotsCovered.toLocaleString("fr-FR")} />
      <KpiTile
        label="À vérifier"
        value={stats.toVerify.toLocaleString("fr-FR")}
        tone={stats.toVerify > 0 ? "watch" : "ok"}
      />
      <KpiTile label="Validées" value={stats.validated.toLocaleString("fr-FR")} tone="ok" />
      <KpiTile
        label="Niveaux"
        value={`${stats.levelDebutant} / ${stats.levelIntermediaire} / ${stats.levelConfirme}`}
        hint="débutant · intermédiaire · confirmé"
      />
    </div>
  );
}
