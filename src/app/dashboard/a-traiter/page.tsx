import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import {
  A_TRAITER_SECTION_LABELS,
  collectATraiter,
  type ATraiterItem,
  type ATraiterSection,
} from "@/lib/a-traiter/collect";
import { PageHeader } from "@/components/ui/PageHeader";
import { BackLink } from "@/components/ui/BackLink";
import { FollowUpInlineActions } from "@/components/follow-up/FollowUpInlineActions";

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
  fiche: "Fiche",
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
  });

  const sections = (Object.keys(A_TRAITER_SECTION_LABELS) as ATraiterSection[]).filter(
    (s) => snapshot.counts[s] > 0 || s === "bloquant" || s === "a_valider",
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      <BackLink href="/dashboard">Tableau de bord</BackLink>
      <PageHeader
        eyebrow="Pilotage quotidien"
        title="À traiter"
        description="Centre opérationnel : critique, urgent, important et à anticiper — fiches de suivi, missions et alertes."
        actions={
          <span className="rounded-full bg-[#1e3a5f] px-3 py-1.5 text-xs font-bold text-white">
            {snapshot.total} point{snapshot.total === 1 ? "" : "s"}
          </span>
        }
      />

      {snapshot.total === 0 ? (
        <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 px-6 py-12 text-center">
          <p className="text-sm font-semibold text-emerald-900">Rien à traiter pour le moment.</p>
          <p className="mt-1 text-xs text-emerald-800/80">
            Les livrables à valider, pièces manquantes et missions urgentes apparaîtront ici.
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-flex rounded-lg border border-emerald-200 bg-white px-4 py-2 text-xs font-semibold text-[#1e3a5f]"
          >
            Retour au tableau de bord
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-4">
          {(Object.keys(A_TRAITER_SECTION_LABELS) as ATraiterSection[]).map((s) => (
            <div
              key={s}
              className={`rounded-xl border bg-white px-4 py-3 ${SECTION_STYLES[s].border}`}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {A_TRAITER_SECTION_LABELS[s]}
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{snapshot.counts[s]}</p>
            </div>
          ))}
        </div>
      )}

      {sections.map((section) => {
        const list = snapshot.items.filter((i) => i.section === section);
        const style = SECTION_STYLES[section];
        return (
          <section key={section} className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                {A_TRAITER_SECTION_LABELS[section]}
              </h2>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${style.badge}`}>
                {list.length}
              </span>
            </div>
            {list.length === 0 ? (
              <p className="text-sm text-slate-500">{style.empty}</p>
            ) : (
              <ul className="space-y-2">
                {list.map((item) => {
                  const ficheId = item.source === "fiche" ? item.id.replace(/^fiche-/, "") : null;
                  return (
                    <li key={item.id}>
                      <div
                        className={`rounded-xl border bg-white p-4 shadow-sm transition hover:border-[#1e3a5f]/40 hover:shadow ${style.border}`}
                      >
                        <Link href={item.href} className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                                {SOURCE_LABELS[item.source]}
                              </span>
                              {item.urgencyLabel ? (
                                <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${style.badge}`}>
                                  {item.urgencyLabel}
                                </span>
                              ) : null}
                              <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
                            </div>
                            <p className="mt-1 text-xs text-slate-600">{item.meta}</p>
                            <p className="mt-1 text-[11px] text-slate-400">
                              {item.dueLabel && item.dueLabel !== "—"
                                ? `Échéance : ${item.dueLabel}`
                                : formatWhen(item.createdAt)}
                              {item.delayLabel ? ` · Retard ${item.delayLabel}` : ""}
                              {item.assigneeName ? ` · ${item.assigneeName}` : ""}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs font-semibold text-[#1e3a5f]">Ouvrir →</span>
                        </Link>
                        {ficheId ? <FollowUpInlineActions sheetId={ficheId} /> : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}

      <p className="text-center text-[11px] text-slate-400">
        Cette vue ne remplace pas la messagerie ni le Pilotage : elle pointe vers l’action à faire.
      </p>
    </div>
  );
}
