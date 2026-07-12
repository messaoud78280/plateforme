import Link from "next/link";
import { StatusBadge } from "@/components/pilotage/PilotageBadges";
import {
  EnsureHandoverButton,
  QuickAddDelayEvent,
  QuickAddEmbeddedElement,
  QuickAddLesson,
  QuickAddMeeting,
  QuickAddNonConformity,
  QuickAddPhoto,
  QuickAddPricingAssumption,
  QuickAddSensitiveDeadline,
  QuickAddSensitiveWork,
  QuickAddTimelineEvent,
  QuickAddTradeInterface,
} from "@/components/pilotage/PilotageSecurisationForms";
import { ContractRiskPanel } from "@/components/pilotage/PilotageCockpit";
import { formatDateFr } from "@/lib/pilotage/calculations";
import {
  METHODE_HUB_LINKS,
  PILOTAGE_LIST_PATH,
  SECURISATION_HUB_LINKS,
} from "@/lib/pilotage/constants";
import {
  CONTEXTUAL_QUESTIONS,
  TRADE_RISK_LIBRARY,
  TRAINING_NOTIONS,
} from "@/lib/pilotage/methodLibrary";
import type { ContractRiskResult } from "@/lib/pilotage/contractRisk";
import type { ConsistencyIssue } from "@/lib/pilotage/consistency";
import type { DataQualityIssue } from "@/lib/pilotage/dataQuality";

