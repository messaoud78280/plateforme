import Link from "next/link";
import { SeoEnResumeBlock } from "@/components/seo/SeoContentBlocks";
import { GeoAssistantTravauxHubLinks } from "@/components/seo/GeoAssistantTravauxHubLinks";
import { GeoVillesHubLinks } from "@/components/seo/GeoVillesHubLinks";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import {
  ASSISTANT_TRAVAUX_GEO_CONTENT,
  ASSISTANT_TRAVAUX_GEO_PATHS,
  type AssistantTravauxGeoKey,
} from "@/lib/assistant-travaux-geo";

const COUNTRY_LABEL: Record<AssistantTravauxGeoKey, string> = {
  france: "France",
  belgique: "Belgique",
  suisse: "Suisse",
  luxembourg: "Luxembourg",
};

export function AssistantTravauxGeoLanding({ geoKey }: { geoKey: AssistantTravauxGeoKey }) {
  const pagePath = ASSISTANT_TRAVAUX_GEO_PATHS[geoKey];
  const content = ASSISTANT_TRAVAUX_GEO_CONTENT[geoKey];
  const country = COUNTRY_LABEL[geoKey];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: content.faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <SeoLandingPage
      description={`Plateforme travaux en ${country} : outils BTP pour vos équipes — DCE, dossiers chantier et marchés. Éditeur BeWork.`}
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: `Plateforme travaux — ${country}`, href: pagePath },
      ]}
      h1={content.h1}
      intro={
        <>
          {content.introLead} BeWork est l&apos;<strong>éditeur d&apos;une plateforme interne BTP</strong> : analyse DCE,
          appels d&apos;offres, situations, DOE et suivi documentaire.{" "}
          <strong>Vos équipes l&apos;utilisent</strong> ; BeWork configure, héberge et fait évoluer — avec{" "}
          <strong>validation finale</strong> chez vous.
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <SeoEnResumeBlock>
        <p>
          <strong>Qu&apos;est-ce qu&apos;une plateforme travaux BeWork ?</strong> Un environnement métier
          bureau-chantier pour vos collaborateurs : analyse DCE, dossiers marché, comptes rendus, situations et
          relances — pendant que le terrain avance. BeWork équipe ; vos équipes pilotent.
        </p>
      </SeoEnResumeBlock>

      <h2>Contexte {country}</h2>
      <p>{content.localContext}</p>

      <h2>Pour qui ?</h2>
      <ul>
        <li>Artisans et PME du bâtiment qui veulent un outil métier partagé</li>
        <li>Conducteurs de travaux et chargés d&apos;affaires sans environnement numérique unique</li>
        <li>Titulaires ou candidats sur marchés publics ou privés</li>
        <li>Entreprises multi-chantiers qui veulent un suivi documentaire fiable</li>
      </ul>

      <h2>Ce que la plateforme couvre</h2>
      <ul>
        <li>Devis, relances clients et suivi des réponses</li>
        <li>Analyse DCE et préparation de réponses aux appels d&apos;offres</li>
        <li>Situations de travaux, facturation publique (Chorus Pro selon périmètre)</li>
        <li>Comptes rendus, PPSPS, DOE, DICT — organisation et suivi</li>
        <li>Classement documentaire chantier et relances fournisseurs</li>
      </ul>

      <h2>Comment ça se passe ?</h2>
      <ol>
        <li>Étude de cadrage (organisation, modules, rôles, priorités).</li>
        <li>Déploiement et configuration de la plateforme pour votre entreprise.</li>
        <li>Vos équipes utilisent les modules au quotidien ; BeWork fait évoluer.</li>
        <li>Validation de votre part avant tout envoi engageant.</li>
      </ol>

      <h2>Pourquoi BeWork ?</h2>
      <p>
        Éditeur de plateforme métier BTP (pas prestation administrative généraliste), outils IA pour accélérer le tri et
        la mise en forme, accompagnement de déploiement et modalités sur{" "}
        <Link href="/tarifs" className="text-[#1d4ed8] hover:underline">
          bework.fr/tarifs
        </Link>
        .
      </p>

      <h2>FAQ — plateforme travaux {country}</h2>
      <dl>
        {content.faq.map((item) => (
          <div key={item.q} className="mb-6">
            <dt className="font-semibold text-black">{item.q}</dt>
            <dd className="mt-1 text-black">{item.a}</dd>
          </div>
        ))}
      </dl>

      {geoKey === "france" ? <GeoVillesHubLinks paysFilter="France" hub /> : null}
      {geoKey === "belgique" ? <GeoVillesHubLinks paysFilter="Belgique" hub /> : null}
      {geoKey === "suisse" ? <GeoVillesHubLinks paysFilter="Suisse" hub /> : null}

      <GeoAssistantTravauxHubLinks currentHref={pagePath} />
    </SeoLandingPage>
  );
}
