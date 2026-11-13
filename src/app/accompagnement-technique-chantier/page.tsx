import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { BtpCtaBand } from "@/components/marketing-btp/BtpCtaBand";
import { BtpPageHero } from "@/components/marketing-btp/BtpPageHero";
import "@/components/marketing-btp/btp-marketing.css";
import {
  BTP_ACCOMPAGNEMENT_EXAMPLES,
  BTP_ACCOMPAGNEMENT_OBJECTIFS,
  BTP_ACCOMPAGNEMENT_STEPS,
  BTP_CTA_ACCOMPAGNEMENT,
  BTP_SEO_PAGES,
} from "@/lib/bework-btp-services";
import { buildMarketingPageMetadata } from "@/lib/seo-formation-pages";

const seo = BTP_SEO_PAGES.accompagnementTechnique;
export const metadata: Metadata = buildMarketingPageMetadata({
  path: seo.path,
  title: seo.title,
  description: seo.description,
});

export default function AccompagnementTechniqueChantierPage() {
  return (
    <div className="bw-btp-site min-h-screen">
      <MarketingSiteHeader />
      <main>
        <BtpPageHero
          eyebrow="MÉTHODES D'EXÉCUTION • ACCOMPAGNEMENT TERRAIN"
          title="Nous accompagnons vos compagnons dans la maîtrise des modes opératoires."
          subtitle="BeWork intervient directement sur chantier pour accompagner les compagnons dans la compréhension et l’application des méthodes d’exécution adaptées aux exigences de l’ouvrage. Notre approche associe transmission du savoir-faire, démonstrations pratiques, organisation des postes et suivi de la qualité d’exécution."
          primaryHref={BTP_CTA_ACCOMPAGNEMENT.href}
          primaryLabel={BTP_CTA_ACCOMPAGNEMENT.label}
          secondaryHref="/demande-de-devis?besoin=assistance_modes_operatoires"
          secondaryLabel="Assistance aux modes opératoires"
          note="Accompagnement technique opérationnel • Prestations sur devis"
          imageSrc="/marketing/bework-hero-accompagnement-technique.jpg"
          imageAlt="Accompagnement technique de compagnons sur chantier — photo d’ambiance illustrative"
        />

        <section className="bw-btp-section bw-btp-section-alt" aria-labelledby="objectifs-title">
          <div className="bw-btp-container">
            <h2 id="objectifs-title" className="font-bold">
              Objectifs de l’accompagnement.
            </h2>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {BTP_ACCOMPAGNEMENT_OBJECTIFS.map((item) => (
                <article key={item} className="bw-btp-card">
                  <p className="font-semibold text-[var(--btp-heading)]">{item}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bw-btp-section" aria-labelledby="deroulement-title">
          <div className="bw-btp-container">
            <h2 id="deroulement-title" className="font-bold">
              Déroulement de l’accompagnement.
            </h2>
            <div className="mt-10 space-y-4">
              {BTP_ACCOMPAGNEMENT_STEPS.map((step) => (
                <article
                  key={step.n}
                  className="bw-btp-card grid gap-4 md:grid-cols-[5rem_1fr] md:items-start"
                >
                  <p className="text-2xl font-bold text-[var(--btp-accent)]">{step.n}</p>
                  <div>
                    <h3 className="text-xl font-bold">{step.title}</h3>
                    <ul className="mt-3 space-y-1.5">
                      {step.items.map((item) => (
                        <li key={item} className="flex gap-2 text-base text-[var(--btp-muted)]">
                          <span className="text-[var(--btp-accent)]" aria-hidden>
                            •
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bw-btp-section bw-btp-section-alt" aria-labelledby="exemples-title">
          <div className="bw-btp-container">
            <h2 id="exemples-title" className="font-bold">
              Exemples concrets d’accompagnement.
            </h2>
            <div className="relative mt-8 aspect-[21/9] overflow-hidden rounded-[var(--btp-radius)] border border-[var(--btp-border)] bg-[var(--btp-soft)] sm:aspect-[24/9]">
              <Image
                src="/marketing/bework-pole-accompagnement.jpg"
                alt="Démonstration de méthode d’exécution sur chantier — photo d’ambiance illustrative"
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 1200px"
              />
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {BTP_ACCOMPAGNEMENT_EXAMPLES.map((ex) => (
                <article key={ex.title} className="bw-btp-card">
                  <h3 className="font-bold">{ex.title}</h3>
                  <ul className="mt-3 space-y-1.5">
                    {ex.items.map((item) => (
                      <li key={item} className="flex gap-2 text-base text-[var(--btp-muted)]">
                        <span className="text-[var(--btp-accent)]" aria-hidden>
                          •
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bw-btp-section">
          <div className="bw-btp-container max-w-3xl">
            <h2 className="font-bold">Positionnement important</h2>
            <p className="mt-4 text-base leading-relaxed text-[var(--btp-muted)]">
              Il s’agit d’un accompagnement technique opérationnel, adapté au
              chantier. Il ne doit pas être confondu avec les formations
              réglementaires, habilitations ou certifications obligatoires.
            </p>
            <p className="mt-4 text-base leading-relaxed text-[var(--btp-muted)]">
              Une véritable action de formation professionnelle ou AFEST doit
              faire l’objet d’une organisation et d’un cadre réglementaire
              spécifiques. BeWork ne prétend pas délivrer une habilitation, une
              qualification ou une certification qui n’existe pas.
            </p>
            <p className="mt-4 text-base leading-relaxed text-[var(--btp-muted)]">
              Nos outils internes peuvent, selon les fonctionnalités existantes,
              aider à préparer des fiches méthodes, structurer les étapes,
              documenter les observations, produire des synthèses et suivre les
              points d’amélioration — sous contrôle humain.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={BTP_CTA_ACCOMPAGNEMENT.href}
                className="bw-btp-btn bw-btp-btn-primary"
              >
                {BTP_CTA_ACCOMPAGNEMENT.label}
              </Link>
              <Link href="/plateforme-ia" className="bw-btp-btn bw-btp-btn-secondary">
                Méthode &amp; outils internes
              </Link>
            </div>
          </div>
        </section>

        <BtpCtaBand
          title="Besoin d’un accompagnement technique sur chantier ?"
          subtitle="Précisez l’ouvrage, le mode opératoire et le contexte d’équipe. Nous étudions le besoin et proposons une intervention sur devis."
          ctaHref={BTP_CTA_ACCOMPAGNEMENT.href}
          ctaLabel={BTP_CTA_ACCOMPAGNEMENT.label}
        />
      </main>
      <MarketingSiteFooter />
    </div>
  );
}
