"use client";

import { useState } from "react";
import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import { HOME_BG_SOFT, HOME_CONTENT, HOME_SECTION } from "@/components/home/homeSectionStyles";
import { cn } from "@/lib/cn";

const MODULES = [
  {
    id: "chantiers",
    label: "Chantiers",
    title: "Chantiers et affaires",
    desc: "Suivez chaque dossier : contexte, documents, responsabilités et historique au même endroit.",
    preview: ["Résidence Horizon", "Lot étanchéité", "7 actions ouvertes"],
  },
  {
    id: "documents",
    label: "Documents",
    title: "Documents et GED",
    desc: "Plans, CCTP, CR et pièces DOE classés, recherchables et liés au chantier.",
    preview: ["CCTP v3", "Plan EXE", "Notices manquantes"],
  },
  {
    id: "messagerie",
    label: "Messagerie",
    title: "Messagerie chantier",
    desc: "Échanges internes et externes rattachés à l'affaire — plus de fils WhatsApp orphelins.",
    preview: ["Canal Point.P", "Équipe chantier", "2 non lus"],
  },
  {
    id: "planning",
    label: "Planning",
    title: "Planning ressources",
    desc: "Qui est affecté, sur quel chantier, et ce qui reste à organiser.",
    preview: ["Vue équipe", "Sans affectation", "Conflits"],
  },
  {
    id: "marches",
    label: "Marchés",
    title: "Marchés et consultations",
    desc: "Classer, analyser et suivre les dossiers de consultation — publics ou privés.",
    preview: ["DCE reçu", "Analyse en cours", "Go / No Go"],
  },
  {
    id: "achats",
    label: "Achats",
    title: "Achats et fournisseurs",
    desc: "Commandes, livraisons et suivi fournisseur reliés au chantier.",
    preview: ["BC membrane", "Livraison 11/08", "Point.P"],
  },
  {
    id: "ia",
    label: "IA",
    title: "IA documentaire",
    desc: "Lire, synthétiser, détecter et proposer des actions — validées par vos équipes.",
    preview: ["Synthèse CCTP", "Risques", "Actions"],
  },
  {
    id: "reserves",
    label: "Réserves",
    title: "Réserves",
    desc: "Suivi des réserves, levées et recontrôles jusqu'à la réception.",
    preview: ["Réserve façade", "À recontrôler", "PV"],
  },
  {
    id: "doe",
    label: "DOE",
    title: "DOE",
    desc: "Pièces attendues, manquantes, relances — pour ne pas bloquer le solde.",
    preview: ["Notices", "Manquant", "Relance"],
  },
] as const;

/** Composez votre BeWork — sélecteur, pas grille de cartes. */
export function HomeModulesGrid() {
  const [active, setActive] = useState<(typeof MODULES)[number]["id"]>("chantiers");
  const current = MODULES.find((m) => m.id === active) ?? MODULES[0]!;

  return (
    <section id="modules" className={`${HOME_SECTION} ${HOME_BG_SOFT}`} aria-labelledby="modules-heading">
      <div className="container-site">
        <HomeSectionHeader
          id="modules-heading"
          eyebrow="Offre plateforme"
          title="Composez votre environnement BeWork."
          lead="Une des façons de travailler avec nous : assembler les modules autour de votre organisation."
        />

        <div className={`${HOME_CONTENT} mx-auto max-w-4xl`}>
          <div
            className="flex flex-wrap justify-center gap-x-1 gap-y-1 border-b border-slate-200 pb-1"
            role="tablist"
            aria-label="Modules BeWork"
          >
            {MODULES.map((m) => {
              const selected = m.id === active;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActive(m.id)}
                  className={cn(
                    "relative px-3 py-2.5 text-sm font-semibold transition",
                    selected ? "text-[#0a0a0a]" : "text-slate-500 hover:text-[#0a0a0a]",
                  )}
                >
                  {m.label}
                  {selected ? (
                    <span className="absolute inset-x-2 -bottom-px h-0.5 bg-[#0a0a0a]" aria-hidden />
                  ) : null}
                </button>
              );
            })}
          </div>

          <div
            role="tabpanel"
            className="mt-8 grid gap-8 sm:mt-10 sm:grid-cols-[1.15fr_0.85fr] sm:items-start sm:gap-12"
          >
            <div>
              <h3 className="font-display text-2xl font-extrabold tracking-tight text-[#0a0a0a]">{current.title}</h3>
              <p className="mt-3 max-w-md text-base leading-relaxed text-slate-600">{current.desc}</p>
            </div>
            <div aria-live="polite">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Dans BeWork</p>
              <ul className="mt-3 space-y-3 border-l border-slate-200 pl-4">
                {current.preview.map((line) => (
                  <li key={line} className="text-sm font-medium text-slate-800">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
