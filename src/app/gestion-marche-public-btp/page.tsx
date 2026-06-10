import Link from "next/link";
import { SeoEnResumeBlock } from "@/components/seo/SeoContentBlocks";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { landingPageMetadataFromPath } from "@/lib/seo-landing-metadata";
import { buildFaqPageJsonLd, buildLandingServiceJsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";

const PAGE_PATH = "/gestion-marche-public-btp";
const PAGE_URL = absoluteUrl(PAGE_PATH);

export const metadata = landingPageMetadataFromPath(PAGE_PATH);

export default function Page() {
  const faq = [
    {
      q: "BeWork peut-il aider une entreprise déjà titulaire d’un marché public ?",
      a: "Oui : suivi administratif après attribution — situations, Chorus Pro, avenants documentés, DOE, relances et classement du dossier marché.",
    },
    {
      q: "BeWork peut-il suivre les bons de commande d’un accord-cadre ?",
      a: "Oui sur le volet suivi : échéances, pièces attendues, relances et traçabilité des bons émis — selon périmètre défini avec vous.",
    },
    {
      q: "Quelle différence avec un logiciel de gestion chantier ?",
      a: "Un logiciel stocke et planifie ; BeWork produit et suit les livrables administratifs (pièces marché, relances, dossiers) avec une validation humaine avant envoi.",
    },
    {
      q: "BeWork gère-t-il la sous-traitance marché public ?",
      a: "BeWork peut organiser le suivi documentaire (DC4, attestations, relances) — les engagements contractuels et validations restent chez le titulaire.",
    },
  ] as const;

  const faqLd = buildFaqPageJsonLd(faq, PAGE_URL);
  const serviceLd = buildLandingServiceJsonLd({
    name: "Gestion administrative de marché public BTP",
    description: "Suivi après attribution : situations, Chorus Pro, DOE, avenants et dossier marché.",
    pageUrl: PAGE_URL,
    serviceType: "Gestion marché public BTP",
  });

  return (
    <SeoLandingPage
      description="Gestion administrative de marché public BTP après attribution : situations, Chorus Pro, DOE, avenants et suivi documentaire."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Gestion marché public BTP", href: PAGE_PATH },
      ]}
      h1="Gestion administrative de marché public BTP après attribution"
      intro={
        <>
          Gagner un <strong>marché public travaux</strong> n&apos;est que le début : situations,{" "}
          <strong>facturation Chorus Pro</strong>, avenants, réserves, <strong>DOE BTP</strong> et relances
          administratives. BeWork tient le fil du <strong>suivi administratif marché public</strong> pendant que vous
          exécutez le chantier.
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }} />

      <SeoEnResumeBlock>
        <p>
          <strong>Gestion administrative de marché public</strong> : tout ce qui entoure l&apos;exécution contractuelle
          hors terrain — facturation, pièces obligatoires, délais CCAP, DOE, sous-traitance déclarée et traçabilité pour
          la réception.
        </p>
      </SeoEnResumeBlock>

      <h2>Pour qui ?</h2>
      <ul>
        <li>Titulaires de marchés à prix global, forfaitaires ou accords-cadres</li>
        <li>Entreprises générales et lots techniques avec peu de capacité bureau</li>
        <li>Conducteurs de travaux sur plusieurs marchés en parallèle</li>
      </ul>

      <h2>Ce que BeWork prend en charge</h2>
      <ul>
        <li>
          <Link href="/facturation-chorus-pro-btp" className="text-[#1d4ed8] hover:underline">
            Facturation Chorus Pro
          </Link>{" "}
          et situations de travaux
        </li>
        <li>Suivi des bons de commande (accord-cadre)</li>
        <li>Classement documentaire marché (CCTP, avenants, correspondances)</li>
        <li>
          <Link href="/services/doe-btp" className="text-[#1d4ed8] hover:underline">
            DOE BTP
          </Link>{" "}
          et pièces de fin de chantier
        </li>
        <li>Relances MOA/MOE et alertes sur échéances contractuelles</li>
      </ul>

      <h2>Comment ça se passe ?</h2>
      <ol>
        <li>Reprise du dossier marché (contrat, CCAP, planning administratif).</li>
        <li>Tableau de suivi : situations, DOE, réserves, sous-traitance.</li>
        <li>Production et relances selon le calendrier chantier.</li>
        <li>Points de validation avant tout envoi engageant.</li>
      </ol>

      <h2>Les erreurs que nous aidons à éviter</h2>
      <ul>
        <li>Pénalités liées à un retard de DOE ou de pièce contractuelle</li>
        <li>Factures rejetées faute de pièce ou de référence</li>
        <li>Avenants non formalisés qui fragilisent le CA</li>
        <li>Dossier marché incomplet en réception</li>
      </ul>

      <h2>Exemple concret</h2>
      <p>
        Accord-cadre multi-sites : BeWork suit les bons de commande émis, prépare les situations mensuelles, trace les
        relances Chorus Pro et compile le DOE lot par lot — le conducteur valide l&apos;avancement terrain.
      </p>

      <h2>Pourquoi BeWork ?</h2>
      <p>
        Spécialisation administratif BTP, pas de remplacement du conducteur de travaux, process cadré. Avant attribution,
        voir{" "}
        <Link href="/reponse-appel-offres-btp" className="text-[#1d4ed8] hover:underline">
          réponse aux appels d&apos;offres
        </Link>
        .
      </p>

      <h2>FAQ — gestion marché public</h2>
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
