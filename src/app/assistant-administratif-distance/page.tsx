import Link from "next/link";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { landingPageMetadataFromPath } from "@/lib/seo-landing-metadata";

const PAGE_PATH = "/assistant-administratif-distance";

export const metadata = landingPageMetadataFromPath(PAGE_PATH);

const faq = [
  {
    q: "Comment fonctionne une plateforme travaux à distance avec BeWork ?",
    a: "Vos équipes déposent demandes et pièces sur la plateforme (messagerie, tâches, documents) : elles structurent l’avancement et produisent des livrables clairs depuis n’importe où. Idéal quand vous êtes sur chantier : le bureau suit sans dépendre d’un présentiel.",
  },
  {
    q: "Quelles capacités peuvent être gérées sans présence sur chantier ?",
    a: "Analyse DCE, préparation de relances et mails chantier, structuration de dossiers, suivi de devis et situations, classement de pièces, tableaux de suivi, coordination écrite fournisseurs — tout ce qui ne nécessite pas une présence physique sur site.",
  },
  {
    q: "Comment transmettre les demandes dans la plateforme ?",
    a: "Via l’environnement BeWork (tâches et échanges), en joignant notes, PDF, captures ou liens vers vos outils selon ce que vous autorisez. L’essentiel est un brief court : objectif, deadline, niveau de validation attendu.",
  },
  {
    q: "Le client garde-t-il la validation finale sur les documents ?",
    a: "Oui. La plateforme aide à préparer, structurer et suivre ; vous validez avant envoi tout ce qui engage votre entreprise : prix, formulation contractuelle, engagement technique ou réponse sensible au client final.",
  },
] as const;

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export default function Page() {
  return (
    <SeoLandingPage
      description="Plateforme BTP accessible à distance : analyse DCE, relances, comptes rendus et suivi dossiers. Vos équipes utilisent ; BeWork configure et fait évoluer."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Assistant travaux à distance", href: PAGE_PATH },
      ]}
      h1="Assistant travaux à distance : plateforme BTP accessible hors bureau"
      intro={
        <>
          La plateforme BeWork est accessible à distance : analyse DCE, relances, comptes rendus et suivi documentaire
          chantier — une <strong>plateforme interne</strong> métier, pas une prestation de saisie générique. Vos
          équipes utilisent ; BeWork configure, déploie et fait évoluer. France, Belgique, Suisse et Luxembourg.{" "}
          <Link href="/services/assistant-travaux" className="text-[#1d4ed8] hover:underline">
            Service assistant travaux
          </Link>
          .
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <h2>Comment circulent les documents à distance</h2>
      <p>
        Les échanges passent par la plateforme BeWork : dépôt des pièces, messagerie liée à chaque dossier, statuts
        visibles à tout moment. Aucune information ne transite par des canaux personnels non tracés — l&apos;historique
        des échanges reste consultable dossier par dossier.
      </p>

      <h2>Ce qui ne demande pas de présence sur site</h2>
      <p>
        Analyse de DCE, préparation de comptes rendus à partir de vos notes ou photos de chantier, relances
        fournisseurs par écrit, suivi de situations et de factures Chorus Pro, classement de pièces pour le DOE. À
        l&apos;inverse, tout ce qui exige un jugement technique sur place — contrôle d&apos;exécution, réception de
        travaux — reste de la responsabilité de votre équipe terrain.
      </p>

      <h2>Confidentialité et traçabilité</h2>
      <p>
        Les documents transmis restent liés au dossier et à votre compte ; l&apos;accès est limité aux rôles autorisés.
        Chaque validation avant envoi engageant reste tracée, ce qui permet de retrouver qui a approuvé quoi et quand.
      </p>

      <section className="not-prose" id="faq" aria-label="FAQ assistant travaux à distance" style={{ scrollMarginTop: "6rem" }}>
        <h2 className="mt-12 text-xl font-bold tracking-tight text-black md:text-2xl">Questions fréquentes</h2>
        <dl className="mt-5 space-y-4">
          {faq.map((item) => (
            <div key={item.q} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <dt className="text-base font-semibold text-black">{item.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-slate-700">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </SeoLandingPage>
  );
}
