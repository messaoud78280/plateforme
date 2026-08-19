"use client";

import { useEffect, useRef, useState } from "react";
import { HOME_SECTION } from "@/components/home/homeSectionStyles";
import { cn } from "@/lib/cn";

const SCENARIOS = [
  {
    id: "devis",
    label: "Devis accepté",
    color: "#2563eb",
    colorLight: "#eff6ff",
    colorBorder: "#bfdbfe",
    trigger: "Un devis est accepté",
    steps: [
      { label: "Chantier créé", desc: "Le dossier chantier est ouvert automatiquement." },
      { label: "Budget initialisé", desc: "Le budget est créé à partir du montant du devis." },
      { label: "Documents organisés", desc: "Les dossiers GED sont préparés et structurés." },
      { label: "Actions générées", desc: "Les premières tâches sont créées pour les équipes." },
      { label: "Équipe informée", desc: "Les collaborateurs concernés reçoivent une notification." },
    ],
  },
  {
    id: "commande",
    label: "Commande validée",
    color: "#d97706",
    colorLight: "#fffbeb",
    colorBorder: "#fde68a",
    trigger: "Une commande est validée",
    steps: [
      { label: "Bon de commande généré", desc: "Le BC est créé et prêt à être envoyé au fournisseur." },
      { label: "Fournisseur informé", desc: "Le fournisseur reçoit la commande par le canal prévu." },
      { label: "Montant engagé", desc: "Le montant est engagé sur le budget chantier." },
      { label: "Budget actualisé", desc: "Le suivi financier est mis à jour en temps réel." },
      { label: "Livraison suivie", desc: "La livraison attendue apparaît dans le planning." },
    ],
  },
  {
    id: "facture",
    label: "Facture reçue",
    color: "#7c3aed",
    colorLight: "#f5f3ff",
    colorBorder: "#ddd6fe",
    trigger: "Une facture fournisseur arrive",
    steps: [
      { label: "Document récupéré", desc: "La facture est capturée et numérisée." },
      { label: "Classée", desc: "Elle est rangée dans le dossier correspondant." },
      { label: "Rattachée au fournisseur", desc: "Le fournisseur est identifié et mis à jour." },
      { label: "Rattachée au chantier", desc: "La dépense est imputée sur le bon chantier." },
      { label: "Processus administratif déclenché", desc: "Le circuit de validation suit votre propre processus." },
    ],
  },
] as const;

const STEP_DELAY_MS = 600;
const STEP_PAUSE_MS = 3000;

