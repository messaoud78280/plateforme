"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { PieChart, Pie, Cell, Legend, Tooltip as PieTooltip } from "recharts";

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
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-slate-500">Chargement des statistiques…</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-700">{error || "Données indisponibles"}</p>
      </div>
    );
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
      {/* Cartes récap */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-slate-800">{stats.tasks.total}</p>
          <p className="text-sm text-slate-500">Tâches (période)</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-green-600">{stats.tasks.completed}</p>
          <p className="text-sm text-slate-500">Terminées</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-blue-600">{tauxCompletion} %</p>
          <p className="text-sm text-slate-500">Complétion</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-slate-800">
            {stats.tempsMoyenJours < 1 ? "< 1" : stats.tempsMoyenJours} j
          </p>
          <p className="text-sm text-slate-500">Temps moyen</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-slate-800">{stats.documents.total}</p>
          <p className="text-sm text-slate-500">Documents</p>
        </div>
      </div>

      {/* Graphique évolution */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">Évolution des tâches</h2>
        <p className="mt-1 text-sm text-slate-500">Créées vs complétées sur la période</p>
        <div className="mt-6 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.evolution} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number | undefined) => [value ?? 0, ""]}
                labelFormatter={(_, payload) => payload[0]?.payload?.date}
              />
              <Bar dataKey="creees" name="Créées" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completees" name="Complétées" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Répartition par statut */}
      {pieData.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">Répartition par statut</h2>
          <div className="mt-6 h-64">
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
        </div>
      )}

      {/* Tableau récap */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">Récapitulatif</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600">
                <th className="pb-2 font-medium">Indicateur</th>
                <th className="pb-2 font-medium">Valeur</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-2 text-slate-600">Tâches créées sur la période</td>
                <td className="py-2 font-medium">{stats.tasks.total}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 text-slate-600">Tâches terminées</td>
                <td className="py-2 font-medium">{stats.tasks.completed}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 text-slate-600">Taux de complétion</td>
                <td className="py-2 font-medium">{tauxCompletion} %</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 text-slate-600">Temps moyen de traitement</td>
                <td className="py-2 font-medium">
                  {stats.tempsMoyenJours < 1 ? "< 1 jour" : `${stats.tempsMoyenJours} jours`}
                </td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 text-slate-600">Documents déposés</td>
                <td className="py-2 font-medium">{stats.documents.total}</td>
              </tr>
              <tr>
                <td className="py-2 text-slate-600">Projets créés</td>
                <td className="py-2 font-medium">{stats.projects.total}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
