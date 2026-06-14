import Link from "next/link";
import { SeoEnResumeBlock } from "@/components/seo/SeoContentBlocks";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { landingPageMetadataFromPath } from "@/lib/seo-landing-metadata";
import { buildFaqPageJsonLd, buildLandingServiceJsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";

const PAGE_PATH = "/facturation-chorus-pro-btp";
const PAGE_URL = absoluteUrl(PAGE_PATH);

export const metadata = landingPageMetadataFromPath(PAGE_PATH);

export default function Page() {
  const faq = [
    {
      q: "BeWork peut-il gérer Chorus Pro pour une entreprise BTP ?",
      a: "Oui sur le volet administratif : préparation des pièces, structuration des situations, dépôt encadré et suivi des statuts — vous gardez la validation des montants et la responsabilité du titulaire.",
    },
    {
      q: "BeWork peut-il préparer les situations de travaux avant facturation ?",
      a: "Oui : relevés d’avancement, pièces justificatives, cohérence avec le marché et modèles de situation — voir aussi /situation-travaux-btp.",
    },
    {
      q: "Que faire si une facture Chorus Pro est rejetée ?",
      a: "Identifier le motif de rejet, corriger les pièces ou références, relancer le dépôt et tracer les échanges. BeWork peut structurer ce suivi ; la validation reste chez vous.",
    },
    {
      q: "BeWork garantit-il le paiement des factures publiques ?",
      a: "Non. BeWork limite les erreurs de dépôt et accélère le suivi administratif — les délais de paiement dépendent de l’acheteur public et du contrat.",
    },
  ] as const;

  const faqLd = buildFaqPageJsonLd(faq, PAGE_URL);
  const serviceLd = buildLandingServiceJsonLd({
    name: "Facturation Chorus Pro BTP",
    description: "Préparation des situations, dépôt encadré et suivi des factures publiques pour titulaires de marchés.",
    pageUrl: PAGE_URL,
    serviceType: "Facturation Chorus Pro BTP",
  });

  return (
    <SeoLandingPage
      description="Facturation Chorus Pro BTP : situations, dépôt, suivi et relances de vos factures publiques — assistant travaux BeWork."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Facturation Chorus Pro BTP", href: PAGE_PATH },
      ]}
      h1="Facturation Chorus Pro BTP : dépôt, suivi et relance de vos factures publiques"
      intro={
        <>
          Titulaire d&apos;un <strong>marché public travaux</strong>, vous devez facturer dans les règles : situations,
          pièces, dépôt <strong>Chorus Pro</strong>, suivi des statuts et relances. BeWork structure la{" "}
          <strong>facturation marché public BTP</strong> pour éviter rejets et retards — vous validez les montants.
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }} />

      <SeoEnResumeBlock>
        <p>
          <strong>Chorus Pro pour le BTP</strong> : portail de facturation électronique des acheteurs publics. Les
          entreprises titulaires y déposent situations et factures selon les exigences du marché (références, PJ, formats).
        </p>
      </SeoEnResumeBlock>

      <h2>Pour qui ?</h2>
      <ul>
        <li>Titulaires de marchés publics travaux (lots, accords-cadres, marchés à tranches)</li>
        <li>PME BTP sans service comptabilité dédié aux marchés publics</li>
        <li>Conducteurs de travaux qui préparent les situations sur chantier mais n&apos;ont pas le temps du dépôt</li>
      </ul>

      <h2>Ce que BeWork prend en charge</h2>
      <ul>
        <li>Préparation et relecture des situations de travaux</li>
        <li>Checklist pièces avant dépôt Chorus Pro</li>
        <li>Suivi des statuts (déposée, en traitement, rejetée, payée)</li>
        <li>Relances administratives sur factures en attente</li>
        <li>Classement documentaire lié au marché</li>
      </ul>

      <h2>Comment ça se passe ?</h2>
      <ol>
        <li>Transmission des situations et références marché.</li>
        <li>Vérification de cohérence et des pièces obligatoires.</li>
        <li>Dépôt encadré ou remise d&apos;un dossier prêt à déposer.</li>
        <li>Suivi des statuts et alertes en cas de rejet.</li>
      </ol>

      <h2>Les erreurs que nous aidons à éviter</h2>
      <ul>
        <li>Facture Chorus Pro rejetée pour référence ou PJ manquante</li>
        <li>Situation non alignée avec l&apos;avancement réel ou le CCAP</li>
        <li>Oubli de relance sur facture en attente de traitement</li>
        <li>Dossier marché incomplet en fin de chantier (impact solde)</li>
      </ul>

      <h2>Exemple concret</h2>
      <p>
        Situation mensuelle n°4 sur un lot VRD : BeWork reprend votre relevé, vérifie les références marché, prépare le
        dossier de dépôt et suit le statut jusqu&apos;à traitement — vous validez le montant avant envoi.
      </p>

      <h2>Liens utiles</h2>
      <ul>
        <li>
          <Link href="/situation-travaux-btp" className="text-[#1d4ed8] hover:underline">
            Situations de travaux BTP
          </Link>
        </li>
        <li>
          <Link href="/assistants-administratifs-taches#marches-publics-accords-cadres" className="text-[#1d4ed8] hover:underline">
            Situations &amp; Chorus Pro — bloc exécution marché
          </Link>
        </li>
        <li>
          <Link href="/gestion-marche-public-btp" className="text-[#1d4ed8] hover:underline">
            Gestion administrative marché public
          </Link>
        </li>
        <li>
          <Link href="/impayes-btp-relances" className="text-[#1d4ed8] hover:underline">
            Relances impayés BTP
          </Link>
        </li>
      </ul>

      <h2>FAQ — Chorus Pro BTP</h2>
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
