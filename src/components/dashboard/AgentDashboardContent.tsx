import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  NOUVEAU: "Nouvelle",
  EN_ATTENTE: "En attente",
  ASSIGNEE: "Assignée",
  EN_ANALYSE: "En analyse",
  EN_COURS: "En cours",
  EN_ATTENTE_INFO: "En attente d'info",
  A_VALIDER: "À valider",
  COMPLETE: "Terminée",
};

const PRIORITY_COLORS: Record<string, string> = {
  STANDARD: "bg-slate-100 text-slate-800",
  PRIORITAIRE: "bg-amber-100 text-amber-800",
  URGENT: "bg-red-100 text-red-800",
};

export type AgentTaskItem = {
  id: string;
  title: string;
  status: string;
  priority: string | null;
  desiredDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  client: { id: string; name: string };
};

export type AgentMessageItem = {
  id: string;
  content: string;
  createdAt: Date;
  read: boolean;
  sender: { id: string; name: string };
  task: { id: string; title: string };
};

export type AgentDashboardContentProps = {
  userName: string | null;
  missionsToday: number;
  missionsUrgentes: number;
  missionsEnCours: number;
  messagesNonLus: number;
  missions: AgentTaskItem[];
  missionsUrgentesList: AgentTaskItem[];
  messagesRecents: AgentMessageItem[];
};

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function SummaryCard({ label, count, href }: { label: string; count: number; href?: string }) {
  const content = (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-2xl font-bold text-slate-800">{count}</p>
      <p className="mt-1 text-sm text-slate-600">{label}</p>
    </div>
  );
  if (href) {
    return <Link href={href} className="block transition hover:opacity-90">{content}</Link>;
  }
  return content;
}

export function AgentDashboardContent({
  userName,
  missionsToday,
  missionsUrgentes,
  missionsEnCours,
  messagesNonLus,
  missions,
  missionsUrgentesList,
  messagesRecents,
}: AgentDashboardContentProps) {
  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-800">
          Bienvenue, {userName ?? "Agent"}
        </h1>
        <p className="mt-1 text-slate-600">
          Espace de travail centré sur vos missions. Gérez les tâches assignées et échangez avec les clients.
        </p>
      </div>

      {/* Indicateurs */}
      <section aria-label="Indicateurs">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Vue d'ensemble</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <SummaryCard label="Missions aujourd'hui" count={missionsToday} href="/dashboard/taches" />
          <SummaryCard label="Missions urgentes" count={missionsUrgentes} href="/dashboard/taches" />
          <SummaryCard label="Missions en cours" count={missionsEnCours} href="/dashboard/taches" />
          <SummaryCard label="Messages non lus" count={messagesNonLus} href="/dashboard/messagerie" />
        </div>
      </section>

      {/* Mes missions assignées - section principale */}
      <section aria-label="Mes missions assignées">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Mes missions assignées</h2>
        {missions.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-slate-500">Aucune mission assignée pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {missions.map((task) => (
              <div
                key={task.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/dashboard/taches/${task.id}`}
                    className="font-medium text-slate-800 hover:text-blue-600 hover:underline"
                  >
                    {task.title}
                  </Link>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    <span>Client : {task.client.name}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        PRIORITY_COLORS[task.priority ?? "STANDARD"] ?? PRIORITY_COLORS.STANDARD
                      }`}
                    >
                      {task.priority === "URGENT" ? "Urgent" : task.priority === "PRIORITAIRE" ? "Prioritaire" : "Standard"}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        task.status === "COMPLETE" ? "bg-green-100 text-green-800" :
                        task.status === "A_VALIDER" ? "bg-violet-100 text-violet-800" :
                        task.status === "EN_COURS" || task.status === "EN_ANALYSE" || task.status === "ASSIGNEE"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {STATUS_LABELS[task.status] ?? task.status}
                    </span>
                    <span className="text-xs">Créée le {formatDate(task.createdAt)}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/dashboard/taches/${task.id}`}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Ouvrir la mission
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
        <Link
          href="/dashboard/taches"
          className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline"
        >
          Voir toutes mes missions →
        </Link>
      </section>

      {/* Missions urgentes */}
      <section aria-label="Missions urgentes">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Missions urgentes</h2>
        {missionsUrgentesList.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Aucune mission urgente.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {missionsUrgentesList.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-red-100 bg-red-50/50 p-3"
              >
                <Link
                  href={`/dashboard/taches/${task.id}`}
                  className="font-medium text-slate-800 hover:text-blue-600 hover:underline"
                >
                  {task.title}
                </Link>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-slate-600">{task.client.name}</span>
                  <Link
                    href={`/dashboard/taches/${task.id}`}
                    className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700"
                  >
                    Ouvrir
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Messages récents */}
      <section aria-label="Messages récents">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Messages récents</h2>
        {messagesRecents.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Aucun message récent.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {messagesRecents.map((msg) => (
              <Link
                key={msg.id}
                href={`/dashboard/taches/${msg.task.id}`}
                className={`block rounded-lg border p-3 transition hover:border-blue-300 ${
                  !msg.read ? "border-blue-200 bg-blue-50/50" : "border-slate-200 bg-white"
                }`}
              >
                <p className="truncate text-sm text-slate-800">{msg.content}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {msg.sender.name} · {msg.task.title} · {formatDate(msg.createdAt)}
                </p>
              </Link>
            ))}
          </div>
        )}
        <Link
          href="/dashboard/messagerie"
          className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline"
        >
          Voir la messagerie →
        </Link>
      </section>
    </div>
  );
}
