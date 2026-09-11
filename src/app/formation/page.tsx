import type { Metadata } from "next";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { FormationAcquis } from "@/components/formation/FormationAcquis";
import { FormationAiChange } from "@/components/formation/FormationAiChange";
import { FormationAudience } from "@/components/formation/FormationAudience";
import { FormationChecklist } from "@/components/formation/FormationChecklist";
import { FormationEntrepreneur } from "@/components/formation/FormationEntrepreneur";
import { FormationEvolves } from "@/components/formation/FormationEvolves";
import { FormationExamples } from "@/components/formation/FormationExamples";
import { FormationFaq } from "@/components/formation/FormationFaq";
import { FormationFinalCta } from "@/components/formation/FormationFinalCta";
import { FormationFormats } from "@/components/formation/FormationFormats";
import { FormationHero } from "@/components/formation/FormationHero";
import { FormationInteractive } from "@/components/formation/FormationInteractive";
import { FormationLearnToLearn } from "@/components/formation/FormationLearnToLearn";
import { FormationOwnProject } from "@/components/formation/FormationOwnProject";
import { FormationPrerequis } from "@/components/formation/FormationPrerequis";
import { FormationPricing } from "@/components/formation/FormationPricing";
import { FormationProgramme } from "@/components/formation/FormationProgramme";
import { FormationReorientation } from "@/components/formation/FormationReorientation";
import { FormationStickyNav } from "@/components/formation/FormationStickyNav";
import { FormationWhy } from "@/components/formation/FormationWhy";
import styles from "@/components/formation/formation.module.css";
import { FORMATION_PAGE_FAQ } from "@/lib/bework-formation";
import {
  beworkCourseJsonLd,
  breadcrumbJsonLd,
  buildMarketingPageMetadata,
  SEO_PAGES,
} from "@/lib/seo-formation-pages";
import { absoluteUrl, SITE_URL } from "@/lib/site";

const seo = SEO_PAGES.formation;
const pageUrl = absoluteUrl(seo.path);

export const metadata: Metadata = buildMarketingPageMetadata({
  path: seo.path,
  title: seo.title,
  absoluteTitle: seo.absoluteTitle,
  description: seo.description,
  keywords: [...seo.keywords],
});

const formationJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: seo.absoluteTitle ?? `${seo.title} | BeWork`,
      description: seo.description,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      mainEntity: { "@id": `${SITE_URL}/#course` },
    },
    beworkCourseJsonLd({
      description: seo.description,
    }),
    breadcrumbJsonLd([
      { name: "Accueil", path: "/" },
      { name: "Formation", path: "/formation" },
    ]),
    {
      "@type": "FAQPage",
      "@id": `${pageUrl}#faq`,
      mainEntity: FORMATION_PAGE_FAQ.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ],
};

/** Page /formation — référence complète journée BeWork. */
export default function FormationPage() {
  return (
    <div className={`min-h-screen bg-transparent ${styles.page}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(formationJsonLd) }}
      />
      <MarketingSiteHeader plainBg />
      <FormationStickyNav />

      <main className={styles.flow}>
        <FormationHero />
        <FormationFormats />
        <FormationWhy />
        <FormationAiChange />
        <FormationPrerequis />
        <FormationInteractive />
        <FormationProgramme />
        <FormationAcquis />
        <FormationOwnProject />
        <FormationLearnToLearn />
        <FormationAudience />
        <FormationReorientation />
        <FormationEntrepreneur />
        <FormationExamples />
        <FormationEvolves />
        <FormationPricing />
        <FormationFaq />
        <FormationChecklist />
        <FormationFinalCta />
      </main>

      <MarketingSiteFooter />
    </div>
  );
}
