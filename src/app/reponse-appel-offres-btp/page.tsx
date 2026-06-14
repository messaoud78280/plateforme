import Link from "next/link";
import { SeoEnResumeBlock } from "@/components/seo/SeoContentBlocks";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { landingPageMetadataFromPath } from "@/lib/seo-landing-metadata";
import { buildFaqPageJsonLd, buildLandingServiceJsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";

const PAGE_PATH = "/reponse-appel-offres-btp";
const PAGE_URL = absoluteUrl(PAGE_PATH);

export const metadata = landingPageMetadataFromPath(PAGE_PATH);

export default function Page() {
  const faq = [
    {
      q: "BeWork peut-il répondre à un appel d’offres BTP ?",
      a: "Oui sur le volet administratif et documentaire : analyse DCE, structuration des pièces, mémoire technique, DPGF/BPU/DQE et suivi du dépôt. La décision Go/No-go, le prix final et la signature restent chez vous.",
    },
    {
      q: "Quelles pièces d’un marché public travaux BeWork peut-il analyser ?",
      a: "RC, CCAP, CCTP, BPU, DPGF, DQE, plans, annexes techniques et règlement de consultation — avec une synthèse des points bloquants et des échéances.",
    },
    {
      q: "BeWork rédige-t-il le mémoire technique ?",
      a: "Oui : structuration, rédaction à partir de vos références et méthodes, mise en forme et relecture. Vous validez le contenu technique et les engagements avant dépôt.",
    },
    {
      q: "Comment transmettre un DCE à BeWork ?",
      a: "Via le formulaire contact ou votre espace client : déposez le dossier, précisez la date limite et le lot visé. Une première analyse peut être proposée en mission ponctuelle.",
    },
    {
      q: "BeWork garantit-il le gain du marché ?",
      a: "Non. BeWork sécurise la préparation, limite les oublis de pièces et structure la réponse — le résultat de l’attribution dépend du maître d’ouvrage et des offres concurrentes.",
    },
  ] as const;

  const faqLd = buildFaqPageJsonLd(faq, PAGE_URL);
  const serviceLd = buildLandingServiceJsonLd({
    name: "Réponse aux appels d'offres BTP",
    description:
      "Analyse DCE, mémoire technique, DPGF et dépôt plateforme pour entreprises du bâtiment — assistant travaux BeWork.",
    pageUrl: PAGE_URL,
    serviceType: "Réponse appels d'offres BTP",
  });

  return (
    <SeoLandingPage
      description="Réponse aux appels d’offres BTP : analyse DCE, mémoire technique, DPGF et dépôt plateforme — assistants travaux BeWork."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Réponse appels d’offres BTP", href: PAGE_PATH },
      ]}
      h1="Réponse aux appels d’offres BTP : DCE, mémoire technique, DPGF"
      intro={
        <>
          Répondre à un <strong>appel d&apos;offres BTP</strong> demande du temps : lecture du DCE, mémoire technique,
          pièces administratives, chiffrage et dépôt sur la plateforme. BeWork structure votre{" "}
          <strong>réponse marché public travaux</strong> pendant que vous tenez le terrain — avec validation finale
          avant tout envoi engageant.
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }} />

      <SeoEnResumeBlock>
        <p>
          <strong>Qu&apos;est-ce qu&apos;une réponse à appel d&apos;offres BTP ?</strong> L&apos;ensemble des pièces
          exigées par le règlement de consultation : offre technique (mémoire), offre financière (DPGF, BPU, DQE), pièces
          administratives (DC1, DC2, attestations) et dépôt dans les délais sur la plateforme acheteur.
        </p>
      </SeoEnResumeBlock>

      <h2>Pour qui ?</h2>
      <ul>
        <li>PME et artisans qui veulent répondre sans sacrifier les chantiers en cours</li>
        <li>Conducteurs de travaux et chargés d&apos;affaires sur plusieurs dossiers en parallèle</li>
        <li>Entreprises générales, VRD, second œuvre candidats sur marchés publics ou privés</li>
        <li>Titulaires d&apos;accords-cadres qui doivent structurer des réponses récurrentes</li>
      </ul>

      <h2>Ce que BeWork prend en charge</h2>
      <ul>
        <li>
          <Link href="/services/analyse-dce-btp" className="text-[#1d4ed8] hover:underline">
            Analyse DCE
          </Link>{" "}
          : RC, CCAP, CCTP, lots, délais, pièces manquantes
        </li>
        <li>
          <Link href="/services/memoire-technique-btp" className="text-[#1d4ed8] hover:underline">
            Mémoire technique BTP
          </Link>{" "}
          : structure, rédaction, références chantier
        </li>
        <li>DPGF, BPU, DQE : organisation des tableaux et relecture de cohérence</li>
        <li>Checklist pièces administratives et suivi du dépôt plateforme</li>
        <li>Synthèse Go/No-go et alertes sur les points à risque</li>
      </ul>

      <h2>Comment ça se passe ?</h2>
      <ol>
        <li>Vous transmettez le DCE et la date limite.</li>
        <li>BeWork analyse les pièces et propose une synthèse (délais, lots, exigences critiques).</li>
        <li>Préparation du mémoire technique et des tableaux de prix selon votre méthode.</li>
        <li>Relecture croisée et validation de votre part avant dépôt.</li>
      </ol>

      <h2>Les erreurs que nous aidons à éviter</h2>
      <ul>
        <li>Oubli de pièce obligatoire dans le règlement de consultation</li>
        <li>Mémoire technique hors sujet ou non conforme au CCTP</li>
        <li>Incohérence entre BPU, DPGF et quantités</li>
        <li>Dépôt tardif ou mauvaise plateforme</li>
        <li>Réponse lancée sans analyse des pénalités ou contraintes CCAP</li>
      </ul>

      <h2>Exemple concret</h2>
      <p>
        Un lot peinture en marché public avec délai court : BeWork extrait les exigences CCTP, prépare le plan du
        mémoire technique, relève les points à chiffrer et suit la checklist DC1/DC2 — vous validez le prix et le dépôt.
      </p>

      <h2>Pourquoi BeWork ?</h2>
      <p>
        Lecture métier des pièces marché, pas de promesse de gain garanti, process cadré et tarifs publics. Après
        attribution, voir{" "}
        <Link href="/gestion-marche-public-btp" className="text-[#1d4ed8] hover:underline">
          gestion administrative après attribution
        </Link>{" "}
        et la{" "}
        <Link href="/assistants-administratifs-taches#reponses-appels-offres" className="text-[#1d4ed8] hover:underline">
          section réponses AO sur la page missions
        </Link>
        .
      </p>

      <h2>FAQ — réponse appels d&apos;offres BTP</h2>
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
