"use client";

import { type JSX } from "react";
import { HomeClientSpacePreview } from "@/components/HomeClientSpacePreview";
import {
  BlueprintCotationProcessAmbient,
  BlueprintCotationProcessRail,
} from "@/components/home/BlueprintCotationDecor";

const BLUE = "#2563eb";
const fontSans = "var(--font-inter), ui-sans-serif, system-ui, sans-serif";

const STEPS: {
  n: number;
  title: string;
  body: string;
  Icon: () => JSX.Element;
}[] = [
  {
    n: 1,
    title: "Vous nous envoyez votre demande",
    body: "Via la plateforme : devis, dossier chantier, relance, fournisseur, document — un brief court suffit pour lancer le travail.",
    Icon: IconInbox,
  },
  {
    n: 2,
    title: "BeWork analyse et prépare le travail",
    body: "Qualification, pièces attendues, priorisation et répartition vers l’assistant travaux le plus aligné avec votre contexte BTP.",
    Icon: IconUserLink,
  },
  {
    n: 3,
    title: "L’assistant travaux augmenté par l’IA exécute ou pré-remplit",
    body: "Rédaction, relances, classement, pré-remplissage et suivi : le relais humain reste piloté, l’IA accélère tout ce qui est reproductible.",
    Icon: IconBriefcase,
  },
  {
    n: 4,
    title: "Vous validez uniquement l’essentiel",
    body: "Ce qui engage (prix, engagement, envoi sensible) passe par vous. Le reste est traité dans le cadre défini avec votre forfait.",
    Icon: IconCheckCircle,
  },
  {
    n: 5,
    title: "Votre activité devient plus fluide",
    body: "Moins de friction entre bureau et chantier : statuts visibles, pièces classées, relances qui avancent sans sacrifier le terrain.",
    Icon: IconChart,
  },
];

/** Section « Process BeWork » — parcours aligné sur la homepage */
export function HomeHowItWorksDetailSection() {
  return (
    <section
      id="process-bework"
      className="relative scroll-mt-28 bg-transparent pt-10 pb-12 md:pt-12 md:pb-14 lg:pt-14 lg:pb-16"
      style={{ fontFamily: fontSans }}
      aria-labelledby="how-detail-heading"
    >
      {/* Ancre héritée : anciens liens / signets #comment-ca-marche */}
      <span
        id="comment-ca-marche"
        className="pointer-events-none absolute left-0 top-0 block h-px w-px overflow-hidden opacity-0"
        aria-hidden
      />
      <BlueprintCotationProcessAmbient />
      <div className="container-site relative z-[2]">
        <header className="relative z-10 mx-auto mb-16 max-w-3xl text-center md:mb-20">
          <h2
            id="how-detail-heading"
            className="font-heading text-sm font-semibold uppercase tracking-[0.22em] md:text-base"
            style={{ color: BLUE }}
          >
            Process BeWork
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-800 md:mt-6 md:text-xl">
            Un seul parcours, du premier message à une organisation plus fluide — sans vous noyer dans l’administratif.
          </p>
          <p className="mx-auto mt-3 max-w-3xl text-base leading-relaxed text-slate-700">
            Vos Beworkers peuvent travailler avec vos outils existants : Excel, Google Sheets, Outlook, Gmail, Batigest, Onaya, EBP, Sage, MS Project,
            Drive, SharePoint, Chorus Pro, PLACE/AWS, ChatGPT et Claude.
          </p>
        </header>

        <div className="relative">
          <BlueprintCotationProcessRail className="inset-x-3 -top-5 h-12 md:inset-x-6 md:-top-6 md:h-14" />
          <div className="relative z-10 grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Timeline */}
          <div className="relative pl-0">
            <div className="absolute left-5 top-3 bottom-3 w-px bg-gradient-to-b from-slate-200 via-slate-200 to-slate-200/30" aria-hidden />

            <ol className="relative space-y-6 md:space-y-8">
              {STEPS.map((s) => (
                <li key={s.n} className="flex gap-3.5">
                  <div
                    className="relative z-[1] flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm shadow-blue-900/12"
                    style={{ backgroundColor: BLUE }}
                  >
                    {s.n}
                  </div>
                  <div className="min-w-0 flex-1 pt-px">
                    <div className="flex items-start gap-2">
                      <span className="mt-px shrink-0 [&_svg]:h-[17px] [&_svg]:w-[17px]" style={{ color: BLUE }} aria-hidden>
                        <s.Icon />
                      </span>
                      <h3 className="text-base font-semibold leading-snug text-slate-900 md:text-lg">{s.title}</h3>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-700 md:text-base">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <HomeClientSpacePreview />
          </div>
        </div>
      </div>
    </section>
  );
}

function IconInbox() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.85} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 12h-6l-2 3H10l-2-3H2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}

function IconUserLink() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.85} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx={9} cy={7} r={4} strokeLinecap="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 11h-4M20 9v4" />
    </svg>
  );
}

function IconBriefcase() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.85} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  );
}

function IconCheckCircle() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.85} aria-hidden>
      <circle cx={12} cy={12} r={9} />
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.85} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m7 12 4-4 4 8 5-10" />
    </svg>
  );
}
