import Link from "next/link";
import { ActionsWidget } from "@/components/dashboard/ActionsWidget";
import { CLIENT_TASK_STATUS_LABELS, type TaskStatus } from "@/types";

const DOCUMENT_CATEGORY_LABELS: Record<string, string> = {
  FACTURE: "Facture",
  CONTRAT: "Contrat",
  RH: "RH",
  FISCAL: "Fiscal",
  AUTRE: "Autre",
};

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
    category: string | null;
    status: string;
    createdAt: Date;
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
    category: string;
    task: { id: string; title: string } | null;
    fileUrl: string;
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
}: ClientDashboardContentProps) {
  const remaining = Math.max(0, actionsData.monthlyActionsTotal - actionsData.monthlyActionsUsed);
  const tempsMoyenLabel =
    tempsMoyenJours < 1 ? "Réponse moyenne : < 24h" : `Réponse moyenne : ${Math.round(tempsMoyenJours)} j`;

  return (
    <div className="space-y-8 pb-12">
      {/* Bloc d'accueil + 3 CTA */}
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-800">Bonjour, {userName ?? "vous"}</h1>
        <p className="mt-1 text-slate-600">Que souhaitez-vous déléguer aujourd&apos;hui ?</p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/nouvelle-demande"
            className="inline-flex items-center rounded-lg bg-[#1d4ed8] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1e40af]"
          >
            Nouvelle demande
          </Link>
          <Link
            href="/dashboard/taches"
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Voir mes demandes
          </Link>
          <Link
            href="/dashboard/messagerie"
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Contacter mon assistant
          </Link>
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

      {/* 3 cartes KPI + barre de progression */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Actions restantes</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">
            {remaining} <span className="text-lg font-normal text-slate-500">/ {actionsData.monthlyActionsTotal}</span>
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Demandes en cours</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{tasksEnCours}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Temps moyen de traitement</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{tempsMoyenLabel}</p>
        </div>
      </section>

      {/* Votre activité ce mois-ci */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">Votre activité ce mois-ci</h2>
        <p className="mt-1 text-sm text-slate-500">
          Nombre de demandes, actions réalisées et temps estimé économisé.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
            <p className="text-2xl font-bold text-slate-800">{tasksCompleteesCeMois}</p>
            <p className="text-sm text-slate-500">Demandes réalisées ce mois</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
            <p className="text-2xl font-bold text-[#1d4ed8]">{actionsData.monthlyActionsUsed}</p>
            <p className="text-sm text-slate-500">Actions réalisées</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
            <p className="text-2xl font-bold text-green-700">
              {actionsData.monthlyActionsUsed * 10} min
            </p>
            <p className="text-sm text-slate-500">Temps estimé économisé</p>
          </div>
        </div>
      </section>

      {/* Barre de progression des actions */}
      <ActionsWidget
        subscriptionPlan={actionsData.subscriptionPlan}
        monthlyActionsTotal={actionsData.monthlyActionsTotal}
        monthlyActionsUsed={actionsData.monthlyActionsUsed}
        renewsAt={actionsData.renewsAt}
      />

      {/* Bloc principal : Mes demandes en cours */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">Mes demandes en cours</h2>
          <p className="mt-0.5 text-sm text-slate-500">Suivez l&apos;avancement de vos demandes</p>
        </div>
        <div className="overflow-x-auto">
          {clientTasks.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-slate-500">Aucune demande pour le moment.</p>
              <div className="mt-4">
                <Link
                  href="/dashboard/nouvelle-demande"
                  className="inline-flex rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e40af]"
                >
                  Nouvelle demande
                </Link>
              </div>
            </div>
          ) : (
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-4 py-3 font-semibold text-slate-700">Demande</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Catégorie</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Statut</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Date</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Actions</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Assistant</th>
                  <th className="px-4 py-3 font-semibold text-slate-700 text-right">Lien</th>
                </tr>
              </thead>
              <tbody>
                {clientTasks.map((task) => (
                  <tr key={task.id} className="border-b border-slate-100 transition hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-800">{task.title}</td>
                    <td className="px-4 py-3 text-slate-600">{task.category ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          task.status === "COMPLETE"
                            ? "bg-green-100 text-green-800"
                            : task.status === "EN_COURS"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {CLIENT_TASK_STATUS_LABELS[task.status as TaskStatus] ?? task.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(task.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {task.actionsUsed != null ? task.actionsUsed : task.estimatedActions ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{task.assignedTo?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/dashboard/taches/${task.id}`}
                        className="font-medium text-[#1d4ed8] hover:underline"
                      >
                        Voir le détail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {clientTasks.length > 0 && (
          <div className="border-t border-slate-100 px-6 py-3">
            <Link href="/dashboard/taches" className="text-sm font-medium text-[#1d4ed8] hover:underline">
              Voir toutes mes demandes →
            </Link>
          </div>
        )}
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Messages récents */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
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
                        className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
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

        {/* Documents récents */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-800">Documents récents</h2>
            <p className="mt-0.5 text-sm text-slate-500">Derniers documents partagés</p>
          </div>
          <div className="divide-y divide-slate-100">
            {recentDocuments.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-slate-500">
                Aucun document pour le moment.
              </div>
            ) : (
              recentDocuments.map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-3 px-6 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-800">{d.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {new Date(d.createdAt).toLocaleDateString("fr-FR")} · {DOCUMENT_CATEGORY_LABELS[d.category] ?? d.category}
                      {d.task && ` · ${d.task.title}`}
                    </p>
                  </div>
                  <a
                    href={d.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Télécharger
                  </a>
                </div>
              ))
            )}
          </div>
          {recentDocuments.length > 0 && (
            <div className="border-t border-slate-100 px-6 py-3">
              <Link href="/dashboard/documents" className="text-sm font-medium text-[#1d4ed8] hover:underline">
                Voir tous les documents →
              </Link>
            </div>
          )}
        </section>
      </div>

      {/* Abonnement : déjà couvert par ActionsWidget avec liens */}
    </div>
  );
}
