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
import { PILOTAGE_LIST_PATH } from "@/lib/pilotage/constants";
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
      status: { in: ["Ouvert", "En cours"] },
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

  const groups = [
    { id: "Critique", title: "Critique", className: "border-red-200 bg-red-50/40" },
    { id: "Important", title: "Important", className: "border-orange-200 bg-orange-50/30" },
    { id: "À surveiller", title: "À surveiller", className: "border-amber-200 bg-amber-50/30" },
  ];

  return (
    <div className="space-y-6">
      <BackLink href={PILOTAGE_LIST_PATH}>Portefeuille</BackLink>
      <PilotageSubNav />
      <header className="overflow-hidden rounded-2xl border border-red-200/60 bg-gradient-to-br from-red-50 via-white to-orange-50 p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-red-700/70">Centre de commandement</p>
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
                          <p className="font-semibold text-slate-900">{b.title}</p>
                          <p className="text-xs text-slate-600">
                            {b.pilotage.project.title} ·{" "}
                            {b.pilotage.project.client.company ?? b.pilotage.project.client.name}
                          </p>
                        </div>
                        <StatusBadge status={b.severity} />
                      </div>
                      {b.consequence ? <p className="mt-2 text-sm text-slate-700">{b.consequence}</p> : null}
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
                          href={`${PILOTAGE_LIST_PATH}/${b.pilotageId}?onglet=blocages`}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#1e3a5f]"
                        >
                          Ouvrir le chantier
                        </Link>
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
