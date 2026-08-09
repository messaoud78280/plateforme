import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { StatusBadge } from "@/components/pilotage/PilotageBadges";
import { PilotageSubNav } from "@/components/pilotage/PilotageSubNav";
import {
  buildPilotageListWhere,
  canEditPilotageOperational,
  requirePilotageSession,
} from "@/lib/pilotage/access";
import { formatDateFr } from "@/lib/pilotage/calculations";
import { PILOTAGE_LIST_PATH, BLOCKER_OPEN_STATUSES, BLOCKER_SEVERITIES } from "@/lib/pilotage/constants";
import { prisma } from "@/lib/prisma";
import { ResolveBlockerButton } from "@/components/pilotage/PilotageQuickForms";

export const dynamic = "force-dynamic";

export default async function PilotageBlocagesPage() {
  const session = await requirePilotageSession();
  const canEdit = canEditPilotageOperational(session.user.role);
  const scope = buildPilotageListWhere({ id: session.user.id, role: session.user.role });

  const blockers = await prisma.pilotageBlocker.findMany({
    where: {
      archivedAt: null,
      status: { in: [...BLOCKER_OPEN_STATUSES] },
      pilotage: scope,
    },
    include: {
      pilotage: {
        include: {
          project: { include: { client: { select: { name: true, company: true } } } },
        },
      },
    },
    orderBy: [{ severity: "asc" }, { openedAt: "asc" }],
    take: 200,
  });

  const groups = BLOCKER_SEVERITIES.map((id) => ({
    id,
    title: id,
    className:
      id === "Critique"
        ? "border-red-200 bg-red-50/40"
        : id === "Important"
          ? "border-orange-200 bg-orange-50/30"
          : "border-amber-200 bg-amber-50/30",
  }));

  return (
    <div className="space-y-6">
      <BackLink href={PILOTAGE_LIST_PATH}>Portefeuille</BackLink>
      <PilotageSubNav />
      <header className="overflow-hidden rounded-2xl border border-red-200/60 bg-white p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-red-700/70">
          Blocages contractuels
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Blocages et décisions attendues</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Agrégation des points qui freinent le marché : obligations critiques, visas, TS, jalons et décisions externes.
        </p>
        <p className="mt-3 text-sm font-semibold text-red-800">{blockers.length} blocage(s) ouvert(s)</p>
      </header>

      {groups.map((g) => {
        const list = blockers.filter((b) => b.severity === g.id);
        if (list.length === 0 && g.id !== "Critique") return null;
        return (
          <section key={g.id} className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900">
              {g.title} ({list.length})
            </h2>
            {list.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun blocage critique.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {list.map((b) => {
                  const days = Math.floor((Date.now() - new Date(b.openedAt).getTime()) / 86400000);
                  return (
                    <article key={b.id} className={`pilotage-card border p-4 ${g.className}`}>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            {b.pilotage.project.title}
                          </p>
                          <p className="font-semibold text-slate-900">Blocage : {b.title}</p>
                          <p className="text-xs text-slate-600">
                            {b.pilotage.project.client.company ?? b.pilotage.project.client.name}
                          </p>
                        </div>
                        <StatusBadge status={b.severity} />
                      </div>
                      {b.consequence ? <p className="mt-2 text-sm text-slate-700">{b.consequence}</p> : null}
                      {b.originLabel ? (
                        <p className="mt-2 text-[11px] font-medium text-slate-500">📎 {b.originLabel}</p>
                      ) : null}
                      <dl className="mt-3 grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
                        <div>Interne : {b.internalOwner ?? "—"}</div>
                        <div>Décideur : {b.externalDecider ?? "—"}</div>
                        <div>Ancienneté : {days} j</div>
                        <div>Prochaine action : {b.nextAction ?? "—"}</div>
                        <div>Relance : {formatDateFr(b.nextFollowUpAt)}</div>
                        <div>Jalon impacté : {b.impactedMilestone ?? "—"}</div>
                      </dl>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link
                          href={`/dashboard/projets/${b.pilotage.project.id}/suivi-contractuel?onglet=blocages`}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#1e3a5f]"
                        >
                          Ouvrir {b.pilotage.project.title}
                        </Link>
                        {b.originType === "TASK" && b.originId ? (
                          <Link
                            href={`/dashboard/taches/${b.originId}`}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600"
                          >
                            Voir la mission d&apos;origine
                          </Link>
                        ) : null}
                        <ResolveBlockerButton blockerId={b.id} canEdit={canEdit} />
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
