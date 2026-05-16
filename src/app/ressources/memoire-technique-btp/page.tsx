import type { Metadata } from "next";
import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { TUTO_TITRE } from "@/components/seo/tuto-section-titles";
import { absoluteUrl } from "@/lib/site";

const pagePath = "/ressources/memoire-technique-btp";
const pageUrl = absoluteUrl(pagePath);

const DESCRIPTION =
  "Tuto mémoire technique BTP : critères jury, structure, preuves et planning méthode avant dépôt.";

export const metadata: Metadata = {
  title: "Mémoire technique BTP | Méthode, structure & appel d’offres",
  description: DESCRIPTION,
  alternates: { canonical: pageUrl, languages: { fr: pageUrl, "x-default": pageUrl } },
  openGraph: {
    type: "article",
    locale: "fr_FR",
    url: pageUrl,
    siteName: "BeWork",
    title: "Mémoire technique BTP | Méthode et structure",
    description: DESCRIPTION,
    images: [{ url: absoluteUrl("/opengraph-image"), width: 1200, height: 630, alt: "Mémoire technique BTP — BeWork" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mémoire technique BTP | BeWork",
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

const FAQ_ITEMS = [
  {
    q: "Le mémoire technique suffit-il à gagner un marché ?",
    a: "Non : il est souvent un critère important, mais le prix, les capacités et le dossier administratif comptent aussi. Le mémoire sert à démontrer méthode, moyens et compréhension du besoin.",
  },
  {
    q: "Dois-je reprendre les intitulés demandés dans le RC ?",
    a: "En général oui : respecter la structure, les formats et les questions posées évite l’élimination sur forme et facilite la lecture du jury.",
  },
  {
    q: "BeWork peut-elle rédiger le mémoire à ma place ?",
    a: "BeWork peut aider à structurer, harmoniser, compléter les pièces et préparer une version prête à valider. La signature et la validation technique finale restent chez vous.",
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

export default function MemoireTechniqueBtpPage() {
  return (
    <>
      <FaqJsonLd />
      <SeoLandingPage
        description={DESCRIPTION}
        h1="Mémoire technique BTP : structure utile avant dépôt"
        intro={
          <>
            Après la <Link href="/ressources/analyse-dce-btp">lecture du DCE</Link>, le mémoire technique traduit votre compréhension du marché.
            L’objectif : répondre aux <strong>critères du jury</strong>, sans disperser l’information ni sur-promettre.
          </>
        }
        breadcrumbItems={[
          { name: "Accueil", href: "/" },
          { name: "Ressources", href: "/ressources" },
          { name: "Mémoire technique BTP", href: pagePath },
        ]}
      >
        <section className="not-prose">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-[13px] font-semibold text-slate-800">En bref</p>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
              Contenu exact = RC + grilles d’évaluation + CCTP. Ce tuto donne une trame générale ; adaptez au dossier et à la procédure.
            </p>
          </div>
        </section>

        <h2>{TUTO_TITRE.aQuoi}</h2>
        <ul>
          <li>Répondre explicitement aux exigences du RC (méthode, organisation, moyens, délais).</li>
          <li>Montrer votre capacité à exécuter le lot (interfaces, phasage, risques).</li>
          <li>Faciliter la notation : jurés pressés, repères visuels clairs, pièces jointes conformes.</li>
        </ul>

        <h2>{TUTO_TITRE.quand}</h2>
        <ul>
          <li>Une fois le GO / NO-GO donné après analyse du DCE.</li>
          <li>Quand les hypothèses techniques et le planning interne sont cadrés.</li>
          <li>Avant de figer le chiffrage et les engagements forts dans l’offre.</li>
        </ul>

        <h2>{TUTO_TITRE.etapes}</h2>
        <ol>
          <li>Recopier la structure demandée (titres, ordre, formats, longueurs max).</li>
          <li>Extraire les critères de notation du RC et les mapper en tableau “exigence → réponse → preuve”.</li>
          <li>Rédiger méthode + moyens + planning : jalons, interfaces MOA/MOE, coactivité.</li>
          <li>Joindre références pertinentes (sans surcharger) et schémas si autorisés.</li>
          <li>Relire avec la grille : chaque critère a une réponse identifiable.</li>
          <li>Contrôler les pièces jointes listées dans le DCE (formats, mentions, signatures).</li>
        </ol>

        <h2>{TUTO_TITRE.erreurs}</h2>
        <ul>
          <li>Généralités marketing qui ne répondent pas aux questions du RC.</li>
          <li>Copier-coller d’un ancien mémoire sans adaptation au lot.</li>
          <li>Oublier interfaces, phasage, accès chantier ou coactivité.</li>
          <li>Incohérence avec le prix ou les délais annoncés dans l’offre.</li>
          <li>Annexes hors format ou trop lourdes : risque de non-conformité au dépôt.</li>
        </ul>

        <h2>{TUTO_TITRE.exemple}</h2>
        <p>
          <strong>Trame courte.</strong> 1) Compréhension du besoin (références aux articles CCTP). 2) Méthode d’exécution (phasage, planning
          type). 3) Moyens et organisation (effectifs clés, chef de chantier, sous-traitance identifiée). 4) Qualité / sécurité /
          environnement selon critères. 5) Pièces & références demandées.
        </p>

        <section className="not-prose" id="faq" aria-label="FAQ mémoire technique" style={{ scrollMarginTop: "6rem" }}>
          <h2 className="mt-12 border-b border-slate-200 pb-3 text-xl font-bold tracking-tight text-black md:text-2xl">{TUTO_TITRE.faq}</h2>
          <dl className="mt-5 space-y-4">
            {FAQ_ITEMS.map((item) => (
              <div key={item.q} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <dt className="text-base font-semibold text-black">{item.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-slate-700">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="not-prose" aria-label="CTA">
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
            <p className="text-base font-bold text-slate-900">Structurer mémoire, pièces et relais administratif</p>
            <p className="mt-2 text-sm text-slate-700">BeWork peut aider à cadrer le dossier de réponse et le suivi documents — vous validez le fond.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <CalendlyBookingLink className="inline-flex rounded-lg bg-[#1d4ed8] px-6 py-3 font-semibold text-white hover:bg-[#1e40af]">
                Réserver un échange
              </CalendlyBookingLink>
              <Link href="/assistants-administratifs-taches" className="inline-flex rounded-lg border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-900 hover:bg-slate-50">
                Voir les missions
              </Link>
              <Link href="/ressources/analyse-dce-btp" className="inline-flex rounded-lg border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-900 hover:bg-slate-50">
                Tuto analyse DCE
              </Link>
            </div>
          </div>
        </section>
      </SeoLandingPage>
    </>
  );
}
