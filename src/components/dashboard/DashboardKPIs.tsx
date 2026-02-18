import Link from "next/link";

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
  const kpis = [
    {
      label: "Tâches en cours",
      value: tasksEnCours,
      href: "/dashboard/taches",
      color: "bg-blue-50 text-blue-700 border-blue-200",
      icon: "📋",
    },
    {
      label: "Tâches complétées ce mois",
      value: tasksCompleteesCeMois,
      href: "/dashboard/taches",
      color: "bg-green-50 text-green-700 border-green-200",
      icon: "✅",
    },
    {
      label: "Documents en attente",
      value: documentsEnAttente,
      href: "/dashboard/documents?statut=EN_ATTENTE",
      color: "bg-amber-50 text-amber-700 border-amber-200",
      icon: "📄",
    },
    {
      label: "Temps moyen de traitement",
      value: tempsMoyenJours < 1 ? "< 1 j" : `${tempsMoyenJours.toFixed(1)} j`,
      href: "/dashboard",
      color: "bg-slate-50 text-slate-700 border-slate-200",
      icon: "⏱",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <Link
          key={kpi.label}
          href={kpi.href}
          className={`rounded-xl border p-6 transition hover:shadow-md ${kpi.color}`}
        >
          <span className="text-2xl">{kpi.icon}</span>
          <p className="mt-2 text-2xl font-bold">{kpi.value}</p>
          <p className="text-sm opacity-90">{kpi.label}</p>
        </Link>
      ))}
    </div>
  );
}
