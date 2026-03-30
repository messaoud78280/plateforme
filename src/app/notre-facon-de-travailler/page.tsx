import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import {
  BeforeAfterSection,
  ChainFlowSection,
  ImpactCardsSection,
  PresenceBlockSection,
  ShortTimelineSection,
  VousNousSection,
} from "@/components/methode/MethodeVisualBlocks";
import { absoluteUrl } from "@/lib/site";
import { TARIFS_PLANS } from "@/lib/tarifs-plans";

const pageUrl = absoluteUrl("/notre-facon-de-travailler");
const ogImage = absoluteUrl("/opengraph-image");

export const metadata: Metadata = {
  title: "Notre méthode — façon de travailler BeWork BTP",
  description:
    "Chaîne complète client → encaissement, avant/après, rôles et forfaits Structure à Pilotage. Méthode claire pour artisans et PME du bâtiment.",
  alternates: { canonical: pageUrl, languages: { fr: pageUrl, "x-default": pageUrl } },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: pageUrl,
    siteName: "BeWork",
    title: "Notre méthode — BeWork",
    description:
      "Flux administratif de A à Z, organisation terrain et forfaits adaptés au BTP.",
    images: [{ url: ogImage, width: 1200, height: 630, alt: "BeWork — méthode de travail BTP" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Notre méthode | BeWork",
    description: "Méthode visuelle pour artisans et PME du bâtiment.",
  },
  robots: { index: true, follow: true },
};

function formatPriceTtc(value: string) {
  const n = parseInt(value.replace(/\s/g, ""), 10);
  if (Number.isNaN(n)) return value;
  return n.toLocaleString("fr-FR");
}

function SectionShell({
  id,
  title,
  children,
  className = "",
}: {
  id?: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-24 ${className}`} aria-labelledby={id ? `${id}-heading` : undefined}>
      <h2 id={id ? `${id}-heading` : undefined} className="text-2xl font-bold tracking-tight text-[#0f172a] md:text-3xl">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function NotreFaconDeTravaillerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fb] via-[#eef0f4] to-[#e0e4ea]">
      <MarketingSiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
        {/* Hero */}
        <header className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#1d4ed8]">Notre méthode</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#0f172a] md:text-4xl md:leading-tight">
            Une organisation simple, efficace et adaptée au terrain
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#334155] md:text-lg">
            De la demande client à l’encaissement : un système clair. Vous gardez le chantier, nous structurons
            l’administratif — avec un forfait mensuel adapté (Structure à Pilotage).
          </p>
          <a
            href="#flux"
            className="mt-8 inline-flex rounded-lg bg-[#1d4ed8] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1e40af] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:ring-offset-2"
          >
            Voir le flux complet
          </a>
        </header>

        <div className="mx-auto mt-16 max-w-5xl space-y-20 md:mt-24 md:space-y-28">
          <ChainFlowSection />
          <BeforeAfterSection />
          <VousNousSection />
          <ShortTimelineSection />

          {/* Grille tarifaire */}
          <SectionShell id="forfaits" title="Quatre forfaits, une même méthode" className="mx-auto max-w-5xl">
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#334155] md:text-base">
              Le déroulé ne change pas : analyse, cadrage, suivi, ajustements. Ce qui varie, c’est la profondeur du pilotage
              — posée à la mise en place avec vous.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {TARIFS_PLANS.map((plan) => (
                <div
                  key={plan.planKey}
                  className={`relative rounded-xl border bg-white/90 p-5 shadow-sm transition-all duration-200 hover:border-[#bfdbfe] hover:shadow-md ${
                    plan.badge ? "border-[#1d4ed8]/40 pt-7 ring-1 ring-[#1d4ed8]/20" : "border-[#e2e8f0]"
                  }`}
                >
                  {plan.badge && (
                    <span className="absolute -top-2.5 left-4 rounded-full bg-[#1d4ed8] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                      {plan.badge}
                    </span>
                  )}
                  <p className="text-lg font-bold text-[#0f172a]">{plan.name}</p>
                  <p className="mt-1 text-sm font-semibold text-[#1d4ed8]">
                    {formatPriceTtc(plan.price)} € TTC<span className="font-normal text-[#64748b]"> / mois</span>
                  </p>
                  <div className="mt-2" aria-label="Repère indicatif de charge">
                    <p className="text-[11px] leading-snug text-[#64748b] md:text-xs md:leading-relaxed">
                      <span className="block font-normal">{plan.equivalentNote.line1}</span>
                      <span className="mt-0.5 block font-normal text-[#94a3b8]">{plan.equivalentNote.line2}</span>
                    </p>
                  </div>
                  <p className="mt-3 border-t border-[#e2e8f0] pt-3 text-sm leading-snug text-[#334155]">{plan.tagline}</p>
                  <ul className="mt-4 space-y-1.5 text-xs leading-snug text-[#64748b]">
                    {plan.highlights.slice(0, 3).map((h) => (
                      <li key={h} className="flex gap-2">
                        <span className="shrink-0 text-[#1d4ed8]" aria-hidden>
                          ✓
                        </span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mx-auto mt-6 max-w-xl text-center">
              <p className="text-[11px] font-normal leading-relaxed text-[#64748b] md:text-xs">
                Les volumes indiqués sont des repères estimatifs. Notre approche repose sur un cadre de travail structuré et un
                niveau de suivi adapté à votre activité, et non sur une logique horaire stricte.
              </p>
            </div>
            <p className="mt-5 text-center">
              <Link
                href="/tarifs"
                className="text-sm font-semibold text-[#1d4ed8] underline decoration-[#1d4ed8]/30 underline-offset-2 hover:decoration-[#1d4ed8]"
              >
                Voir le détail des forfaits et le comparatif
              </Link>
            </p>
          </SectionShell>

          <ImpactCardsSection />
          <PresenceBlockSection />

          <SectionShell id="conseil" title="Un accompagnement au-delà de l’administratif">
            <div className="mt-6 rounded-2xl border border-[#e2e8f0] bg-white/90 p-6 shadow-sm transition-shadow duration-200 hover:shadow-md md:p-8">
              <ul className="grid gap-3 sm:grid-cols-2" role="list">
                {[
                  "Conseils sur l’organisation",
                  "Aide au recrutement",
                  "Structuration des équipes",
                  "Amélioration du fonctionnement",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-2 text-sm font-medium text-[#334155]">
                    <span className="text-[#1d4ed8]" aria-hidden>
                      ✓
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
              <p className="mt-6 border-t border-[#f1f5f9] pt-6 text-center text-sm font-semibold text-[#0f172a] md:text-base">
                On ne fait pas que gérer. On vous aide à évoluer.
              </p>
            </div>
          </SectionShell>
        </div>

        {/* CTA */}
        <div className="mx-auto mt-20 max-w-3xl rounded-xl border-2 border-[#1d4ed8]/30 bg-[#eff6ff] p-8 text-center md:mt-24 md:p-10">
          <h2 className="text-xl font-bold text-[#0f172a] md:text-2xl">On fait le point sur votre organisation ?</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[#334155] md:text-base">
            Un échange suffit pour voir si notre méthode colle à votre façon de travailler sur le terrain.
          </p>
          <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <Link
              href="/contact"
              className="inline-flex justify-center rounded-lg bg-[#1d4ed8] px-6 py-3 font-semibold text-white transition hover:bg-[#1e40af]"
            >
              Demander un cadrage
            </Link>
            <Link
              href="/tarifs"
              className="inline-flex justify-center rounded-lg border-2 border-[#1d4ed8] px-6 py-3 font-semibold text-[#1d4ed8] transition hover:bg-white/60"
            >
              Voir les forfaits
            </Link>
          </div>
        </div>

        <p className="mt-10 text-center">
          <Link href="/" className="text-sm font-medium text-[#64748b] underline hover:text-[#0f172a]">
            Retour à l’accueil
          </Link>
        </p>
      </main>

      <footer className="mt-12 border-t border-[#c8cdd6] bg-[#f8f9fb] px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 text-sm text-[#334155] md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <BeWorkLogo size="sm" />
            <span className="text-[#0f172a]">© {new Date().getFullYear()} BeWork</span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/" className="font-medium hover:text-[#0f172a]">
              Accueil
            </Link>
            <Link href="/faq" className="font-medium hover:text-[#0f172a]">
              FAQ
            </Link>
            <Link href="/tarifs" className="font-medium hover:text-[#0f172a]">
              Forfaits
            </Link>
            <Link href="/blog" className="font-medium hover:text-[#0f172a]">
              Blog
            </Link>
            <Link href="/contact" className="font-medium hover:text-[#0f172a]">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
