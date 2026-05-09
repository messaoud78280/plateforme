import type { Metadata } from "next";
import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { TUTO_TITRE } from "@/components/seo/tuto-section-titles";
import { absoluteUrl } from "@/lib/site";

const pagePath = "/ressources/chiffrage-devis-btp";
const pageUrl = absoluteUrl(pagePath);

const DESCRIPTION =
  "Tuto pratique : chiffrage devis BTP — BPU, DQE, hypothèses, quantités, interfaces et erreurs fréquentes avant envoi d’offre.";

export const metadata: Metadata = {
  title: "Chiffrage devis BTP | BPU, DQE & méthode",
  description: DESCRIPTION,
  alternates: { canonical: pageUrl, languages: { fr: pageUrl, "x-default": pageUrl } },
  openGraph: {
    type: "article",
    locale: "fr_FR",
    url: pageUrl,
    siteName: "BeWork",
    title: "Chiffrage devis BTP | Méthode",
    description: DESCRIPTION,
    images: [{ url: absoluteUrl("/opengraph-image"), width: 1200, height: 630, alt: "Chiffrage devis BTP — BeWork" }],
  },
  robots: { index: true, follow: true },
};

const FAQ_ITEMS = [
  {
    q: "Faut-il chiffrer avant d’avoir levé toutes les ambiguïtés du DCE ?",
    a: "Non pour figer un prix public : gardez une phase de questions / hypothèses, puis figez les postes sensibles avant envoi.",
  },
  {
    q: "BeWork peut-elle chiffrer à ma place ?",
    a: "Non pour les prix et quantités : c’est votre expertise. BeWork peut aider à structurer le dossier, suivre les pièces et préparer les relances autour du devis.",
  },
] as const;

function FaqJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${pageUrl}#faq`,
    url: pageUrl,
    inLanguage: "fr-FR",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

export default function ChiffrageDevisBtpPage() {
  return (
    <>
      <FaqJsonLd />
      <SeoLandingPage
        description={DESCRIPTION}
        h1="Chiffrage devis BTP : sécuriser postes, quantités et hypothèses"
        intro={
          <>
            Un devis solide repose sur des <strong>quantités</strong> et des <strong>hypothèses</strong> explicites. Ce tuto cible le
            montage d’offre après <Link href="/ressources/analyse-dce-btp">analyse du DCE</Link> — pas le détail métier de chaque corps d’état.
          </>
        }
        breadcrumbItems={[
          { name: "Accueil", href: "/" },
          { name: "Ressources", href: "/ressources" },
          { name: "Chiffrage devis BTP", href: pagePath },
        ]}
      >
        <section className="not-prose">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-[13px] leading-relaxed text-slate-600 shadow-sm">
            Compléments utiles :{" "}
            <Link href="/devis-retard-btp" className="font-semibold text-[#1d4ed8] underline-offset-4 hover:underline">
              devis en retard
            </Link>
            ,{" "}
            <Link href="/relance-devis-btp" className="font-semibold text-[#1d4ed8] underline-offset-4 hover:underline">
              relances devis
            </Link>
            .
          </div>
        </section>

        <h2>{TUTO_TITRE.aQuoi}</h2>
        <ul>
          <li>Aligner prix, unités et quantités sur le bordereau (BPU / DQE / DPGF selon marché).</li>
          <li>Tracer les hypothèses (zones, interfaces, variantes) pour éviter les écarts après signature.</li>
          <li>Préparer arbitrage interne : marge, risques, délais de mobilisation.</li>
        </ul>

        <h2>{TUTO_TITRE.quand}</h2>
        <ul>
          <li>Après lecture RC + CCTP + pièces de prix, et avant engagement sur une date de remise.</li>
          <li>Quand les questions techniques majeures sont soit levées, soit formalisées comme réserves dans l’offre (si permis).</li>
        </ul>

        <h2>{TUTO_TITRE.etapes}</h2>
        <ol>
          <li>Importer / structurer le bordereau : unités, quantités, postes optionnels / variantes.</li>
          <li>Lister les zones d’ambiguïté (interfaces, reprises, accès, délais imposés).</li>
          <li>Poser des hypothèses écrites par poste sensible (méthode, décomposition, sous-détail).</li>
          <li>Croiser planning interne et jalons client (pénalités, phasage imposé).</li>
          <li>Contrôler cohérence totaux / sous-totaux et exclusions (fourniture / pose).</li>
          <li>Prévoir relecture croisée : technique + chiffrage + administratif avant envoi.</li>
        </ol>

        <h2>{TUTO_TITRE.erreurs}</h2>
        <ul>
          <li>Chiffrer sur une quantité ou une unité erronée (non détectée au passage BPU).</li>
          <li>Oublier une variante mentionnée dans une annexe ou une Q/R.</li>
          <li>Mélanger prix unitaire et prix global sans le dire.</li>
          <li>Ne pas provisionner interfaces ou reprises quand le CCTP est ambigu.</li>
        </ul>

        <h2>{TUTO_TITRE.exemple}</h2>
        <p>
          <strong>Règle simple.</strong> Pour chaque poste à risque : quantité + prix + hypothèse 1 ligne + responsable validation interne.
          Cela évite le débat “on avait compris quoi ?” après attribution.
        </p>

        <section className="not-prose" id="faq" style={{ scrollMarginTop: "6rem" }}>
          <h2 className="mt-12 border-b border-slate-200 pb-3 text-xl font-bold">{TUTO_TITRE.faq}</h2>
          <dl className="mt-5 space-y-4">
            {FAQ_ITEMS.map((item) => (
              <div key={item.q} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <dt className="font-semibold text-black">{item.q}</dt>
                <dd className="mt-2 text-sm text-slate-700">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="not-prose" aria-label="CTA">
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
            <p className="text-base font-bold text-slate-900">Relais administratif autour des devis et dossiers</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <CalendlyBookingLink className="inline-flex rounded-lg bg-[#1d4ed8] px-6 py-3 font-semibold text-white hover:bg-[#1e40af]">
                Contacter BeWork
              </CalendlyBookingLink>
              <Link href="/assistants-administratifs-taches" className="inline-flex rounded-lg border border-slate-200 px-6 py-3 font-semibold text-slate-900 hover:bg-slate-50">
                Missions
              </Link>
            </div>
          </div>
        </section>
      </SeoLandingPage>
    </>
  );
}
