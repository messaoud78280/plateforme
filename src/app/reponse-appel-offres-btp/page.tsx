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
      q: "La plateforme BeWork aide-t-elle à répondre à un appel d’offres BTP ?",
      a: "Oui : modules d’analyse DCE, structuration des pièces, trame de mémoire technique, organisation DPGF/BPU/DQE et préparation au dépôt. Go/No-go, prix, choix techniques, signature et dépôt définitif restent chez vous — vos équipes utilisent la plateforme.",
    },
    {
      q: "Quelles pièces d’un marché public travaux peut-on analyser dans la plateforme ?",
      a: "RC, CCAP, CCTP, BPU, DPGF, DQE, plans, annexes techniques et règlement de consultation — avec une synthèse des points bloquants et des échéances.",
    },
    {
      q: "La plateforme aide-t-elle à rédiger le mémoire technique ?",
      a: "Oui : structuration, rédaction à partir de vos références et méthodes, mise en forme et relecture. Vous validez le contenu technique et les engagements avant dépôt.",
    },
    {
      q: "Comment transmettre un DCE dans l’environnement BeWork ?",
      a: "Via le formulaire contact ou votre espace client : déposez le dossier, précisez la date limite et le lot visé. Le cadrage de déploiement précise le circuit exact.",
    },
    {
      q: "BeWork garantit-il le gain du marché ?",
      a: "Non. La plateforme sécurise la préparation, limite les oublis de pièces et structure la réponse — le résultat de l’attribution dépend du maître d’ouvrage et des offres concurrentes.",
    },
  ] as const;

  const faqLd = buildFaqPageJsonLd(faq, PAGE_URL);
  const serviceLd = buildLandingServiceJsonLd({
    name: "Réponse aux appels d'offres BTP — plateforme BeWork",
    description:
      "Plateforme interne pour préparer les AO BTP : analyse DCE, pièces, structure mémoire technique et dépôt — prix et dépôt chez le client.",
    pageUrl: PAGE_URL,
    serviceType: "Plateforme préparation appels d'offres BTP",
  });

  return (
    <SeoLandingPage
      description="Plateforme BeWork pour AO BTP : analyse DCE, pièces, structure mémoire technique et préparation au dépôt — sous votre validation."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Réponse appels d’offres BTP", href: PAGE_PATH },
      ]}
      h1="Réponse aux appels d’offres BTP : plateforme pour analyser le DCE et structurer la candidature"
      intro={
        <>
          Répondre à un <strong>appel d&apos;offres BTP</strong> demande du temps : lecture du DCE, mémoire technique,
          pièces administratives, offre financière et dépôt sur la plateforme acheteur. BeWork déploie une{" "}
          <strong>plateforme interne</strong> pour structurer cette préparation pendant que vous tenez le terrain —
          vos équipes utilisent ; BeWork configure et fait évoluer. Vous gardez prix, choix techniques et dépôt
          définitif.
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

      <h2>Ce que la plateforme structure</h2>
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
          : structure, rédaction, références chantier — à valider avant envoi
        </li>
        <li>DPGF, BPU, DQE : organisation des tableaux et relecture de cohérence (prix chez vous)</li>
        <li>Checklist pièces administratives et préparation au dépôt plateforme</li>
        <li>Synthèse Go/No-go et alertes sur les points à risque — décision finale chez vous</li>
      </ul>

      <h2>Comment ça se passe ?</h2>
      <ol>
        <li>Vous transmettez le DCE et la date limite dans l&apos;environnement BeWork.</li>
        <li>Vos équipes analysent les pièces et produisent une synthèse (délais, lots, exigences critiques).</li>
        <li>Préparation du mémoire technique et organisation des tableaux selon votre méthode.</li>
        <li>Relecture croisée et validation de votre part avant dépôt définitif.</li>
      </ol>

      <h2>Les erreurs que la plateforme aide à éviter</h2>
      <ul>
        <li>Oubli de pièce obligatoire dans le règlement de consultation</li>
        <li>Mémoire technique hors sujet ou non conforme au CCTP</li>
        <li>Incohérence entre BPU, DPGF et quantités</li>
        <li>Dépôt tardif ou mauvaise plateforme</li>
        <li>Réponse lancée sans analyse des pénalités ou contraintes CCAP</li>
      </ul>

      <h2>Exemple concret</h2>
      <p>
        Un lot peinture en marché public avec délai court : la plateforme aide à extraire les exigences CCTP, préparer
        le plan du mémoire technique, relever les points à chiffrer et suivre la checklist DC1/DC2 — vous fixez le prix
        et déposez.
      </p>

      <h2>Pourquoi BeWork ?</h2>
      <p>
        Éditeur de plateforme métier BTP, pas de promesse de gain garanti, process cadré et tarification sur étude.
        Après attribution, voir{" "}
        <Link href="/gestion-marche-public-btp" className="text-[#1d4ed8] hover:underline">
          gestion administrative après attribution
        </Link>{" "}
        et la{" "}
        <Link href="/assistants-administratifs-taches#reponses-appels-offres" className="text-[#1d4ed8] hover:underline">
          section AO sur les capacités plateforme
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
