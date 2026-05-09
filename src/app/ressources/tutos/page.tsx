import type { Metadata } from "next";
import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { RESOURCE_TUTO_ITEMS, type ResourceTutoItem, type ResourceStatus } from "@/content/resource-tutos";
import { absoluteUrl } from "@/lib/site";

const pageUrl = absoluteUrl("/ressources/tutos");
const ogImage = absoluteUrl("/opengraph-image");

export const metadata: Metadata = {
  title: "Tutoriels PDF & pratiques BTP | BeWork",
  description:
    "Tutoriels BeWork : guides PDF téléchargeables et méthodes courtes pour le chantier — à commencer par le compte rendu de chantier avec l’IA.",
  alternates: { canonical: pageUrl, languages: { fr: pageUrl, "x-default": pageUrl } },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: pageUrl,
    siteName: "BeWork",
    title: "Tutoriels PDF & pratiques BTP | BeWork",
    description: "Liste des tutoriels gratuits BeWork.",
    images: [{ url: ogImage, width: 1200, height: 630, alt: "BeWork — tutoriels" }],
  },
  robots: { index: true, follow: true },
};

function BadgeStatus({ status }: { status: ResourceStatus }) {
  const base =
    "inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[0.625rem] font-semibold ring-1 sm:px-2 sm:py-0.5 sm:text-[0.6875rem] bg-teal-50 text-teal-950 ring-teal-200/90";
  return <span className={base}>{status}</span>;
}

function ResourceGlyph({ className }: { className?: string }) {
  const cn = className ?? "h-4 w-4 text-[#1d4ed8] sm:h-[1.125rem] sm:w-[1.125rem]";
  return (
    <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h10a2 2 0 002-2V9l-5-6H8a2 2 0 00-2 2v13a2 2 0 002 2z" />
      <path strokeLinecap="round" d="M13 4v7h7M10 17h9M10 13h9" />
    </svg>
  );
}

const CARD =
  "flex h-full flex-col rounded-xl border border-slate-200/95 bg-white p-3 shadow-sm transition hover:border-slate-300 hover:shadow-sm sm:p-3.5";

const ICON_WRAP =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eff6ff] ring-1 ring-blue-100 sm:h-9 sm:w-9";

const LINK_BTN =
  "inline-flex min-h-[2.25rem] w-full items-center justify-center rounded-lg bg-[#1d4ed8] px-3 text-xs font-semibold text-white shadow-sm shadow-[#1d4ed8]/18 transition hover:bg-[#1e40af] sm:w-auto sm:min-h-[2.375rem] sm:px-4 sm:text-sm";

function ResourceCard({ item }: { item: ResourceTutoItem }) {
  return (
    <article className={CARD}>
      <div className="flex items-start gap-2.5 sm:gap-3">
        <span className={ICON_WRAP} aria-hidden>
          <ResourceGlyph />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <h2 className="text-[0.8125rem] font-bold leading-snug tracking-tight text-slate-900 sm:text-sm">{item.title}</h2>
            <BadgeStatus status={item.status} />
          </div>
          <p className="mt-1 text-[0.75rem] leading-snug text-slate-600 sm:mt-1.5 sm:text-[0.8125rem] sm:leading-relaxed">{item.desc}</p>
        </div>
      </div>
      <div className="mt-2.5 sm:mt-3">
        <Link href={item.href} className={LINK_BTN}>
          Ouvrir le tutoriel
        </Link>
      </div>
    </article>
  );
}

export default function RessourcesTutosPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <MarketingSiteHeader plainBg />

      <main className="mx-auto max-w-site px-4 pb-14 pt-10 sm:px-6 md:pb-16 md:pt-12">
        <header className="w-full border-b border-slate-200/90 pb-6 md:pb-8">
          <nav className="mb-4 text-[0.6875rem] text-slate-700 sm:text-sm" aria-label="Fil d’Ariane">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <li>
                <Link href="/ressources" className="font-medium text-black hover:text-[#1d4ed8]">
                  Ressources
                </Link>
              </li>
              <li className="text-slate-400" aria-hidden>
                /
              </li>
              <li className="font-medium text-black">Tutoriels</li>
            </ol>
          </nav>
          <h1 className="text-balance text-2xl font-bold tracking-tight text-black md:text-3xl">Tutoriels</h1>
          <p className="mt-3 max-w-xl text-xs leading-snug text-slate-700 sm:text-sm sm:leading-relaxed md:text-[0.9375rem]">
            Tutoriels courts et guides PDF préparés par BeWork. Commencez par le compte rendu de chantier avec l&apos;IA — mise en page,
            transcription complète et prompts prêts à l&apos;emploi.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <CalendlyBookingLink className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">
              Réserver un appel
            </CalendlyBookingLink>
          </div>
        </header>

        <div className="mx-auto mt-8 w-full max-w-4xl">
          {RESOURCE_TUTO_ITEMS.length === 0 ? null : RESOURCE_TUTO_ITEMS.length === 1 ? (
            <div className="mx-auto max-w-lg">
              <ResourceCard key={RESOURCE_TUTO_ITEMS[0].href} item={RESOURCE_TUTO_ITEMS[0]} />
            </div>
          ) : (
            <div className="flex flex-col gap-2 md:gap-2.5">
              <div className="grid grid-cols-1 items-stretch gap-2 sm:grid-cols-2 md:gap-2.5">
                {RESOURCE_TUTO_ITEMS.slice(0, 2).map((item) => (
                  <ResourceCard key={item.href} item={item} />
                ))}
              </div>
              {RESOURCE_TUTO_ITEMS.length > 2 ? (
                <div className="flex max-w-full flex-col gap-2 md:max-w-xl md:gap-2.5">
                  {RESOURCE_TUTO_ITEMS.slice(2).map((item) => (
                    <ResourceCard key={item.href} item={item} />
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </main>

      <MarketingSiteFooter />
    </div>
  );
}
