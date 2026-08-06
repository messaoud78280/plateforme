import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { SeoEnResumeBlock } from "@/components/seo/SeoContentBlocks";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { landingPageMetadataFromPath } from "@/lib/seo-landing-metadata";
import { buildFaqPageJsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";

const PAGE_PATH = "/comparatif-assistance-travaux-btp";
const PAGE_URL = absoluteUrl(PAGE_PATH);

const COMPARISON_ROWS = [
  {
    critere: "Périmètre métier BTP",
    recruter: "Dépend du profil recruté — formation chantier nécessaire",
    generaliste: "Courrier, saisie, agenda — peu de lecture DCE/CCTP",
    bework: "Plateforme interne métier : AO, DCE, chantiers, marchés publics",
  },
  {
    critere: "Analyse DCE & appels d'offres",
    recruter: "Possible si profil formé — charge à monter en interne",
    generaliste: "Hors compétence métier en pratique",
    bework: "Modules synthèse RC/CCAP/CCTP, mémoire technique, checklists dépôt",
  },
  {
    critere: "Marchés publics & Chorus Pro",
    recruter: "À organiser en interne (process, outils)",
    generaliste: "Rarement structuré pour l'exécution MP",
    bework: "Situations, relances, anti-pénalités, DOE — selon modules déployés",
  },
  {
    critere: "Coût & flexibilité",
    recruter: "Coût fixe (salaire + charges) — peu adaptable aux pics",
    generaliste: "Souvent forfait horaire ou saisie — hors dossiers lourds",
    bework: "Tarification sur étude, montée en charge progressive",
  },
  {
    critere: "Délai de mise en route",
    recruter: "Recrutement, onboarding, outils — plusieurs semaines/mois",
    generaliste: "Rapide mais périmètre souvent générique",
    bework: "Diagnostic + configuration plateforme (selon périmètre)",
  },
  {
    critere: "Validation & engagement",
    recruter: "Poste interne — vigilance sur signatures engageantes",
    generaliste: "Risque d'envoi sans relecture technique",
    bework: "Circuit explicite : vos équipes préparent, vous validez avant envoi",
  },
] as const;

export const metadata = landingPageMetadataFromPath(PAGE_PATH);

export default function Page() {
  const faq = [
    {
      q: "BeWork remplace-t-il un recrutement interne ?",
      a: "Non. BeWork déploie une plateforme interne pertinente quand la charge varie, avant une embauche, ou pour absorber pics AO et clôture marché. Un poste interne reste adapté si le besoin est stable à temps plein.",
    },
    {
      q: "En quoi BeWork diffère d'un prestataire administratif généraliste ?",
      a: "BeWork est éditeur de plateforme BTP : lots, CCTP, DCE, situations marché public, réserves, DOE. Ce n'est pas du courrier ni de la saisie générique — vos équipes utilisent l'outil ; BeWork configure et fait évoluer.",
    },
    {
      q: "Peut-on combiner la plateforme et une personne en interne ?",
      a: "Oui. La plateforme peut absorber la surcharge (appels d'offres, DOE, relances MOE) pendant que votre équipe garde le quotidien interne.",
    },
    {
      q: "Comment est établie la tarification ?",
      a: "Sur étude selon modules, volume et formule. La méthode est décrite sur /tarifs — sans prix inventés hors cadrage.",
    },
  ] as const;

  const faqLd = buildFaqPageJsonLd(faq, PAGE_URL);

  return (
    <SeoLandingPage
      description="Recruter, outil admin générique ou plateforme BeWork ? Comparatif pour entreprises BTP : périmètre, DCE, marchés publics, coût et validation."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Comparatif assistance travaux BTP", href: PAGE_PATH },
      ]}
      h1="Recruter, outil générique ou plateforme BeWork : le comparatif BTP"
      intro={
        <>
          Dirigeant ou conducteur de travaux : faut-il <strong>recruter</strong>, passer par un{" "}
          <strong>outil ou prestataire administratif généraliste</strong>, ou déployer une{" "}
          <strong>plateforme interne BTP</strong> avec BeWork ? Ce tableau aide à arbitrer — sans promesse de « tout
          faire à votre place » : vous gardez prix, technique et signatures.
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <SeoEnResumeBlock>
        <p>
          <strong>Quand choisir BeWork ?</strong> Charge variable, pics d&apos;appels d&apos;offres, marchés publics à
          suivre, conducteurs saturés — et besoin d&apos;un environnement qui comprend DCE, Chorus Pro et DOE, pas une
          saisie générique. Vos équipes utilisent ; BeWork configure et fait évoluer.
        </p>
      </SeoEnResumeBlock>

      <h2>Tableau comparatif</h2>
      <div className="not-prose overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th scope="col" className="p-3 font-semibold text-black">
                Critère
              </th>
              <th scope="col" className="p-3 font-semibold text-black">
                Recruter en interne
              </th>
              <th scope="col" className="p-3 font-semibold text-black">
                Prestataire / outil admin. généraliste
              </th>
              <th scope="col" className="p-3 font-semibold text-[#1d4ed8]">
                BeWork — plateforme interne
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row) => (
              <tr key={row.critere} className="border-b border-slate-100 align-top">
                <th scope="row" className="p-3 font-medium text-black">
                  {row.critere}
                </th>
                <td className="p-3 text-slate-700">{row.recruter}</td>
                <td className="p-3 text-slate-700">{row.generaliste}</td>
                <td className="p-3 text-slate-800">{row.bework}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Quand recruter reste pertinent</h2>
      <ul>
        <li>Besoin bureau stable et quotidien à temps plein</li>
        <li>Présence physique indispensable sur site</li>
        <li>Volume constant de flux internes (RH, accueil, comptabilité courante)</li>
      </ul>

      <h2>Quand un outil ou prestataire généraliste suffit</h2>
      <ul>
        <li>Flux administratif hors chantier (courrier, facturation simple hors BTP)</li>
        <li>Pas de dossiers marché public, DCE ou clôture DOE</li>
      </ul>

      <h2>Quand BeWork est le plus adapté</h2>
      <ul>
        <li>Appels d&apos;offres, analyse DCE, mémoires techniques</li>
        <li>Exécution marché public : situations, Chorus Pro, réserves, DOE</li>
        <li>Conducteurs débordés sur plusieurs chantiers</li>
        <li>PME qui veut structurer avant d&apos;embaucher</li>
      </ul>

      <h2>Aller plus loin</h2>
      <ul>
        <li>
          <Link href="/tarifs" className="text-[#1d4ed8] hover:underline">
            Méthode de tarification
          </Link>
        </li>
        <li>
          <Link href="/assistants-administratifs-taches" className="text-[#1d4ed8] hover:underline">
            Capacités plateforme
          </Link>
        </li>
        <li>
          <Link href="/admin-btp-sans-recruter" className="text-[#1d4ed8] hover:underline">
            Tenir le bureau sans recruter
          </Link>
        </li>
        <li>
          <Link href="/cas-clients" className="text-[#1d4ed8] hover:underline">
            Cas clients BTP
          </Link>
        </li>
        <li>
          <CalendlyBookingLink className="text-[#1d4ed8] hover:underline">
            Demander une démonstration
          </CalendlyBookingLink>
        </li>
      </ul>

      <h2>FAQ — choisir son mode d&apos;organisation</h2>
      <dl>
        {faq.map((item) => (
          <div key={item.q} className="mb-6">
            <dt className="font-semibold text-black">{item.q}</dt>
            <dd className="mt-1 text-black">{item.a}</dd>
          </div>
        ))}
      </dl>
    </SeoLandingPage>
  );
}
