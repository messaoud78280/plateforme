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

export type ManagerTaskItem = {
  id: string;
  title: string;
  status: string;
  priority: string | null;
  createdAt: Date;
  client: { id: string; name: string };
  assignedTo: { id: string; name: string } | null;
};

export type ManagerActivityItem = {
  id: string;
  title: string;
  detail: string | null;
  createdAt: Date;
  client?: { name: string };
};

type ManagerDashboardContentProps = {
  nouvellesDemandes: ManagerTaskItem[];
  aAssigner: ManagerTaskItem[];
  missionsEnCours: ManagerTaskItem[];
  missionsAValider: ManagerTaskItem[];
  missionsTerminees: ManagerTaskItem[];
  /** Indicateurs optionnels pour le bandeau KPI */
  nouvellesCount?: number;
  aAssignerCount?: number;
  enCoursCount?: number;
  aValiderCount?: number;
  agentsActifsCount?: number;
  actionsConsumees?: number;
  activiteRecente?: ManagerActivityItem[];
};

function TaskCard({
  task,
  actions,
}: {
  task: ManagerTaskItem;
  actions?: { label: string; href: string; primary?: boolean }[];
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Link
            href={`/dashboard/taches/${task.id}`}
            className="font-medium text-slate-800 hover:text-blue-600 hover:underline line-clamp-2"
          >
            {task.title}
          </Link>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span>Client : {task.client.name}</span>
            {task.assignedTo && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-800">
                {task.assignedTo.name}
              </span>
            )}
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                PRIORITY_COLORS[task.priority ?? "STANDARD"] ?? PRIORITY_COLORS.STANDARD
              }`}
            >
              {task.priority ?? "Standard"}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-1.5">
          <Link
            href={`/dashboard/taches/${task.id}`}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Voir
          </Link>
          {actions?.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                a.primary
                  ? "bg-[#1d4ed8] text-white hover:bg-[#1e40af]"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {a.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, count, href }: { label: string; count: number; href?: string }) {
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

export function ManagerDashboardContent({
  nouvellesDemandes,
  aAssigner,
  missionsEnCours,
  missionsAValider,
  missionsTerminees,
  nouvellesCount,
  aAssignerCount,
  enCoursCount,
  aValiderCount,
  agentsActifsCount = 0,
  actionsConsumees,
  activiteRecente = [],
}: ManagerDashboardContentProps) {
  const showKpis = typeof nouvellesCount === "number" || agentsActifsCount > 0;
  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Centre de pilotage des missions</h2>
        <p className="mt-1 text-slate-600">
          Gérez les demandes clients, assignez les agents et validez les missions.
        </p>
      </div>

      {/* Indicateurs */}
      {showKpis && (
        <section aria-label="Indicateurs">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">Vue d'ensemble</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <KpiCard
              label="Nouvelles demandes"
              count={typeof nouvellesCount === "number" ? nouvellesCount : nouvellesDemandes.length}
              href="/dashboard/taches?statut=NOUVEAU"
            />
            <KpiCard
              label="Missions à assigner"
              count={typeof aAssignerCount === "number" ? aAssignerCount : aAssigner.length}
              href="/dashboard/taches"
            />
            <KpiCard
              label="Missions en cours"
              count={typeof enCoursCount === "number" ? enCoursCount : missionsEnCours.length}
              href="/dashboard/taches?statut=EN_COURS"
            />
            <KpiCard
              label="Missions à valider"
              count={typeof aValiderCount === "number" ? aValiderCount : missionsAValider.length}
              href="/dashboard/taches?statut=A_VALIDER"
            />
            <KpiCard
              label="Agents actifs"
              count={agentsActifsCount}
              href="/dashboard/agents"
            />
          </div>
        </section>
      )}

      {/* Actions consommées + Activité récente */}
      {(typeof actionsConsumees === "number" || activiteRecente.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {typeof actionsConsumees === "number" && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800">Actions consommées</h3>
              <p className="mt-2 text-3xl font-bold text-[#1d4ed8]">{actionsConsumees}</p>
              <p className="mt-1 text-sm text-slate-500">Total consommé par les clients ce mois</p>
            </div>
          )}
          {activiteRecente.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800">Activité récente</h3>
              <ul className="mt-4 space-y-3">
                {activiteRecente.slice(0, 5).map((a) => (
                  <li key={a.id} className="flex gap-3 border-l-2 border-slate-200 pl-3 text-sm">
                    <div>
                      <p className="font-medium text-slate-800">{a.title}</p>
                      {a.detail && <p className="text-slate-500">{a.detail}</p>}
                      {a.client && <p className="text-xs text-slate-400">Client : {a.client.name}</p>}
                      <p className="mt-0.5 text-xs text-slate-400">
                        {new Date(a.createdAt).toLocaleString("fr-FR")}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <Link href="/dashboard/taches" className="mt-3 inline-block text-sm font-medium text-[#1d4ed8] hover:underline">
                Voir les missions →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* 1. Nouvelles demandes */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Nouvelles demandes</h3>
          <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-sm font-medium text-slate-700">
            {nouvellesDemandes.length}
          </span>
        </div>
        <p className="mb-4 text-sm text-slate-500">
          Demandes créées par les clients. Voir la demande et assigner un agent.
        </p>
        {nouvellesDemandes.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">Aucune nouvelle demande.</p>
        ) : (
          <div className="space-y-3">
            {nouvellesDemandes.slice(0, 5).map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                actions={[{ label: "Assigner", href: `/dashboard/taches/${t.id}#assign`, primary: true }]}
              />
            ))}
            {nouvellesDemandes.length > 5 && (
              <Link
                href="/dashboard/taches?statut=NOUVEAU"
                className="block pt-2 text-center text-sm font-medium text-[#1d4ed8] hover:underline"
              >
                Voir toutes ({nouvellesDemandes.length}) →
              </Link>
            )}
          </div>
        )}
      </section>

      {/* 2. À assigner */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">À assigner</h3>
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-sm font-medium text-amber-800">
            {aAssigner.length}
          </span>
        </div>
        <p className="mb-4 text-sm text-slate-500">
          Demandes analysées mais non encore distribuées à un agent.
        </p>
        {aAssigner.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">Tout est assigné.</p>
        ) : (
          <div className="space-y-3">
            {aAssigner.slice(0, 5).map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                actions={[{ label: "Assigner agent", href: `/dashboard/taches/${t.id}#assign`, primary: true }]}
              />
            ))}
            {aAssigner.length > 5 && (
              <Link
                href="/dashboard/taches"
                className="block pt-2 text-center text-sm font-medium text-[#1d4ed8] hover:underline"
              >
                Voir tout →
              </Link>
            )}
          </div>
        )}
      </section>

      {/* 3. Missions en cours */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Missions en cours</h3>
          <Link
            href="/dashboard/taches?statut=EN_COURS"
            className="text-sm font-medium text-[#1d4ed8] hover:underline"
          >
            Voir tout
          </Link>
        </div>
        <p className="mb-4 text-sm text-slate-500">
          Client, agent assigné, statut et priorité.
        </p>
        {missionsEnCours.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">Aucune mission en cours.</p>
        ) : (
          <div className="space-y-3">
            {missionsEnCours.slice(0, 6).map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                actions={[
                  { label: STATUS_LABELS[t.status] ?? t.status, href: "#" },
                ]}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. Missions à valider */}
      <section className="rounded-2xl border-2 border-violet-200 bg-violet-50/30 p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Missions à valider</h3>
          <span className="rounded-full bg-violet-200 px-2.5 py-0.5 text-sm font-medium text-violet-900">
            {missionsAValider.length}
          </span>
        </div>
        <p className="mb-4 text-sm text-slate-600">
          Travaux terminés par les agents. Valider ou demander une modification.
        </p>
        {missionsAValider.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">Rien à valider pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {missionsAValider.slice(0, 5).map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                actions={[
                  { label: "Valider", href: `/dashboard/taches/${t.id}#valider`, primary: true },
                  { label: "Modifier", href: `/dashboard/taches/${t.id}#correction` },
                ]}
              />
            ))}
            {missionsAValider.length > 5 && (
              <Link
                href="/dashboard/taches?statut=A_VALIDER"
                className="block pt-2 text-center text-sm font-medium text-[#1d4ed8] hover:underline"
              >
                Voir toutes ({missionsAValider.length}) →
              </Link>
            )}
          </div>
        )}
      </section>

      {/* 5. Missions terminées */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Missions terminées</h3>
          <Link
            href="/dashboard/taches?statut=COMPLETE"
            className="text-sm font-medium text-[#1d4ed8] hover:underline"
          >
            Voir l&apos;historique
          </Link>
        </div>
        {missionsTerminees.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">Aucune mission terminée.</p>
        ) : (
          <div className="space-y-3">
            {missionsTerminees.slice(0, 5).map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
