import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import {
  SEO_OG_ALTERNATE_LOCALES,
  SEO_OG_LOCALE_PRIMARY,
  hreflangFrancophonieLanguages,
} from "@/lib/seo-francophonie";
import { absoluteUrl } from "@/lib/site";

const pageUrl = absoluteUrl("/notre-facon-de-travailler");
const ogImage = absoluteUrl("/opengraph-image");

const METHODE_TITLE = "Notre méthode BeWork : brief, préparation, validation BTP";
const METHODE_DESCRIPTION =
  "Méthode BeWork pour le BTP : brief, qualification, préparation, suivi et validation par vous avant tout envoi engageant. Process tracé, supervision FR.";

export const metadata: Metadata = {
  title: { absolute: METHODE_TITLE },
  description: METHODE_DESCRIPTION,
  keywords: [
    "méthode assistant travaux BTP",
    "process externalisation administrative BTP",
    "validation chantier",
    "relais bureau-chantier",
    "assistant travaux BeWork",
  ],
  alternates: { canonical: pageUrl, languages: hreflangFrancophonieLanguages("/notre-facon-de-travailler") },
  openGraph: {
    type: "website",
    locale: SEO_OG_LOCALE_PRIMARY,
    alternateLocale: [...SEO_OG_ALTERNATE_LOCALES],
    url: pageUrl,
    siteName: "BeWork",
    title: METHODE_TITLE,
    description: METHODE_DESCRIPTION,
    images: [{ url: ogImage, width: 1200, height: 630, alt: "BeWork — méthode de travail BTP" }],
  },
  twitter: {
    card: "summary_large_image",
    title: METHODE_TITLE,
    description: METHODE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

const methodeJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: METHODE_TITLE,
      description: METHODE_DESCRIPTION,
      inLanguage: "fr-FR",
      isPartOf: { "@id": `${absoluteUrl("/")}#website` },
      about: { "@id": `${absoluteUrl("/")}#organization` },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${pageUrl}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Notre méthode", item: pageUrl },
      ],
    },
  ],
};

const METHOD_STEPS = [
  {
    step: 1,
    title: "Vous envoyez vos demandes",
    desc: "Vous transmettez vos demandes via la plateforme (ou le canal cadré au démarrage). Plus c’est précis, plus ça avance vite.",
    bullets: [
      "Devis, relances, situations",
      "Documents travaux & pièces chantier",
      "DICT/DT, fournisseurs, locations",
      "DOE, réserves, planning (selon périmètre)",
    ],
  },
  {
    step: 2,
    title: "BeWork analyse et qualifie",
    desc: "On trie, on clarifie, on identifie ce qu’il manque et on qualifie le livrable attendu avant d’exécuter.",
    bullets: ["Urgence & impact chantier", "Infos manquantes", "Type de livrable", "Besoin de validation"],
  },
  {
    step: 3,
    title: "BeWork prépare le travail",
    desc: "On prépare des livrables propres et actionnables : brouillons, synthèses, checklists, tableaux — sous supervision humaine.",
    bullets: [
      "Brouillons de mails / relances",
      "Tableaux de suivi (statuts, prochaines actions)",
      "Comptes rendus mis au propre",
      "Synthèses DCE/CCTP & checklists",
    ],
  },
  {
    step: 4,
    title: "BeWork suit l’avancement",
    desc: "On tient la cadence : relances, échéances, demandes en attente, points bloquants, et on remonte ce qui doit être arbitré.",
    bullets: ["Statuts & échéances", "Relances", "Pièces en attente", "Points bloquants"],
  },
  {
    step: 5,
    title: "Vous validez ce qui engage",
    desc: "Vous gardez la main sur les décisions qui engagent votre entreprise. BeWork prépare et vous fait valider avant envoi sur les points sensibles.",
    bullets: ["Prix & marges", "Choix techniques", "Arbitrages chantier", "Signatures & engagements"],
  },
  {
    step: 6,
    title: "Tout reste traçable",
    desc: "Chaque demande, échange et document est suivi et retrouvé. Objectif : continuité, propreté et moins de pertes d’info entre bureau et chantier.",
    bullets: ["Échanges datés", "Historique accessible", "Documents classés", "Meilleure continuité"],
  },
] as const;

