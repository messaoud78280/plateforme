"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { PieChart, Pie, Cell, Legend, Tooltip as PieTooltip } from "recharts";
import { KpiTile } from "@/components/ui/KpiTile";
import { Card, CardHeader } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { TableSkeleton } from "@/components/ui/Skeleton";

interface Stats {
  period: string;
  start: string;
  end: string;
  tasks: { total: number; completed: number; byStatus: Record<string, number> };
  documents: { total: number; byStatus: Record<string, number> };
  projects: { total: number };
  tempsMoyenJours: number;
  evolution: { date: string; label: string; creees: number; completees: number }[];
}

export function ReportsView({ period }: { period: string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`/api/reports/stats?period=${period}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setStats(data);
      })
      .catch(() => setError("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) {
    return <TableSkeleton rows={4} />;
  }

  if (error || !stats) {
    return <Alert tone="critical">{error || "Données indisponibles"}</Alert>;
  }

  const pieData = [
    { name: "En attente", value: stats.tasks.byStatus.EN_ATTENTE ?? 0, color: "#f59e0b" },
    { name: "En cours", value: stats.tasks.byStatus.EN_COURS ?? 0, color: "#3b82f6" },
    { name: "Terminées", value: stats.tasks.byStatus.COMPLETE ?? 0, color: "#22c55e" },
  ].filter((d) => d.value > 0);

  const tauxCompletion =
    stats.tasks.total > 0
      ? Math.round((stats.tasks.completed / stats.tasks.total) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <KpiTile label="Tâches (période)" value={stats.tasks.total} />
        <KpiTile label="Terminées" value={stats.tasks.completed} tone="ok" />
        <KpiTile label="Complétion" value={`${tauxCompletion} %`} />
        <KpiTile
          label="Temps moyen"
          value={stats.tempsMoyenJours < 1 ? "< 1 j" : `${stats.tempsMoyenJours} j`}
        />
        <KpiTile label="Documents" value={stats.documents.total} />
      </div>

      <Card hover={false}>
        <CardHeader title="Évolution des tâches" description="Créées vs complétées sur la période" />
        <div className="mt-2 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.evolution} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number | undefined) => [value ?? 0, ""]}
                labelFormatter={(_, payload) => payload[0]?.payload?.date}
              />
              <Bar dataKey="creees" name="Créées" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completees" name="Complétées" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {pieData.length > 0 && (
        <Card hover={false}>
          <CardHeader title="Répartition par statut" />
          <div className="mt-2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <PieTooltip formatter={(value: number | undefined) => [value ?? 0, ""]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <Card hover={false}>
        <CardHeader title="Récapitulatif" />
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[color:var(--cc-chrome-border)] text-bework-muted">
                <th className="pb-2 font-medium">Indicateur</th>
                <th className="pb-2 font-medium">Valeur</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-bework-navy/[0.06]">
                <td className="py-2 text-bework-muted">Tâches créées sur la période</td>
                <td className="py-2 font-medium text-bework-ink">{stats.tasks.total}</td>
              </tr>
              <tr className="border-b border-bework-navy/[0.06]">
                <td className="py-2 text-bework-muted">Tâches terminées</td>
                <td className="py-2 font-medium text-bework-ink">{stats.tasks.completed}</td>
              </tr>
              <tr className="border-b border-bework-navy/[0.06]">
                <td className="py-2 text-bework-muted">Taux de complétion</td>
                <td className="py-2 font-medium text-bework-ink">{tauxCompletion} %</td>
              </tr>
              <tr className="border-b border-bework-navy/[0.06]">
                <td className="py-2 text-bework-muted">Temps moyen de traitement</td>
                <td className="py-2 font-medium text-bework-ink">
                  {stats.tempsMoyenJours < 1 ? "< 1 jour" : `${stats.tempsMoyenJours} jours`}
                </td>
              </tr>
              <tr className="border-b border-bework-navy/[0.06]">
                <td className="py-2 text-bework-muted">Documents déposés</td>
                <td className="py-2 font-medium text-bework-ink">{stats.documents.total}</td>
              </tr>
              <tr>
                <td className="py-2 text-bework-muted">Projets créés</td>
                <td className="py-2 font-medium text-bework-ink">{stats.projects.total}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
