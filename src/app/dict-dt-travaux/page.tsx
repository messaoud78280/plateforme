import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import Link from "next/link";
import { landingPageMetadataFromPath } from "@/lib/seo-landing-metadata";

const PAGE_PATH = "/dict-dt-travaux";

export const metadata = landingPageMetadataFromPath(PAGE_PATH);

export default function Page() {
  const faq = [
    {
      q: "Quelle est la différence entre DT et DICT ?",
      a: "DT = déclaration de projet de travaux (en amont). DICT = déclaration d’intention de commencement de travaux (avant intervention). Dans les deux cas, le point clé est le suivi des pièces, réponses et échéances.",
    },
    {
      q: "Quand faut-il préparer une DICT avant travaux ?",
      a: "Le plus tôt possible, dès que la date de démarrage se précise. L’objectif : éviter de bloquer le chantier à cause d’un dossier incomplet ou de réponses non suivies.",
    },
    {
      q: "Pourquoi suivre les récépissés et réponses exploitants ?",
      a: "Parce que c’est ce qui évite les oublis et les blocages au démarrage : qui a répondu, quoi manque, quelle échéance, quelle prochaine action. Sans suivi, le dossier se perd vite.",
    },
    {
      q: "BeWork peut-elle préparer le suivi DICT/DT ?",
      a: "Oui : checklist des informations, préparation du dossier côté bureau, tableau de suivi, suivi des accusés/réponses, relances, classement et rappels d’échéances. Vous validez les informations et ce qui engage votre entreprise.",
    },
    {
      q: "Qui reste responsable des informations déclarées ?",
      a: "Votre entreprise. BeWork organise et suit le dossier, mais vous gardez la responsabilité réglementaire, la validation des informations chantier et les décisions opérationnelles.",
    },
    {
      q: "Comment éviter qu’une DICT bloque un démarrage chantier ?",
      a: "Centraliser les infos chantier, vérifier adresse/emprise/dates, suivre les réponses, relancer si besoin et classer les récépissés. L’objectif : un dossier complet et retrouvable avant la date de démarrage.",
    },
  ] as const;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <SeoLandingPage
      description="DICT/DT : informations chantier, accusés, réponses et échéances. Une méthode simple pour éviter les oublis et démarrer le chantier à l’heure."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "DICT / DT", href: PAGE_PATH },
      ]}
      h1="DICT / DT travaux : organisez vos démarches avant le démarrage chantier"
      intro={
        <>
          Une DICT/DT mal suivie peut retarder un démarrage chantier, créer des oublis et compliquer la coordination. Ici,
          l’objectif est simple : préparer un dossier clair, suivre les accusés/réponses, relancer si besoin et retrouver
          les pièces au bon moment.
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h2>À quoi servent les DICT/DT ?</h2>
      <p>
        Sans entrer dans un cours juridique : la DT (déclaration de projet de travaux) et la DICT (déclaration d’intention
        de commencement de travaux) servent à identifier les réseaux et à sécuriser l’intervention avant travaux. Ce qui fait
        la différence au quotidien : un dossier suivi, complet et retrouvable.
      </p>

      <h2>Pourquoi ces démarches sont souvent mal suivies</h2>
      <ul>
        <li>Informations chantier dispersées (adresse, emprise, plans, dates)</li>
        <li>Dates de démarrage qui bougent, et le dossier ne suit pas</li>
        <li>Récépissés / accusés non classés</li>
        <li>Réponses exploitants oubliées</li>
        <li>Pas de tableau de suivi ni de relances</li>
        <li>Documents introuvables au moment du démarrage</li>
      </ul>

      <h2>Méthode simple pour suivre un dossier DICT/DT</h2>
      <ul>
        <li>Rassembler les informations chantier (adresse, emprise, plans, dates, intervenants)</li>
        <li>Vérifier les éléments sensibles (précision de l’adresse, zones, échéances)</li>
        <li>Lister les déclarations à faire et les pièces à obtenir</li>
        <li>Suivre les réponses, récépissés et accusés</li>
        <li>Classer et retrouver les pièces par chantier</li>
        <li>Relancer si nécessaire et signaler les éléments manquants</li>
      </ul>

      <h2>Ce que BeWork peut prendre en charge (côté bureau)</h2>
      <ul>
        <li>Checklist des informations nécessaires</li>
        <li>Préparation du dossier et classement des pièces</li>
        <li>Tableau de suivi des déclarations par chantier</li>
        <li>Suivi des accusés/réponses + relances si besoin</li>
        <li>Rappels d’échéances et alerte sur éléments manquants</li>
      </ul>

      <h2>Ce que vous gardez (validation finale)</h2>
      <ul>
        <li>Responsabilité réglementaire</li>
        <li>Validation des informations chantier transmises</li>
        <li>Choix techniques et sécurité terrain</li>
        <li>Décisions opérationnelles et engagements</li>
      </ul>

      <h2>Exemple concret</h2>
      <p>
        Avant un démarrage prévu la semaine suivante, BeWork peut vérifier les informations disponibles, préparer la checklist DICT/DT, suivre les
        réponses reçues, classer les récépissés et vous signaler les éléments manquants à valider.
      </p>

      <h2>Aller plus loin</h2>
      <ul>
        <li>
          <Link href="/assistants-administratifs-taches" className="font-semibold text-[#1d4ed8] underline-offset-4 hover:underline">
            Voir les missions BeWork
          </Link>
        </li>
        <li>
          <Link href="/notre-facon-de-travailler" className="font-semibold text-[#1d4ed8] underline-offset-4 hover:underline">
            Comprendre notre façon de travailler
          </Link>
        </li>
        <li>
          <Link href="/tarifs" className="font-semibold text-[#1d4ed8] underline-offset-4 hover:underline">
            Découvrir les forfaits
          </Link>
        </li>
        <li>
          <Link href="/chantier-mal-suivi" className="font-semibold text-[#1d4ed8] underline-offset-4 hover:underline">
            Chantier mal suivi : reprendre le contrôle
          </Link>
        </li>
        <li>
          <Link href="/ressources/analyse-dce-btp" className="font-semibold text-[#1d4ed8] underline-offset-4 hover:underline">
            Analyser un DCE (appels d’offres)
          </Link>
        </li>
      </ul>
    </SeoLandingPage>
  );
}

