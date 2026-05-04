"use client";

import { type JSX } from "react";
import { HomeClientSpacePreview } from "@/components/HomeClientSpacePreview";

const BLUE = "#2563eb";
const fontSans = "var(--font-inter), var(--font-geist-sans), system-ui, sans-serif";

const STEPS: {
  n: number;
  title: string;
  body: string;
  Icon: () => JSX.Element;
}[] = [
  {
    n: 1,
    title: "Vous déposez votre demande",
    body: "Décrivez votre besoin en quelques clics : devis, dossier, relance ou coordination.",
    Icon: IconInbox,
  },
  {
    n: 2,
    title: "Votre référent analyse et attribue",
    body: "Il qualifie la demande et la confie au profil le plus adapté à votre contexte BTP.",
    Icon: IconUserLink,
  },
  {
    n: 3,
    title: "Le Beworker traite la mission",
    body: "Rédaction, relances, classement et suivi : l’équipe exécute dans le cadre de votre forfait.",
    Icon: IconBriefcase,
  },
  {
    n: 4,
    title: "Vous validez avant envoi",
    body: "Les éléments sensibles passent par votre relecture avant envoi au client ou au fournisseur.",
    Icon: IconCheckCircle,
  },
  {
    n: 5,
    title: "Suivi et décompte des crédits",
    body: "Statuts visibles à chaque étape et transparence sur la consommation de vos crédits.",
    Icon: IconChart,
  },
];

/** Section « Comment ça marche en détail » — landing premium, sous Solution */
export function HomeHowItWorksDetailSection() {
  return (
    <section
      id="comment-ca-marche"
      className="relative scroll-mt-24 bg-transparent pt-10 pb-12 md:pt-12 md:pb-14 lg:pt-14 lg:pb-16"
      style={{ fontFamily: fontSans, scrollMarginTop: "6rem" }}
      aria-labelledby="how-detail-heading"
    >
      <div className="container-site relative z-[1]">
        <header className="mx-auto mb-16 max-w-3xl text-center md:mb-20">
          <h2
            id="how-detail-heading"
            className="text-[13px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: BLUE }}
          >
            Comment ça marche en détail
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed text-slate-600 md:mt-6 md:text-lg">
            De la demande à la livraison, BeWork structure, suit et sécurise chaque étape pour vous faire gagner du temps.
          </p>
        </header>

        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
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
                      <h3 className="text-[15px] font-semibold leading-snug text-slate-900 md:text-base">{s.title}</h3>
                    </div>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600 md:text-[14px]">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <HomeClientSpacePreview />
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
