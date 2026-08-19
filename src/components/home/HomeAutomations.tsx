"use client";

import { useState } from "react";
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

export function HomeAutomations() {
  const [active, setActive] = useState<(typeof SCENARIOS)[number]["id"]>("devis");
  const current = SCENARIOS.find((s) => s.id === active) ?? SCENARIOS[0]!;

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
        <div className="mt-10 flex flex-wrap justify-center gap-2 sm:mt-12">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActive(s.id)}
              className={cn(
                "rounded-lg border px-4 py-2 text-sm font-semibold transition-all duration-200",
                active === s.id
                  ? "shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
              )}
              style={
                active === s.id
                  ? {
                      background: s.colorLight,
                      borderColor: s.colorBorder,
                      color: s.color,
                    }
                  : undefined
              }
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Workflow visuel */}
        <div className="mx-auto mt-8 max-w-2xl" key={current.id} aria-live="polite">
          {/* Déclencheur */}
          <div
            className="rounded-xl border p-4 text-center shadow-sm"
            style={{ borderColor: current.colorBorder, background: current.colorLight }}
          >
            <p
              className="text-[11px] font-bold uppercase tracking-[0.16em]"
              style={{ color: current.color }}
            >
              Déclencheur
            </p>
            <p className="font-display mt-1 text-lg font-extrabold tracking-tight text-[#0a0a0a]">
              {current.trigger}
            </p>
          </div>

          {/* Flèche et étapes */}
          <div className="relative mt-1">
            {/* Ligne verticale */}
            <div
              className="absolute left-6 top-0 bottom-0 w-px"
              style={{ background: `linear-gradient(to bottom, ${current.color}40, ${current.color}10)` }}
              aria-hidden
            />

            <ol className="space-y-1 pt-2">
              {current.steps.map((step, i) => (
                <li key={step.label} className="flex items-start gap-4 pl-1">
                  {/* Connecteur */}
                  <div className="relative flex flex-col items-center" aria-hidden>
                    <div
                      className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold shadow-sm"
                      style={{ background: current.color }}
                    >
                      {i + 1}
                    </div>
                    {i < current.steps.length - 1 && (
                      <div
                        className="mt-1 h-1 w-px flex-1"
                        style={{ background: `${current.color}30` }}
                      />
                    )}
                  </div>

                  {/* Contenu */}
                  <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
                    <p className="text-sm font-bold text-[#0a0a0a]">↓ {step.label}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Message sur-mesure */}
        <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-[#fed7aa] bg-[#fff7ed] px-6 py-6 text-center sm:mt-12">
          <p className="text-base font-semibold text-[#0a0a0a]">
            Chaque entreprise fonctionne différemment.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Nous construisons les automatisations autour de <strong>vos propres processus</strong>, pas autour d&apos;un
            modèle générique.
          </p>
        </div>
      </div>
    </section>
  );
}
