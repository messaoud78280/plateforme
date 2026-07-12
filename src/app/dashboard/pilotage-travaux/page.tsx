import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { ProgressBar, StatusBadge } from "@/components/pilotage/PilotageBadges";
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
import { PILOTAGE_LIST_PATH, PILOTAGE_STATUS_LABELS } from "@/lib/pilotage/constants";
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
        actions: { where: { archivedAt: null }, select: { id: true, title: true, dueDate: true, status: true, priority: true } },
        requiredDocuments: { where: { archivedAt: null }, select: { id: true, status: true } },
        plans: { where: { archivedAt: null }, select: { id: true, status: true, visaDueDate: true } },
        extraWorks: { where: { archivedAt: null }, select: { id: true, writtenValidation: true, startedWithoutValidation: true, status: true } },
        doeItems: { where: { archivedAt: null }, select: { id: true, status: true } },
        situations: { where: { archivedAt: null, status: { in: ["À préparer", "En préparation"] } }, select: { id: true } },
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
    return {
      ...p,
      overdueActions,
      missingDocsCount: missingDocs.length,
      visasCount: visas.length,
      tsAlertCount: tsOpen.length,
      situationsTodo: p.situations.length,
      doeIncomplete,
    };
  });

  if (retard) rows = rows.filter((r) => r.overdueActions.length > 0);
  if (week) {
    rows = rows.filter((r) =>
      r.actions.some(
        (a) => isActionOpen(a.status) && a.dueDate && a.dueDate >= today && a.dueDate <= weekEnd,
      ),
    );
  }
  if (urg) {
    rows = rows.filter(
      (r) =>
        r.overdueActions.length > 0 ||
        r.status === "BLOQUE" ||
        r.status === "SOUS_SURVEILLANCE" ||
        r.tsAlertCount > 0,
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

  const stats = {
    chantiers: rows.length,
    retards: rows.reduce((n, r) => n + r.overdueActions.length, 0),
    docs: rows.reduce((n, r) => n + r.missingDocsCount, 0),
    visas: rows.reduce((n, r) => n + r.visasCount, 0),
    situations: rows.reduce((n, r) => n + r.situationsTodo, 0),
    ts: rows.reduce((n, r) => n + r.tsAlertCount, 0),
    doe: rows.filter((r) => r.doeIncomplete).length,
  };

  return (
    <div className="space-y-6">
      <BackLink href="/dashboard">Tableau de bord</BackLink>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pilotage administratif des travaux</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Suivez les obligations contractuelles, les documents, les échéances, les visas, les situations et le DOE de chaque chantier.
          </p>
        </div>
        {canEdit ? (
          <Link
            href={`${PILOTAGE_LIST_PATH}/nouveau`}
            className="inline-flex items-center rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#162d4a]"
          >
            + Nouveau pilotage chantier
          </Link>
        ) : null}
      </header>

      <div className="grid gap-px overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-200/60 shadow-sm sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <Stat label="Chantiers suivis" value={stats.chantiers} />
        <Stat label="Actions en retard" value={stats.retards} accent={stats.retards > 0 ? "red" : undefined} />
        <Stat label="Docs manquants" value={stats.docs} accent={stats.docs > 0 ? "amber" : undefined} />
        <Stat label="Visas en attente" value={stats.visas} accent={stats.visas > 0 ? "amber" : undefined} />
        <Stat label="Situations à préparer" value={stats.situations} />
        <Stat label="TS non validés" value={stats.ts} accent={stats.ts > 0 ? "red" : undefined} />
        <Stat label="DOE incomplets" value={stats.doe} />
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <label className="min-w-[180px] flex-1 text-xs font-semibold text-slate-600">
          Recherche
          <input
            name="q"
            defaultValue={q}
            placeholder="Chantier, client, lot…"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal"
          />
        </label>
        {(session.user.role === "MANAGER" || session.user.role === "AGENCE") && (
          <label className="text-xs font-semibold text-slate-600">
            Client
            <select name="client" defaultValue={clientId} className="mt-1 block rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal">
              <option value="">Tous</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company ?? c.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="text-xs font-semibold text-slate-600">
          Statut
          <select name="statut" defaultValue={status} className="mt-1 block rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal">
            <option value="">Tous</option>
            {Object.entries(PILOTAGE_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 pb-2 text-xs font-semibold text-slate-700">
          <input type="checkbox" name="retard" value="1" defaultChecked={retard} />
          En retard
        </label>
        <label className="flex items-center gap-2 pb-2 text-xs font-semibold text-slate-700">
          <input type="checkbox" name="semaine" value="1" defaultChecked={week} />
          À traiter cette semaine
        </label>
        <label className="flex items-center gap-2 pb-2 text-xs font-semibold text-slate-700">
          <input type="checkbox" name="urgence" value="1" defaultChecked={urg} />
          Urgences
        </label>
        <button type="submit" className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white">
          Filtrer
        </button>
        <Link href={PILOTAGE_LIST_PATH} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">
          Réinitialiser
        </Link>
      </form>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900">À traiter aujourd’hui</h2>
        {urgentActions.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Aucune action urgente pour le moment.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {urgentActions.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{a.title}</p>
                  <p className="text-xs text-slate-500">
                    {a.chantier} · {a.client} · échéance {formatDateFr(a.dueDate)}
                    {a.overdue ? <span className="ml-2 font-semibold text-red-700">En retard</span> : null}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={a.status} />
                  <Link
                    href={`${PILOTAGE_LIST_PATH}/${a.pilotageId}?onglet=actions`}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-[#1e3a5f]"
                  >
                    Ouvrir
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900">Chantiers pilotés ({rows.length})</h2>
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-sm font-semibold text-slate-700">Aucun pilotage chantier</p>
            <p className="mt-1 text-sm text-slate-500">
              Dès qu’un marché est obtenu, créez un pilotage pour structurer obligations, documents, échéances et DOE.
            </p>
            {canEdit ? (
              <Link
                href={`${PILOTAGE_LIST_PATH}/nouveau`}
                className="mt-4 inline-flex rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white"
              >
                + Nouveau pilotage chantier
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-3">
            {rows.map((r) => (
              <Link
                key={r.id}
                href={`${PILOTAGE_LIST_PATH}/${r.id}`}
                className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-[#1e3a5f]/40 hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold text-slate-900">{r.project.title}</h3>
                    <p className="text-sm text-slate-600">
                      {r.project.client.company ?? r.project.client.name}
                      {r.lot ? ` · ${r.lot}` : ""}
                      {r.project.siteCity ? ` · ${r.project.siteCity}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Conducteur : {r.conducteur?.name ?? "—"} · Assistant : {r.assistant?.name ?? "—"} · Début{" "}
                      {formatDateFr(r.startDate)} → {formatDateFr(r.plannedEndDate)}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                <div className="mt-4 flex flex-wrap items-end gap-6">
                  <ProgressBar value={r.adminProgressPct} label="Admin" />
                  <ProgressBar value={r.doeProgressPct} label="DOE" />
                  <Metric danger={r.overdueActions.length > 0} label="Retards" value={r.overdueActions.length} />
                  <Metric danger={r.missingDocsCount > 0} label="Docs manquants" value={r.missingDocsCount} />
                  <Metric warn={r.visasCount > 0} label="Visas" value={r.visasCount} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: "red" | "amber" }) {
  return (
    <div className="bg-white px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p
        className={`mt-0.5 text-xl font-bold ${
          accent === "red" ? "text-red-700" : accent === "amber" ? "text-amber-700" : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Metric({
  label,
  value,
  danger,
  warn,
}: {
  label: string;
  value: number;
  danger?: boolean;
  warn?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`text-lg font-bold ${danger ? "text-red-700" : warn ? "text-amber-700" : "text-slate-800"}`}>{value}</p>
    </div>
  );
}
