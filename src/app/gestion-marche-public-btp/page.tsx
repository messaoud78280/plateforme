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
      q: "La plateforme BeWork aide-t-elle une entreprise déjà titulaire d’un marché public ?",
      a: "Oui : capacités d’exécution après attribution structurées en 7 blocs — démarrage, documents d’exécution, milieu occupé, amiante SS4, Chorus Pro, réserves et DOE. Vos équipes utilisent ; BeWork configure et fait évoluer.",
    },
    {
      q: "Peut-on suivre les bons de commande d’un accord-cadre dans la plateforme ?",
      a: "Oui sur le volet suivi : échéances, pièces attendues, relances et traçabilité des bons émis — selon périmètre défini au déploiement.",
    },
    {
      q: "Quelle différence avec un logiciel de gestion chantier générique ?",
      a: "Un logiciel générique stocke et planifie ; BeWork est une plateforme métier BTP pour pièces marché, situations, relances et DOE, avec validation humaine avant envoi — BeWork n’exécute pas à votre place.",
    },
    {
      q: "La plateforme couvre-t-elle le suivi documentaire de sous-traitance marché public ?",
      a: "Oui : organisation du suivi documentaire (DC4, attestations, relances) — les engagements contractuels et validations restent chez le titulaire.",
    },
  ] as const;

  const faqLd = buildFaqPageJsonLd(faq, PAGE_URL);
  const serviceLd = buildLandingServiceJsonLd({
    name: "Exécution marché public BTP — plateforme BeWork",
    description:
      "Plateforme interne après attribution : documents d'exécution, situations Chorus Pro, anti-pénalités, réserves et DOE.",
    pageUrl: PAGE_URL,
    serviceType: "Plateforme exécution marché public BTP",
  });

  return (
    <SeoLandingPage
      description="Plateforme BeWork pour l’exécution marché public BTP : situations, Chorus Pro, réserves, DOE et suivi documentaire — vos équipes utilisent ; BeWork configure."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Exécution marché public BTP", href: PAGE_PATH },
      ]}
      h1="Exécution marché public BTP : plateforme pour sécuriser le suivi après attribution"
      intro={
        <>
          Gagner un <strong>marché public travaux</strong> n&apos;est que le début : documents d&apos;exécution,{" "}
          <strong>situations de travaux</strong>, <strong>facturation Chorus Pro</strong>, réserves,{" "}
          <strong>DOE BTP</strong> et relances MOE/MOA. BeWork déploie une <strong>plateforme interne</strong> pour
          structurer l&apos;exécution pendant que vous tenez le chantier — vos équipes utilisent ; BeWork configure et
          fait évoluer. Validation finale chez vous.
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }} />

      <SeoEnResumeBlock>
        <p>
          <strong>Exécution de marché public BTP</strong> : tout ce qui entoure l&apos;exécution contractuelle hors
          terrain — démarrage marché, documents d&apos;exécution et visas, facturation Chorus Pro, pièces obligatoires,
          tableau anti-pénalités, réserves et DOE pour la réception. BeWork ne fait pas les travaux : BeWork équipe la
          plateforme pour que vos équipes sécurisent le suivi documentaire et administratif.
        </p>
      </SeoEnResumeBlock>

      <h2>Les 7 blocs d&apos;exécution dans la plateforme</h2>
      <p>
        Le détail opérationnel est structuré sur la{" "}
        <Link href="/assistants-administratifs-taches#marches-publics-accords-cadres" className="text-[#1d4ed8] hover:underline">
          page capacités — section marchés publics
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

      <h2>Ce que la plateforme structure</h2>
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
        <li>Reprise du dossier marché (contrat, CCAP, planning administratif) dans l&apos;environnement BeWork.</li>
        <li>Tableau de suivi : situations, DOE, réserves, sous-traitance.</li>
        <li>Production et relances selon le calendrier chantier — par vos équipes.</li>
        <li>Points de validation avant tout envoi engageant.</li>
      </ol>

      <h2>Les erreurs que la plateforme aide à éviter</h2>
      <ul>
        <li>Pénalités liées à un retard de DOE ou de pièce contractuelle</li>
        <li>Factures rejetées faute de pièce ou de référence</li>
        <li>Avenants non formalisés qui fragilisent le CA</li>
        <li>Dossier marché incomplet en réception</li>
      </ul>

      <h2>Exemple concret</h2>
      <p>
        Accord-cadre multi-sites : la plateforme suit les bons de commande émis, structure les situations mensuelles,
        trace les relances Chorus Pro et compile le DOE lot par lot — le conducteur valide l&apos;avancement terrain.
      </p>

      <h2>Pourquoi BeWork ?</h2>
      <p>
        Plateformes internes intelligentes pour le BTP — terrain et administratif, sans remplacement du conducteur de
        travaux, process cadré et validation avant envoi. Avant attribution, voir{" "}
        <Link href="/reponse-appel-offres-btp" className="text-[#1d4ed8] hover:underline">
          réponse aux appels d&apos;offres
        </Link>{" "}
        ou la{" "}
        <Link href="/assistants-administratifs-taches#reponses-appels-offres" className="text-[#1d4ed8] hover:underline">
          section AO sur les capacités plateforme
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
