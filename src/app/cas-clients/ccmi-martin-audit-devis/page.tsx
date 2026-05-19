import type { Metadata } from "next";
import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { CcmiMartinCarousel } from "@/components/cas-clients/CcmiMartinCarousel";
import { DevisPdfViewer } from "@/components/cas-clients/DevisPdfViewer";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import {
  CCMI_MARTIN_CASE,
  CCMI_MARTIN_CONTROLS,
  CCMI_MARTIN_ISSUES,
  CCMI_MARTIN_KEY_FIGURES,
  CCMI_MARTIN_SLIDES,
} from "@/content/cas-clients-catalog";
import { SEO_PUBLIC_ROBOTS } from "@/lib/seo-search-engines";
import { buildWebPageAndBreadcrumbJsonLd } from "@/lib/seo-landing-json-ld";
import { absoluteUrl } from "@/lib/site";

const PAGE_PATH = CCMI_MARTIN_CASE.href;

const title = "Cas client CCMI Martin : audit devis BTP avant signature | BeWork";
const description =
  "Découvrez comment BeWork a audité un devis CCMI de 287 180 € TTC avant signature : 92 lignes analysées, oublis détectés, DTU vérifiés, étude G2 prise en compte et devis rectifié.";

const ogImage = absoluteUrl(CCMI_MARTIN_SLIDES[0]!.src);
const pageUrl = absoluteUrl(PAGE_PATH);

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  keywords: ["audit devis CCMI", "devis BTP", "cas client BeWork", "DTU devis", "étude de sol G2"],
  alternates: { canonical: pageUrl, languages: { fr: pageUrl, "x-default": pageUrl } },
  robots: SEO_PUBLIC_ROBOTS,
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: pageUrl,
    siteName: "BeWork",
    title,
    description,
    images: [{ url: ogImage, width: 1080, height: 1350, alt: title }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogImage],
  },
};

const h1 = "Cas client CCMI Martin : un devis de 287 180 € audité avant signature";

const breadcrumbItems = [
  { name: "Accueil", href: "/" },
  { name: "Cas clients BTP", href: "/cas-clients" },
  { name: "CCMI Martin", href: PAGE_PATH },
] as const;

const jsonLd = buildWebPageAndBreadcrumbJsonLd({
  pagePath: PAGE_PATH,
  h1,
  description,
  breadcrumbItems: [...breadcrumbItems],
});

