import Link from "next/link";

export type AlertItem = {
  id: string;
  title: string;
  message: string;
  level: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string | null;
};

interface AlertsSectionProps {
  alerts: AlertItem[];
}

export function AlertsSection({ alerts }: AlertsSectionProps) {
  const urgentCount = alerts.filter((a) => a.level === "URGENT").length;

  return (
    <div className="rounded-xl surface-metallic-light p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Alertes importantes</h2>
        {urgentCount > 0 && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
            {urgentCount} urgent{urgentCount > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {alerts.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">Aucune alerte.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {alerts.slice(0, 5).map((a) => (
            <li
              key={a.id}
              className={`rounded-lg border p-3 ${
                a.level === "URGENT"
                  ? "border-red-200 bg-red-50"
                  : a.level === "WARNING"
                    ? "border-amber-200 bg-amber-50"
                    : "border-slate-200 bg-slate-50"
              }`}
            >
              <p className="font-medium text-slate-800">{a.title}</p>
              <p className="text-sm text-slate-600">{a.message}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <p className="text-xs text-slate-400">
                  {new Date(a.createdAt).toLocaleString("fr-FR")}
                </p>
                {a.actionUrl && (
                  <Link
                    href={a.actionUrl}
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    Voir le projet →
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
