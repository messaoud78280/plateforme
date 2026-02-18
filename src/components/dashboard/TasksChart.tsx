"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type TaskForChart = { createdAt: Date; completedAt: Date | null; status: string };

interface TasksChartProps {
  tasks: TaskForChart[];
}

export function TasksChart({ tasks }: TasksChartProps) {
  // 7 derniers jours : pour chaque jour, compter créations et complétions
  const days: { date: string; label: string; creees: number; completees: number }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const end = new Date(d);
    end.setDate(end.getDate() + 1);
    const creees = tasks.filter(
      (t) => t.createdAt >= d && t.createdAt < end
    ).length;
    const completees = tasks.filter(
      (t) => t.completedAt && t.completedAt >= d && t.completedAt < end
    ).length;
    days.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" }),
      creees,
      completees,
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-800">
        Évolution des tâches (7 derniers jours)
      </h2>
      <p className="mt-1 text-sm text-slate-500">Créées vs complétées</p>

      <div className="mt-6 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={days} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value: number) => [value, ""]}
              labelFormatter={(_, payload) => payload[0]?.payload?.date}
            />
            <Bar dataKey="creees" name="Créées" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="completees" name="Complétées" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
