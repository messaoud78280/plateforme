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
      a: "Oui : assistance technique et administrative après attribution en 7 blocs — démarrage, documents d’exécution, milieu occupé, amiante SS4, Chorus Pro, réserves et DOE. Détail sur la page missions et cette landing.",
    },
    {
      q: "BeWork peut-il suivre les bons de commande d’un accord-cadre ?",
      a: "Oui sur le volet suivi : échéances, pièces attendues, relances et traçabilité des bons émis — selon périmètre défini avec vous.",
    },
    {
      q: "Quelle différence avec un logiciel de gestion chantier ?",
      a: "Un logiciel stocke et planifie ; BeWork produit et suit les livrables techniques et documentaires (pièces marché, situations, relances, DOE) avec validation humaine avant envoi.",
    },
    {
      q: "BeWork gère-t-il la sous-traitance marché public ?",
      a: "BeWork peut organiser le suivi documentaire (DC4, attestations, relances) — les engagements contractuels et validations restent chez le titulaire.",
    },
  ] as const;

  const faqLd = buildFaqPageJsonLd(faq, PAGE_URL);
  const serviceLd = buildLandingServiceJsonLd({
    name: "Exécution marché public BTP — assistance technique et administrative",
    description:
      "Assistance technique et administrative après attribution : documents d'exécution, situations Chorus Pro, anti-pénalités, réserves et DOE.",
    pageUrl: PAGE_URL,
    serviceType: "Assistance technique exécution marché public BTP",
  });

  return (
    <SeoLandingPage
      description="Assistance technique et administrative après attribution de marché public BTP : situations, Chorus Pro, réserves, DOE et suivi documentaire."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Exécution marché public BTP", href: PAGE_PATH },
      ]}
      h1="Exécution marché public BTP : sécuriser le suivi après attribution"
      intro={
        <>
          Gagner un <strong>marché public travaux</strong> n&apos;est que le début : documents d&apos;exécution,{" "}
          <strong>situations de travaux</strong>, <strong>facturation Chorus Pro</strong>, réserves,{" "}
          <strong>DOE BTP</strong> et relances MOE/MOA. BeWork structure l&apos;
          <strong>assistance technique et administrative</strong> de l&apos;exécution pendant que vous tenez le
          chantier — validation finale chez vous.
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }} />

      <SeoEnResumeBlock>
        <p>
          <strong>Exécution de marché public BTP</strong> : tout ce qui entoure l&apos;exécution contractuelle hors
          terrain — démarrage marché, documents d&apos;exécution et visas, facturation Chorus Pro, pièces obligatoires,
          tableau anti-pénalités, réserves et DOE pour la réception. BeWork ne fait pas les travaux : BeWork sécurise
          le suivi documentaire et administratif pour que le chantier soit payé, réceptionné et protégé contre les
          pénalités.
        </p>
      </SeoEnResumeBlock>

      <h2>Les 7 blocs d&apos;exécution BeWork</h2>
      <p>
        Le détail opérationnel est structuré sur la{" "}
        <Link href="/assistants-administratifs-taches#marches-publics-accords-cadres" className="text-[#1d4ed8] hover:underline">
          page missions — section marchés publics
        </Link>{" "}
        : démarrage administratif, documents et visas, planning et réunions, milieu occupé / amiante SS4, situations et
        Chorus Pro, réserves et preuves, DOE et clôture.
      </p>

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
        <li>
          <Link href="/assistants-administratifs-taches#marches-publics-accords-cadres" className="text-[#1d4ed8] hover:underline">
            Exécution marché public (7 blocs)
          </Link>{" "}
          : bons de commande, logement occupé, ECF, SS4, anti-pénalités
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
        Spécialisation BTP terrain et administrative, pas de remplacement du conducteur de travaux, process cadré et
        validation avant envoi. Avant attribution, voir{" "}
        <Link href="/reponse-appel-offres-btp" className="text-[#1d4ed8] hover:underline">
          réponse aux appels d&apos;offres
        </Link>{" "}
        ou la{" "}
        <Link href="/assistants-administratifs-taches#reponses-appels-offres" className="text-[#1d4ed8] hover:underline">
          section AO sur la page missions
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