export default function CcmiMartinAuditDevisPage() {
  const c = CCMI_MARTIN_CASE;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fb] via-[#eef0f4] to-[#e0e4ea]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <MarketingSiteHeader plainBg />

      <main className="mx-auto max-w-site px-6 py-12 md:py-20">
        <nav className="mb-8 text-sm text-black" aria-label="Fil d’Ariane">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {breadcrumbItems.map((item, i) => (
              <li key={item.href} className="flex items-center gap-2">
                {i > 0 ? <span className="text-[#94a3b8]">/</span> : null}
                {i < breadcrumbItems.length - 1 ? (
                  <Link href={item.href} className="font-medium hover:text-[#1d4ed8]">
                    {item.name}
                  </Link>
                ) : (
                  <span className="font-medium">{item.name}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <header className="mx-auto max-w-3xl text-center">
          <div className="flex flex-wrap justify-center gap-2">
            {c.badges.map((b) => (
              <span
                key={b}
                className="rounded-full bg-[#1d4ed8]/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#1d4ed8]"
              >
                {b}
              </span>
            ))}
          </div>
          <h1 className="mt-6 font-heading text-3xl font-bold tracking-tight text-black md:text-4xl">{h1}</h1>
          <p className="mt-5 text-lg leading-relaxed text-black">
            À première vue, le devis semblait complet. Après analyse BeWork, plusieurs points techniques,
            contractuels et financiers devaient être précisés avant signature.
          </p>
        </header>

        <section className="mx-auto mt-10 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Chiffres clés">
          {CCMI_MARTIN_KEY_FIGURES.map((f) => (
            <div key={f.label} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{f.label}</p>
              <p className="mt-1 text-lg font-bold text-[#1e3a5f]">{f.value}</p>
            </div>
          ))}
        </section>

        <p className="mx-auto mt-6 max-w-3xl text-center text-xs text-slate-500">
          Cas client anonymisé. Les montants et constats sont présentés à titre d’exemple de méthode d’audit BeWork.
          Les références DTU mentionnées sont indicatives et à vérifier selon le projet.
        </p>

        <Section title="Le contexte">
          <p>
            On nous a confié un devis CCMI à auditer avant signature. Dossier Martin — Mantes-la-Ville (78), montant
            initial 287 180 € TTC. À première vue, le devis semblait complet : lots, quantités, prix, projet structuré
            et total clair. Mais l’analyse ligne par ligne avec la méthode BeWork a fait ressortir des imprécisions,
            des oublis et plusieurs points pouvant créer des plus-values ou des litiges en cours de chantier.
          </p>
        </Section>

        <Section title="Ce que BeWork a contrôlé">
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {CCMI_MARTIN_CONTROLS.map((item) => (
              <li key={item} className="rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm text-slate-800">
                {item}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Les points relevés">
          <div className="grid gap-4 md:grid-cols-2">
            {CCMI_MARTIN_ISSUES.map((issue) => (
              <article key={issue.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-semibold text-slate-900">{issue.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">{issue.text}</p>
              </article>
            ))}
          </div>
        </Section>

        <Section title="Avant / après — visuels du dossier">
          <p className="mb-6 text-sm text-slate-600">
            Le carrousel reprend les visuels transmis (devis initial vs corrections). Le PDF ci-dessous présente la
            version rectifiée, structurée et exploitable pour le client.
          </p>
          <CcmiMartinCarousel pdfHref={c.pdfCompleteHref} />
        </Section>

        <Section title="Devis rectifié — version présentable client">
          <DevisPdfViewer
            pdfHref={c.pdfPresentableHref}
            title="Extrait du devis corrigé (comparatif lignes / statuts)"
            downloadLabel="Ouvrir le PDF présentable en plein écran"
          />
        </Section>

        <Section title="Ce que BeWork a rendu au client">
          <p>
            Au final, BeWork n’a pas simplement relu le devis. Nous avons produit une version rectifiée, structurée et
            exploitable :
          </p>
          <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-slate-800">
            <li>désignations corrigées</li>
            <li>points techniques complétés</li>
            <li>postes à confirmer</li>
            <li>oublis identifiés</li>
            <li>avenants potentiels</li>
            <li>références DTU indicatives</li>
            <li>préconisations liées à la G2</li>
            <li>synthèse claire pour le client</li>
          </ul>
        </Section>

        <Section title="Pourquoi c’est important">
          <p>
            Un devis flou peut coûter cher. Un devis bien structuré protège le client, l’entreprise, le conducteur de
            travaux et le chantier. L’objectif est de clarifier avant signature plutôt que de découvrir les problèmes une
            fois les travaux engagés.
          </p>
        </Section>

        <section className="mx-auto mt-14 max-w-3xl rounded-2xl border border-[#1d4ed8]/20 bg-white p-8 text-center shadow-sm">
          <h2 className="font-heading text-2xl font-bold text-slate-900">
            Vous souhaitez faire auditer un devis avant signature ?
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-700">
            BeWork aide les entreprises du BTP, constructeurs, artisans et maîtres d’œuvre à fiabiliser leurs devis, DPGF,
            dossiers techniques et documents chantier.
          </p>
          <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <CalendlyBookingLink className="inline-flex justify-center rounded-lg bg-[#1d4ed8] px-6 py-3 font-semibold text-white hover:bg-[#1e40af]">
              Réserver un appel de cadrage
            </CalendlyBookingLink>
            <Link
              href="/services"
              className="inline-flex justify-center rounded-lg border-2 border-[#1d4ed8] px-6 py-3 font-semibold text-[#1d4ed8] hover:bg-[#eff6ff]"
            >
              Découvrir nos prestations
            </Link>
            <a
              href={c.pdfCompleteHref}
              download
              className="inline-flex justify-center rounded-lg border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Télécharger le cas client PDF
            </a>
          </div>
          <p className="mt-8 text-sm font-medium italic text-[#1e3a5f]">On tient le bureau, vous tenez le chantier.</p>
        </section>

        <p className="mx-auto mt-8 text-center">
          <Link href="/cas-clients" className="text-sm font-semibold text-[#1d4ed8] hover:underline">
            ← Retour aux cas clients
          </Link>
        </p>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto mt-14 max-w-4xl">
      <h2 className="font-heading text-xl font-bold text-slate-900 md:text-2xl">{title}</h2>
      <div className="mt-5 text-sm leading-relaxed text-slate-800 md:text-base">{children}</div>
    </section>
  );
}
