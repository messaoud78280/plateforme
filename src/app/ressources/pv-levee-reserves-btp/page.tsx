import type { Metadata } from "next";
import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { TUTO_TITRE } from "@/components/seo/tuto-section-titles";
import { absoluteUrl } from "@/lib/site";

const pagePath = "/ressources/pv-levee-reserves-btp";
const pageUrl = absoluteUrl(pagePath);

const DESCRIPTION =
  "Tuto PV levée de réserves : quand lever, quoi tracer, preuves et clôture sans zone d’ombre.";

export const metadata: Metadata = {
  title: "PV de levée de réserves BTP | Méthode & traçabilité",
  description: DESCRIPTION,
  alternates: { canonical: pageUrl, languages: { fr: pageUrl, "x-default": pageUrl } },
  openGraph: {
    type: "article",
    locale: "fr_FR",
    url: pageUrl,
    siteName: "BeWork",
    title: "PV de levée de réserves BTP",
    description: DESCRIPTION,
    images: [{ url: absoluteUrl("/opengraph-image"), width: 1200, height: 630, alt: "PV levée réserves BTP — BeWork" }],
  },
  robots: { index: true, follow: true },
};

const FAQ_ITEMS = [
  {
    q: "Une levée partielle est-elle possible ?",
    a: "Souvent oui selon le cadre contractuel : le PV doit dire clairement ce qui est levé, ce qui reste, et les prochaines échéances pour le solde.",
  },
  {
    q: "BeWork peut-elle rédiger le PV ?",
    a: "BeWork peut structurer le document à partir de vos constats et pièces, assurer la cohérence des statuts et le suivi des actions. La validation finale reste côté entreprise et parties au marché.",
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

export default function PvLeveeReservesBtpPage() {
  return (
    <>
      <FaqJsonLd />
      <SeoLandingPage
        description={DESCRIPTION}
        h1="PV de levée de réserves : clôturer sans ambiguïté"
        intro={
          <>
            Ce tuto vise la <strong>traçabilité</strong> : quoi lever, avec quelle preuve, qui valide, et quelles réserves restent ouvertes.
            Il complète le suivi des dossiers (<Link href="/chantier-mal-suivi">chantier mal suivi</Link>).
          </>
        }
        breadcrumbItems={[
          { name: "Accueil", href: "/" },
          { name: "Ressources", href: "/ressources" },
          { name: "PV levée de réserves", href: pagePath },
        ]}
      >
        <h2>{TUTO_TITRE.aQuoi}</h2>
        <ul>
          <li>Formaliser ce qui est corrigé ou accepté à une date donnée.</li>
          <li>Éviter le flou entre “presque fini” et “levé”.</li>
          <li>Préparer la suite (garantie, SAV, derniers documents DOE).</li>
        </ul>

        <h2>{TUTO_TITRE.quand}</h2>
        <ul>
          <li>Après corrections constatées sur site ou preuves fournies (photos, documents).</li>
          <li>Avant une réception partielle ou une échéance contractuelle.</li>
          <li>Quand toutes les parties peuvent signer / valider le constat.</li>
        </ul>

        <h2>{TUTO_TITRE.etapes}</h2>
        <ol>
          <li>Lister les réserves d’origine (référence au PV ou document source).</li>
          <li>Pour chaque point : statut (levé / reste / reporté), date, preuve jointe.</li>
          <li>Indiquer responsables et suites si une réserve reste ouverte.</li>
          <li>Joindre photos / attestations si le marché les exige.</li>
          <li>Faire signer / valider selon le circuit prévu (interne + contreparties).</li>
          <li>Archiver une version PDF unique dans le dossier chantier.</li>
        </ol>

        <h2>{TUTO_TITRE.erreurs}</h2>
        <ul>
          <li>Libellés vagues (“OK vu chantier”) sans référence à la réserve initiale.</li>
          <li>Oublier les réserves annexes ou hors lot qui réapparaissent en fin de garantie.</li>
          <li>Ne pas tracer les suites pour les points non levés.</li>
        </ul>

        <h2>{TUTO_TITRE.exemple}</h2>
        <p>
          <strong>Tableau minimal.</strong> Réserve n° — description initiale — action réalisée — preuve — statut levé ou restant — prochaine échéance / resp.
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
            <p className="font-bold text-slate-900">Suivi réserves, preuves et documents chantier</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <CalendlyBookingLink className="inline-flex rounded-lg bg-[#1d4ed8] px-6 py-3 font-semibold text-white hover:bg-[#1e40af]">
                Réserver un appel
              </CalendlyBookingLink>
              <Link href="/ressources" className="inline-flex rounded-lg border border-slate-200 px-6 py-3 font-semibold text-slate-900 hover:bg-slate-50">
                Ressources
              </Link>
            </div>
          </div>
        </section>
      </SeoLandingPage>
    </>
  );
}
