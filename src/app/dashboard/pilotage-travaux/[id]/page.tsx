import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/ui/BackLink";
import { ProgressBar, StatusBadge } from "@/components/pilotage/PilotageBadges";
import {
  HealthPanel,
  MilestoneTimeline,
  ProgressRing,
} from "@/components/pilotage/PilotageCockpit";
import { PilotageDetailNav } from "@/components/pilotage/PilotageDetailNav";
import {
  ActionStatusButtons,
  DoeStatusSelect,
  EnsureMilestonesButton,
  GenerateReportButton,
  MilestoneStatusSelect,
  QuickAddAction,
  QuickAddBlocker,
  QuickAddExtraWork,
  QuickAddMarketDoc,
  QuickAddObligation,
  QuickAddPlan,
  QuickAddRequiredDoc,
  QuickAddSituation,
  QuickAddSubcontractor,
  ResolveBlockerButton,
} from "@/components/pilotage/PilotageQuickForms";
import {
  canEditPilotageOperational,
  requirePilotageAccess,
  requirePilotageSession,
} from "@/lib/pilotage/access";
import {
  computeDoeProgress,
  formatDateFr,
  isActionOpen,
  isDocMissing,
  isDueWithinDays,
  isOverdue,
  isVisaPending,
  startOfDay,
  addDays,
} from "@/lib/pilotage/calculations";
import { PILOTAGE_LIST_PATH, SERVICE_LEVEL_LABELS, type DetailTabId } from "@/lib/pilotage/constants";
import { countHealthSignals } from "@/lib/pilotage/health";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

function first(sp: SP, key: string) {
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v;
}

