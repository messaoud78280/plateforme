import type { Metadata } from "next";
import Link from "next/link";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { BtpCtaBand } from "@/components/marketing-btp/BtpCtaBand";
import { BtpPageHero } from "@/components/marketing-btp/BtpPageHero";
import "@/components/marketing-btp/btp-marketing.css";
import { BTP_SEO_PAGES } from "@/lib/bework-btp-services";
import { buildMarketingPageMetadata } from "@/lib/seo-formation-pages";
import { SITE_URL } from "@/lib/site";

const seo = BTP_SEO_PAGES.ingenierie;
export const metadata: Metadata = buildMarketingPageMetadata({
  path: seo.path,
  title: seo.title,
  description: seo.description,
});

const SERVICES = [
  {
    title: "Études techniques et méthodes",
    body: "Analyse des contraintes d’exécution, phasage et méthodes adaptées aux ouvrages.",
  },
  {
    title: "Métrés, quantitatifs et chiffrage",
    body: "Quantitatifs, études de prix et éléments de chiffrage pour préparer l’offre ou le suivi.",
  },
  {
    title: "Analyse DCE, CCTP, CCAP, RC et plans",
    body: "Lecture critique des pièces marché pour identifier risques, flous et interfaces.",
  },
  {
    title: "Réponses aux appels d’offres",
    body: "Assistance à la constitution d’offre sur marchés publics et privés.",
  },
  {
    title: "Mémoires techniques",
    body: "Élaboration de mémoires techniques structurés, alignés sur le CCTP et les moyens mobilisables.",
  },
  {
    title: "Suivi contractuel et assistance technique",
    body: "Préparation et suivi contractuel, assistance technique aux entreprises pendant l’exécution.",
  },
] as const;

const LINKS = [
  {
    href: "/marches-publics-prives",
    label: "Marchés publics et privés",
    note: "AO, études de prix, suivi d’exécution",
  },
  {
    href: "/expertises-tce",
    label: "Expertises TCE",
    note: "Vision lots et coordination",
  },
  {
    href: "/accompagnement-technique-chantier",
    label: "Accompagnement technique",
    note: "Modes opératoires et compagnons",
  },
  {
    href: "/conduite-de-travaux",
    label: "Conduite de travaux",
    note: "Offre principale — pilotage chantier",
  },
] as const;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: seo.title,
  description: seo.description,
  provider: { "@type": "Organization", name: "BeWork", url: SITE_URL },
  areaServed: ["Yvelines", "Île-de-France", "France"],
  url: `${SITE_URL}${seo.path}`,
};

export default function IngenierieEtMarchesPage() {
  return (
    <div className="bw-btp-site min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MarketingSiteHeader />
      <main>
        <BtpPageHero
          eyebrow="INGÉNIERIE & MARCHÉS — COMPLÉMENT"
          title="Ingénierie et assistance aux marchés pour vos opérations BTP."
          subtitle="Études, métrés, analyse des pièces marché, réponses aux appels d’offres et assistance technique. Cette activité soutient la conduite de travaux et les équipes TP/VRD — sans prendre le dessus sur les deux offres principales."
          primaryHref="/demande-de-devis?besoin=assistance_marches_publics"
          primaryLabel="Demander une assistance marchés"
          secondaryHref="/conduite-de-travaux"
          secondaryLabel="Voir la conduite de travaux"
          note="Complément commercial • Prestations sur devis • Yvelines & Île-de-France"
        />

        <section className="bw-btp-section" aria-labelledby="services-title">
          <div className="bw-btp-container">
            <h2 id="services-title" className="font-bold">
              Prestations d’ingénierie et de marchés.
            </h2>
            <p className="mt-3 max-w-3xl text-base text-[var(--btp-muted)]">
              Périmètre précisé après étude de votre besoin. Aucune référence
              client ni volume d’affaires inventés.
            </p>
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {SERVICES.map((item) => (
                <article key={item.title} className="bw-btp-card">
                  <h3 className="font-bold">{item.title}</h3>
                  <p className="mt-3 text-base text-[var(--btp-muted)]">
                    {item.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bw-btp-section bw-btp-section-alt" aria-labelledby="maillage-title">
          <div className="bw-btp-container">
            <h2 id="maillage-title" className="font-bold">
              Pages associées.
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="bw-btp-card block transition hover:border-[var(--btp-border-strong)]"
                >
                  <h3 className="font-bold">{link.label}</h3>
                  <p className="mt-2 text-base text-[var(--btp-muted)]">
                    {link.note}
                  </p>
                  <span className="mt-4 inline-block text-base font-semibold text-[var(--btp-accent)]">
                    Consulter →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <BtpCtaBand
          title="Besoin d’une assistance technique ou marchés ?"
          subtitle="Décrivez le dossier ou l’opération. Nous étudions le périmètre et proposons une mission sur devis."
          ctaHref="/demande-de-devis?besoin=assistance_marches_publics"
          ctaLabel="Demander un devis"
        />
      </main>
      <MarketingSiteFooter />
    </div>
  );
}
