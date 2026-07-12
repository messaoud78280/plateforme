"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  HealthPanel,
  MilestoneTimeline,
  ProgressRing,
} from "@/components/pilotage/PilotageCockpit";
import { ProgressBar, StatusBadge } from "@/components/pilotage/PilotageBadges";
import { ProspectContactForm } from "@/components/contact/ProspectContactForm";
import type { DemoPersonalization, DemoScenario } from "@/lib/demo-pilotage/types";
import { DEMO_INTEREST_OPTIONS, DEMO_TOUR_STEPS, DEMO_VALUE_TIPS } from "@/lib/demo-pilotage/token";

type TabId =
  | "vue"
  | "obligations"
  | "actions"
  | "plans"
  | "blocages"
  | "jalons"
  | "financier"
  | "doe"
  | "rapport"
  | "avant-apres"
  | "conclusion";

const TABS: { id: TabId; label: string }[] = [
  { id: "vue", label: "Vue d’ensemble" },
  { id: "obligations", label: "Obligations" },
  { id: "actions", label: "Actions" },
  { id: "plans", label: "Plans et visas" },
  { id: "blocages", label: "Blocages" },
  { id: "jalons", label: "Jalons" },
  { id: "financier", label: "Situations & TS" },
  { id: "doe", label: "DOE" },
  { id: "rapport", label: "Rapport" },
  { id: "avant-apres", label: "Organisation" },
  { id: "conclusion", label: "Suite" },
];

type SandboxState = {
  resolvedBlockers: string[];
  validatedDocs: string[];
  completedActions: string[];
};

const emptySandbox = (): SandboxState => ({
  resolvedBlockers: [],
  validatedDocs: [],
  completedActions: [],
});

