import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { StatusBadge } from "@/components/pilotage/PilotageBadges";
import { PilotageSubNav } from "@/components/pilotage/PilotageSubNav";
import {
  buildPilotageListWhere,
  requirePilotageSession,
} from "@/lib/pilotage/access";
import { formatDateFr, startOfDay, addDays } from "@/lib/pilotage/calculations";
import { PILOTAGE_LIST_PATH } from "@/lib/pilotage/constants";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PilotageCalendrierPage() {
  const session = await requirePilotageSession();
  const scope = buildPilotageListWhere({ id: session.user.id, role: session.user.role });
  const from = addDays(startOfDay(), -7);
  const to = addDays(startOfDay(), 45);

  const pilotages = await prisma.worksitePilotage.findMany({
    where: scope,
    include: {
      project: { select: { title: true } },
      actions: {
        where: { archivedAt: null, dueDate: { gte: from, lte: to } },
        select: { id: true, title: true, dueDate: true, status: true, priority: true },
      },
      obligations: {
        where: { archivedAt: null, dueDate: { gte: from, lte: to } },
        select: { id: true, title: true, dueDate: true, status: true },
      },
      plans: {
        where: { archivedAt: null, visaDueDate: { gte: from, lte: to } },
        select: { id: true, reference: true, title: true, visaDueDate: true, status: true },
      },
      milestones: {
        where: { archivedAt: null, plannedAt: { gte: from, lte: to } },
        select: { id: true, title: true, plannedAt: true, status: true },
      },
      blockers: {
        where: { archivedAt: null, nextFollowUpAt: { gte: from, lte: to }, status: { in: ["Ouvert", "En cours"] } },
        select: { id: true, title: true, nextFollowUpAt: true, severity: true, status: true },
      },
    },
    take: 80,
  });

  const events: {
    key: string;
    date: Date;
    type: string;
    title: string;
    chantier: string;
    status: string;
    href: string;
  }[] = [];

  for (const p of pilotages) {
    const chantier = p.project.title;
    for (const a of p.actions) {
      if (!a.dueDate) continue;
      events.push({
        key: `a-${a.id}`,
        date: a.dueDate,
        type: "Action",
        title: a.title,
        chantier,
        status: a.status,
        href: `${PILOTAGE_LIST_PATH}/${p.id}?onglet=actions`,
      });
    }
    for (const o of p.obligations) {
      if (!o.dueDate) continue;
      events.push({
        key: `o-${o.id}`,
        date: o.dueDate,
        type: "Obligation",
        title: o.title,
        chantier,
        status: o.status,
        href: `${PILOTAGE_LIST_PATH}/${p.id}?onglet=obligations`,
      });
    }
    for (const pl of p.plans) {
      if (!pl.visaDueDate) continue;
      events.push({
        key: `v-${pl.id}`,
        date: pl.visaDueDate,
        type: "Visa",
        title: `${pl.reference} — ${pl.title}`,
        chantier,
        status: pl.status,
        href: `${PILOTAGE_LIST_PATH}/${p.id}?onglet=plans`,
      });
    }
    for (const m of p.milestones) {
      if (!m.plannedAt) continue;
      events.push({
        key: `m-${m.id}`,
        date: m.plannedAt,
        type: "Jalon",
        title: m.title,
        chantier,
        status: m.status,
        href: `${PILOTAGE_LIST_PATH}/${p.id}?onglet=jalons`,
      });
    }
    for (const b of p.blockers) {
      if (!b.nextFollowUpAt) continue;
      events.push({
        key: `b-${b.id}`,
        date: b.nextFollowUpAt,
        type: "Relance",
        title: b.title,
        chantier,
        status: b.severity,
        href: `${PILOTAGE_LIST_PATH}/${p.id}?onglet=blocages`,
      });
    }
  }

  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="space-y-6">
      <BackLink href={PILOTAGE_LIST_PATH}>Portefeuille</BackLink>
      <PilotageSubNav />
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Calendrier de pilotage</h1>
        <p className="mt-1 text-sm text-slate-600">
          Vue liste portefeuille : actions, obligations, visas, jalons et relances sur 45 jours.
        </p>
      </header>
      <section className="pilotage-card overflow-hidden">
        {events.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Aucune échéance sur la période.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {events.map((e) => (
              <li key={e.key} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{e.type}</p>
                  <p className="truncate text-sm font-semibold text-slate-900">{e.title}</p>
                  <p className="text-xs text-slate-500">
                    {e.chantier} · {formatDateFr(e.date)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={e.status} />
                  <Link href={e.href} className="text-xs font-semibold text-[#1e3a5f] hover:underline">
                    Ouvrir
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
