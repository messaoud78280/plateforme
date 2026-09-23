import type { Metadata } from "next";
import Link from "next/link";
import { QualiopiCertificateActions } from "@/components/qualiopi/QualiopiCertificateActions";
import { QualiopiMark } from "@/components/qualiopi/QualiopiMark";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { TrainingOffersSection } from "@/components/marketing/TrainingOffersSection";
import {
  FORMATION_LEGAL_ENTITY,
  QUALIOPI_CERTIFICATION,
  QUALIOPI_COPY,
} from "@/lib/formation-organism";
import {
  breadcrumbJsonLd,
  buildMarketingPageMetadata,
  SEO_PAGES,
} from "@/lib/seo-formation-pages";
import { absoluteUrl, SITE_URL } from "@/lib/site";
import styles from "./organisme-formation.module.css";

const seo = SEO_PAGES.organismeFormation;
const pageUrl = absoluteUrl(seo.path);

export const metadata: Metadata = buildMarketingPageMetadata({
  path: seo.path,
  title: seo.title,
  absoluteTitle: seo.absoluteTitle,
  description: seo.description,
});

const orgJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: seo.absoluteTitle,
      description: seo.description,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${SITE_URL}/#organization` },
    },
    breadcrumbJsonLd([
      { name: "Accueil", path: "/" },
      { name: "Organisme de formation", path: seo.path },
    ]),
  ],
};

/** Page institutionnelle — OFC Création d'entreprise & Qualiopi. */
export default function OrganismeFormationPage() {
  return (
    <div className="min-h-screen bg-transparent">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <MarketingSiteHeader plainBg />

      <main>
        <section className={styles.hero} aria-labelledby="org-hero-title">
          <div className={styles.shell}>
            <p className={styles.eyebrow}>L&apos;organisme de formation</p>
            <h1 id="org-hero-title" className={styles.heroTitle}>
              BeWork.
              <span className={styles.heroAccent}>
                {" "}
                Une ambition pédagogique portée par un organisme certifié.
              </span>
            </h1>
            <p className={styles.heroLead}>{QUALIOPI_COPY.primary}</p>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="org-present-title">
          <div className={styles.shellNarrow}>
            <h2 id="org-present-title" className={styles.h2}>
              Un organisme de formation
              <span className={styles.h2Accent}> au service de vos projets.</span>
            </h2>
            <div className={styles.prose}>
              <p>
                <strong>{FORMATION_LEGAL_ENTITY.legalNameDisplay}</strong> est l&apos;organisme
                qui porte juridiquement les formations.{" "}
                <strong>{FORMATION_LEGAL_ENTITY.brand}</strong> est la marque dédiée aux
                formations à la création numérique assistée par intelligence artificielle.
              </p>
              <p>
                L&apos;objectif des parcours BeWork est de permettre à des non-développeurs
                d&apos;apprendre à construire leurs propres projets numériques — sites,
                applications et outils métier — sans connaissances préalables en
                programmation.
              </p>
            </div>
          </div>
        </section>

        <section
          id="certification"
          className={styles.sectionSoft}
          aria-labelledby="org-cert-title"
        >
          <div className={styles.shell}>
            <header className={styles.sectionHead}>
              <p className={styles.eyebrow}>Certification qualité</p>
              <h2 id="org-cert-title" className={styles.h2}>
                Une certification Qualiopi
                <span className={styles.h2Accent}> au titre des actions de formation.</span>
              </h2>
            </header>

            <article className={styles.certCard}>
              <QualiopiMark variant="card" />
              <dl className={styles.dl}>
                <div>
                  <dt>Titulaire</dt>
                  <dd>{FORMATION_LEGAL_ENTITY.legalNameDisplay}</dd>
                </div>
                <div>
                  <dt>Certificateur</dt>
                  <dd>{QUALIOPI_CERTIFICATION.certificator}</dd>
                </div>
                <div>
                  <dt>Certificat</dt>
                  <dd>n° {QUALIOPI_CERTIFICATION.certificateNumber}</dd>
                </div>
                <div>
                  <dt>Validité indiquée</dt>
                  <dd>
                    {QUALIOPI_CERTIFICATION.validFromLabel} →{" "}
                    {QUALIOPI_CERTIFICATION.validToLabel}
                  </dd>
                </div>
              </dl>
              <p className={styles.surveillance}>
                {QUALIOPI_CERTIFICATION.surveillanceNote}
              </p>
            </article>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="org-meaning-title">
          <div className={styles.shellNarrow}>
            <h2 id="org-meaning-title" className={styles.h2}>
              Que signifie la certification Qualiopi&nbsp;?
            </h2>
            <div className={styles.prose}>
              <p>{QUALIOPI_COPY.whatIs}</p>
              <p>
                Cette certification ne valide pas automatiquement les projets créés par les
                participants, et ne constitue pas une garantie de résultat professionnel.
              </p>
            </div>
          </div>
        </section>

        <section
          id="certificat"
          className={styles.sectionSoft}
          aria-labelledby="org-pdf-title"
        >
          <div className={styles.shellNarrow}>
            <h2 id="org-pdf-title" className={styles.h2}>
              Consulter notre certificat
            </h2>
            <p className={styles.lead}>
              Le certificat officiel délivré par {QUALIOPI_CERTIFICATION.certificator} est
              disponible en PDF. Son contenu n&apos;a pas été modifié.
            </p>
            <QualiopiCertificateActions />
          </div>
        </section>

        <TrainingOffersSection
          id="formations"
          analyticsPrefix="organisme-formation"
          headingLevel="h2"
        />

        <section className={styles.section} aria-labelledby="org-admin-title">
          <div className={styles.shellNarrow}>
            <h2 id="org-admin-title" className={styles.h2}>
              Informations de l&apos;organisme
            </h2>
            <div className={styles.adminCard}>
              <p className={styles.adminName}>{FORMATION_LEGAL_ENTITY.legalNameDisplay}</p>
              <ul className={styles.adminList}>
                <li>
                  <span>SIREN</span>
                  <strong>{FORMATION_LEGAL_ENTITY.siren}</strong>
                </li>
                <li>
                  <span>NDA</span>
                  <strong>{FORMATION_LEGAL_ENTITY.nda}</strong>
                </li>
                <li>
                  <span>Siège social</span>
                  <strong>
                    {FORMATION_LEGAL_ENTITY.addressLine}, {FORMATION_LEGAL_ENTITY.postalCity}
                  </strong>
                </li>
              </ul>
              <p className={styles.ndaDisclaimer}>{FORMATION_LEGAL_ENTITY.ndaDisclaimer}</p>
              <p className={styles.adminLinks}>
                <Link href="/mentions-legales">Mentions légales</Link>
                <Link href="/formation">Découvrir les formations</Link>
                <Link href="/contact#participer">Demander une place</Link>
              </p>
            </div>
          </div>
        </section>
      </main>

      <MarketingSiteFooter />
    </div>
  );
}
