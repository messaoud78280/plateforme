import Link from "next/link";
import { MINUTES_PER_ACTION } from "@/lib/actions";
import { ActionsWidget } from "@/components/dashboard/ActionsWidget";
import { QuickDelegationForm } from "@/components/dashboard/QuickDelegationForm";
import { MissionHistorySection } from "@/components/missions/MissionHistorySection";
import { CopiloteAdmin } from "@/components/dashboard/CopiloteAdmin";
import { CLIENT_TASK_STATUS_LABELS, type TaskStatus } from "@/types";
import { DeleteTaskButton } from "@/components/tasks/DeleteTaskButton";

function formatMessageDate(d: Date) {
  const date = new Date(d);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

type ClientDashboardContentProps = {
  userName: string | null;
  openDemande?: boolean;
  contractStatus: "PENDING" | "SIGNED" | null;
  actionsData: {
    subscriptionPlan: string | null;
    monthlyActionsTotal: number;
    monthlyActionsUsed: number;
    renewsAt: Date | null;
  };
  tasksEnCours: number;
  tasksCompleteesCeMois: number;
  tempsMoyenJours: number;
  clientTasks: {
    id: string;
    title: string;
    category?: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    actionsUsed: number | null;
    estimatedActions: string | null;
    assignedTo: { id: string; name: string } | null;
  }[];
  recentMessages: {
    id: string;
    content: string;
    createdAt: Date;
    project: { id: string; title: string };
    sender: { id: string; name: string };
    receiverId: string;
  }[];
  clientId: string;
  recentDocuments: {
    id: string;
    name: string;
    createdAt: Date;
    category?: string;
    task: { id: string; title: string } | null;
    fileUrl: string;
  }[];
  recentActivities: {
    id: string;
    type: string;
    title: string;
    detail: string | null;
    createdAt: Date;
  }[];
};

export function ClientDashboardContent({
  userName,
  openDemande,
  contractStatus,
  actionsData,
  tasksEnCours,
  tasksCompleteesCeMois,
  tempsMoyenJours,
  clientTasks,
  recentMessages,
  clientId,
  recentDocuments,
  recentActivities,
}: ClientDashboardContentProps) {
  const remaining = Math.max(0, actionsData.monthlyActionsTotal - actionsData.monthlyActionsUsed);
  const tempsMoyenLabel =
    tempsMoyenJours < 1 ? "Réponse moyenne : < 2h" : `Réponse moyenne : ${Math.round(tempsMoyenJours)} j`;

  return (
    <div className="space-y-8 pb-12">
      {/* Zone centrale : actions principales */}
      <section className="rounded-2xl surface-metallic-light p-8">
        <h1 className="text-2xl font-bold text-slate-800">Bonjour, {userName ?? "vous"}</h1>
        <p className="mt-1 text-slate-600">Que souhaitez-vous déléguer aujourd&apos;hui ?</p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/nouvelle-demande"
            className="inline-flex items-center rounded-lg bg-[#1d4ed8] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#1e40af]"
          >
            + Nouvelle mission
          </Link>
          <Link
            href="/dashboard/taches"
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Voir mes missions
          </Link>
        </div>
        <div className="mt-6 pt-6 border-t border-slate-100">
          <QuickDelegationForm />
        </div>
      </section>

      {/* Contrat compact (si non signé) */}
      {contractStatus !== "SIGNED" && (
        <section className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3">
          <p className="text-sm text-amber-800">
            Pour accéder à l&apos;ensemble des services, veuillez{" "}
            <Link href="/contract" className="font-medium text-amber-900 underline hover:no-underline">
              lire et accepter le contrat d&apos;abonnement
            </Link>
            .
          </p>
        </section>
      )}

      {/* 3 indicateurs principaux */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl surface-metallic-light p-5">
          <p className="text-sm font-medium text-slate-500">Actions restantes</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">
            {remaining} <span className="text-lg font-normal text-slate-500">/ {actionsData.monthlyActionsTotal}</span>
          </p>
        </div>
        <div className="rounded-xl surface-metallic-light p-5">
          <p className="text-sm font-medium text-slate-500">Missions en cours</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{tasksEnCours}</p>
        </div>
        <div className="rounded-xl surface-metallic-light p-5">
          <p className="text-sm font-medium text-slate-500">Derniers messages</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{recentMessages.length}</p>
          <Link href="/dashboard/messagerie" className="mt-1 block text-sm font-medium text-[#1d4ed8] hover:underline">
            Voir la messagerie →
          </Link>
        </div>
      </section>

      {/* Communication digitale */}

      {/* Barre de progression des actions */}
      <ActionsWidget
        subscriptionPlan={actionsData.subscriptionPlan}
        monthlyActionsTotal={actionsData.monthlyActionsTotal}
        monthlyActionsUsed={actionsData.monthlyActionsUsed}
        renewsAt={actionsData.renewsAt}
      />

      {/* Activité récente */}
      <section className="rounded-2xl surface-metallic-light p-6">
        <h2 className="text-lg font-semibold text-slate-800">Activité récente</h2>
        <p className="mt-0.5 text-sm text-slate-500">Dernières tâches réalisées (devis envoyé, relance effectuée, etc.)</p>
        <ul className="mt-4 space-y-3">
          {(
            recentActivities.length > 0
              ? recentActivities.map((a) => ({ id: a.id, title: a.title, detail: a.detail, createdAt: a.createdAt }))
              : clientTasks
                  .filter((t) => t.status === "COMPLETE")
                  .slice(0, 5)
                  .map((t) => ({
                    id: t.id,
                    title: `Demande « ${t.title} » terminée`,
                    detail: null,
                    createdAt: t.createdAt,
                  }))
          ).length === 0 ? (
            <li className="text-sm text-slate-500">Aucune action récente. Vos demandes en cours apparaîtront ici une fois traitées.</li>
          ) : (
            (recentActivities.length > 0
              ? recentActivities.map((a) => (
                  <li key={a.id} className="flex gap-3 border-l-2 border-slate-200 pl-4">
                    <div className="flex-1">
                      <p className="font-medium text-slate-800">{a.title}</p>
                      {a.detail && <p className="text-sm text-slate-500">{a.detail}</p>}
                      <p className="mt-1 text-xs text-slate-400">
                        {new Date(a.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </li>
                ))
              : clientTasks
                  .filter((t) => t.status === "COMPLETE")
                  .slice(0, 5)
                  .map((t) => (
                    <li key={t.id} className="flex gap-3 border-l-2 border-slate-200 pl-4">
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">Demande « {t.title} » terminée</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {new Date(t.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </li>
                  ))
            )
          )}
        </ul>
      </section>

      {/* Copilote administratif */}
      <CopiloteAdmin />

      {/* Missions récentes */}
      <section className="rounded-2xl surface-metallic-light">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">Missions récentes</h2>
          <p className="mt-0.5 text-sm text-slate-500">Vos missions avec conversation, documents et historique</p>
        </div>
        <div className="divide-y divide-slate-100">
          {clientTasks.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-slate-500">Aucune mission pour le moment.</p>
              <div className="mt-4">
                <Link
                  href="/dashboard/nouvelle-demande"
                  className="inline-flex rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e40af]"
                >
                  + Nouvelle mission
                </Link>
              </div>
            </div>
          ) : (
            clientTasks.slice(0, 8).map((task) => (
              <div
                key={task.id}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 sm:flex-nowrap"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-800">{task.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        task.status === "COMPLETE"
                          ? "bg-green-100 text-green-800"
                          : task.status === "EN_COURS" || task.status === "EN_ANALYSE" || task.status === "ASSIGNEE"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {CLIENT_TASK_STATUS_LABELS[task.status as TaskStatus] ?? task.status}
                    </span>
                    <span>Assistant : {task.assignedTo?.name ?? "—"}</span>
                    <span>
                      {new Date(task.updatedAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/dashboard/taches/${task.id}`}
                    className="rounded-lg surface-metallic-light px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Voir la mission →
                  </Link>
                  <DeleteTaskButton taskId={task.id} />
                </div>
              </div>
            ))
          )}
        </div>
        {clientTasks.length > 0 && (
          <div className="border-t border-slate-100 px-6 py-3">
            <Link href="/dashboard/taches" className="text-sm font-medium text-[#1d4ed8] hover:underline">
              Voir toutes mes missions →
            </Link>
          </div>
        )}
      </section>

      {/* Historique des missions — mémoire administrative */}
      <MissionHistorySection />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Messages récents */}
        <section className="rounded-2xl surface-metallic-light">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-800">Messages récents</h2>
            <p className="mt-0.5 text-sm text-slate-500">Derniers échanges avec votre assistant</p>
          </div>
          <div className="divide-y divide-slate-100">
            {recentMessages.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-slate-500">
                Aucun message. Utilisez la messagerie pour échanger avec votre assistant.
              </div>
            ) : (
              recentMessages.map((m) => {
                const isFromClient = m.sender.id === clientId;
                const assistantName = isFromClient ? "Vous" : m.sender.name;
                const excerpt = m.content.length > 80 ? m.content.slice(0, 80) + "…" : m.content;
                return (
                  <div key={m.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-800">{assistantName}</p>
                        <p className="mt-0.5 text-sm text-slate-600 line-clamp-2">{excerpt}</p>
                        <p className="mt-1 text-xs text-slate-400">{formatMessageDate(m.createdAt)}</p>
                      </div>
                      <Link
                        href="/dashboard/messagerie"
                        className="shrink-0 rounded-lg surface-metallic-light px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Ouvrir la conversation
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {recentMessages.length > 0 && (
            <div className="border-t border-slate-100 px-6 py-3">
              <Link href="/dashboard/messagerie" className="text-sm font-medium text-[#1d4ed8] hover:underline">
                Voir la messagerie →
              </Link>
            </div>
          )}
        </section>

        {/* Activité récente ou temps économisé */}
        <section className="rounded-2xl surface-metallic-light">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-800">Temps économisé</h2>
            <p className="mt-0.5 text-sm text-slate-500">Ce mois-ci</p>
          </div>
          <div className="px-6 py-4">
            <p className="text-2xl font-bold text-[#1d4ed8]">{actionsData.monthlyActionsUsed} actions</p>
            <p className="text-sm text-slate-600">≈ {Math.round((actionsData.monthlyActionsUsed * MINUTES_PER_ACTION) / 60)} h économisées</p>
          </div>
        </section>
      </div>

      {/* Abonnement : déjà couvert par ActionsWidget avec liens */}
    </div>
  );
}
