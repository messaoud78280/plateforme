import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { StatusBadge } from "@/components/pilotage/PilotageBadges";
import { PilotageSubNav } from "@/components/pilotage/PilotageSubNav";
import {
  buildPilotageListWhere,
  requirePilotageSession,
} from "@/lib/pilotage/access";
import {
  formatDateFr,
  isActionOpen,
  isDocMissing,
  isDueWithinDays,
  isOverdue,
  isVisaPending,
  startOfDay,
  addDays,
} from "@/lib/pilotage/calculations";
import { PILOTAGE_LIST_PATH } from "@/lib/pilotage/constants";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PilotageATraiterPage() {
  const session = await requirePilotageSession();
  const scope = buildPilotageListWhere({ id: session.user.id, role: session.user.role });
  const today = startOfDay();
  const weekEnd = addDays(today, 7);

  const pilotages = await prisma.worksitePilotage.findMany({
    where: scope,
    include: {
      project: { include: { client: { select: { name: true, company: true } } } },
      actions: { where: { archivedAt: null } },
      requiredDocuments: { where: { archivedAt: null } },
      plans: { where: { archivedAt: null } },
      blockers: { where: { archivedAt: null, status: { in: ["Ouvert", "En cours"] } } },
      extraWorks: { where: { archivedAt: null } },
      situations: { where: { archivedAt: null, status: { in: ["À préparer", "En préparation"] } } },
    },
    take: 80,
  });

  type Item = {
    key: string;
    section: "retard" | "semaine" | "valider" | "externe";
    title: string;
    chantier: string;
    client: string;
    meta: string;
    href: string;
    priority?: string;
  };

  const items: Item[] = [];
  for (const p of pilotages) {
    const chantier = p.project.title;
    const client = p.project.client.company ?? p.project.client.name;
    const base = `/dashboard/projets/${p.project.id}/suivi-contractuel`;

    for (const a of p.actions) {
      if (!isActionOpen(a.status)) continue;
      if (isOverdue(a.dueDate, a.status)) {
        items.push({
          key: `a-${a.id}`,
          section: "retard",
          title: a.title,
          chantier,
          client,
          meta: `Action · échéance ${formatDateFr(a.dueDate)}`,
          href: `${base}?onglet=a-traiter`,
          priority: a.priority,
        });
      } else if (a.dueDate && a.dueDate >= today && a.dueDate <= weekEnd) {
        items.push({
          key: `a-${a.id}`,
          section: "semaine",
          title: a.title,
          chantier,
          client,
          meta: `Action · ${formatDateFr(a.dueDate)}`,
          href: `${base}?onglet=a-traiter`,
          priority: a.priority,
        });
      }
    }
    for (const d of p.requiredDocuments.filter((x) => isDocMissing(x.status))) {
      items.push({
        key: `d-${d.id}`,
        section: "valider",
        title: d.name,
        chantier,
        client,
        meta: `Document · ${d.status}`,
        href: `${base}?onglet=documents`,
      });
    }
    for (const pl of p.plans.filter((x) => isVisaPending(x.status) || isOverdue(x.visaDueDate, x.status))) {
      items.push({
        key: `p-${pl.id}`,
        section: "externe",
        title: `Visa ${pl.reference}`,
        chantier,
        client,
        meta: pl.title,
        href: `${base}?onglet=plans`,
      });
    }
    for (const b of p.blockers) {
      items.push({
        key: `b-${b.id}`,
        section: b.severity === "Critique" ? "retard" : "externe",
        title: b.title,
        chantier,
        client,
        meta: `Blocage · ${b.severity}`,
        href: `${base}?onglet=blocages`,
        priority: b.priority,
      });
    }
    for (const e of p.extraWorks.filter((x) => x.startedWithoutValidation && !x.writtenValidation)) {
      items.push({
        key: `e-${e.id}`,
        section: "retard",
        title: e.reference ?? "Travaux supplémentaires",
        chantier,
        client,
        meta: "Sans validation écrite",
        href: `${base}?onglet=ts`,
      });
    }
  }

  const sections = [
    { id: "retard" as const, title: "En retard", tone: "text-red-700" },
    { id: "semaine" as const, title: "Cette semaine", tone: "text-amber-700" },
    { id: "valider" as const, title: "À valider / documents", tone: "text-slate-800" },
    { id: "externe" as const, title: "En attente externe", tone: "text-slate-800" },
  ];

  return (
    <div className="space-y-6">
      <BackLink href={PILOTAGE_LIST_PATH}>Portefeuille</BackLink>
      <PilotageSubNav />
      <header>
        <h1 className="text-2xl font-bold text-slate-900">À traiter</h1>
        <p className="mt-1 text-sm text-slate-600">
          File de travail multi-chantiers : retards, échéances, validations et décisions attendues.
        </p>
      </header>
      <div className="grid gap-4">
        {sections.map((s) => {
          const list = items.filter((i) => i.section === s.id);
          return (
            <section key={s.id} className="pilotage-card p-5">
              <h2 className={`text-sm font-bold ${s.tone}`}>
                {s.title} ({list.length})
              </h2>
              {list.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">Rien dans cette section.</p>
              ) : (
                <ul className="mt-3 divide-y divide-slate-100">
                  {list.slice(0, 40).map((i) => (
                    <li key={i.key} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{i.title}</p>
                        <p className="text-xs text-slate-500">
                          {i.chantier} · {i.client} · {i.meta}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {i.priority ? <StatusBadge status={i.priority} /> : null}
                        <Link
                          href={i.href}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-[#1e3a5f]"
                        >
                          Traiter
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
