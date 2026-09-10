import type { Metadata } from "next";
import Link from "next/link";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { CTA_GROUP, CTA_PRIMARY, CTA_SECONDARY } from "@/components/marketing/marketingCtaStyles";
import {
  BEWORK_FORMATION_TAGLINE,
  BEWORK_SESSION_PRICE_EUR,
  FORMATION_INCLUDES,
} from "@/lib/bework-formation";
import { absoluteUrl } from "@/lib/site";

const PATH = "/tarifs" as const;
const pageUrl = absoluteUrl(PATH);

export const metadata: Metadata = {
  title: `Tarifs — Session formation ${BEWORK_SESSION_PRICE_EUR} €`,
  description: `Tarif unique BeWork : ${BEWORK_SESSION_PRICE_EUR} € pour une journée de formation pratique à la création avec l’intelligence artificielle.`,
  alternates: { canonical: pageUrl },
  openGraph: {
    title: `BeWork — ${BEWORK_SESSION_PRICE_EUR} € la session`,
    description: BEWORK_FORMATION_TAGLINE,
    url: pageUrl,
    type: "website",
  },
};

const FAQ_TARIFS = [
  {
    q: "Y a-t-il un abonnement après la formation ?",
    a: "Non pour cette offre : le tarif indiqué concerne la session de formation. Les outils éventuellement utilisés pendant la journée relèvent de votre propre environnement.",
  },
  {
    q: "Le prix inclut-il le matériel ?",
    a: "Non. Vous venez avec votre ordinateur. La journée couvre l’accompagnement, les démonstrations et la méthode.",
  },
  {
    q: "Puis-je venir avec mon projet ?",
    a: "Oui. Les idées personnelles ou professionnelles aident à appliquer concrètement ce qui est vu pendant la session.",
  },
] as const;

export default function TarifsPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <MarketingSiteHeader plainBg />

      <main className="mx-auto max-w-site px-4 py-10 sm:py-12 md:py-16">
        <section className="text-center">
          <h1 className="font-heading text-metallic-black text-[1.75rem] font-bold tracking-tight sm:text-4xl md:text-5xl md:leading-tight">
            Une session, un tarif clair
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-slate-700 sm:mt-5 sm:text-xl">
            {BEWORK_FORMATION_TAGLINE}
          </p>
        </section>

        <section className="mx-auto mt-12 max-w-lg sm:mt-14" aria-labelledby="prix-heading">
          <div className="rounded-2xl border-2 border-[#1d4ed8]/20 bg-white p-8 text-center shadow-sm md:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#1d4ed8]">Formation journée</p>
            <h2 id="prix-heading" className="mt-3 text-5xl font-extrabold tracking-tight text-[#0f172a] sm:text-6xl">
              {BEWORK_SESSION_PRICE_EUR}&nbsp;€
            </h2>
            <p className="mt-3 text-base text-slate-600">par participant · petit groupe</p>
            <ul className="mt-8 space-y-3 text-left">
              {FORMATION_INCLUDES.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-slate-700 sm:text-base">
                  <span className="text-[#1d4ed8]" aria-hidden>
                    •
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <div className={`mt-8 ${CTA_GROUP} justify-center`}>
              <Link href="/contact#participer" className={CTA_PRIMARY}>
                Participer
              </Link>
              <Link href="/formation" className={CTA_SECONDARY}>
                Détail de la formation
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-14 max-w-3xl" aria-labelledby="faq-tarifs">
          <h2 id="faq-tarifs" className="text-2xl font-bold text-[#0f172a]">
            Questions sur le tarif
          </h2>
          <ul className="mt-6 space-y-4">
            {FAQ_TARIFS.map(({ q, a }) => (
              <li key={q} className="rounded-xl border border-slate-200/90 bg-white shadow-sm">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-base font-semibold text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:ring-inset [&::-webkit-details-marker]:hidden">
                    <span>{q}</span>
                    <span className="shrink-0 pl-2 text-slate-400 group-open:rotate-180">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </summary>
                  <div className="border-t border-slate-100 px-5 py-4 text-base leading-relaxed text-slate-700">{a}</div>
                </details>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14 rounded-2xl border-2 border-[#1d4ed8]/25 bg-[#eff6ff] p-8 text-center md:p-10">
          <h2 className="text-2xl font-bold text-[#0f172a]">Prêt à rejoindre une session&nbsp;?</h2>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-slate-600">
            Laissez vos coordonnées : nous vous indiquons les prochaines dates disponibles.
          </p>
          <div className={`mt-6 ${CTA_GROUP} justify-center`}>
            <Link href="/contact#participer" className={CTA_PRIMARY}>
              Manifestation d&apos;intérêt
            </Link>
            <Link href="/demonstrations" className={CTA_SECONDARY}>
              Voir les démonstrations
            </Link>
          </div>
        </section>

        <div className="mt-10 flex justify-center">
          <Link href="/" className="text-base font-medium text-slate-600 underline hover:text-[#0f172a]">
            Retour à l&apos;accueil
          </Link>
        </div>
      </main>

      <MarketingSiteFooter />
    </div>
  );
}
