import type { Metadata } from "next";
import Link from "next/link";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { BwAtmosphere } from "@/components/home/BwAtmosphere";
import {
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
    <div className="min-h-screen bg-transparent">
      <MarketingSiteHeader plainBg />

      <main>
        <section className={`${HOME_SECTION} relative overflow-hidden`}>
          <BwAtmosphere variant="hero" />
          <div className="relative z-[1] mx-auto max-w-site px-5 sm:px-6">
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

        <section className={`${HOME_SECTION} relative overflow-hidden`} aria-labelledby="journee-heading">
          <BwAtmosphere variant="timeline" />
          <div className="relative z-[1] mx-auto max-w-site px-5 sm:px-6">
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
                <li key={step.title} className={`${HOME_CARD} p-5`}>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8190A8]">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-[#0B0D12]">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#42526B]">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className={`${HOME_SECTION} relative overflow-hidden`} aria-labelledby="inclus-heading">
          <BwAtmosphere variant="formation" />
          <div className="relative z-[1] mx-auto max-w-site px-5 sm:px-6">
            <div className={HOME_HEADER}>
              <p className={HOME_EYEBROW}>Inclus</p>
              <h2 id="inclus-heading" className={HOME_H2}>
                Ce que comprend la journée
              </h2>
            </div>
            <ul className={`${HOME_CONTENT} mx-auto grid max-w-3xl gap-3 sm:grid-cols-2`}>
              {FORMATION_INCLUDES.map((line) => (
                <li key={line} className={`${HOME_CARD} px-4 py-3 text-sm font-semibold text-[#42526B]`}>
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={`${HOME_SECTION} relative overflow-hidden`} aria-labelledby="groupes-heading">
          <BwAtmosphere variant="reassurance" />
          <div className="relative z-[1] mx-auto max-w-site px-5 sm:px-6">
            <div className={HOME_HEADER}>
              <p className={HOME_EYEBROW}>Petit groupe</p>
              <h2 id="groupes-heading" className={HOME_H2}>
                Une formation pratique, pas un amphithéâtre
              </h2>
              <p className={HOME_LEAD}>
                L’objectif : expérimenter, poser des questions, avancer sur vos idées.
              </p>
            </div>
          </div>
        </section>

        <section className={`${HOME_SECTION} relative overflow-hidden`} aria-labelledby="faq-snippet">
          <BwAtmosphere variant="reassurance" />
          <div className="relative z-[1] mx-auto max-w-site px-5 sm:px-6">
            <div className={HOME_HEADER}>
              <p className={HOME_EYEBROW}>FAQ</p>
              <h2 id="faq-snippet" className={HOME_H2}>
                Questions fréquentes
              </h2>
            </div>
            <dl className={`${HOME_CONTENT} mx-auto max-w-3xl space-y-3`}>
              {faqSnippet.map((item) => (
                <div key={item.q} className={`${HOME_CARD} p-5`}>
                  <dt className="font-semibold text-[#0B0D12]">{item.q}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-[#42526B]">{item.a}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-8 text-center">
              <Link href="/faq" className={CTA_SECONDARY}>
                Voir toute la FAQ
              </Link>
            </div>
          </div>
        </section>

        <section className={`${HOME_SECTION} relative overflow-hidden`}>
          <BwAtmosphere variant="cta" />
          <div className="relative z-[1] mx-auto max-w-site px-5 text-center sm:px-6">
            <h2 className={HOME_H2}>Prêt à commencer&nbsp;?</h2>
            <p className={`${HOME_LEAD} mx-auto`}>
              Demandez une place pour la prochaine journée BeWork.
            </p>
            <div className={`mt-8 ${CTA_GROUP} justify-center`}>
              <Link href="/contact#participer" className={CTA_PRIMARY}>
                Demander une place
              </Link>
              <Link href="/demonstrations" className={CTA_SECONDARY}>
                Voir les démonstrations
              </Link>
            </div>
          </div>
        </section>
      </main>
      <MarketingSiteFooter />
    </div>
  );
}
