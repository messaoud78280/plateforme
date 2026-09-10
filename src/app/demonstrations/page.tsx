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
import { CTA_PRIMARY, CTA_SECONDARY } from "@/components/marketing/marketingCtaStyles";
import { DEMO_INTERACTIVE_SLUGS, DEMO_PROJECTS } from "@/lib/bework-formation";
import { absoluteUrl } from "@/lib/site";

const PATH = "/demonstrations" as const;
const pageUrl = absoluteUrl(PATH);
const interactive = new Set<string>(DEMO_INTERACTIVE_SLUGS);

export const metadata: Metadata = {
  title: "Démonstrations — Exemples de projets créés avec l’IA",
  description:
    "Explorez des démonstrations BeWork : messagerie, agenda, réservation, CRM, tableau de bord, espace client… Des exemples de ce qu’il est possible d’aborder en formation.",
  alternates: { canonical: pageUrl },
};

export default function DemonstrationsHubPage() {
  return (
    <div className="min-h-screen bg-transparent">
      <MarketingSiteHeader plainBg />

      <main>
        <section className={`${HOME_SECTION} relative overflow-hidden`}>
          <BwAtmosphere variant="creation" />
          <div className="relative z-[1] mx-auto max-w-site px-5 sm:px-6">
            <div className={HOME_HEADER}>
              <p className={HOME_EYEBROW}>Démonstrations</p>
              <h1 className={HOME_H2}>
                Ce n&apos;est pas une image.
                <br />
                <span className="text-[#275BE8]">Essayez.</span>
              </h1>
              <p className={HOME_LEAD}>
                Découvrez quelques exemples de ce qu&apos;il est aujourd&apos;hui possible de
                construire. Interfaces d&apos;exemple, données fictives, sans inscription.
              </p>
            </div>

            <ul className={`${HOME_CONTENT} grid gap-4 sm:grid-cols-2 lg:grid-cols-3`}>
              {DEMO_PROJECTS.map((demo) => (
                <li key={demo.slug}>
                  <Link
                    href={`/demonstrations/${demo.slug}`}
                    className={`${HOME_CARD} group flex h-full flex-col p-6 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_55px_rgba(30,60,120,0.10)]`}
                  >
                    <span
                      className="h-1.5 w-12 rounded-full"
                      style={{ backgroundColor: demo.accent }}
                      aria-hidden
                    />
                    <h2 className="mt-4 text-lg font-semibold text-[#0B0D12] group-hover:text-[#275BE8]">
                      {demo.title}
                    </h2>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-[#42526B]">
                      {demo.description}
                    </p>
                    <span className="mt-4 text-sm font-semibold text-[#275BE8]">
                      {interactive.has(demo.slug) ? "Explorer →" : "Voir l’aperçu →"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-14 flex flex-wrap justify-center gap-3">
              <Link href="/formation" className={CTA_PRIMARY}>
                Découvrir la formation
              </Link>
              <Link href="/contact#participer" className={CTA_SECONDARY}>
                Participer
              </Link>
            </div>
          </div>
        </section>
      </main>
      <MarketingSiteFooter />
    </div>
  );
}
