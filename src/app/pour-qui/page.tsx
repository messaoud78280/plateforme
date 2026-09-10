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
import { AUDIENCE_PROFILES, METIER_IDEAS } from "@/lib/bework-formation";
import { absoluteUrl } from "@/lib/site";

const PATH = "/pour-qui" as const;
const pageUrl = absoluteUrl(PATH);

export const metadata: Metadata = {
  title: "Pour qui ? — Formation création avec l’IA",
  description:
    "Entrepreneurs, artisans, indépendants, TPE/PME, porteurs de projet : à qui s’adresse la formation BeWork pour créer sites et outils avec l’IA.",
  alternates: { canonical: pageUrl },
};

export default function PourQuiPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <MarketingSiteHeader plainBg />

      <main>
        <section className={`${HOME_SECTION} ${HOME_BG_WHITE}`} id="pour-qui">
          <div className="mx-auto max-w-site px-5 sm:px-6">
            <div className={HOME_HEADER}>
              <p className={HOME_EYEBROW}>Pour qui ?</p>
              <h1 className={HOME_H2}>Une formation ouverte à ceux qui veulent créer</h1>
              <p className={HOME_LEAD}>
                Pas besoin d&apos;être développeur. BeWork s&apos;adresse à celles et ceux qui ont une activité, une idée
                ou une curiosité concrète pour l&apos;intelligence artificielle appliquée à la création.
              </p>
            </div>

            <ul className={`${HOME_CONTENT} grid gap-4 sm:grid-cols-2 lg:grid-cols-3`}>
              {AUDIENCE_PROFILES.map((p) => (
                <li key={p.title} className={`${HOME_CARD} p-6`}>
                  <h2 className="text-lg font-semibold text-[#0f172a]">{p.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={`${HOME_SECTION} ${HOME_BG_SOFT}`} aria-labelledby="metiers-heading">
          <div className="mx-auto max-w-site px-5 sm:px-6">
            <div className={HOME_HEADER}>
              <p className={HOME_EYEBROW}>Exemples par métier</p>
              <h2 id="metiers-heading" className={HOME_H2}>
                Des idées adaptées à votre activité
              </h2>
              <p className={HOME_LEAD}>
                Illustrations — chaque participant repart avec une méthode pour travailler sur son propre besoin.
              </p>
            </div>
            <ul className={`${HOME_CONTENT} grid gap-3 sm:grid-cols-2 lg:grid-cols-4`}>
              {METIER_IDEAS.map((m) => (
                <li key={m.metier} className={`${HOME_CARD} p-5`}>
                  <p className="text-sm font-bold text-[#1d4ed8]">{m.metier}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">{m.idea}</p>
                </li>
              ))}
            </ul>
            <div className={`mt-12 ${CTA_GROUP} justify-center`}>
              <Link href="/contact#participer" className={CTA_PRIMARY}>
                Participer
              </Link>
              <Link href="/formation" className={CTA_SECONDARY}>
                Voir la formation
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingSiteFooter />
    </div>
  );
}
