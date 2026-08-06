import Link from "next/link";
import { SeoEnResumeBlock, SeoObjectiveCard } from "@/components/seo/SeoContentBlocks";
import { GeoVillesHubLinks } from "@/components/seo/GeoVillesHubLinks";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import {
  ASSISTANT_TRAVAUX_VILLE_PATHS,
  ASSISTANT_TRAVAUX_VILLES,
  type AssistantTravauxVilleKey,
} from "@/lib/assistant-travaux-villes";

export function AssistantTravauxVilleLanding({ villeKey }: { villeKey: AssistantTravauxVilleKey }) {
  const pagePath = ASSISTANT_TRAVAUX_VILLE_PATHS[villeKey];
  const content = ASSISTANT_TRAVAUX_VILLES[villeKey];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: content.faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  const paysHub =
    content.pays === "France"
      ? "/assistant-travaux-france"
      : content.pays === "Belgique"
        ? "/assistant-travaux-belgique"
        : "/assistant-travaux-suisse";

  return (
    <SeoLandingPage
      description={`Plateforme BTP ${content.label} : outils travaux pour vos équipes — devis, marchés publics et dossiers chantier. Éditeur BeWork.`}
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Assistant travaux", href: "/services/assistant-travaux" },
        { name: content.label, href: pagePath },
      ]}
      h1={content.h1}
      intro={
        <>
          {content.introLead} BeWork est l&apos;<strong>éditeur d&apos;une plateforme interne BTP</strong> —{" "}
          <strong>vos équipes l&apos;utilisent</strong> au quotidien ; BeWork configure et fait évoluer, avec{" "}
          <strong>validation finale</strong> chez vous avant tout envoi engageant.
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <SeoEnResumeBlock>
        <p>
          <strong>Plateforme travaux à {content.label.split(" &")[0]}</strong> : outils métier pour devis, appels
          d&apos;offres, situations, DOE et relances — spécialisés BTP, utilisés par vos collaborateurs, pas un
          secrétariat générique externalisé.
        </p>
      </SeoEnResumeBlock>

      <h2>Contexte local</h2>
      <div className="not-prose">
        <SeoObjectiveCard>{content.localContext}</SeoObjectiveCard>
      </div>

      <h2>Exemple concret</h2>
      <p>{content.casUsage}</p>

      <h2>Ce que la plateforme couvre</h2>
      <ul>
        <li>Devis, relances et suivi des réponses clients</li>
        <li>Analyse DCE et réponse aux appels d&apos;offres</li>
        <li>Situations de travaux et facturation publique (Chorus Pro selon périmètre)</li>
        <li>Comptes rendus, PPSPS, DOE, DICT — organisation et suivi</li>
      </ul>

      <h2>Maillage {content.pays}</h2>
      <p>
        <Link href={paysHub} className="text-[#1d4ed8] hover:underline">
          Plateforme travaux {content.pays}
        </Link>
        {" · "}
        <Link href="/externalisation-administrative-btp-france" className="text-[#1d4ed8] hover:underline">
          Plateforme administrative BTP
        </Link>
        {" · "}
        <Link href="/tarifs" className="text-[#1d4ed8] hover:underline">
          Tarifs
        </Link>
        {" · "}
        <Link href="/contact#formulaire" className="text-[#1d4ed8] hover:underline">
          Demander une étude
        </Link>
      </p>

      <h2>FAQ — {content.label}</h2>
      <dl>
        {content.faq.map((item) => (
          <div key={item.q} className="mb-6">
            <dt className="font-semibold text-black">{item.q}</dt>
            <dd className="mt-1 text-black">{item.a}</dd>
          </div>
        ))}
      </dl>

      <GeoVillesHubLinks currentHref={pagePath} paysFilter={content.pays} />
    </SeoLandingPage>
  );
}
