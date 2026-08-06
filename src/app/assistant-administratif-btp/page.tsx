import type { Metadata } from "next";
import Link from "next/link";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { landingPageMetadataFromPath } from "@/lib/seo-landing-metadata";

const PAGE_PATH = "/assistant-administratif-btp";

const PAGE_META_DESCRIPTION =
  "Vous cherchez un assistant administratif BTP ? BeWork déploie une plateforme interne : vos équipes pilotent DCE, dossiers, AO et marchés publics — BeWork configure, héberge et fait évoluer.";

const baseMetadata = landingPageMetadataFromPath(PAGE_PATH);

export const metadata: Metadata = {
  ...baseMetadata,
  description: PAGE_META_DESCRIPTION,
  openGraph: {
    ...(typeof baseMetadata.openGraph === "object" ? baseMetadata.openGraph : {}),
    description: PAGE_META_DESCRIPTION,
  },
  twitter: {
    ...(typeof baseMetadata.twitter === "object" ? baseMetadata.twitter : {}),
    description: PAGE_META_DESCRIPTION,
  },
};

const faq = [
  {
    q: "Quelle différence entre un outil admin généraliste et la plateforme BeWork ?",
    a: "Un outil hors métier bâtiment traite le courrier et la saisie générique. La plateforme BeWork est conçue pour les dossiers chantier : analyse DCE, relances, fournisseurs, documents travaux, réserves, marchés publics — avec circuit de validation avant envoi engageant.",
  },
  {
    q: "Qui utilise la plateforme au quotidien ?",
    a: "Vos équipes (dirigeant, conducteur de travaux, bureau). Elles structurent suivis, comptes rendus, relances et pièces. BeWork configure, déploie et fait évoluer l’environnement ; la décision technique et la validation des points sensibles restent chez vous.",
  },
  {
    q: "Quelles capacités BTP la plateforme couvre-t-elle ?",
    a: "Analyse DCE, suivi de devis et relances clients, préparation de documents chantier, relances fournisseurs, comptes rendus, suivi des listes de pièces (DOE, réserves) et situations marché public — toujours avec validation interne.",
  },
  {
    q: "Est-ce adapté aux artisans et petites entreprises du bâtiment ?",
    a: "Oui. La plateforme s’adresse aux TPE/PME sans équipe bureau à plein temps : vos collaborateurs travaillent dans un environnement métier, sans recruter pour absorber la charge documentaire. Tarification sur étude.",
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
      description="Plateforme interne BTP BeWork : analyse DCE, dossiers chantier, appels d'offres et marchés publics. Vos équipes utilisent ; BeWork configure et fait évoluer."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Assistant administratif BTP", href: PAGE_PATH },
      ]}
      h1="Assistant administratif BTP : une plateforme interne pour vos dossiers chantier"
      intro={
        <>
          Beaucoup de dirigeants BTP cherchent un « assistant administratif » pour le bâtiment. BeWork répond avec une{" "}
          <strong>plateforme interne</strong> spécialisée : analyse DCE, dossiers chantier, relances, appels d&apos;offres
          et marchés publics — pas un outil admin générique. Vos équipes utilisent au quotidien ; BeWork configure,
          déploie et fait évoluer. France, Belgique, Suisse et Luxembourg. Voir aussi le{" "}
          <Link href="/services/assistant-travaux" className="text-[#1d4ed8] hover:underline">
            service assistant travaux
          </Link>
          .
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <h2>Assistant administratif ou plateforme travaux : la vraie différence</h2>
      <p>
        Un assistant administratif généraliste traite l&apos;accueil, le courrier et la facturation courante. La
        plateforme BeWork est briefée sur le vocabulaire et les contraintes du chantier : lire un DCE, distinguer une
        pièce obligatoire d&apos;une pièce optionnelle, structurer un compte rendu à partir de notes de site, suivre un
        fournisseur. C&apos;est ce cadrage métier — dans un environnement que vos équipes pilotent — qui change le
        résultat.
      </p>

      <h2>Le périmètre, concrètement</h2>
      <p>
        Sur la phase candidature : lecture et classement du DCE, tableau de conformité des pièces, appui à la
        structuration du mémoire technique. Sur la phase chantier : comptes rendus, relances fournisseurs et
        sous-traitants, suivi des situations et de la facturation Chorus Pro, préparation du DOE et des réserves. Le
        périmètre exact se cadre avec vous au déploiement — capacités détaillées sur{" "}
        <Link href="/assistants-administratifs-taches" className="text-[#1d4ed8] hover:underline">
          la page capacités plateforme
        </Link>
        .
      </p>

      <h2>Ce qui reste chez vous</h2>
      <p>
        Prix, choix techniques, méthodes d&apos;exécution et signature restent de votre responsabilité et de celle de
        vos conseils habituels. La plateforme aide à préparer et structurer ; vous validez ce qui engage
        l&apos;entreprise. BeWork n&apos;exécute pas à votre place.
      </p>

      <section className="not-prose" id="faq" aria-label="FAQ assistant administratif BTP" style={{ scrollMarginTop: "6rem" }}>
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
