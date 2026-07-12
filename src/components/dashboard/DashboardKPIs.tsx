import { KpiTile } from "@/components/ui/KpiTile";

interface DashboardKPIsProps {
  tasksEnCours: number;
  tasksCompleteesCeMois: number;
  documentsEnAttente: number;
  tempsMoyenJours: number;
}

export function DashboardKPIs({
  tasksEnCours,
  tasksCompleteesCeMois,
  documentsEnAttente,
  tempsMoyenJours,
}: DashboardKPIsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <KpiTile
        label="Tâches en cours"
        value={tasksEnCours}
        href="/dashboard/taches"
        tone="neutral"
        hint="Ouvrir les missions"
      />
      <KpiTile
        label="Complétées ce mois"
        value={tasksCompleteesCeMois}
        href="/dashboard/taches"
        tone="ok"
      />
      <KpiTile
        label="Documents en attente"
        value={documentsEnAttente}
        href="/dashboard/documents?statut=EN_ATTENTE"
        tone={documentsEnAttente > 0 ? "watch" : "neutral"}
        hint="À traiter"
      />
      <KpiTile
        label="Temps moyen"
        value={tempsMoyenJours < 1 ? "< 1 j" : `${tempsMoyenJours.toFixed(1)} j`}
        href="/dashboard"
        tone="neutral"
        hint="Traitement"
      />
    </div>
  );
}
