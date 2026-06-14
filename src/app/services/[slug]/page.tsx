import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServicePageBody } from "@/components/marketing/ServicePageBody";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { SERVICE_PAGES, SERVICE_PAGE_ORDER, isServicePageSlug, servicePagePath } from "@/content/service-pages";
import { hreflangFrancophonieLanguages } from "@/lib/seo-francophonie";
import { buildFaqPageJsonLd, buildServiceOfferingJsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return SERVICE_PAGE_ORDER.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!isServicePageSlug(slug)) return {};
  const d = SERVICE_PAGES[slug];
  const path = servicePagePath(slug);
  const url = absoluteUrl(path);
  return {
    title: { absolute: d.metaTitle },
    description: d.metaDescription,
    alternates: { canonical: url, languages: hreflangFrancophonieLanguages(path) },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      url,
      siteName: "BeWork",
      title: d.metaTitle,
      description: d.metaDescription,
      images: [{ url: absoluteUrl("/opengraph-image"), width: 1200, height: 630, alt: d.h1 }],
    },
    twitter: {
      card: "summary_large_image",
      title: d.metaTitle,
      description: d.metaDescription,
    },
  };
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  if (!isServicePageSlug(slug)) notFound();
  const d = SERVICE_PAGES[slug];
  const path = servicePagePath(slug);
  const pageUrl = absoluteUrl(path);

  const serviceLd = buildServiceOfferingJsonLd(d, pageUrl);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqPageJsonLd(d.faq, pageUrl)) }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }} />
      <SeoLandingPage
        description={d.metaDescription}
        h1={d.h1}
        intro={d.intro}
        breadcrumbItems={[
          { name: "Accueil", href: "/" },
          { name: "Services", href: "/services" },
          { name: d.h1, href: path },
        ]}
      >
        <ServicePageBody definition={d} />
      </SeoLandingPage>
    </>
  );
}