function Card({ title, children, hint }: { title: string; children: React.ReactNode; hint?: string }) {
  return (
    <section className="pilotage-card p-4">
      <h2 className="text-sm font-bold text-[#1e3a5f]">{title}</h2>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function HubGrid({
  pilotageId,
  links,
}: {
  pilotageId: string;
  links: readonly { id: string; label: string; hint: string }[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {links.map((l) => (
        <Link
          key={l.id}
          href={`${PILOTAGE_LIST_PATH}/${pilotageId}?onglet=${l.id}`}
          className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-[#1e3a5f]/30 hover:shadow-sm"
        >
          <p className="text-sm font-bold text-slate-900">{l.label}</p>
          <p className="mt-1 text-xs text-slate-500">{l.hint}</p>
        </Link>
      ))}
    </div>
  );
}

type Deadline = {
  id: string;
  title: string;
  deadlineType: string;
  dueAt: Date | null;
  status: string;
  confirmationLevel: string;
  responsibleName: string | null;
  sourceType: string;
  priority: string;
};

type Assumption = {
  id: string;
  title: string;
  category: string;
  lot: string | null;
  assumedValue: string | null;
  verificationStatus: string;
  realityObserved: string | null;
  gapSummary: string | null;
  impactCost: string | null;
  impactDelay: string | null;
};

type Handover = {
  id: string;
  title: string;
  status: string;
  items: { id: string; title: string; category: string; transmitted: boolean; validated: boolean }[];
};

type TradeIface = {
  id: string;
  primaryLot: string;
  relatedLot: string;
  subject: string;
  status: string;
  whoSupplies: string | null;
  whoInstalls: string | null;
  riskLevel: string;
};

type Embedded = {
  id: string;
  title: string;
  elementType: string;
  status: string;
  pourAt: Date | null;
  zone: string | null;
  requestingLot: string | null;
  executingLot: string | null;
};

type SensWork = {
  id: string;
  title: string;
  lot: string | null;
  status: string;
  sensitivityLevel: string;
  plannedAt: Date | null;
};

type NC = {
  id: string;
  description: string;
  severity: string;
  status: string;
  lot: string | null;
  dueAt: Date | null;
};

type Delay = {
  id: string;
  title: string;
  causeCategory: string;
  presumedOrigin: string | null;
  status: string;
  confirmationLevel: string;
  startedAt: Date | null;
};

type Timeline = {
  id: string;
  title: string;
  eventType: string;
  occurredAt: Date;
  confirmationLevel: string;
  actorInternal: string | null;
  actorExternal: string | null;
};

type Meeting = {
  id: string;
  title: string;
  meetingType: string;
  status: string;
  scheduledAt: Date | null;
};

type Photo = {
  id: string;
  title: string | null;
  category: string;
  fileUrl: string;
  zone: string | null;
  takenAt: Date | null;
};

type Lesson = {
  id: string;
  title: string;
  validationStatus: string;
  lot: string | null;
  recommendation: string | null;
};

export function PilotageAdvancedTabs({
  tab,
  pilotageId,
  canEdit,
  contractRisk,
  consistencyIssues,
  qualityIssues,
  deadlines,
  assumptions,
  handovers,
  tradeInterfaces,
  embeddedElements,
  sensitiveWorks,
  nonConformities,
  delayEvents,
  timelineEvents,
  meetings,
  photos,
  lessons,
  openBlockersCount,
  tsAlertCount,
}: {
  tab: string;
  pilotageId: string;
  canEdit: boolean;
  contractRisk: ContractRiskResult;
  consistencyIssues: ConsistencyIssue[];
  qualityIssues: DataQualityIssue[];
  deadlines: Deadline[];
  assumptions: Assumption[];
  handovers: Handover[];
  tradeInterfaces: TradeIface[];
  embeddedElements: Embedded[];
  sensitiveWorks: SensWork[];
  nonConformities: NC[];
  delayEvents: Delay[];
  timelineEvents: Timeline[];
  meetings: Meeting[];
  photos: Photo[];
  lessons: Lesson[];
  openBlockersCount: number;
  tsAlertCount: number;
}) {
  const soon = new Date();
  soon.setDate(soon.getDate() + 7);
  const unconfirmedReservations = embeddedElements.filter(
    (e) =>
      e.pourAt &&
      e.pourAt <= soon &&
      !["Validée", "Réalisée", "Contrôlée", "Clôturée", "Non applicable"].includes(e.status),
  );

  if (tab === "securisation") {
    return (
      <div className="space-y-4">
        <ContractRiskPanel risk={contractRisk} href={`${PILOTAGE_LIST_PATH}/${pilotageId}?onglet=qualite`} />
        <Card title="Synthèse sécurisation" hint="Indicateurs d’aide au pilotage — validation humaine requise.">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Mini label="Échéances à vérifier" value={deadlines.filter((d) => d.status === "À vérifier").length} />
            <Mini label="Retards ouverts" value={delayEvents.filter((d) => !["Clôturé", "Résolu"].includes(d.status)).length} />
            <Mini label="NC ouvertes" value={nonConformities.filter((n) => !["Clôturée", "Corrigée"].includes(n.status)).length} />
            <Mini label="TS / blocages critiques" value={tsAlertCount + openBlockersCount} />
          </div>
        </Card>
        {consistencyIssues.length > 0 ? (
          <Card title="Contrôles de cohérence" hint="Alertes non bloquantes — justification possible.">
            <ul className="space-y-2">
              {consistencyIssues.slice(0, 8).map((i) => (
                <li key={`${i.code}-${i.entityId}`} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={i.severity} />
                    <span className="font-semibold text-slate-900">{i.title}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{i.explanation}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{i.entityLabel}</p>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
        <HubGrid pilotageId={pilotageId} links={SECURISATION_HUB_LINKS} />
      </div>
    );
  }

  if (tab === "methode") {
    return (
      <div className="space-y-4">
        <Card
          title="Méthode BeWork"
          hint="Passation, interfaces, ouvrages sensibles et capitalisation — propositions à confirmer."
        >
          <p className="text-sm text-slate-600">
            Structurez la transmission études → travaux, les responsabilités entre lots et les preuves avant fermeture
            d’ouvrage.
          </p>
        </Card>
        <HubGrid pilotageId={pilotageId} links={METHODE_HUB_LINKS} />
        <Card title="Risques types par lot (bibliothèque)" hint="Recommandations à confirmer sur le chantier.">
          <ul className="space-y-2">
            {TRADE_RISK_LIBRARY.slice(0, 6).map((r) => (
              <li key={r.title} className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={r.severity} />
                  <span className="text-xs text-slate-500">{r.lot}</span>
                </div>
                <p className="mt-1 font-semibold text-slate-900">{r.title}</p>
                <p className="text-xs text-slate-600">{r.prevention}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    );
  }

  if (tab === "echeances") {
    return (
      <div className="space-y-4">
        <Card
          title="Échéances sensibles"
          hint="Échéance contractuelle potentielle détectée. Vérification humaine nécessaire."
        >
          <QuickAddSensitiveDeadline pilotageId={pilotageId} canEdit={canEdit} />
          <ul className="mt-4 space-y-2">
            {deadlines.length === 0 ? (
              <li className="text-sm text-slate-500">Aucune échéance sensible enregistrée.</li>
            ) : (
              deadlines.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <div>
                    <p className="font-semibold text-slate-900">{d.title}</p>
                    <p className="text-xs text-slate-500">
                      {d.deadlineType} · {formatDateFr(d.dueAt)} · {d.responsibleName ?? "Sans responsable"} ·{" "}
                      {d.sourceType}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <StatusBadge status={d.status} />
                    <StatusBadge status={d.confirmationLevel} />
                  </div>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>
    );
  }

  if (tab === "hypotheses") {
    const invalidated = assumptions.filter((a) => a.verificationStatus === "Différente de la réalité");
    const confirmed = assumptions.filter((a) => a.verificationStatus === "Confirmée");
    return (
      <div className="space-y-4">
        <Card title="Hypothèses vs réalité chantier">
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <Mini label="Confirmées" value={confirmed.length} />
            <Mini label="Invalidées" value={invalidated.length} />
            <Mini label="À vérifier" value={assumptions.filter((a) => a.verificationStatus === "À vérifier" || a.verificationStatus === "Hypothèse d’étude").length} />
          </div>
          <QuickAddPricingAssumption pilotageId={pilotageId} canEdit={canEdit} />
          <ul className="mt-4 space-y-2">
            {assumptions.length === 0 ? (
              <li className="text-sm text-slate-500">Aucune hypothèse de chiffrage enregistrée.</li>
            ) : (
              assumptions.map((a) => (
                <li key={a.id} className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900">{a.title}</p>
                    <StatusBadge status={a.verificationStatus} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {a.category}
                    {a.lot ? ` · ${a.lot}` : ""} · Retenu : {a.assumedValue ?? "—"}
                  </p>
                  {a.realityObserved ? (
                    <p className="mt-1 text-xs text-slate-700">Réalité : {a.realityObserved}</p>
                  ) : null}
                  {a.gapSummary || a.impactCost || a.impactDelay ? (
                    <p className="mt-1 text-xs text-amber-800">
                      Écart / impact : {[a.gapSummary, a.impactCost, a.impactDelay].filter(Boolean).join(" · ")}
                    </p>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>
    );
  }

  if (tab === "passation") {
    const handover = handovers[0];
    return (
      <div className="space-y-4">
        <Card
          title="Passation du marché"
          hint="Transmettre au service travaux les informations utiles issues de l’étude et de la négociation."
        >
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <EnsureHandoverButton pilotageId={pilotageId} canEdit={canEdit} />
            {handover ? <StatusBadge status={handover.status} /> : null}
          </div>
          {!handover ? (
            <p className="text-sm text-slate-500">Initialisez la checklist de passation pour démarrer le workflow.</p>
          ) : (
            <ul className="space-y-2">
              {handover.items.map((it) => (
                <li key={it.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <div>
                    <p className="font-semibold text-slate-900">{it.title}</p>
                    <p className="text-xs text-slate-500">{it.category}</p>
                  </div>
                  <div className="flex gap-2 text-[11px] font-semibold">
                    <span className={it.transmitted ? "text-emerald-700" : "text-slate-400"}>
                      {it.transmitted ? "Transmis" : "Non transmis"}
                    </span>
                    <span className={it.validated ? "text-emerald-700" : "text-slate-400"}>
                      {it.validated ? "Validé" : "À valider"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-slate-500">
            Workflow : À préparer → Préparée → Présentée → Questions ouvertes → Validée → Clôturée. Prévoir réunion et
            compte rendu.
          </p>
        </Card>
      </div>
    );
  }

  if (tab === "interfaces") {
    return (
      <div className="space-y-4">
        <Card title="Interfaces entre lots" hint="Responsabilités à la frontière entre corps d’état.">
          <QuickAddTradeInterface pilotageId={pilotageId} canEdit={canEdit} />
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="text-[10px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-2 py-2">Lot A</th>
                  <th className="px-2 py-2">Lot B</th>
                  <th className="px-2 py-2">Sujet</th>
                  <th className="px-2 py-2">Fournit</th>
                  <th className="px-2 py-2">Pose</th>
                  <th className="px-2 py-2">Statut</th>
                </tr>
              </thead>
              <tbody>
                {tradeInterfaces.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-2 py-3 text-slate-500">
                      Aucune interface enregistrée.
                    </td>
                  </tr>
                ) : (
                  tradeInterfaces.map((t) => (
                    <tr key={t.id} className="border-t border-slate-100">
                      <td className="px-2 py-2 font-semibold">{t.primaryLot}</td>
                      <td className="px-2 py-2">{t.relatedLot}</td>
                      <td className="px-2 py-2">{t.subject}</td>
                      <td className="px-2 py-2">{t.whoSupplies ?? "—"}</td>
                      <td className="px-2 py-2">{t.whoInstalls ?? "—"}</td>
                      <td className="px-2 py-2">
                        <StatusBadge status={t.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  if (tab === "reservations") {
    return (
      <div className="space-y-4">
        {unconfirmedReservations.length > 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            Coulage ou fermeture prévu prochainement : {unconfirmedReservations.length} réservation(s) non confirmée(s).
          </div>
        ) : null}
        <Card
          title="Réservations et incorporations"
          hint="Ne jamais déclarer automatiquement qu’un ouvrage est techniquement conforme."
        >
          <QuickAddEmbeddedElement pilotageId={pilotageId} canEdit={canEdit} />
          <ul className="mt-4 space-y-2">
            {embeddedElements.length === 0 ? (
              <li className="text-sm text-slate-500">Aucune réservation enregistrée.</li>
            ) : (
              embeddedElements.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {e.title} <span className="font-normal text-slate-500">({e.elementType})</span>
                    </p>
                    <p className="text-xs text-slate-500">
                      {e.requestingLot ?? "—"} → {e.executingLot ?? "—"} · {e.zone ?? "Sans zone"} · Coulage{" "}
                      {formatDateFr(e.pourAt)}
                    </p>
                  </div>
                  <StatusBadge status={e.status} />
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>
    );
  }

  if (tab === "ouvrages") {
    return (
      <div className="space-y-4">
        <Card
          title="Ouvrages sensibles"
          hint="Statut « Conforme selon les éléments enregistrés » — pas de conformité réglementaire automatique."
        >
          <QuickAddSensitiveWork pilotageId={pilotageId} canEdit={canEdit} />
          <ul className="mt-4 space-y-2">
            {sensitiveWorks.length === 0 ? (
              <li className="text-sm text-slate-500">Aucun ouvrage sensible suivi.</li>
            ) : (
              sensitiveWorks.map((w) => (
                <li key={w.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <div>
                    <p className="font-semibold text-slate-900">{w.title}</p>
                    <p className="text-xs text-slate-500">
                      {w.lot ?? "Sans lot"} · Prévu {formatDateFr(w.plannedAt)} · Sensibilité {w.sensitivityLevel}
                    </p>
                  </div>
                  <StatusBadge status={w.status} />
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>
    );
  }

  if (tab === "nc") {
    return (
      <div className="space-y-4">
        <Card title="Non-conformités">
          <QuickAddNonConformity pilotageId={pilotageId} canEdit={canEdit} />
          <ul className="mt-4 space-y-2">
            {nonConformities.length === 0 ? (
              <li className="text-sm text-slate-500">Aucune non-conformité enregistrée.</li>
            ) : (
              nonConformities.map((n) => (
                <li key={n.id} className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={n.severity} />
                    <StatusBadge status={n.status} />
                  </div>
                  <p className="mt-1 font-semibold text-slate-900">{n.description}</p>
                  <p className="text-xs text-slate-500">
                    {n.lot ?? "Sans lot"} · Échéance {formatDateFr(n.dueAt)}
                  </p>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>
    );
  }

  if (tab === "retards") {
    return (
      <div className="space-y-4">
        <Card
          title="Retards et événements perturbateurs"
          hint="Origine enregistrée / supposée — pas d’attribution juridique automatique."
        >
          <QuickAddDelayEvent pilotageId={pilotageId} canEdit={canEdit} />
          <ul className="mt-4 space-y-2">
            {delayEvents.length === 0 ? (
              <li className="text-sm text-slate-500">Aucun retard enregistré.</li>
            ) : (
              delayEvents.map((d) => (
                <li key={d.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900">{d.title}</p>
                    <StatusBadge status={d.status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Origine enregistrée : {d.causeCategory}
                    {d.presumedOrigin ? ` — ${d.presumedOrigin}` : ""} · {formatDateFr(d.startedAt)} ·{" "}
                    {d.confirmationLevel}
                  </p>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>
    );
  }

  if (tab === "chronologie") {
    return (
      <div className="space-y-4">
        <Card title="Chronologie des faits" hint="Synthèse factuelle à valider avant usage dans un courrier.">
          <QuickAddTimelineEvent pilotageId={pilotageId} canEdit={canEdit} />
          <ol className="mt-4 space-y-3 border-l-2 border-[#1e3a5f]/20 pl-4">
            {timelineEvents.length === 0 ? (
              <li className="text-sm text-slate-500">Aucun fait chronologique enregistré.</li>
            ) : (
              timelineEvents.map((e) => (
                <li key={e.id} className="relative text-sm">
                  <span className="absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full bg-[#1e3a5f]" />
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    {formatDateFr(e.occurredAt)} · {e.eventType}
                  </p>
                  <p className="font-semibold text-slate-900">{e.title}</p>
                  <p className="text-xs text-slate-500">
                    {[e.actorInternal, e.actorExternal].filter(Boolean).join(" / ") || "—"} · {e.confirmationLevel}
                  </p>
                </li>
              ))
            )}
          </ol>
        </Card>
      </div>
    );
  }

  if (tab === "qualite") {
    return (
      <div className="space-y-4">
        <Card title="Qualité des données" hint={`${qualityIssues.length} anomalie(s) détectée(s).`}>
          <ul className="space-y-2">
            {qualityIssues.length === 0 ? (
              <li className="text-sm text-emerald-700">Aucune anomalie structurelle majeure détectée.</li>
            ) : (
              qualityIssues.slice(0, 40).map((q) => (
                <li key={`${q.code}-${q.entityId}`} className="flex flex-wrap items-start justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <div>
                    <p className="font-semibold text-slate-900">{q.title}</p>
                    <p className="text-xs text-slate-600">{q.entityLabel}</p>
                    <p className="mt-1 text-xs text-[#1e3a5f]">{q.fixHint}</p>
                  </div>
                  <StatusBadge status={q.priority} />
                </li>
              ))
            )}
          </ul>
        </Card>
        <Card title="Cohérence">
          <ul className="space-y-2">
            {consistencyIssues.length === 0 ? (
              <li className="text-sm text-emerald-700">Aucun écart de cohérence détecté.</li>
            ) : (
              consistencyIssues.map((i) => (
                <li key={`${i.code}-${i.entityId}`} className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
                  <StatusBadge status={i.severity} />
                  <p className="mt-1 font-semibold">{i.title}</p>
                  <p className="text-xs text-slate-600">{i.explanation}</p>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>
    );
  }

  if (tab === "reunions") {
    return (
      <div className="space-y-4">
        <Card title="Préparer la réunion">
          <QuickAddMeeting pilotageId={pilotageId} canEdit={canEdit} />
          <ul className="mt-4 space-y-2">
            {meetings.length === 0 ? (
              <li className="text-sm text-slate-500">Aucune réunion préparée.</li>
            ) : (
              meetings.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <div>
                    <p className="font-semibold">{m.title}</p>
                    <p className="text-xs text-slate-500">
                      {m.meetingType} · {formatDateFr(m.scheduledAt)}
                    </p>
                  </div>
                  <StatusBadge status={m.status} />
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>
    );
  }

  if (tab === "photos") {
    return (
      <div className="space-y-4">
        <Card title="Photos documentées">
          <QuickAddPhoto pilotageId={pilotageId} canEdit={canEdit} />
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {photos.length === 0 ? (
              <li className="text-sm text-slate-500">Aucune photo documentée.</li>
            ) : (
              photos.map((p) => (
                <li key={p.id} className="rounded-xl border border-slate-100 p-3 text-sm">
                  <p className="font-semibold">{p.title ?? p.category}</p>
                  <p className="text-xs text-slate-500">
                    {p.category} · {p.zone ?? "Sans zone"} · {formatDateFr(p.takenAt)}
                  </p>
                  <a href={p.fileUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold text-[#1e3a5f] hover:underline">
                    Ouvrir le fichier
                  </a>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>
    );
  }

  if (tab === "rex") {
    return (
      <div className="space-y-4">
        <Card
          title="Retour d’expérience"
          hint="Brouillon par défaut — enrichissement des modèles uniquement après validation responsable."
        >
          <QuickAddLesson pilotageId={pilotageId} canEdit={canEdit} />
          <ul className="mt-4 space-y-2">
            {lessons.length === 0 ? (
              <li className="text-sm text-slate-500">Aucun enseignement capitalisé.</li>
            ) : (
              lessons.map((l) => (
                <li key={l.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={l.validationStatus} />
                    {l.lot ? <span className="text-xs text-slate-500">{l.lot}</span> : null}
                  </div>
                  <p className="mt-1 font-semibold">{l.title}</p>
                  {l.recommendation ? <p className="text-xs text-slate-600">{l.recommendation}</p> : null}
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>
    );
  }

  if (tab === "formation") {
    return (
      <div className="space-y-4">
        <Card title="Mode formation" hint="Aide pédagogique contextuelle — activable sans surcharger le pilotage.">
          <div className="grid gap-3 lg:grid-cols-2">
            {TRAINING_NOTIONS.map((n) => (
              <article key={n.id} className="rounded-xl border border-slate-100 p-3">
                <h3 className="text-sm font-bold text-[#1e3a5f]">{n.title}</h3>
                <p className="mt-1 text-xs text-slate-700">{n.definition}</p>
                <p className="mt-2 text-[11px] text-slate-500">
                  <span className="font-semibold">Utilité :</span> {n.utility}
                </p>
                <p className="mt-1 text-[11px] text-amber-800">
                  <span className="font-semibold">Erreur fréquente :</span> {n.frequentError}
                </p>
                <p className="mt-1 text-[11px] text-slate-600">
                  <span className="font-semibold">Vigilance :</span> {n.vigilance}
                </p>
              </article>
            ))}
          </div>
        </Card>
        <Card title="Questions intelligentes">
          <ul className="grid gap-2 sm:grid-cols-2">
            {CONTEXTUAL_QUESTIONS.map((q) => (
              <li key={q.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{q.context}</span>
                <p className="mt-0.5">{q.text}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    );
  }

  return null;
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums text-[#1e3a5f]">{value}</p>
    </div>
  );
}
