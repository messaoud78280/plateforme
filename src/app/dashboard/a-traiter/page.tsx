import Link from "next/link";
import { after } from "next/server";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import {
  A_TRAITER_SECTION_LABELS,
  collectATraiter,
  type ATraiterItem,
  type ATraiterSection,
} from "@/lib/a-traiter/collect";
import { ATTENTION_URGENCY_ORDER } from "@/lib/a-traiter/attention-board";
import { URGENCY_LABELS, URGENCY_STYLES } from "@/lib/follow-up/types";
import { canEditFollowUpBoard, resolveFollowUpOwnerUserId } from "@/lib/follow-up/access";
import { syncAttentionNotificationsForOwner } from "@/lib/follow-up/attention/sync-notifications";
import { isAgencyOrManager, isAgent } from "@/lib/authz";
import { PageHeader } from "@/components/ui/PageHeader";
import { BackLink } from "@/components/ui/BackLink";
import { ATraiterAttentionBoard } from "@/components/a-traiter/ATraiterAttentionBoard";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

const SECTION_STYLES: Record<
  ATraiterSection,
  { border: string; badge: string; empty: string }
> = {
  bloquant: {
    border: "border-red-900/30",
    badge: "bg-red-950 text-white",
    empty: "Aucune situation critique.",
  },
  urgent: {
    border: "border-red-200",
    badge: "bg-red-100 text-red-900",
    empty: "Aucun élément urgent.",
  },
  a_valider: {
    border: "border-orange-200",
    badge: "bg-orange-100 text-orange-900",
    empty: "Rien d’important en attente.",
  },
  relance: {
    border: "border-yellow-200",
    badge: "bg-yellow-100 text-yellow-900",
    empty: "Rien à anticiper pour le moment.",
  },
};

const SOURCE_LABELS: Record<ATraiterItem["source"], string> = {
  mission: "Mission",
  alerte: "Alerte",
  piece: "Pièce",
  blocage: "Pilotage",
  notification: "Notif.",
  message: "Message",
};

function formatWhen(d: Date) {
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ATraiterPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard/a-traiter");
  }

  const snapshot = await collectATraiter({
    id: session.user.id,
    role: session.user.role,
    personType: session.user.personType ?? null,
  });

  // W3-C1 : sync hors chemin critique de rendu (PERF-V1)
  const external =
    session.user.personType === "CLIENT_EXT" || session.user.personType === "SUPPLIER";
  if (!external && (isAgencyOrManager(session.user) || isAgent(session.user) || session.user.role === "CLIENT")) {
    const userId = session.user.id;
    const role = session.user.role;
    after(async () => {
      try {
        const ownerUserId = await resolveFollowUpOwnerUserId(userId);
        const agentOnly = isAgent({ role }) && !isAgencyOrManager({ role });
        await syncAttentionNotificationsForOwner({
          ownerUserId,
          assigneeOnlyId: agentOnly ? userId : null,
        });
      } catch (e) {
        console.error("[a-traiter] syncAttentionNotifications:", e);
      }
    });
  }

  const canEdit = canEditFollowUpBoard(session.user);
  const empty = snapshot.total === 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      <BackLink href="/dashboard">Tableau de bord</BackLink>
      <PageHeader
        eyebrow="Pilotage quotidien"
        title="À traiter"
        description="Les éléments qui nécessitent votre attention."
        actions={
          <span className="rounded-full bg-[#1e3a5f] px-3 py-1.5 text-xs font-bold text-white">
            {snapshot.total} élément{snapshot.total === 1 ? "" : "s"}
          </span>
        }
      />

      {empty ? (
        <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 px-6 py-12 text-center">
          <p className="text-sm font-semibold text-emerald-900">Tout est à jour.</p>
          <p className="mt-1 text-xs text-emerald-800/80">
            Aucun élément ne nécessite votre attention actuellement.
          </p>
          <Link
            href="/dashboard/fiches-suivi?view=tableau"
            className="mt-4 inline-flex rounded-lg border border-emerald-200 bg-white px-4 py-2 text-xs font-semibold text-[#1e3a5f]"
          >
            Voir le tableau de suivi
          </Link>
        </div>
      ) : (
        <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
          {ATTENTION_URGENCY_ORDER.map((u) => {
            const style = URGENCY_STYLES[u];
            const n = snapshot.attentionCounts[u as keyof typeof snapshot.attentionCounts];
            return (
              <div
                key={u}
                className={cn("rounded-xl border bg-white px-3 py-3", style.border)}
              >
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} aria-hidden />
                  {URGENCY_LABELS[u]}
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{n}</p>
              </div>
            );
          })}
        </div>
      )}

      <ATraiterAttentionBoard
        cards={snapshot.attentionCards}
        currentUserId={session.user.id}
        canEdit={canEdit}
      />

      {snapshot.items.length > 0 ? (
        <div className="space-y-4 border-t border-slate-200 pt-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Autres actions</h2>
            <p className="text-xs text-slate-500">
              Missions, pièces, blocages et messages — hors fiches de suivi.
            </p>
          </div>
          {(Object.keys(A_TRAITER_SECTION_LABELS) as ATraiterSection[])
            .filter((s) => snapshot.counts[s] > 0)
            .map((section) => {
              const list = snapshot.items.filter((i) => i.section === section);
              const style = SECTION_STYLES[section];
              return (
                <section key={section} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      {A_TRAITER_SECTION_LABELS[section]}
                    </h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${style.badge}`}>
                      {list.length}
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {list.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          className={`block rounded-xl border bg-white p-4 shadow-sm transition hover:border-[#1e3a5f]/40 hover:shadow ${style.border}`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                                  {SOURCE_LABELS[item.source]}
                                </span>
                                <p className="truncate text-sm font-semibold text-slate-900">
                                  {item.title}
                                </p>
                              </div>
                              <p className="mt-1 text-xs text-slate-600">{item.meta}</p>
                              <p className="mt-1 text-[11px] text-slate-400">
                                {item.dueLabel && item.dueLabel !== "—"
                                  ? `Échéance : ${item.dueLabel}`
                                  : formatWhen(item.createdAt)}
                                {item.assigneeName ? ` · ${item.assigneeName}` : ""}
                              </p>
                            </div>
                            <span className="shrink-0 text-xs font-semibold text-[#1e3a5f]">
                              Ouvrir →
                            </span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
        </div>
      ) : null}
    </div>
  );
}
