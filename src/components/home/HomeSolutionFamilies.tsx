"use client";

import { useState } from "react";
import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import { HOME_BG_SOFT, HOME_CONTENT, HOME_SECTION } from "@/components/home/homeSectionStyles";
import { cn } from "@/lib/cn";

const FAMILIES = [
  {
    id: "apps",
    label: "Applications métier",
    title: "Applications métier IA",
    desc: "Des outils internes dédiés à un besoin précis de votre entreprise — conçus autour de vos méthodes de travail.",
  },
  {
    id: "agents",
    label: "Agents IA",
    title: "Agents IA métier",
    desc: "Assistants capables, selon les autorisations, d'analyser, rechercher, préparer, structurer ou proposer certaines actions.",
  },
  {
    id: "auto",
    label: "Automatisations",
    title: "Automatisations intelligentes",
    desc: "Transformer des opérations répétitives en workflows adaptés — lorsque c'est fiable et utile.",
  },
  {
    id: "docs",
    label: "Documents",
    title: "Analyse documentaire",
    desc: "Exploiter CCTP, CCAP, RC, DCE, contrats, devis, CR, DOE, réserves et autres documents métier.",
  },
  {
    id: "search",
    label: "Recherche",
    title: "Recherche intelligente",
    desc: "Retrouver rapidement une information dans les corpus documentaires et données autorisées de l'entreprise.",
  },
  {
    id: "assist",
    label: "Assistants",
    title: "Assistants internes",
    desc: "Assistants spécialisés autour des informations et procédures de votre organisation.",
  },
  {
    id: "integ",
    label: "Intégrations",
    title: "Intégrations",
    desc: "Connecter l'IA à vos logiciels existants lorsque leurs interfaces, droits et architecture le permettent — à étudier au cas par cas.",
  },
  {
    id: "pilot",
    label: "Pilotage",
    title: "Outils de pilotage",
    desc: "Transformer l'information en alertes, actions, priorités ou vues de suivi.",
  },
  {
    id: "voice",
    label: "Voix",
    title: "Solutions vocales",
    desc: "Notes chantier, comptes rendus, extraction d'informations — lorsque la voix apporte vraiment un gain.",
  },
  {
    id: "vision",
    label: "Visuel",
    title: "Analyse visuelle",
    desc: "Analyse d'images lorsque le cas d'usage, la précision attendue et la technologie le permettent.",
  },
  {
    id: "platform",
    label: "Plateformes",
    title: "Plateformes métier",
    desc: "Environnements complets comme la plateforme BeWork — équipes, chantiers, documents et processus réunis.",
  },
] as const;

/** Familles de solutions — sélecteur progressif, pas une grille de cartes. */
export function HomeSolutionFamilies() {
  const [active, setActive] = useState<(typeof FAMILIES)[number]["id"]>("apps");
  const current = FAMILIES.find((f) => f.id === active) ?? FAMILIES[0]!;

  return (
    <section id="solutions" className={`${HOME_SECTION} ${HOME_BG_SOFT}`} aria-labelledby="solutions-heading">
      <div className="container-site">
        <HomeSectionHeader
          id="solutions-heading"
          title="L'IA là où elle est réellement utile."
          lead="Pas une IA générique posée à côté de votre entreprise. Des outils conçus autour de vos documents, vos métiers et vos processus."
        />

        <div className={`${HOME_CONTENT} mx-auto max-w-4xl`}>
          <div
            className="flex flex-wrap justify-center gap-x-1 gap-y-1 border-b border-slate-200 pb-1"
            role="tablist"
            aria-label="Familles de solutions"
          >
            {FAMILIES.map((f) => {
              const selected = f.id === active;
              return (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActive(f.id)}
                  className={cn(
                    "relative px-3 py-2.5 text-sm font-semibold transition",
                    selected ? "text-[#0a0a0a]" : "text-slate-500 hover:text-[#0a0a0a]",
                  )}
                >
                  {f.label}
                  {selected ? (
                    <span className="absolute inset-x-2 -bottom-px h-0.5 bg-[#0a0a0a]" aria-hidden />
                  ) : null}
                </button>
              );
            })}
          </div>

          <div role="tabpanel" className="mt-10 max-w-2xl sm:mt-12" aria-live="polite">
            <h3 className="font-display text-2xl font-extrabold tracking-tight text-[#0a0a0a] sm:text-3xl">
              {current.title}
            </h3>
            <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">{current.desc}</p>
            <p className="mt-6 text-sm text-slate-500">
              Chaque projet est étudié : faisabilité, données, sécurité, autorisations, intégrations et architecture
              adaptée.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