export function HomeAutomations() {
  const [active, setActive] = useState<(typeof SCENARIOS)[number]["id"]>("devis");
  const [activeStep, setActiveStep] = useState(-1);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const current = SCENARIOS.find((s) => s.id === active) ?? SCENARIOS[0]!;

  function clearTimer() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function runSequence(stepIndex: number, steps: typeof current.steps) {
    if (stepIndex >= steps.length) {
      // Pause puis recommence
      timerRef.current = setTimeout(() => {
        setActiveStep(-1);
        timerRef.current = setTimeout(() => runSequence(0, steps), 400);
      }, STEP_PAUSE_MS);
      return;
    }
    setActiveStep(stepIndex);
    timerRef.current = setTimeout(() => runSequence(stepIndex + 1, steps), STEP_DELAY_MS);
  }

  useEffect(() => {
    clearTimer();
    setActiveStep(-1);
    setRunning(true);
    timerRef.current = setTimeout(() => runSequence(0, current.steps), 500);
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  function switchScenario(id: (typeof SCENARIOS)[number]["id"]) {
    clearTimer();
    setRunning(false);
    setActiveStep(-1);
    setActive(id);
  }

  return (
    <section id="automatisations" className={`${HOME_SECTION} bg-white`} aria-labelledby="auto-heading">
      <div className="container-site">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ea580c]">
            Automatisations
          </p>
          <h2
            id="auto-heading"
            className="font-display mt-3 text-balance text-[1.75rem] font-extrabold leading-[1.12] tracking-[-0.03em] text-[#0a0a0a] sm:text-[2.25rem] md:text-[2.75rem]"
          >
            Automatisez ce que vos équipes répètent tous les jours.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Lorsqu&apos;une action peut être automatisée de manière fiable, BeWork peut créer le processus
            correspondant.
          </p>
        </div>

        {/* Selector */}
        <div className="mt-10 flex flex-wrap justify-center gap-2 sm:mt-12" role="tablist">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={active === s.id}
              onClick={() => switchScenario(s.id)}
              className={cn(
                "rounded-xl border px-5 py-2.5 text-sm font-semibold transition-all duration-200",
                active === s.id
                  ? "shadow-sm scale-[1.02]"
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800",
              )}
              style={
                active === s.id
                  ? { background: s.colorLight, borderColor: s.colorBorder, color: s.color }
                  : undefined
              }
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Layout : Déclencheur + Workflow côte à côte sur desktop */}
        <div className="mx-auto mt-8 max-w-3xl sm:mt-10" key={current.id} aria-live="polite">
          <div className="grid gap-4 sm:grid-cols-[200px_1fr] sm:gap-6">

            {/* Déclencheur */}
            <div
              className="bework-sheen flex flex-col items-center justify-center rounded-2xl border p-5 text-center shadow-sm sm:flex-col"
              style={{ borderColor: current.colorBorder, background: current.colorLight }}
            >
              {/* Icône éclair */}
              <span
                className="mb-3 flex h-10 w-10 items-center justify-center rounded-full text-white text-lg shadow-sm"
                style={{ background: current.color }}
                aria-hidden
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </span>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: current.color }}>
                Déclencheur
              </p>
              <p className="font-display mt-1.5 text-sm font-extrabold leading-snug tracking-tight text-[#0a0a0a] sm:text-base">
                {current.trigger}
              </p>
              {/* Token de départ */}
              <div
                className="mt-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold"
                style={{ borderColor: `${current.color}40`, background: `${current.color}10`, color: current.color }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full motion-safe:animate-[hero-pulse_1.5s_ease-in-out_infinite]"
                  style={{ backgroundColor: current.color }}
                  aria-hidden
                />
                En cours
              </div>
            </div>

            {/* Étapes animées */}
            <div className="relative">
              {/* Ligne verticale de fond */}
              <div
                className="absolute left-[19px] top-4 bottom-4 w-0.5 rounded-full"
                style={{ background: `linear-gradient(to bottom, ${current.color}30, ${current.color}08)` }}
                aria-hidden
              />

              <ol className="space-y-2">
                {current.steps.map((step, i) => {
                  const isActive = activeStep >= i;
                  const isCurrent = activeStep === i;
                  return (
                    <li
                      key={step.label}
                      className={cn(
                        "flex items-start gap-3 transition-all duration-500",
                        isActive ? "opacity-100 translate-y-0" : "opacity-30 translate-y-1",
                      )}
                    >
                      {/* Cercle numéroté */}
                      <div
                        className={cn(
                          "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all duration-300",
                          isActive ? "text-white shadow-md" : "bg-slate-100 text-slate-400",
                        )}
                        style={isActive ? { background: current.color, boxShadow: isCurrent ? `0 0 0 3px ${current.color}30` : undefined } : undefined}
                        aria-hidden
                      >
                        {isActive ? (
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4"
                            aria-hidden
                          >
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        ) : (
                          i + 1
                        )}
                      </div>

                      {/* Carte contenu */}
                      <div
                        className={cn(
                          "bework-sheen min-w-0 flex-1 rounded-xl border px-4 py-3 transition-all duration-300",
                          isActive
                            ? "border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.07)]"
                            : "border-slate-100 bg-slate-50/50",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <p
                            className={cn(
                              "text-sm font-bold transition-colors",
                              isActive ? "text-[#0a0a0a]" : "text-slate-400",
                            )}
                          >
                            {step.label}
                          </p>
                          {isCurrent && (
                            <span
                              className="h-1.5 w-1.5 rounded-full motion-safe:animate-[hero-pulse_1s_ease-in-out_infinite]"
                              style={{ backgroundColor: current.color }}
                              aria-hidden
                            />
                          )}
                        </div>
                        <p
                          className={cn(
                            "mt-0.5 text-xs leading-relaxed transition-colors",
                            isActive ? "text-slate-500" : "text-slate-300",
                          )}
                        >
                          {step.desc}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </div>

        {/* Message sur-mesure */}
        <div className="bework-sheen mx-auto mt-10 max-w-3xl rounded-2xl border border-[#fed7aa] bg-gradient-to-r from-[#fff7ed] to-[#fffbeb] px-6 py-6 text-center sm:mt-12">
          <p className="text-base font-semibold text-[#0a0a0a]">
            Chaque entreprise fonctionne différemment.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Nous construisons les automatisations autour de{" "}
            <strong className="font-semibold text-[#0a0a0a]">vos propres processus</strong>, pas autour d&apos;un
            modèle générique.
          </p>
        </div>
      </div>
    </section>
  );
}
