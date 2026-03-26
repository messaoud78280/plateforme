import { Activity } from "@prisma/client";

interface ActivityTimelineProps {
  activities: Activity[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  return (
    <div className="rounded-xl surface-metallic-light p-6">
      <h2 className="text-lg font-semibold text-slate-800">Activité récente</h2>
      <p className="mt-1 text-sm text-slate-500">Les 5 dernières actions</p>

      {activities.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">Aucune activité récente.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {activities.map((a) => (
            <li key={a.id} className="flex gap-3 border-l-2 border-slate-200 pl-4">
              <div className="flex-1">
                <p className="font-medium text-slate-800">{a.title}</p>
                {a.detail && <p className="text-sm text-slate-500">{a.detail}</p>}
                <p className="mt-1 text-xs text-slate-400">
                  {new Date(a.createdAt).toLocaleString("fr-FR")}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