const FAQ_ITEMS = [
  {
    q: "Comment envoyer une demande à BeWork ?",
    a: "Via la plateforme BeWork (ou le canal défini au démarrage). L’idéal : un objectif clair, le contexte chantier, les pièces jointes et la date limite si elle existe.",
  },
  {
    q: "Comment BeWork priorise les demandes ?",
    a: "Selon l’urgence, l’impact terrain et les échéances (démarrage, livraison, client, fournisseur). Les urgences doivent être signalées explicitement.",
  },
  {
    q: "Quels documents faut-il fournir ?",
    a: "Tout ce qui permet d’agir sans aller-retour : devis existant, CCTP/DCE, coordonnées, photos, pièces chantier, références, délais, et vos consignes de validation.",
  },
  {
    q: "Est-ce que je dois tout valider ?",
    a: "Vous validez ce qui engage votre entreprise : prix, choix techniques, signatures, engagements contractuels, réponses sensibles. BeWork prépare et vous fait valider avant diffusion si nécessaire.",
  },
  {
    q: "Comment suivre l’avancement des demandes ?",
    a: "Avec des statuts et un suivi sur la plateforme : demandes en cours, en attente, bloquées, livrées. BeWork remonte aussi les points bloquants et arbitrages.",
  },
  {
    q: "Quel rôle joue l’IA dans la méthode BeWork ?",
    a: "L’IA aide à trier, synthétiser, reformuler, repérer les points clés et préparer des brouillons. Il y a une supervision humaine, et vous gardez la validation finale sur ce qui engage.",
  },
  {
    q: "Les échanges et documents sont-ils traçables ?",
    a: "Oui : demandes datées, historique, documents classés et restitution. Objectif : continuité et moins de pertes d’informations entre bureau et chantier.",
  },
] as const;

function FaqJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
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
      <h2 id={id ? `${id}-heading` : undefined} className="text-2xl font-bold tracking-tight text-black md:text-3xl">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function NotreFaconDeTravaillerPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(methodeJsonLd) }} />
      <FaqJsonLd />
      <MarketingSiteHeader />

      <main className="mx-auto max-w-site px-4 py-14 md:px-6 md:py-20">
        {/* Hero */}
        <header className="mx-auto max-w-3xl text-center">
          <p className="mx-auto max-w-full text-center text-[12px] font-semibold uppercase tracking-[0.2em] text-[#1d4ed8]">
            Méthode BeWork
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-black md:text-4xl md:leading-tight">
            Notre façon de travailler : un relais bureau‑chantier clair et suivi
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-slate-700 md:text-lg">
            Vous envoyez vos demandes, BeWork les analyse, prépare les livrables, suit les échéances et vous laisse valider ce qui engage votre
            entreprise.
          </p>
          <a
            href="#etapes"
            className="mt-8 inline-flex rounded-lg bg-[#1d4ed8] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1e40af] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:ring-offset-2"
          >
            Voir les étapes
          </a>
        </header>

        <div className="mx-auto mt-16 max-w-5xl space-y-16 md:mt-24 md:space-y-20">
          <SectionShell id="etapes" title="Les étapes (concrètes) de la méthode BeWork" className="mx-auto max-w-5xl">
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-700 md:text-base">
              Cette page décrit notre méthode de travail (réception → analyse → préparation → suivi → validation → traçabilité). Elle complète la home et
              les pages “Missions” et “Tarifs”, sans refaire leur contenu.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {METHOD_STEPS.map((s) => (
                <div key={s.step} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#1d4ed8]">
                        Étape {String(s.step).padStart(2, "0")}
                      </p>
                      <h3 className="mt-2 text-lg font-bold tracking-tight text-black md:text-xl">{s.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-700">{s.desc}</p>
                    </div>
                    <span
                      className="shrink-0 rounded-xl bg-[#eff6ff] px-3 py-2 text-sm font-bold text-[#1d4ed8] ring-1 ring-blue-100"
                      aria-hidden
                    >
                      {s.step}
                    </span>
                  </div>
                  <ul className="mt-4 grid gap-2 text-sm text-slate-800 sm:grid-cols-2" role="list">
                    {s.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2">
                        <span className="mt-0.5 text-[#1d4ed8]" aria-hidden>
                          ✓
                        </span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </SectionShell>

          <SectionShell id="ia" title="Ce que l’IA apporte (sans remplacer l’humain)" className="mx-auto max-w-5xl">
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
                <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#1d4ed8]">L’IA aide à</p>
                <ul className="mt-4 grid gap-2 text-sm text-slate-800 sm:grid-cols-2" role="list">
                  {["Trier", "Synthétiser", "Reformuler", "Repérer les points importants", "Préparer des brouillons", "Structurer des documents"].map(
                    (t) => (
                      <li key={t} className="flex items-start gap-2">
                        <span className="mt-0.5 text-[#1d4ed8]" aria-hidden>
                          ✓
                        </span>
                        <span>{t}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
                <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#1d4ed8]">Mais</p>
                <ul className="mt-4 space-y-2 text-sm leading-relaxed text-slate-800" role="list">
                  {[
                    "Supervision humaine sur les livrables et la qualité",
                    "Vous gardez la validation finale sur ce qui engage (prix, technique, contrats, signatures)",
                    "L’IA ne remplace pas un bureau d’études, un maître d’œuvre, un avocat ou un expert technique",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2">
                      <span className="mt-0.5 text-slate-900" aria-hidden>
                        ✓
                      </span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </SectionShell>

          <SectionShell id="delais" title="Délais et priorités" className="mx-auto max-w-5xl">
            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
              <ul className="grid gap-2 text-sm leading-relaxed text-slate-800 sm:grid-cols-2" role="list">
                {[
                  "Les demandes sont traitées selon l’urgence et la complexité.",
                  "Les urgences doivent être signalées clairement (impact chantier, échéance).",
                  "Les demandes simples peuvent être traitées rapidement si les infos sont complètes.",
                  "Les dossiers longs (DOE, DCE/CCTP, PPSPS…) nécessitent un cadrage et parfois un découpage.",
                  "Les délais dépendent du forfait, du volume en cours et des informations fournies.",
                  "On vous propose une estimation (et un point de validation) avant d’aller trop loin sur une demande lourde.",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <span className="mt-0.5 text-[#1d4ed8]" aria-hidden>
                      ✓
                    </span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </SectionShell>

          <SectionShell id="cadre" title="Confidentialité, cadre et traçabilité" className="mx-auto max-w-5xl">
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
                <h3 className="text-lg font-bold tracking-tight text-black">Confidentialité</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  Accès encadrés, informations sensibles traitées avec rigueur, et échanges professionnels. Le périmètre et les modalités sont définis au
                  démarrage.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-slate-800" role="list">
                  {["Accès autorisés uniquement", "Circuits de validation", "Périmètre défini", "Traçabilité des échanges"].map((t) => (
                    <li key={t} className="flex items-start gap-2">
                      <span className="mt-0.5 text-[#1d4ed8]" aria-hidden>
                        ✓
                      </span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
                <h3 className="text-lg font-bold tracking-tight text-black">Traçabilité</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  Chaque demande avance avec des statuts, des dates et des livrables classés. Objectif : continuité, même quand la semaine est sous pression.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-slate-800" role="list">
                  {["Demandes suivies", "Historique accessible", "Documents classés", "Points bloquants visibles"].map((t) => (
                    <li key={t} className="flex items-start gap-2">
                      <span className="mt-0.5 text-[#1d4ed8]" aria-hidden>
                        ✓
                      </span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </SectionShell>

          <SectionShell id="faq" title="Questions fréquentes (méthode)" className="mx-auto max-w-5xl">
            <ul className="mt-6 space-y-4">
              {FAQ_ITEMS.map((item, i) => (
                <li key={i} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-black focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:ring-inset [&::-webkit-details-marker]:hidden">
                      <span>{item.q}</span>
                      <span className="shrink-0 text-slate-700 group-open:rotate-180" aria-hidden>
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </summary>
                    <div className="border-t border-slate-200 px-5 py-4 text-sm leading-relaxed text-slate-700">{item.a}</div>
                  </details>
                </li>
              ))}
            </ul>
          </SectionShell>
        </div>

        {/* CTA */}
        <div className="mx-auto mt-20 max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm md:mt-24 md:p-10">
          <h2 className="text-xl font-bold text-black md:text-2xl">On fait le point sur votre organisation ?</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-700 md:text-base">
            Un échange suffit pour cadrer votre besoin, votre circuit de validation et les priorités.
          </p>
          <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <CalendlyBookingLink className="inline-flex justify-center rounded-lg bg-[#1d4ed8] px-6 py-3 font-semibold text-white transition hover:bg-[#1e40af]">
              <span className="sm:hidden">Rendez-vous découverte</span>
              <span className="hidden sm:inline">Demander un rendez-vous découverte</span>
            </CalendlyBookingLink>
            <Link
              href="/assistants-administratifs-taches"
              className="inline-flex justify-center rounded-lg border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Voir les missions
            </Link>
          </div>
        </div>

        <p className="mt-10 text-center">
          <Link href="/" className="text-sm font-medium text-black underline hover:text-black">
            Retour à l’accueil
          </Link>
        </p>
      </main>

      <MarketingSiteFooter />
    </div>
  );
}