export function DemoPilotageShell({
  scenario,
  personalization,
  mode,
  token,
  showTipsDefault = true,
  conclusionHref,
}: {
  scenario: DemoScenario;
  personalization?: DemoPersonalization | null;
  mode: "staff" | "prospect";
  token?: string;
  showTipsDefault?: boolean;
  conclusionHref?: string;
}) {
  const [tab, setTab] = useState<TabId>("vue");
  const [presentation, setPresentation] = useState(false);
  const [showTips, setShowTips] = useState(showTipsDefault);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [sandbox, setSandbox] = useState<SandboxState>(emptySandbox);
  const [interests, setInterests] = useState<string[]>([]);
  const [interestNote, setInterestNote] = useState("");
  const [interestSaved, setInterestSaved] = useState(false);
  const [sandboxMsg, setSandboxMsg] = useState<string | null>(null);

  const storageKey = token ? `bework-demo-sandbox-${token}` : `bework-demo-sandbox-${scenario.id}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setSandbox(JSON.parse(raw) as SandboxState);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  const persistSandbox = useCallback(
    (next: SandboxState) => {
      setSandbox(next);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    },
    [storageKey],
  );

  const resetSandbox = () => {
    persistSandbox(emptySandbox());
    setSandboxMsg("Démonstration réinitialisée (simulation locale uniquement).");
  };

  const companyLabel = personalization?.prospectCompany
    ? personalization.prospectCompany
    : scenario.clientName;

  const welcome = personalization?.prospectCompany
    ? `Voici comment BeWork pourrait organiser un chantier ${personalization.corpsEtat ?? scenario.lot.toLowerCase()} pour ${personalization.prospectCompany}.`
    : `Découvrez comment BeWork pilote un marché après attribution — données entièrement fictives.`;

  const health = useMemo(
    () => ({
      score: scenario.healthScore,
      label: scenario.healthLabel,
      reasons: scenario.healthReasons,
    }),
    [scenario],
  );

  const openBlockers = scenario.blockers.filter((b) => !sandbox.resolvedBlockers.includes(b.id));
  const tip = showTips ? DEMO_VALUE_TIPS[tab] : null;

  function flashSandbox(msg: string) {
    setSandboxMsg(msg);
    window.setTimeout(() => setSandboxMsg(null), 3500);
  }

  async function saveInterests() {
    if (!token) {
      setInterestSaved(true);
      return;
    }
    await fetch(`/api/demo-pilotage/${token}/interests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interests, interestNote }),
    });
    setInterestSaved(true);
  }

  useEffect(() => {
    if (!token) return;
    void fetch(`/api/demo-pilotage/${token}/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: tab }),
    }).catch(() => undefined);
  }, [token, tab]);

  const density = presentation ? "text-base" : "text-sm";

  return (
    <div className={`space-y-5 ${presentation ? "demo-presentation" : ""}`}>
      <div className="sticky top-0 z-30 border-b border-amber-200/80 bg-amber-50/95 px-4 py-2 text-center text-xs font-semibold text-amber-950 backdrop-blur">
        Démonstration BeWork — Données fictives
        {presentation ? " · Mode présentation" : ""}
        {mode === "prospect" ? " · Accès lecture seule sécurisé" : ""}
      </div>

      <header className="overflow-hidden rounded-[var(--cc-radius-lg)] border border-bework-navy/15 bg-gradient-to-br from-bework-navy via-[#243f66] to-bework-navy-deep p-6 text-white shadow-[var(--cc-shadow)]">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/60">
          {companyLabel} · {scenario.marketType}
        </p>
        <h1 className={`font-heading mt-1 font-bold tracking-tight ${presentation ? "text-3xl" : "text-2xl"}`}>
          {scenario.worksiteTitle}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/80">{welcome}</p>
        <p className="mt-1 text-xs text-white/55">
          {scenario.location} · {scenario.lot} · {scenario.amountHt} · {scenario.serviceLevel}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPresentation((v) => !v)}
            className="rounded-lg bg-white px-3.5 py-2 text-xs font-semibold text-bework-navy"
          >
            {presentation ? "Quitter la présentation" : "Activer le mode présentation"}
          </button>
          <button
            type="button"
            onClick={() => {
              setTourOpen(true);
              setTourStep(0);
              setTab("vue");
            }}
            className="rounded-lg border border-white/25 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/15"
          >
            Visite guidée
          </button>
          <button
            type="button"
            onClick={() => setShowTips((v) => !v)}
            className="rounded-lg border border-white/25 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/15"
          >
            {showTips ? "Masquer les explications" : "Afficher les explications"}
          </button>
          <button
            type="button"
            onClick={resetSandbox}
            className="rounded-lg border border-white/25 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/15"
          >
            Réinitialiser la démonstration
          </button>
          {conclusionHref ? (
            <Link
              href={conclusionHref}
              className="rounded-lg border border-white/25 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/15"
            >
              Conclusion commerciale
            </Link>
          ) : null}
        </div>
      </header>

      {sandboxMsg ? (
        <p className="rounded-[var(--cc-radius)] border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-medium text-emerald-900">
          {sandboxMsg}
        </p>
      ) : null}

      {tip ? (
        <aside className="rounded-[var(--cc-radius)] border border-bework-intel/25 bg-violet-50/70 px-4 py-3 text-sm text-violet-950">
          <p className="text-[10px] font-bold uppercase tracking-wider text-bework-intel">Valeur BeWork</p>
          <p className="mt-1 leading-relaxed">{tip}</p>
        </aside>
      ) : null}

      <nav
        className={`flex gap-1 overflow-x-auto rounded-xl border border-bework-navy/10 bg-white p-1.5 shadow-sm ${
          presentation ? "sticky top-10 z-20" : ""
        }`}
        aria-label="Rubriques démonstration"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap ${
              tab === t.id
                ? "bg-bework-navy text-white shadow-sm"
                : "text-bework-ink/80 hover:bg-bework-navy-soft hover:text-bework-navy"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "vue" && (
        <div className={`grid gap-4 lg:grid-cols-3 ${density}`}>
          <div className="space-y-4 lg:col-span-2">
            <section className="pilotage-card p-5">
              <h2 className="text-sm font-bold text-slate-900">À traiter aujourd’hui</h2>
              <ul className="mt-3 space-y-2">
                {scenario.actions
                  .filter((a) => a.overdue || a.dueLabel.includes("Aujourd"))
                  .map((a) => (
                    <li
                      key={a.id}
                      className={`rounded-lg px-3 py-2 text-sm ${
                        a.overdue ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-900"
                      }`}
                    >
                      {a.title}
                    </li>
                  ))}
              </ul>
            </section>
            <section className="pilotage-card p-5">
              <h2 className="text-sm font-bold text-slate-900">Blocages principaux</h2>
              <ul className="mt-3 space-y-2">
                {openBlockers.map((b) => (
                  <li key={b.id} className="flex justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    <span className="font-semibold">{b.title}</span>
                    <StatusBadge status={b.severity} />
                  </li>
                ))}
                {openBlockers.length === 0 ? (
                  <li className="text-sm text-slate-500">Aucun blocage ouvert (simulation).</li>
                ) : null}
              </ul>
            </section>
          </div>
          <div className="space-y-4">
            <HealthPanel health={health} />
            <section className="pilotage-card p-4">
              <ProgressRing value={scenario.adminProgressPct} label="Admin" />
              <div className="mt-3">
                <ProgressBar value={scenario.doeProgressPct} label="DOE" />
              </div>
            </section>
            <section className="pilotage-card p-4">
              <h2 className="text-sm font-bold text-slate-900">Jalons</h2>
              <div className="mt-3">
                <MilestoneTimeline
                  milestones={scenario.milestones.map((m) => ({
                    id: m.id,
                    title: m.title,
                    status: m.status,
                    plannedAt: null,
                    sortOrder: m.sortOrder,
                  }))}
                />
              </div>
            </section>
            <section className="pilotage-card p-4 text-sm">
              <h2 className="text-sm font-bold text-slate-900">Contacts (fictifs)</h2>
              <dl className="mt-2 space-y-1 text-slate-600">
                <div>Conducteur : {scenario.actors.conducteur}</div>
                <div>Assistant BeWork : {scenario.actors.assistant}</div>
                <div>MOA : {scenario.actors.moa}</div>
                <div>MOE : {scenario.actors.moe}</div>
              </dl>
            </section>
          </div>
        </div>
      )}

      {tab === "obligations" && (
        <DemoTable
          headers={["Obligation", "Priorité", "Échéance", "Statut", "Responsable"]}
          rows={scenario.obligations.map((o) => [o.title, o.priority, o.dueLabel, o.status, o.responsible])}
        />
      )}

      {tab === "actions" && (
        <section className="pilotage-card p-5">
          <p className="mb-3 text-xs text-slate-500">
            Essayer la méthode BeWork — simulation locale uniquement. Aucune donnée réelle n’est modifiée.
          </p>
          <ul className="space-y-2">
            {scenario.actions.map((a) => {
              const done = sandbox.completedActions.includes(a.id);
              return (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2">
                  <div>
                    <p className={`text-sm font-semibold ${done ? "text-slate-400 line-through" : "text-slate-900"}`}>
                      {a.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {a.dueLabel}
                      {a.overdue && !done ? " · En retard" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={done ? "Terminée" : a.status} />
                    {!done ? (
                      <button
                        type="button"
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800"
                        onClick={() => {
                          persistSandbox({
                            ...sandbox,
                            completedActions: [...sandbox.completedActions, a.id],
                          });
                          flashSandbox("Cette action est une simulation et ne modifie aucune donnée réelle.");
                        }}
                      >
                        Simuler clôture
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {tab === "plans" && (
        <DemoTable
          headers={["Réf.", "Titre", "Indice", "Visa", "Statut"]}
          rows={scenario.plans.map((p) => [
            p.reference,
            p.title,
            p.indice,
            p.visaDueLabel,
            p.overdue ? "En retard" : p.status,
          ])}
        />
      )}

      {tab === "blocages" && (
        <div className="grid gap-3 md:grid-cols-2">
          {scenario.blockers.map((b) => {
            const resolved = sandbox.resolvedBlockers.includes(b.id);
            return (
              <article
                key={b.id}
                className={`pilotage-card border p-4 ${
                  b.severity === "Critique" ? "border-red-200" : "border-orange-200"
                } ${resolved ? "opacity-60" : ""}`}
              >
                <div className="flex justify-between gap-2">
                  <p className="font-semibold text-slate-900">{b.title}</p>
                  <StatusBadge status={resolved ? "Résolu" : b.severity} />
                </div>
                <p className="mt-2 text-sm text-slate-700">{b.consequence}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Jalon : {b.impactedMilestone} · {b.daysOpen} j · {b.nextAction}
                </p>
                {!resolved ? (
                  <button
                    type="button"
                    className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800"
                    onClick={() => {
                      persistSandbox({
                        ...sandbox,
                        resolvedBlockers: [...sandbox.resolvedBlockers, b.id],
                      });
                      flashSandbox("Cette action est une simulation et ne modifie aucune donnée réelle.");
                    }}
                  >
                    Simuler résolution
                  </button>
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      {tab === "jalons" && (
        <section className="pilotage-card p-5">
          <MilestoneTimeline
            milestones={scenario.milestones.map((m) => ({
              id: m.id,
              title: m.title,
              status: m.status,
              plannedAt: null,
              sortOrder: m.sortOrder,
            }))}
          />
          <ul className="mt-4 space-y-2 text-sm">
            {scenario.milestones.map((m) => (
              <li key={m.id} className="flex justify-between border-b border-slate-50 pb-2">
                <span>{m.title}</span>
                <span className="text-xs text-slate-500">
                  {m.plannedLabel} · {m.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === "financier" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <DemoTable
            headers={["N°", "Période", "Demandé", "Validé", "Payé", "Statut"]}
            rows={scenario.situations.map((s) => [
              s.number,
              s.periodLabel,
              s.requestedHt,
              s.validatedHt,
              s.paidHt,
              s.status,
            ])}
          />
          <DemoTable
            headers={["Réf.", "Description", "HT", "Validation", "Statut"]}
            rows={scenario.extraWorks.map((e) => [
              e.reference,
              e.description,
              e.estimatedHt,
              e.writtenValidation ? "Oui" : e.startedWithoutValidation ? "Non — alerte" : "Non",
              e.status,
            ])}
          />
        </div>
      )}

      {tab === "doe" && (
        <section className="pilotage-card p-5">
          <ProgressBar value={scenario.doeProgressPct} label="Complétude DOE (fictif)" />
          <ul className="mt-4 space-y-2">
            {scenario.doeItems.map((d) => {
              const validated = sandbox.validatedDocs.includes(d.id);
              return (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-50 py-2 text-sm">
                  <span>{d.title}</span>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={validated ? "Conforme" : d.status} />
                    {!validated && d.status !== "Conforme" ? (
                      <button
                        type="button"
                        className="rounded-lg border px-2 py-1 text-[11px] font-semibold text-bework-navy"
                        onClick={() => {
                          persistSandbox({
                            ...sandbox,
                            validatedDocs: [...sandbox.validatedDocs, d.id],
                          });
                          flashSandbox("Cette action est une simulation et ne modifie aucune donnée réelle.");
                        }}
                      >
                        Simuler validation
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {tab === "rapport" && (
        <section className="pilotage-card p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">DOCUMENT FICTIF — DÉMONSTRATION</p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">{scenario.report.title}</h2>
          <p className="text-xs text-slate-500">{scenario.report.periodLabel}</p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-700">
            {scenario.report.summary.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      )}

      {tab === "avant-apres" && <DemoBeforeAfter />}

      {tab === "conclusion" && (
        <div className="space-y-6">
          <section className="pilotage-card p-6">
            <h2 className="text-xl font-bold text-slate-900">Ce que BeWork peut prendre en charge pour votre entreprise</h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2 text-sm text-slate-700">
              {[
                "Mise en route du marché",
                "Analyse des obligations",
                "Suivi documentaire",
                "Suivi des plans et visas",
                "Actions et relances",
                "Blocages",
                "Sous-traitants",
                "Situations",
                "Travaux supplémentaires",
                "DOE",
                "Rapport hebdomadaire",
              ].map((item) => (
                <li key={item} className="rounded-lg bg-slate-50 px-3 py-2">
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              BeWork ne fournit pas seulement un logiciel. BeWork met en place une méthode de pilotage et peut prendre en
              charge son fonctionnement quotidien.
            </p>
          </section>

          <section className="pilotage-card p-6">
            <h3 className="text-sm font-bold text-slate-900">Services qui vous intéressent</h3>
            <p className="mt-1 text-xs text-slate-500">
              Vos choix sont enregistrés pour le suivi commercial BeWork, sans créer de contrat automatiquement.
              {mode === "prospect"
                ? " Des statistiques de consultation (sections visités) peuvent être enregistrées pour améliorer le rendez-vous."
                : ""}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {DEMO_INTEREST_OPTIONS.map((opt) => {
                const on = interests.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      setInterests((prev) => (on ? prev.filter((x) => x !== opt.id) : [...prev, opt.id]))
                    }
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${
                      on
                        ? "bg-bework-navy text-white ring-bework-navy"
                        : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <label className="mt-4 block text-xs font-semibold text-slate-600">
              Quel point vous ferait gagner le plus de temps aujourd’hui ?
              <textarea
                value={interestNote}
                onChange={(e) => setInterestNote(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal"
              />
            </label>
            <button
              type="button"
              onClick={() => void saveInterests()}
              className="mt-3 rounded-lg bg-bework-navy px-4 py-2 text-xs font-semibold text-white"
            >
              Enregistrer mon intérêt
            </button>
            {interestSaved ? (
              <p className="mt-2 text-xs font-medium text-emerald-700">Merci — retour enregistré.</p>
            ) : null}
          </section>

          <section className="pilotage-card p-6">
            <h3 className="text-sm font-bold text-slate-900">Proposition de prochaine étape</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li>· Tester BeWork sur un appel d’offres</li>
              <li>· Tester BeWork sur un chantier déjà obtenu</li>
              <li>· Organiser un audit de votre méthode actuelle</li>
              <li>· Mettre en place un pilote sur deux semaines</li>
            </ul>
            <div className="mt-6">
              <h4 className="mb-3 text-sm font-bold text-slate-900">Demander une proposition</h4>
              <ProspectContactForm source="demo_pilotage_travaux" variant="compact" />
            </div>
          </section>
        </div>
      )}

      {tourOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
            <p className="text-[10px] font-bold uppercase tracking-wider text-bework-navy">
              Visite guidée · {tourStep + 1}/{DEMO_TOUR_STEPS.length}
            </p>
            <h3 className="mt-1 text-lg font-bold text-slate-900">{DEMO_TOUR_STEPS[tourStep]?.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{DEMO_TOUR_STEPS[tourStep]?.text}</p>
            <div className="mt-5 flex flex-wrap justify-between gap-2">
              <button
                type="button"
                className="rounded-lg border px-3 py-2 text-xs font-semibold text-slate-600"
                onClick={() => setTourOpen(false)}
              >
                Quitter
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={tourStep === 0}
                  className="rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-40"
                  onClick={() => {
                    const prev = Math.max(0, tourStep - 1);
                    setTourStep(prev);
                    syncTourTab(prev, setTab);
                  }}
                >
                  Précédent
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-bework-navy px-3 py-2 text-xs font-semibold text-white"
                  onClick={() => {
                    if (tourStep >= DEMO_TOUR_STEPS.length - 1) {
                      setTourOpen(false);
                      setTab("conclusion");
                      return;
                    }
                    const next = tourStep + 1;
                    setTourStep(next);
                    syncTourTab(next, setTab);
                  }}
                >
                  {tourStep >= DEMO_TOUR_STEPS.length - 1 ? "Terminer" : "Suivant"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function syncTourTab(step: number, setTab: (t: TabId) => void) {
  const map: TabId[] = [
    "vue",
    "obligations",
    "actions",
    "plans",
    "blocages",
    "jalons",
    "financier",
    "doe",
    "rapport",
    "conclusion",
  ];
  setTab(map[step] ?? "vue");
}

function DemoTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <section className="pilotage-card overflow-x-auto p-0">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-slate-50/50">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 text-slate-800">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function DemoBeforeAfter() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <h2 className="text-sm font-bold text-slate-800">Organisation actuelle</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          <li>· Documents dispersés</li>
          <li>· Informations dans les emails</li>
          <li>· Relances peu tracées</li>
          <li>· Visas parfois oubliés</li>
          <li>· DOE préparé trop tard</li>
          <li>· Travaux supplémentaires mal suivis</li>
          <li>· Conducteurs surchargés</li>
        </ul>
      </section>
      <section className="rounded-2xl border border-bework-navy/20 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-bework-navy">Organisation avec BeWork</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          <li>· Obligations centralisées</li>
          <li>· Responsables affectés</li>
          <li>· Échéances suivies</li>
          <li>· Blocages visibles</li>
          <li>· Relances tracées</li>
          <li>· Preuves conservées</li>
          <li>· DOE préparé progressivement</li>
          <li>· Synthèse hebdomadaire disponible</li>
        </ul>
      </section>
    </div>
  );
}
