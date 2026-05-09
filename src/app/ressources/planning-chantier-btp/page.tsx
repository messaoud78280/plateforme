import type { Metadata } from "next";
import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { TUTO_TITRE } from "@/components/seo/tuto-section-titles";
import { absoluteUrl } from "@/lib/site";

const pagePath = "/ressources/planning-chantier-btp";
const pageUrl = absoluteUrl(pagePath);

const DESCRIPTION =
  "Tuto pratique : planning chantier BTP — jalons, dépendances, coactivité et tableaux simples pour synchroniser terrain et bureau.";

export const metadata: Metadata = {
  title: "Planning chantier BTP | Jalons & pilotage",
  description: DESCRIPTION,
  alternates: { canonical: pageUrl, languages: { fr: pageUrl, "x-default": pageUrl } },
  openGraph: {
    type: "article",
    locale: "fr_FR",
    url: pageUrl,
    siteName: "BeWork",
    title: "Planning chantier BTP",
    description: DESCRIPTION,
    images: [{ url: absoluteUrl("/opengraph-image"), width: 1200, height: 630, alt: "Planning chantier BTP — BeWork" }],
  },
  robots: { index: true, follow: true },
};

const FAQ_ITEMS = [
  {
    q: "Quelle différence avec un suivi de dossier administratif ?",
    a: "Le planning cible le temps et les dépendances (qui bloque quoi). Le dossier administratif couvre preuves, comptes rendus, réserves. Les deux se complètent — voir aussi le suivi chantier global.",
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

export default function PlanningChantierBtpPage() {
  return (
    <>
      <FaqJsonLd />
      <SeoLandingPage
        description={DESCRIPTION}
        h1="Planning chantier BTP : jalons lisibles pour tout le monde"
        intro={
          <>
            Un planning utile n’est pas forcément un Gantt de 40 pages : ce tuto propose une{" "}
            <strong>lecture terrain + bureau</strong> avec peu de colonnes et des statuts clairs. Pour un tableau de suivi global, voir aussi{" "}
            <Link href="/chantier-mal-suivi">chantier mal suivi</Link>.
          </>
        }
        breadcrumbItems={[
          { name: "Accueil", href: "/" },
          { name: "Ressources", href: "/ressources" },
          { name: "Planning chantier BTP", href: pagePath },
        ]}
      >
        <h2>{TUTO_TITRE.aQuoi}</h2>
        <ul>
          <li>Anticiper les dépendances (appro, accès, validations, livraisons).</li>
          <li>Donner une vision partagée au client et aux corps de métier.</li>
          <li>Réduire les “je croyais que c’était pour la semaine prochaine”.</li>
        </ul>

        <h2>{TUTO_TITRE.quand}</h2>
        <ul>
          <li>Dès le démarrage ou la reprise après aléa majeur.</li>
          <li>Avant chaque réunion de coordination (point d’étape figé).</li>
          <li>Quand plusieurs lots se chevauchent (coactivité à afficher).</li>
        </ul>

        <h2>{TUTO_TITRE.etapes}</h2>
        <ol>
          <li>Lister les jalons clés (gros œuvre, fermeture, essais, OPR…).</li>
          <li>Pour chaque jalon : entrées nécessaires (plans validés, matériaux, accès).</li>
          <li>Ajouter une colonne “bloquant actuel” et une “prochaine action” avec date.</li>
          <li>Synchroniser avec le chiffrage / appro (dates réalistes, pas seulement souhaitées).</li>
          <li>Mettre à jour après chaque réunion ou aléa (sinon le planning ment).</li>
        </ol>

        <h2>{TUTO_TITRE.erreurs}</h2>
        <ul>
          <li>Dates sans propriétaire ni prérequis.</li>
          <li>Oublier les dépendances fournisseurs / sous-traitants.</li>
          <li>Planning figé dans un fichier que personne ne rouvre.</li>
        </ul>

        <h2>{TUTO_TITRE.exemple}</h2>
        <p>
          <strong>Minimum viable.</strong> Colonnes : tâche — commence — fin prévue — dépend de — responsable — statut. Une ligne “bloquant du jour” en haut de compte rendu suffit souvent.
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
            <p className="font-bold text-slate-900">Relire planning + dossiers avec BeWork</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <CalendlyBookingLink className="inline-flex rounded-lg bg-[#1d4ed8] px-6 py-3 font-semibold text-white hover:bg-[#1e40af]">
                Réserver un appel
              </CalendlyBookingLink>
              <Link href="/chantier-mal-suivi" className="inline-flex rounded-lg border border-slate-200 px-6 py-3 font-semibold text-slate-900 hover:bg-slate-50">
                Suivi chantier
              </Link>
            </div>
          </div>
        </section>
      </SeoLandingPage>
    </>
  );
}
