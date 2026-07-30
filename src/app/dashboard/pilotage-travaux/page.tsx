import Link from "next/link";
import { Suspense } from "react";
import { BackLink } from "@/components/ui/BackLink";
import { ProgressBar, StatusBadge } from "@/components/pilotage/PilotageBadges";
import { HealthBadge, PilotageKpi } from "@/components/pilotage/PilotageCockpit";
import { PilotageSubNav } from "@/components/pilotage/PilotageSubNav";
import { PilotageViewToggle } from "@/components/pilotage/PilotageViewToggle";
import {
  buildPilotageListWhere,
  canEditPilotageOperational,
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
import { PILOTAGE_LIST_PATH, PILOTAGE_STATUS_LABELS, SERVICE_LEVEL_LABELS } from "@/lib/pilotage/constants";
import { countHealthSignals, type HealthLabel } from "@/lib/pilotage/health";
import { chantierStatusLabel } from "@/lib/chantier-lifecycle";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

function first(sp: SP, key: string) {
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v;
}

export default async function PilotageTravauxPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const session = await requirePilotageSession();
  const sp = await searchParams;
  const q = (first(sp, "q") ?? "").trim();
  const status = first(sp, "statut") ?? "";
  const urg = first(sp, "urgence") === "1";
  const week = first(sp, "semaine") === "1";
  const clientId = first(sp, "client") ?? "";
  const retard = first(sp, "retard") === "1";
  const kpi = first(sp, "kpi") ?? "";
  const view = first(sp, "vue") === "tableau" ? "tableau" : "cartes";

  const scope = buildPilotageListWhere({ id: session.user.id, role: session.user.role });
  const today = startOfDay();
  const weekEnd = addDays(today, 7);

  const where = {
    ...scope,
    ...(status ? { status: status as "A_PREPARER" | "EN_COURS" | "SOUS_SURVEILLANCE" | "BLOQUE" | "TERMINE" | "ARCHIVE" } : {}),
    ...(clientId ? { clientId } : {}),
    ...(q
      ? {
          OR: [
            { lot: { contains: q, mode: "insensitive" as const } },
            { internalRef: { contains: q, mode: "insensitive" as const } },
            { project: { title: { contains: q, mode: "insensitive" as const } } },
            { project: { client: { name: { contains: q, mode: "insensitive" as const } } } },
            { project: { client: { company: { contains: q, mode: "insensitive" as const } } } },
          ],
        }
      : {}),
  };

  const canEdit = canEditPilotageOperational(session.user.role);

  const [pilotages, clients] = await Promise.all([
    prisma.worksitePilotage.findMany({
      where,
      include: {
        project: {
          include: {
            client: { select: { id: true, name: true, company: true } },
          },
        },
        conducteur: { select: { id: true, name: true } },
        assistant: { select: { id: true, name: true } },
        actions: {
          where: { archivedAt: null },
          select: { id: true, title: true, dueDate: true, status: true, priority: true },
        },
        obligations: {
          where: { archivedAt: null },
          select: { id: true, dueDate: true, status: true, priority: true },
        },
        requiredDocuments: { where: { archivedAt: null }, select: { id: true, status: true } },
        plans: { where: { archivedAt: null }, select: { id: true, status: true, visaDueDate: true } },
        extraWorks: {
          where: { archivedAt: null },
          select: { id: true, writtenValidation: true, startedWithoutValidation: true, status: true },
        },
        doeItems: { where: { archivedAt: null }, select: { id: true, status: true } },
        situations: {
          where: { archivedAt: null, status: { in: ["À préparer", "En préparation"] } },
          select: { id: true },
        },
        blockers: { where: { archivedAt: null }, select: { id: true, severity: true, status: true } },
        milestones: {
          where: { archivedAt: null },
          select: { id: true, title: true, status: true, plannedAt: true, sortOrder: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
    session.user.role === "MANAGER" || session.user.role === "AGENCE"
      ? prisma.user.findMany({
          where: { role: "CLIENT" },
          select: { id: true, name: true, company: true },
          orderBy: { name: "asc" },
          take: 200,
        })
      : Promise.resolve([]),
  ]);

  let rows = pilotages.map((p) => {
    const overdueActions = p.actions.filter((a) => isActionOpen(a.status) && isOverdue(a.dueDate, a.status));
    const missingDocs = p.requiredDocuments.filter((d) => isDocMissing(d.status));
    const visas = p.plans.filter((pl) => isVisaPending(pl.status) || isOverdue(pl.visaDueDate, pl.status));
    const tsOpen = p.extraWorks.filter(
      (e) => e.startedWithoutValidation && !e.writtenValidation && !["Validé", "Refusé", "Payé"].includes(e.status),
    );
    const doeIncomplete = p.doeItems.some((d) => d.status !== "Conforme" && d.status !== "Non applicable");
    const openBlockers = p.blockers.filter((b) => b.status === "Ouvert" || b.status === "En cours");
    const health =
      p.healthLabel && p.healthScore != null
        ? { score: p.healthScore, label: p.healthLabel as HealthLabel, reasons: [] as string[] }
        : countHealthSignals({
            status: p.status,
            actions: p.actions,
            obligations: p.obligations,
            requiredDocuments: p.requiredDocuments,
            plans: p.plans,
            extraWorks: p.extraWorks,
            doeItems: p.doeItems,
            blockers: p.blockers,
            milestones: p.milestones,
          });
    const nextDue = [
      ...p.actions.filter((a) => a.dueDate && isActionOpen(a.status)).map((a) => a.dueDate!),
      ...p.milestones.filter((m) => m.plannedAt && m.status !== "Atteint" && m.status !== "Annulé").map((m) => m.plannedAt!),
    ].sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];
    const nextMilestone = p.milestones.find(
      (m) => !["Atteint", "Annulé", "Non applicable"].includes(m.status),
    );
    return {
      ...p,
      overdueActions,
      missingDocsCount: missingDocs.length,
      visasCount: visas.length,
      tsAlertCount: tsOpen.length,
      situationsTodo: p.situations.length,
      doeIncomplete,
      openBlockersCount: openBlockers.length,
      criticalBlockers: openBlockers.filter((b) => b.severity === "Critique").length,
      health,
      nextDue,
      nextMilestone,
    };
  });

  if (retard) rows = rows.filter((r) => r.overdueActions.length > 0);
  if (week) {
    rows = rows.filter((r) =>
      r.actions.some((a) => isActionOpen(a.status) && a.dueDate && a.dueDate >= today && a.dueDate <= weekEnd),
    );
  }
  if (urg) {
    rows = rows.filter(
      (r) =>
        r.overdueActions.length > 0 ||
        r.status === "BLOQUE" ||
        r.status === "SOUS_SURVEILLANCE" ||
        r.tsAlertCount > 0 ||
        r.criticalBlockers > 0,
    );
  }
  if (kpi === "blocages") rows = rows.filter((r) => r.openBlockersCount > 0 || r.criticalBlockers > 0);
  if (kpi === "visas") rows = rows.filter((r) => r.visasCount > 0);
  if (kpi === "doe") rows = rows.filter((r) => r.doeIncomplete);
  if (kpi === "traiter") {
    rows = rows.filter(
      (r) =>
        r.overdueActions.length > 0 ||
        r.actions.some((a) => isActionOpen(a.status) && isDueWithinDays(a.dueDate, 7)),
    );
  }

  const urgentActions = rows
    .flatMap((r) =>
      r.actions
        .filter((a) => isActionOpen(a.status))
        .map((a) => ({
          ...a,
          pilotageId: r.id,
          chantier: r.project.title,
          client: r.project.client.company ?? r.project.client.name,
          overdue: isOverdue(a.dueDate, a.status),
          near: isDueWithinDays(a.dueDate, 7),
        })),
    )
    .sort((a, b) => {
      if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
      const prio = (x: string) => ({ Critique: 0, Haute: 1, Normale: 2, Basse: 3 }[x] ?? 4);
      if (prio(a.priority) !== prio(b.priority)) return prio(a.priority) - prio(b.priority);
      const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return da - db;
    })
    .slice(0, 8);

  const activeCount = rows.filter((r) => !["TERMINE", "ARCHIVE"].includes(r.status)).length;
  const stats = {
    chantiers: activeCount,
    aTraiter: rows.reduce(
      (n, r) => n + r.actions.filter((a) => isActionOpen(a.status) && (isOverdue(a.dueDate, a.status) || isDueWithinDays(a.dueDate, 7))).length,
      0,
    ),
    blocages: rows.reduce((n, r) => n + r.criticalBlockers, 0),
    echeances: rows.reduce(
      (n, r) =>
        n +
        r.actions.filter((a) => isActionOpen(a.status) && a.dueDate && a.dueDate >= today && a.dueDate <= weekEnd).length,
      0,
    ),
    visas: rows.reduce((n, r) => n + r.visasCount, 0),
    doe: rows.filter((r) => r.doeIncomplete).length,
  };

  return (
    <div className="space-y-6">
      <BackLink href="/dashboard">Tableau de bord</BackLink>
      <PilotageSubNav />

      <header className="overflow-hidden rounded-2xl border border-bework-navy/15 bg-gradient-to-br from-bework-navy via-[#243f66] to-bework-navy-deep p-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/60">BeWork · Command Center</p>
            <h1 className="font-heading mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Pilotage travaux</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/80">
              Supervisez les obligations, échéances, documents, blocages et jalons de tous vos chantiers.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canEdit ? (
              <Link
                href={`${PILOTAGE_LIST_PATH}/nouveau`}
                className="rounded-lg bg-white px-3.5 py-2 text-xs font-semibold text-bework-navy shadow-sm hover:bg-slate-50"
              >
                Nouveau pilotage
              </Link>
            ) : null}
            <Link
              href={`${PILOTAGE_LIST_PATH}/blocages`}
              className="rounded-lg border border-white/25 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur hover:bg-white/15"
            >
              Centre des blocages
            </Link>
            <Link
              href={`${PILOTAGE_LIST_PATH}/calendrier`}
              className="rounded-lg border border-white/25 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur hover:bg-white/15"
            >
              Calendrier
            </Link>
            <Link
              href={`${PILOTAGE_LIST_PATH}/a-traiter`}
              className="rounded-lg border border-white/25 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur hover:bg-white/15"
            >
              Synthèse à traiter
            </Link>
          </div>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <PilotageKpi label="Chantiers actifs" value={stats.chantiers} href={PILOTAGE_LIST_PATH} tone="neutral" />
        <PilotageKpi
          label="Éléments à traiter"
          value={stats.aTraiter}
          href={`${PILOTAGE_LIST_PATH}?kpi=traiter`}
          tone={stats.aTraiter > 0 ? "watch" : "ok"}
        />
        <PilotageKpi
          label="Blocages critiques"
          value={stats.blocages}
          href={`${PILOTAGE_LIST_PATH}/blocages`}
          tone={stats.blocages > 0 ? "critical" : "ok"}
        />
        <PilotageKpi
          label="Échéances cette semaine"
          value={stats.echeances}
          href={`${PILOTAGE_LIST_PATH}?semaine=1`}
          tone={stats.echeances > 0 ? "watch" : "neutral"}
        />
        <PilotageKpi
          label="Visas en retard / attente"
          value={stats.visas}
          href={`${PILOTAGE_LIST_PATH}?kpi=visas`}
          tone={stats.visas > 0 ? "watch" : "ok"}
        />
        <PilotageKpi
          label="DOE à risque"
          value={stats.doe}
          href={`${PILOTAGE_LIST_PATH}?kpi=doe`}
          tone={stats.doe > 0 ? "watch" : "ok"}
        />
      </div>

      <form method="get" className="cc-card flex flex-wrap items-end gap-3 p-4">
        <label className="min-w-[200px] flex-1 text-xs font-semibold text-bework-muted">
          Recherche globale
          <input
            name="q"
            defaultValue={q}
            placeholder="Chantier, client, lot, référence…"
            className="mt-1 w-full rounded-[var(--cc-radius)] border border-[color:var(--cc-chrome-border)] px-3 py-2 text-sm font-normal text-bework-ink focus:border-bework-navy focus:outline-none focus:ring-2 focus:ring-bework-navy/20"
          />
        </label>
        {(session.user.role === "MANAGER" || session.user.role === "AGENCE") && (
          <label className="text-xs font-semibold text-bework-muted">
            Client
            <select name="client" defaultValue={clientId} className="mt-1 block rounded-[var(--cc-radius)] border border-[color:var(--cc-chrome-border)] px-3 py-2 text-sm font-normal text-bework-ink">
              <option value="">Tous</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company ?? c.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="text-xs font-semibold text-bework-muted">
          Statut
          <select name="statut" defaultValue={status} className="mt-1 block rounded-[var(--cc-radius)] border border-[color:var(--cc-chrome-border)] px-3 py-2 text-sm font-normal text-bework-ink">
            <option value="">Tous</option>
            {Object.entries(PILOTAGE_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 pb-2 text-xs font-semibold text-bework-ink/80">
          <input type="checkbox" name="retard" value="1" defaultChecked={retard} />
          En retard
        </label>
        <label className="flex items-center gap-2 pb-2 text-xs font-semibold text-bework-ink/80">
          <input type="checkbox" name="semaine" value="1" defaultChecked={week} />
          Cette semaine
        </label>
        <label className="flex items-center gap-2 pb-2 text-xs font-semibold text-bework-ink/80">
          <input type="checkbox" name="urgence" value="1" defaultChecked={urg} />
          Urgences
        </label>
        <input type="hidden" name="vue" value={view} />
        <button type="submit" className="btn-cc-primary">
          Filtrer
        </button>
        <Link href={PILOTAGE_LIST_PATH} className="btn-cc-secondary">
          Réinitialiser
        </Link>
      </form>

      <section className="pilotage-card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-bework-ink">À traiter aujourd’hui</h2>
          <Link href={`${PILOTAGE_LIST_PATH}/a-traiter`} className="text-xs font-semibold text-bework-navy hover:underline">
            Voir tout
          </Link>
        </div>
        {urgentActions.length === 0 ? (
          <p className="mt-3 text-sm text-bework-muted">Aucune action urgente pour le moment.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[color:var(--cc-chrome-border)]">
            {urgentActions.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-bework-ink">{a.title}</p>
                  <p className="text-xs text-bework-muted">
                    {a.chantier} · {a.client} · échéance {formatDateFr(a.dueDate)}
                    {a.overdue ? <span className="ml-2 font-semibold text-bework-critical">En retard</span> : null}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={a.status} />
                  <Link href={`${PILOTAGE_LIST_PATH}/${a.pilotageId}?onglet=a-traiter`} className="btn-cc-secondary !px-3 !py-1.5 text-xs">
                    Traiter
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-bework-ink">Chantiers pilotés ({rows.length})</h2>
          <Suspense fallback={null}>
            <PilotageViewToggle current={view} />
          </Suspense>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-[var(--cc-radius-lg)] border border-dashed border-[color:var(--cc-chrome-border)] bg-white p-10 text-center">
            <p className="text-sm font-semibold text-bework-ink">Aucun pilotage chantier</p>
            <p className="mt-1 text-sm text-bework-muted">
              Dès qu’un marché est obtenu, créez un pilotage pour structurer obligations, documents, jalons et DOE.
            </p>
            {canEdit ? (
              <Link href={`${PILOTAGE_LIST_PATH}/nouveau`} className="btn-cc-primary mt-4 inline-flex">
                + Nouveau pilotage
              </Link>
            ) : null}
          </div>
        ) : view === "tableau" ? (
          <div className="pilotage-card overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[color:var(--cc-chrome-border)] bg-bework-navy-soft/40 text-[11px] font-bold uppercase tracking-wider text-bework-muted">
                <tr>
                  <th className="px-4 py-3">Chantier</th>
                  <th className="px-4 py-3">Cycle</th>
                  <th className="px-4 py-3">Santé</th>
                  <th className="px-4 py-3">Admin</th>
                  <th className="px-4 py-3">DOE</th>
                  <th className="px-4 py-3">Blocages</th>
                  <th className="px-4 py-3">Retards</th>
                  <th className="px-4 py-3">Échéance</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--cc-chrome-border)]">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-bework-navy-soft/30">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-bework-ink">{r.project.title}</p>
                      <p className="text-xs text-bework-muted">
                        {r.project.client.company ?? r.project.client.name}
                        {r.lot ? ` · ${r.lot}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <StatusBadge status={r.status} />
                        <span className="text-[10px] text-bework-muted">
                          Chantier : {chantierStatusLabel(r.project.chantierStatus)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <HealthBadge label={r.health.label} />
                    </td>
                    <td className="px-4 py-3 tabular-nums">{r.adminProgressPct}%</td>
                    <td className="px-4 py-3 tabular-nums">{r.doeProgressPct}%</td>
                    <td className={`px-4 py-3 tabular-nums ${r.openBlockersCount ? "font-semibold text-bework-critical" : ""}`}>
                      {r.openBlockersCount}
                    </td>
                    <td className={`px-4 py-3 tabular-nums ${r.overdueActions.length ? "font-semibold text-bework-critical" : ""}`}>
                      {r.overdueActions.length}
                    </td>
                    <td className="px-4 py-3 text-xs text-bework-muted">{formatDateFr(r.nextDue)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`${PILOTAGE_LIST_PATH}/${r.id}`} className="text-xs font-semibold text-bework-navy hover:underline">
                        Ouvrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((r) => (
              <Link
                key={r.id}
                href={`${PILOTAGE_LIST_PATH}/${r.id}`}
                className="pilotage-card group relative flex gap-0 overflow-hidden p-0"
              >
                <div
                  className={`w-1.5 shrink-0 ${
                    r.health.label === "CRITIQUE"
                      ? "bg-bework-critical"
                      : r.health.label === "EN_DIFFICULTE"
                        ? "bg-orange-500"
                        : r.health.label === "A_SURVEILLER"
                          ? "bg-bework-watch"
                          : r.health.label === "TERMINE"
                            ? "bg-bework-muted"
                            : "bg-bework-ok"
                  }`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold text-bework-ink group-hover:text-bework-navy">
                        {r.project.title}
                      </h3>
                      <p className="text-sm text-bework-muted">
                        {r.project.client.company ?? r.project.client.name}
                        {r.lot ? ` · ${r.lot}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status={r.status} />
                      <HealthBadge label={r.health.label} />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-bework-muted">
                    Cycle chantier : {chantierStatusLabel(r.project.chantierStatus)} · Conducteur :{" "}
                    {r.conducteur?.name ?? "—"} · Assistant : {r.assistant?.name ?? "—"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-bework-muted/80">
                    {SERVICE_LEVEL_LABELS[r.serviceLevel] ?? r.serviceLevel}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-bework-muted">Prochaine échéance</p>
                      <p className="font-semibold text-bework-ink">{formatDateFr(r.nextDue)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-bework-muted">Prochain jalon</p>
                      <p className="truncate font-semibold text-bework-ink">{r.nextMilestone?.title ?? "—"}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-end gap-4">
                    <ProgressBar value={r.adminProgressPct} label="Admin" />
                    <ProgressBar value={r.doeProgressPct} label="DOE" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-bework-muted">Blocages</p>
                      <p className={`text-lg font-bold ${r.openBlockersCount ? "text-bework-critical" : "text-bework-ink"}`}>
                        {r.openBlockersCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-bework-muted">Retards</p>
                      <p className={`text-lg font-bold ${r.overdueActions.length ? "text-bework-critical" : "text-bework-ink"}`}>
                        {r.overdueActions.length}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <StatusBadge status={r.status} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