export default async function PilotageDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SP>;
}) {
  const session = await requirePilotageSession();
  const { id } = await params;
  const sp = await searchParams;
  await requirePilotageAccess({ id: session.user.id, role: session.user.role }, id);

  const tabRaw = first(sp, "onglet") ?? "vue";
  const validTabs = [
    "vue",
    "a-traiter",
    "blocages",
    "pieces",
    "obligations",
    "documents",
    "actions",
    "plans",
    "calendrier",
    "jalons",
    "sous-traitants",
    "situations",
    "ts",
    "doe",
    "rapports",
    "historique",
  ] as const;
  const tab = (validTabs.includes(tabRaw as (typeof validTabs)[number]) ? tabRaw : "vue") as DetailTabId;
  const canEdit = canEditPilotageOperational(session.user.role);

  const pilotage = await prisma.worksitePilotage.findUnique({
    where: { id },
    include: {
      project: {
        include: { client: { select: { name: true, company: true, email: true, phone: true } } },
      },
      conducteur: { select: { name: true, email: true } },
      assistant: { select: { name: true, email: true } },
      marketDocuments: { where: { archivedAt: null }, orderBy: { depositedAt: "desc" } },
      obligations: { where: { archivedAt: null }, orderBy: [{ dueDate: "asc" }, { priority: "asc" }] },
      requiredDocuments: { where: { archivedAt: null }, orderBy: { dueDate: "asc" } },
      actions: { where: { archivedAt: null }, orderBy: [{ dueDate: "asc" }, { priority: "asc" }] },
      plans: { where: { archivedAt: null }, orderBy: { visaDueDate: "asc" } },
      doeItems: { where: { archivedAt: null }, orderBy: [{ category: "asc" }, { title: "asc" }] },
      subcontractors: { where: { archivedAt: null }, include: { documents: true }, orderBy: { companyName: "asc" } },
      situations: { where: { archivedAt: null }, orderBy: { createdAt: "desc" } },
      extraWorks: { where: { archivedAt: null }, orderBy: { createdAt: "desc" } },
      activities: { orderBy: { createdAt: "desc" }, take: 40 },
      reports: { orderBy: { createdAt: "desc" }, take: 20 },
      milestones: { where: { archivedAt: null }, orderBy: { sortOrder: "asc" } },
      blockers: { where: { archivedAt: null }, orderBy: [{ severity: "asc" }, { openedAt: "desc" }] },
    },
  });
  if (!pilotage) notFound();

  const doe = computeDoeProgress(pilotage.doeItems);
  const overdueActions = pilotage.actions.filter((a) => isActionOpen(a.status) && isOverdue(a.dueDate, a.status));
  const missingDocs = pilotage.requiredDocuments.filter((d) => isDocMissing(d.status));
  const openObligations = pilotage.obligations.filter((o) => !["Validée", "Non applicable"].includes(o.status));
  const visas = pilotage.plans.filter((p) => isVisaPending(p.status) || isOverdue(p.visaDueDate, p.status));
  const incompleteSt = pilotage.subcontractors.filter((s) => s.dossierStatus !== "Complet");
  const situationsTodo = pilotage.situations.filter((s) => ["À préparer", "En préparation"].includes(s.status));
  const tsAlert = pilotage.extraWorks.filter((e) => e.startedWithoutValidation && !e.writtenValidation);
  const openBlockers = pilotage.blockers.filter((b) => b.status === "Ouvert" || b.status === "En cours");
  const health = countHealthSignals({
    status: pilotage.status,
    actions: pilotage.actions,
    obligations: pilotage.obligations,
    requiredDocuments: pilotage.requiredDocuments,
    plans: pilotage.plans,
    extraWorks: pilotage.extraWorks,
    doeItems: pilotage.doeItems,
    blockers: pilotage.blockers,
    milestones: pilotage.milestones,
  });
  const today = startOfDay();
  const weekEnd = addDays(today, 7);
  const nextMilestone = pilotage.milestones.find((m) => !["Atteint", "Annulé", "Non applicable"].includes(m.status));
  const nextDue = [
    ...pilotage.actions.filter((a) => a.dueDate && isActionOpen(a.status)).map((a) => ({ d: a.dueDate!, label: a.title })),
    ...pilotage.obligations
      .filter((o) => o.dueDate && !["Validée", "Non applicable"].includes(o.status))
      .map((o) => ({ d: o.dueDate!, label: o.title })),
  ].sort((a, b) => new Date(a.d).getTime() - new Date(b.d).getTime())[0];

  const hrefTab = (t: string) => `${PILOTAGE_LIST_PATH}/${id}?onglet=${t}`;
  const navBadges: Partial<Record<DetailTabId, number>> = {
    "a-traiter": overdueActions.length + situationsTodo.length,
    blocages: openBlockers.length,
    documents: missingDocs.length,
    plans: visas.length,
    doe: doe.manquant,
  };

  return (
    <div className="space-y-5">
      <BackLink href={PILOTAGE_LIST_PATH}>Pilotage travaux</BackLink>

      <header className="pilotage-card overflow-hidden p-0">
        <div className="border-b border-slate-100 bg-gradient-to-r from-[#1e3a5f]/5 to-transparent px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                {pilotage.project.client.company ?? pilotage.project.client.name}
                {pilotage.lot ? ` · ${pilotage.lot}` : ""}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{pilotage.project.title}</h1>
                <StatusBadge status={pilotage.status} />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Conducteur : {pilotage.conducteur?.name ?? "—"} · Assistant : {pilotage.assistant?.name ?? "—"} ·{" "}
                {formatDateFr(pilotage.startDate)} → {formatDateFr(pilotage.plannedEndDate)}
                {pilotage.internalRef ? ` · Réf. ${pilotage.internalRef}` : ""}
              </p>
              <p className="mt-1 text-[11px] font-medium text-[#1e3a5f]/80">
                {SERVICE_LEVEL_LABELS[pilotage.serviceLevel] ?? pilotage.serviceLevel}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={hrefTab("a-traiter")} className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-semibold text-white">
                À traiter
              </Link>
              <Link href={hrefTab("blocages")} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
                Blocages
              </Link>
              <GenerateReportButton pilotageId={id} />
            </div>
          </div>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <HealthPanel health={health} causesHref={hrefTab("blocages")} compact />
          <div className="pilotage-card flex items-center p-3">
            <ProgressRing value={pilotage.adminProgressPct} label="Admin" />
          </div>
          <div className="pilotage-card p-3">
            <ProgressBar value={doe.pct} label="DOE" />
            <p className="mt-2 text-xs text-slate-500">{doe.manquant} manquant(s)</p>
          </div>
          <MiniStat label="Prochain jalon" valueLabel={nextMilestone?.title ?? "—"} />
          <MiniStat label="Prochaine échéance" valueLabel={nextDue ? `${formatDateFr(nextDue.d)}` : "—"} sub={nextDue?.label} />
          <MiniStat label="Blocages ouverts" value={openBlockers.length} danger={openBlockers.length > 0} />
        </div>
      </header>

      <PilotageDetailNav pilotageId={id} active={tab} badges={navBadges} />

      {tab === "vue" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card title="À traiter aujourd’hui">
              <UrgencyList
                items={[
                  ...overdueActions.map((a) => ({ label: `Retard action : ${a.title}`, tone: "red" as const })),
                  ...tsAlert.map((e) => ({
                    label: `TS sans validation écrite : ${e.reference ?? e.description.slice(0, 60)}`,
                    tone: "red" as const,
                  })),
                  ...openBlockers.slice(0, 4).map((b) => ({
                    label: `Blocage : ${b.title}`,
                    tone: (b.severity === "Critique" ? "red" : "amber") as "red" | "amber",
                  })),
                  ...visas
                    .filter((p) => isOverdue(p.visaDueDate, p.status))
                    .map((p) => ({ label: `Visa en retard : ${p.reference}`, tone: "amber" as const })),
                  ...pilotage.actions
                    .filter((a) => isActionOpen(a.status) && isDueWithinDays(a.dueDate, 7) && !isOverdue(a.dueDate, a.status))
                    .map((a) => ({ label: `Échéance < 7 j : ${a.title}`, tone: "amber" as const })),
                ]}
              />
            </Card>
            <Card title="Blocages principaux">
              {openBlockers.length === 0 ? (
                <p className="text-sm text-slate-500">Aucun blocage ouvert.</p>
              ) : (
                <ul className="space-y-2">
                  {openBlockers.slice(0, 5).map((b) => (
                    <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                      <span className="font-semibold text-slate-900">{b.title}</span>
                      <StatusBadge status={b.severity} />
                    </li>
                  ))}
                </ul>
              )}
              <Link href={hrefTab("blocages")} className="mt-3 inline-block text-xs font-semibold text-[#1e3a5f] hover:underline">
                Voir tous les blocages
              </Link>
            </Card>
            <Card title="Prochaines échéances">
              <ul className="space-y-2 text-sm">
                {[
                  ...pilotage.actions.filter((a) => a.dueDate && isActionOpen(a.status)),
                  ...pilotage.obligations.filter((o) => o.dueDate && !["Validée", "Non applicable"].includes(o.status)),
                  ...pilotage.requiredDocuments.filter((d) => d.dueDate && isDocMissing(d.status)),
                ]
                  .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
                  .slice(0, 12)
                  .map((item) => (
                    <li key={item.id} className="flex justify-between gap-2 border-b border-slate-50 pb-2">
                      <span className="truncate">{"title" in item ? item.title : "name" in item ? item.name : "—"}</span>
                      <span className="shrink-0 text-xs text-slate-500">{formatDateFr(item.dueDate)}</span>
                    </li>
                  ))}
              </ul>
            </Card>
            <Card title="Activité récente">
              <ul className="space-y-2 text-sm">
                {pilotage.activities.length === 0 ? (
                  <li className="text-slate-500">Aucune activité pour le moment.</li>
                ) : (
                  pilotage.activities.slice(0, 10).map((a) => (
                    <li key={a.id} className="flex flex-wrap gap-2 border-b border-slate-50 pb-2">
                      <span className="text-xs text-slate-400">{formatDateFr(a.createdAt)}</span>
                      <span className="font-semibold text-slate-800">{a.actionType}</span>
                      <span className="text-slate-600">{a.entityLabel ?? a.comment ?? ""}</span>
                    </li>
                  ))
                )}
              </ul>
            </Card>
          </div>
          <div className="space-y-4">
            <HealthPanel health={health} causesHref={hrefTab("blocages")} />
            <Card title="Progression par catégorie">
              <div className="space-y-3">
                <ProgressBar value={pilotage.adminProgressPct} label="Avancement administratif et documentaire" />
                <ProgressBar value={doe.pct} label="DOE" />
                <p className="text-xs text-slate-600">Obligations ouvertes : {openObligations.length}</p>
                <p className="text-xs text-slate-600">Documents manquants : {missingDocs.length}</p>
                <p className="text-xs text-slate-600">Plans / visas : {visas.length}</p>
                <p className="text-xs text-slate-600">Sous-traitants incomplets : {incompleteSt.length}</p>
              </div>
            </Card>
            <Card title="Jalons">
              <MilestoneTimeline milestones={pilotage.milestones} />
              <Link href={hrefTab("jalons")} className="mt-3 inline-block text-xs font-semibold text-[#1e3a5f] hover:underline">
                Gérer les jalons
              </Link>
            </Card>
            <Card title="Contacts principaux">
              <dl className="grid gap-2 text-sm">
                <Contact label="Conducteur" value={pilotage.conducteur?.name} />
                <Contact label="Assistant BeWork" value={pilotage.assistant?.name} />
                <Contact label="Responsable client" value={pilotage.clientContactName} />
                <Contact label="Maître d’ouvrage" value={pilotage.maitreOuvrage} />
                <Contact label="Maître d’œuvre" value={pilotage.maitreOeuvre} />
                <Contact label="Bureau de contrôle" value={pilotage.bureauControle} />
                <Contact label="Coordonnateur SPS" value={pilotage.coordinateurSps} />
              </dl>
            </Card>
            <Card title="Documents récents">
              <ul className="space-y-2 text-sm">
                {pilotage.marketDocuments.slice(0, 5).map((d) => (
                  <li key={d.id} className="flex justify-between gap-2">
                    <span className="truncate">{d.title}</span>
                    <StatusBadge status={d.status} />
                  </li>
                ))}
                {pilotage.marketDocuments.length === 0 ? (
                  <li className="text-slate-500">Aucune pièce dépôtée.</li>
                ) : null}
              </ul>
            </Card>
            <Card title="Accès rapides">
              <div className="flex flex-wrap gap-2">
                {[
                  ["documents", "Documents"],
                  ["plans", "Plans"],
                  ["doe", "DOE"],
                  ["obligations", "Obligations"],
                  ["actions", "Actions"],
                ].map(([tid, label]) => (
                  <Link
                    key={tid}
                    href={hrefTab(tid)}
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-[#1e3a5f]/40"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === "a-traiter" && (
        <Panel>
          <h2 className="text-sm font-bold text-slate-900">File de travail quotidienne</h2>
          <div className="mt-4 space-y-6">
            <WorkSection title="En retard" tone="red">
              {overdueActions.map((a) => (
                <WorkRow key={a.id} title={a.title} meta={`Échéance ${formatDateFr(a.dueDate)}`}>
                  <ActionStatusButtons actionId={a.id} status={a.status} canEdit={canEdit} />
                </WorkRow>
              ))}
              {overdueActions.length === 0 ? <p className="text-sm text-slate-500">Rien en retard.</p> : null}
            </WorkSection>
            <WorkSection title="Cette semaine" tone="amber">
              {pilotage.actions
                .filter(
                  (a) =>
                    isActionOpen(a.status) &&
                    a.dueDate &&
                    a.dueDate >= today &&
                    a.dueDate <= weekEnd &&
                    !isOverdue(a.dueDate, a.status),
                )
                .map((a) => (
                  <WorkRow key={a.id} title={a.title} meta={formatDateFr(a.dueDate)}>
                    <ActionStatusButtons actionId={a.id} status={a.status} canEdit={canEdit} />
                  </WorkRow>
                ))}
            </WorkSection>
            <WorkSection title="À valider / documents" tone="neutral">
              {missingDocs.map((d) => (
                <WorkRow key={d.id} title={d.name} meta={`Statut : ${d.status}`} />
              ))}
              {visas.map((p) => (
                <WorkRow key={p.id} title={`Visa ${p.reference}`} meta={p.title} />
              ))}
              {situationsTodo.map((s) => (
                <WorkRow key={s.id} title={`Situation ${s.number}`} meta={s.periodLabel ?? s.status} />
              ))}
            </WorkSection>
            <WorkSection title="Décisions / TS" tone="red">
              {tsAlert.map((e) => (
                <WorkRow key={e.id} title={e.reference ?? "TS"} meta={e.description.slice(0, 80)} />
              ))}
              {openBlockers.map((b) => (
                <WorkRow key={b.id} title={b.title} meta={b.nextAction ?? b.severity}>
                  <ResolveBlockerButton blockerId={b.id} canEdit={canEdit} />
                </WorkRow>
              ))}
            </WorkSection>
          </div>
        </Panel>
      )}

      {tab === "blocages" && (
        <Panel>
          <QuickAddBlocker pilotageId={id} canEdit={canEdit} />
          <div className="mt-4 grid gap-3">
            {pilotage.blockers.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun blocage. Signalez les décisions attendues et les points critiques ici.</p>
            ) : (
              pilotage.blockers.map((b) => {
                const days = Math.floor((Date.now() - new Date(b.openedAt).getTime()) / 86400000);
                return (
                  <div
                    key={b.id}
                    className={`pilotage-card flex gap-3 p-4 ${
                      b.severity === "Critique"
                        ? "border-red-200"
                        : b.severity === "À surveiller"
                          ? "border-amber-200"
                          : ""
                    }`}
                  >
                    <div
                      className={`w-1 shrink-0 rounded-full ${
                        b.severity === "Critique" ? "bg-red-600" : b.severity === "Important" ? "bg-orange-500" : "bg-amber-400"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{b.title}</p>
                        <StatusBadge status={b.severity} />
                        <StatusBadge status={b.status} />
                        <span className="text-[11px] text-slate-500">{days} j</span>
                      </div>
                      {b.consequence ? <p className="mt-1 text-sm text-slate-600">{b.consequence}</p> : null}
                      <p className="mt-2 text-xs text-slate-500">
                        Interne : {b.internalOwner ?? "—"} · Décideur : {b.externalDecider ?? "—"} · Prochaine action :{" "}
                        {b.nextAction ?? "—"} · Relance : {formatDateFr(b.nextFollowUpAt)}
                      </p>
                    </div>
                    {b.status !== "Résolu" ? <ResolveBlockerButton blockerId={b.id} canEdit={canEdit} /> : null}
                  </div>
                );
              })
            )}
          </div>
        </Panel>
      )}

      {tab === "jalons" && (
        <Panel>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-900">Timeline des jalons</h2>
            <EnsureMilestonesButton pilotageId={id} canEdit={canEdit} />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <MilestoneTimeline milestones={pilotage.milestones} />
            <Table
              headers={["Jalon", "Catégorie", "Prévu", "Statut", "Source"]}
              rows={pilotage.milestones.map((m) => [
                m.title,
                m.category,
                formatDateFr(m.plannedAt),
                <MilestoneStatusSelect key="s" milestoneId={m.id} status={m.status} canEdit={canEdit} />,
                m.verificationStatus,
              ])}
              empty="Aucun jalon. Cliquez sur « Initialiser les jalons types »."
            />
          </div>
        </Panel>
      )}

      {tab === "calendrier" && (
        <Panel>
          <h2 className="text-sm font-bold text-slate-900">Échéances du chantier</h2>
          <Table
            headers={["Date", "Type", "Élément", "Statut"]}
            rows={[
              ...pilotage.actions
                .filter((a) => a.dueDate)
                .map((a) => [formatDateFr(a.dueDate), "Action", a.title, <StatusBadge key="s" status={a.status} />]),
              ...pilotage.obligations
                .filter((o) => o.dueDate)
                .map((o) => [formatDateFr(o.dueDate), "Obligation", o.title, <StatusBadge key="s" status={o.status} />]),
              ...pilotage.plans
                .filter((p) => p.visaDueDate)
                .map((p) => [formatDateFr(p.visaDueDate), "Visa", p.reference, <StatusBadge key="s" status={p.status} />]),
              ...pilotage.milestones
                .filter((m) => m.plannedAt)
                .map((m) => [formatDateFr(m.plannedAt), "Jalon", m.title, <StatusBadge key="s" status={m.status} />]),
            ].sort((a, b) => String(a[0]).localeCompare(String(b[0]), "fr"))}
            empty="Aucune date planifiée sur ce chantier."
          />
        </Panel>
      )}

      {tab === "pieces" && (
        <Panel>
          <QuickAddMarketDoc pilotageId={id} canEdit={canEdit} />
          <Table
            headers={["Titre", "Type", "Indice", "Statut", "Émetteur", "En vigueur"]}
            rows={pilotage.marketDocuments.map((d) => [
              d.title,
              d.docType,
              d.indice ?? "—",
              <StatusBadge key="s" status={d.status} />,
              d.emitter ?? "—",
              d.isCurrent ? "Oui" : "Non",
            ])}
            empty="Aucune pièce marché. Ajoutez AE, CCAP, CCTP, DPGF…"
          />
        </Panel>
      )}

      {tab === "obligations" && (
        <Panel>
          <QuickAddObligation pilotageId={id} canEdit={canEdit} />
          <Table
            headers={["Titre", "Catégorie", "Priorité", "Échéance", "Statut", "Responsable"]}
            rows={pilotage.obligations.map((o) => [
              <span key="t" className={isOverdue(o.dueDate, o.status) ? "font-semibold text-red-700" : undefined}>
                {o.title}
              </span>,
              o.category,
              o.priority,
              formatDateFr(o.dueDate),
              <StatusBadge key="s" status={isOverdue(o.dueDate, o.status) && o.status !== "Validée" ? "En retard" : o.status} />,
              o.responsibleName ?? "—",
            ])}
            empty="Aucune obligation. Ajoutez manuellement ou via un modèle à la création."
          />
        </Panel>
      )}

      {tab === "documents" && (
        <Panel>
          <QuickAddRequiredDoc pilotageId={id} canEdit={canEdit} />
          <Table
            headers={["Document", "Catégorie", "Obligatoire", "Échéance", "Statut", "Producteur"]}
            rows={pilotage.requiredDocuments.map((d) => [
              d.name,
              d.category,
              d.isMandatory ? "Oui" : "Non",
              formatDateFr(d.dueDate),
              <StatusBadge key="s" status={d.status} />,
              d.producerName ?? "—",
            ])}
            empty="Aucun document à remettre n’a encore été ajouté."
          />
        </Panel>
      )}

      {tab === "actions" && (
        <Panel>
          <QuickAddAction pilotageId={id} canEdit={canEdit} />
          <Table
            headers={["Action", "Catégorie", "Priorité", "Échéance", "Statut"]}
            rows={pilotage.actions.map((a) => [
              <span key="t" className={isOverdue(a.dueDate, a.status) ? "font-semibold text-red-700" : undefined}>
                {a.title}
                {a.assigneeName ? <span className="mt-0.5 block text-xs font-normal text-slate-500">{a.assigneeName}</span> : null}
              </span>,
              a.category,
              a.priority,
              formatDateFr(a.dueDate),
              <ActionStatusButtons key="s" actionId={a.id} status={a.status} canEdit={canEdit} />,
            ])}
            empty="Aucune action. Créez une relance liée à une obligation, un document ou un visa."
          />
        </Panel>
      )}

      {tab === "plans" && (
        <Panel>
          <QuickAddPlan pilotageId={id} canEdit={canEdit} />
          <Table
            headers={["Réf.", "Titre", "Indice", "Visa attendu", "Statut"]}
            rows={pilotage.plans.map((p) => [
              p.reference,
              p.title,
              p.indice,
              formatDateFr(p.visaDueDate),
              <StatusBadge key="s" status={isOverdue(p.visaDueDate, p.status) ? "En retard" : p.status} />,
            ])}
            empty="Aucun plan. Ajoutez les plans d’exécution et suivez les visas."
          />
        </Panel>
      )}

      {tab === "sous-traitants" && (
        <Panel>
          <QuickAddSubcontractor pilotageId={id} canEdit={canEdit} />
          <Table
            headers={["Entreprise", "Prestation", "Agrément", "Dossier", "Contact"]}
            rows={pilotage.subcontractors.map((s) => [
              s.companyName,
              s.prestation ?? "—",
              <StatusBadge key="a" status={s.approvalStatus} />,
              <StatusBadge key="d" status={s.dossierStatus} />,
              s.contactName ?? s.email ?? "—",
            ])}
            empty="Aucun sous-traitant."
          />
        </Panel>
      )}

      {tab === "situations" && (
        <Panel>
          <QuickAddSituation pilotageId={id} canEdit={canEdit} />
          <Table
            headers={["N°", "Période", "Demandé", "Validé", "Payé", "Statut"]}
            rows={pilotage.situations.map((s) => [
              s.number,
              s.periodLabel ?? "—",
              s.requestedHt?.toString() ?? "—",
              s.validatedHt?.toString() ?? "—",
              s.paidHt?.toString() ?? "—",
              <StatusBadge key="s" status={s.status} />,
            ])}
            empty="Aucune situation."
          />
        </Panel>
      )}

      {tab === "ts" && (
        <Panel>
          {tsAlert.length > 0 ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
              Travaux commencés sans validation écrite ({tsAlert.length})
            </div>
          ) : null}
          <QuickAddExtraWork pilotageId={id} canEdit={canEdit} />
          <Table
            headers={["Réf.", "Description", "Estimé HT", "Validation écrite", "Statut"]}
            rows={pilotage.extraWorks.map((e) => [
              e.reference ?? "—",
              e.description.slice(0, 80),
              e.estimatedHt?.toString() ?? "—",
              e.writtenValidation ? "Oui" : e.startedWithoutValidation ? "Non — alerte" : "Non",
              <StatusBadge key="s" status={e.status} />,
            ])}
            empty="Aucun travaux supplémentaire enregistré."
          />
        </Panel>
      )}

      {tab === "doe" && (
        <Panel>
          <div className="mb-4 flex flex-wrap gap-4 rounded-xl bg-slate-50 p-4">
            <ProgressBar value={doe.pct} label="Complétude DOE" />
            <MiniStat label="Conformes" value={doe.conforme} />
            <MiniStat label="Manquants" value={doe.manquant} warn={doe.manquant > 0} />
            <MiniStat label="À vérifier" value={doe.aVerifier} />
            <MiniStat label="À corriger" value={doe.aCorriger} warn={doe.aCorriger > 0} />
          </div>
          <Table
            headers={["Élément", "Catégorie", "Obligatoire", "Statut"]}
            rows={pilotage.doeItems.map((d) => [
              d.title,
              d.category,
              d.isMandatory ? "Oui" : "Non",
              <DoeStatusSelect key="s" itemId={d.id} status={d.status} canEdit={canEdit} />,
            ])}
            empty="Aucun élément DOE."
          />
        </Panel>
      )}

      {tab === "rapports" && (
        <Panel>
          <GenerateReportButton pilotageId={id} />
          <ul className="mt-4 space-y-2">
            {pilotage.reports.length === 0 ? (
              <li className="text-sm text-slate-500">Aucun rapport archivé.</li>
            ) : (
              pilotage.reports.map((r) => (
                <li key={r.id} className="rounded-xl border border-slate-100 px-4 py-3 text-sm">
                  <p className="font-semibold text-slate-900">{r.title}</p>
                  <p className="text-xs text-slate-500">
                    {formatDateFr(r.createdAt)} · {r.createdByName ?? "—"}
                  </p>
                  <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-slate-50 p-2 text-[11px] text-slate-700">
                    {JSON.stringify(r.contentJson, null, 2)}
                  </pre>
                </li>
              ))
            )}
          </ul>
        </Panel>
      )}

      {tab === "historique" && (
        <Panel>
          <ul className="space-y-3">
            {pilotage.activities.map((a) => (
              <li key={a.id} className="border-b border-slate-100 pb-3 text-sm">
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-slate-400">{new Date(a.createdAt).toLocaleString("fr-FR")}</span>
                  <span className="font-semibold text-[#1e3a5f]">{a.actionType}</span>
                  <span>{a.entityLabel}</span>
                </div>
                {(a.oldValue || a.newValue) && (
                  <p className="mt-1 text-xs text-slate-500">
                    {a.oldValue ? `${a.oldValue} → ` : ""}
                    {a.newValue}
                  </p>
                )}
                {a.comment ? <p className="mt-1 text-xs text-slate-600">{a.comment}</p> : null}
                <p className="text-[11px] text-slate-400">{a.userName ?? "Système"}</p>
              </li>
            ))}
            {pilotage.activities.length === 0 ? <li className="text-slate-500">Historique vide.</li> : null}
          </ul>
        </Panel>
      )}
    </div>
  );
}

function MiniStat({
  label,
  value,
  valueLabel,
  sub,
  danger,
  warn,
}: {
  label: string;
  value?: number;
  valueLabel?: string;
  sub?: string;
  danger?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      {valueLabel != null ? (
        <>
          <p className="truncate text-sm font-bold text-slate-900">{valueLabel}</p>
          {sub ? <p className="truncate text-[11px] text-slate-500">{sub}</p> : null}
        </>
      ) : (
        <p className={`text-lg font-bold ${danger ? "text-red-700" : warn ? "text-amber-700" : "text-slate-900"}`}>{value}</p>
      )}
    </div>
  );
}

function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`pilotage-card p-5 ${className}`}>
      <h2 className="text-sm font-bold text-slate-900">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">{children}</div>;
}

function Contact({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-2 border-b border-slate-50 pb-1">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-800">{value ?? "—"}</dd>
    </div>
  );
}

function UrgencyList({ items }: { items: { label: string; tone: "red" | "amber" }[] }) {
  if (items.length === 0) return <p className="text-sm text-slate-500">Aucune urgence détectée.</p>;
  return (
    <ul className="space-y-2">
      {items.slice(0, 12).map((i, idx) => (
        <li
          key={idx}
          className={`rounded-lg px-3 py-2 text-sm ${i.tone === "red" ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-900"}`}
        >
          {i.label}
        </li>
      ))}
    </ul>
  );
}

function WorkSection({
  title,
  tone,
  children,
}: {
  title: string;
  tone: "red" | "amber" | "neutral";
  children: React.ReactNode;
}) {
  const border =
    tone === "red" ? "border-red-100" : tone === "amber" ? "border-amber-100" : "border-slate-100";
  return (
    <section className={`rounded-xl border ${border} p-3`}>
      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-600">{title}</h3>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}

function WorkRow({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-slate-100">
      <div className="min-w-0">
        <p className="font-semibold text-slate-900">{title}</p>
        {meta ? <p className="text-xs text-slate-500">{meta}</p> : null}
      </div>
      {children}
    </div>
  );
}

function Table({
  headers,
  rows,
  empty,
}: {
  headers: string[];
  rows: React.ReactNode[][];
  empty: string;
}) {
  if (rows.length === 0) {
    return <p className="mt-4 text-sm text-slate-500">{empty}</p>;
  }
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
            {headers.map((h) => (
              <th key={h} className="px-2 py-2 font-bold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-slate-50 align-top">
              {row.map((cell, j) => (
                <td key={j} className="px-2 py-2.5 text-slate-800">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
