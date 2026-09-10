import type { Metadata } from "next";
import Link from "next/link";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import {
  HOME_BG_SOFT,
  HOME_BG_WHITE,
  HOME_CARD,
  HOME_CONTENT,
  HOME_EYEBROW,
  HOME_H2,
  HOME_HEADER,
  HOME_LEAD,
  HOME_SECTION,
} from "@/components/home/homeSectionStyles";
import { CTA_GROUP, CTA_PRIMARY, CTA_SECONDARY } from "@/components/marketing/marketingCtaStyles";
import {
  BEWORK_FORMATION_TAGLINE,
  BEWORK_SESSION_PRICE_EUR,
  FORMATION_DAY_STEPS,
  FORMATION_FAQ,
  FORMATION_INCLUDES,
} from "@/lib/bework-formation";
import { absoluteUrl } from "@/lib/site";

const PATH = "/formation" as const;
const pageUrl = absoluteUrl(PATH);

export const metadata: Metadata = {
  title: "Formation — Créer avec l’intelligence artificielle",
  description:
    "Formation pratique BeWork : apprenez à créer sites, applications et outils numériques avec l’IA, sans prérequis en programmation. Une journée, petits groupes.",
  alternates: { canonical: pageUrl },
  openGraph: {
    title: "Formation BeWork — Créer avec l’IA",
    description: BEWORK_FORMATION_TAGLINE,
    url: pageUrl,
    type: "website",
  },
};

export default function FormationPage() {
  const faqSnippet = FORMATION_FAQ.slice(0, 4);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <MarketingSiteHeader plainBg />

      <main>
        <section className={`${HOME_SECTION} ${HOME_BG_WHITE}`}>
          <div className="mx-auto max-w-site px-5 sm:px-6">
            <div className={HOME_HEADER}>
              <p className={HOME_EYEBROW}>La formation</p>
              <h1 className={HOME_H2}>Apprenez à créer avec l&apos;intelligence artificielle</h1>
              <p className={HOME_LEAD}>{BEWORK_FORMATION_TAGLINE}</p>
              <div className={`mt-8 ${CTA_GROUP} justify-center`}>
                <Link href="/contact#participer" className={CTA_PRIMARY}>
                  Participer — {BEWORK_SESSION_PRICE_EUR}&nbsp;€
                </Link>
                <Link href="/demonstrations" className={CTA_SECONDARY}>
                  Voir les démonstrations
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className={`${HOME_SECTION} ${HOME_BG_SOFT}`} aria-labelledby="journee-heading">
          <div className="mx-auto max-w-site px-5 sm:px-6">
            <div className={HOME_HEADER}>
              <p className={HOME_EYEBROW}>Déroulé</p>
              <h2 id="journee-heading" className={HOME_H2}>
                Une journée structurée
              </h2>
              <p className={HOME_LEAD}>
                Comprendre, préparer, construire, améliorer — et repartir avec une méthode réutilisable.
              </p>
            </div>
            <ol className={`${HOME_CONTENT} grid list-none gap-4 sm:grid-cols-2 lg:grid-cols-3`}>
              {FORMATION_DAY_STEPS.map((step, i) => (
                <li key={step.title} className={`${HOME_CARD} p-6`}>
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1d4ed8] text-sm font-bold text-white"
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-[#0f172a]">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className={`${HOME_SECTION} ${HOME_BG_WHITE}`} aria-labelledby="inclus-heading">
          <div className="mx-auto max-w-site px-5 sm:px-6">
            <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2 lg:items-start">
              <div>
                <p className={HOME_EYEBROW}>Inclus</p>
                <h2 id="inclus-heading" className="mt-3 text-2xl font-bold tracking-tight text-[#0f172a] sm:text-3xl">
                  Ce que vous vivez pendant la session
                </h2>
                <ul className="mt-6 space-y-3">
                  {FORMATION_INCLUDES.map((item) => (
                    <li key={item} className="flex gap-2 text-base text-slate-700">
                      <span className="text-[#1d4ed8]" aria-hidden>
                        •
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`${HOME_CARD} border-2 border-[#1d4ed8]/15 bg-[#eff6ff]/40 p-8 text-center`}>
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#1d4ed8]">Tarif session</p>
                <p className="mt-3 text-5xl font-extrabold tracking-tight text-[#0f172a]">
                  {BEWORK_SESSION_PRICE_EUR}&nbsp;€
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  Une journée complète, en petit groupe. Pas d&apos;abonnement logiciel sur cette offre.
                </p>
                <Link href="/contact#participer" className={`${CTA_PRIMARY} mt-6 inline-flex`}>
                  Je souhaite participer
                </Link>
                <p className="mt-4 text-xs text-slate-500">
                  <Link href="/tarifs" className="font-medium text-[#1d4ed8] hover:underline">
                    Voir la page tarifs
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className={`${HOME_SECTION} ${HOME_BG_SOFT}`} aria-labelledby="groupes-heading">
          <div className="mx-auto max-w-3xl px-5 text-center sm:px-6">
            <p className={HOME_EYEBROW}>Petits groupes</p>
            <h2 id="groupes-heading" className={HOME_H2}>
              Un format pensé pour pratiquer
            </h2>
            <p className={`${HOME_LEAD} mx-auto`}>
              Les sessions se déroulent en petit groupe pour que chacun puisse poser des questions, expérimenter et
              avancer sur des exemples concrets — y compris des idées liées à votre activité.
            </p>
          </div>
        </section>

        <section className={`${HOME_SECTION} ${HOME_BG_WHITE}`} aria-labelledby="faq-snippet">
          <div className="mx-auto max-w-3xl px-5 sm:px-6">
            <div className={HOME_HEADER}>
              <p className={HOME_EYEBROW}>Questions fréquentes</p>
              <h2 id="faq-snippet" className={HOME_H2}>
                Avant de vous inscrire
              </h2>
            </div>
            <dl className={`${HOME_CONTENT} space-y-4`}>
              {faqSnippet.map((item) => (
                <div key={item.q} className={`${HOME_CARD} p-6`}>
                  <dt className="text-base font-semibold text-[#0f172a]">{item.q}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-slate-600">{item.a}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-8 text-center">
              <Link href="/faq" className="text-sm font-semibold text-[#1d4ed8] hover:underline">
                Voir toute la FAQ →
              </Link>
            </p>
          </div>
        </section>

        <section className={`${HOME_SECTION} ${HOME_BG_SOFT}`}>
          <div className="mx-auto max-w-2xl px-5 text-center sm:px-6">
            <h2 className="text-2xl font-bold text-[#0f172a] sm:text-3xl">Prêt à participer&nbsp;?</h2>
            <p className="mt-3 text-base text-slate-600">
              Indiquez-nous votre activité et ce que vous aimeriez créer. Nous vous recontactons pour les prochaines
              sessions.
            </p>
            <div className={`mt-8 ${CTA_GROUP} justify-center`}>
              <Link href="/contact#participer" className={CTA_PRIMARY}>
                Participer
              </Link>
              <Link href="/pour-qui" className={CTA_SECONDARY}>
                Pour qui ?
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingSiteFooter />
    </div>
  );
}
