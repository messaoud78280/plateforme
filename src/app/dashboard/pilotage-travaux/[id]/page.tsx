import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/ui/BackLink";
import { ProgressBar, StatusBadge } from "@/components/pilotage/PilotageBadges";
import {
  ActionStatusButtons,
  DoeStatusSelect,
  GenerateReportButton,
  QuickAddAction,
  QuickAddExtraWork,
  QuickAddMarketDoc,
  QuickAddObligation,
  QuickAddPlan,
  QuickAddRequiredDoc,
  QuickAddSituation,
  QuickAddSubcontractor,
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
} from "@/lib/pilotage/calculations";
import { DETAIL_TABS, PILOTAGE_LIST_PATH, type DetailTabId } from "@/lib/pilotage/constants";
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
  const tab = (DETAIL_TABS.some((t) => t.id === tabRaw) ? tabRaw : "vue") as DetailTabId;
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

  const hrefTab = (t: string) => `${PILOTAGE_LIST_PATH}/${id}?onglet=${t}`;

  return (
    <div className="space-y-5">
      <BackLink href={PILOTAGE_LIST_PATH}>Pilotage travaux</BackLink>

      <header className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{pilotage.project.title}</h1>
              <StatusBadge status={pilotage.status} />
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {pilotage.project.client.company ?? pilotage.project.client.name}
              {pilotage.lot ? ` · ${pilotage.lot}` : ""}
              {pilotage.internalRef ? ` · Réf. ${pilotage.internalRef}` : ""}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Conducteur : {pilotage.conducteur?.name ?? "—"} · Assistant : {pilotage.assistant?.name ?? "—"} ·{" "}
              {formatDateFr(pilotage.startDate)} → {formatDateFr(pilotage.plannedEndDate)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={hrefTab("actions")}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
            >
              Ajouter une action
            </Link>
            <Link
              href={hrefTab("pieces")}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
            >
              Ajouter un document
            </Link>
            <GenerateReportButton pilotageId={id} />
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          <MiniStat label="Retards" value={overdueActions.length} danger={overdueActions.length > 0} />
          <MiniStat label="Docs manquants" value={missingDocs.length} warn={missingDocs.length > 0} />
          <MiniStat label="Obligations ouvertes" value={openObligations.length} />
          <MiniStat label="Visas" value={visas.length} warn={visas.length > 0} />
          <MiniStat label="ST incomplets" value={incompleteSt.length} warn={incompleteSt.length > 0} />
          <MiniStat label="Situations" value={situationsTodo.length} />
          <MiniStat label="TS sans validation" value={tsAlert.length} danger={tsAlert.length > 0} />
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <ProgressBar value={doe.pct} label="DOE" />
          </div>
        </div>
      </header>

      <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm">
        {DETAIL_TABS.map((t) => (
          <Link
            key={t.id}
            href={hrefTab(t.id)}
            className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold whitespace-nowrap ${
              tab === t.id ? "bg-[#1e3a5f] text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "vue" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Urgences">
            <UrgencyList
              items={[
                ...overdueActions.map((a) => ({ label: `Retard action : ${a.title}`, tone: "red" as const })),
                ...tsAlert.map((e) => ({
                  label: `Travaux commencés sans validation écrite : ${e.reference ?? e.description.slice(0, 60)}`,
                  tone: "red" as const,
                })),
                ...visas.filter((p) => isOverdue(p.visaDueDate, p.status)).map((p) => ({
                  label: `Visa en retard : ${p.reference}`,
                  tone: "amber" as const,
                })),
                ...pilotage.actions
                  .filter((a) => isActionOpen(a.status) && isDueWithinDays(a.dueDate, 7) && !isOverdue(a.dueDate, a.status))
                  .map((a) => ({ label: `Échéance < 7 j : ${a.title}`, tone: "amber" as const })),
              ]}
            />
          </Card>
          <Card title="Prochaines échéances">
            <ul className="space-y-2 text-sm">
              {[
                ...pilotage.actions.filter((a) => a.dueDate && isActionOpen(a.status)),
                ...pilotage.obligations.filter((o) => o.dueDate && !["Validée", "Non applicable"].includes(o.status)),
                ...pilotage.requiredDocuments.filter((d) => d.dueDate && isDocMissing(d.status)),
              ]
                .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
                .slice(0, 15)
                .map((item) => (
                  <li key={item.id} className="flex justify-between gap-2 border-b border-slate-50 pb-2">
                    <span className="truncate">{"title" in item ? item.title : "name" in item ? item.name : "—"}</span>
                    <span className="shrink-0 text-xs text-slate-500">{formatDateFr(item.dueDate)}</span>
                  </li>
                ))}
              {pilotage.actions.length === 0 && pilotage.obligations.length === 0 ? (
                <li className="text-slate-500">Aucune échéance planifiée.</li>
              ) : null}
            </ul>
          </Card>
          <Card title="Progression">
            <div className="grid gap-4 sm:grid-cols-2">
              <ProgressBar value={pilotage.adminProgressPct} label="Administratif" />
              <ProgressBar value={doe.pct} label="DOE" />
              <p className="text-xs text-slate-600">Obligations : {pilotage.obligations.length}</p>
              <p className="text-xs text-slate-600">Documents : {pilotage.requiredDocuments.length}</p>
              <p className="text-xs text-slate-600">Plans : {pilotage.plans.length}</p>
              <p className="text-xs text-slate-600">Sous-traitants : {pilotage.subcontractors.length}</p>
            </div>
          </Card>
          <Card title="Contacts">
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
          <Card title="Dernières activités" className="lg:col-span-2">
            <ul className="space-y-2 text-sm">
              {pilotage.activities.length === 0 ? (
                <li className="text-slate-500">Aucune activité pour le moment.</li>
              ) : (
                pilotage.activities.slice(0, 12).map((a) => (
                  <li key={a.id} className="flex flex-wrap gap-2 border-b border-slate-50 pb-2">
                    <span className="text-xs text-slate-400">{formatDateFr(a.createdAt)}</span>
                    <span className="font-semibold text-slate-800">{a.actionType}</span>
                    <span className="text-slate-600">{a.entityLabel ?? a.comment ?? ""}</span>
                    <span className="text-xs text-slate-400">{a.userName ?? ""}</span>
                  </li>
                ))
              )}
            </ul>
          </Card>
        </div>
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
            empty="Aucun document à remettre n’a encore été ajouté. Ajoutez manuellement un document ou utilisez un modèle de checklist."
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
            empty="Aucun sous-traitant. L’alerte dossier incomplet est administrative uniquement."
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
            empty="Aucune situation. Suivi administratif du réalisé / demandé / validé / payé."
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
            empty="Aucun élément DOE. Préparez le DOE dès le démarrage du chantier."
          />
        </Panel>
      )}

      {tab === "rapports" && (
        <Panel>
          <GenerateReportButton pilotageId={id} />
          <ul className="mt-4 space-y-2">
            {pilotage.reports.length === 0 ? (
              <li className="text-sm text-slate-500">Aucun rapport archivé. Générez un rapport à partir des données réelles.</li>
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
  danger,
  warn,
}: {
  label: string;
  value: number;
  danger?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`text-lg font-bold ${danger ? "text-red-700" : warn ? "text-amber-700" : "text-slate-900"}`}>{value}</p>
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
    <section className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ${className}`}>
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
          className={`rounded-lg px-3 py-2 text-sm ${
            i.tone === "red" ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-900"
          }`}
        >
          {i.label}
        </li>
      ))}
    </ul>
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
