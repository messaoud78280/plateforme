import Link from "next/link";
import { BtpPainLandingMaillage } from "@/components/seo/BtpPainLandingMaillage";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { BTP_PAIN_PAGE_PATHS } from "@/lib/btp-pain-pages";
import { landingPageMetadata } from "@/lib/seo-landing-metadata";

const PAGE_PATH = BTP_PAIN_PAGE_PATHS.chantierMalSuivi;

export const metadata = landingPageMetadata({
  title: "Chantier mal suivi : dossier administratif, client, fournisseur | BeWork",
  description:
    "Chantier mal suivi côté administratif : retards, litiges et cash qui fuit. Organisation chantier BTP et suivi dossier — demandes cadrées, pièces, relances. Pilotage encadré.",
  path: PAGE_PATH,
  keywords: [
    "chantier mal suivi",
    "suivi administratif chantier",
    "organisation chantier BTP",
    "suivi dossier chantier",
    "pilotage administratif chantier",
    "coordination administrative BTP",
  ],
});

export default function Page() {
  const faq = [
    {
      q: "Qu’est-ce qui distingue « mauvais suivi » de « mauvaise exécution » ?",
      a: "L’exécution, c’est le geste technique. Le suivi administratif, c’est la cohérence documents (mails, avenants, preuves, validations), la réactivité client et la chaîne fournisseur. Les deux se touchent : un retard de pièce peut bloquer une phase technique ou une facturation.",
    },
    {
      q: "BeWork va-t-il sur le chantier ?",
      a: "Non. Nous tenons le volet bureau : classement, relances, préparation de dossiers, suivi des demandes et remontée des points bloquants. Vous gardez la relation directe sur l’ouvrage et les arbitrages techniques.",
    },
    {
      q: "Comment éviter le chaos quand il y a plusieurs acteurs ?",
      a: "Une demande = un fil, un statut, une échéance visible. Moins de pièces perdues entre trois boîtes mail et moins de « je croyais que X s’en occupait ».",
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
      description="Quand un chantier dérape côté paperasse : où part l’argent, pourquoi le dossier s’effondre et comment sécuriser l’organisation administrative."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Chantier mal suivi — administratif", href: PAGE_PATH },
      ]}
      h1="Chantier mal suivi administratif — le coût caché des dossiers en vrac"
      intro={
        <>
          Vue terrain, tout semble sous contrôle jusqu’à la première divergence : pièce envoyée trois fois, bon de commande
          introuvable, situation de travaux bloquée, client qui conteste alors que vos équipes ont déjà avancé. Un chantier mal
          suivi côté administratif peut coûter cher en heures perdus, décotes acceptées sous pression et impayés en cascade.
          BeWork structure le flux bureau à la même enseigne que votre exigeance chantier.
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h2>Ce que vous perdez aujourd’hui</h2>
      <ul>
        <li>
          <strong>Des avances trésorerie mal calées</strong> quand situations et validations ne suivent pas l’avancement réel.
        </li>
        <li>
          <strong>Une exposition aux contestations</strong> (preuves incomplètes, échanges dispersés dans cinq conversations).
        </li>
        <li>
          <strong>Du temps direction</strong> consacré à reconstituer l’histoire du dossier au lieu d’aller vers le prochain
          chantier.
        </li>
      </ul>

      <h2>Pourquoi ça arrive</h2>
      <p>
        La production avance vite ; le bureau rattrape après coup. À mesure que grandissent fournisseur, sous-traitant et client —
        sans référent unique pour le dossier, chacun optimise son coin. Le téléphone chantier fait office de lien documentaire —
        jusqu’à la première divergence contractuelle où il manque justement la trace qui arrondit les angles.
      </p>

      <h2>Comment BeWork vous aide</h2>
      <p>
        Nous assurons suivi dossier chantier dans un environnement cloisonné : vos demandes (DICT complémentaires, relances GO,
        confirmations fournisseur, mise en copie réglementée…) sont suivies jusqu’à clôture avec statuts. L’assistant administratif
        BTP n’est pas un répondeur : c’est une exécution encadrée, pilotée depuis la France, avec des profils diplômés habitués
        aux dossiers chantier.
      </p>

      <h2>Bénéfices concrets</h2>
      <ul>
        <li>Un chantier mieux défendu sur pièges courants (« on n’a jamais reçu » / « vous n’avez pas validé »).</li>
        <li>Moins d’allers-retours stériles avec fournisseur et client.</li>
        <li>Une transition plus propre chantier suivant sans traîner un sac de dossiers non clos.</li>
      </ul>

      <h2>Questions fréquentes</h2>
      <dl className="space-y-6">
        {faq.map((item) => (
          <div key={item.q}>
            <dt className="font-semibold text-black">{item.q}</dt>
            <dd className="mt-2 text-black leading-relaxed">{item.a}</dd>
          </div>
        ))}
      </dl>

      <div className="not-prose my-10 flex flex-wrap gap-4">
        <Link href="/contact" className="inline-flex rounded-lg bg-[#1d4ed8] px-6 py-3 font-bold text-white hover:bg-[#1e40af]">
          Réserver un appel
        </Link>
        <Link
          href="/dict-dt-travaux"
          className="inline-flex rounded-lg border-2 border-[#1d4ed8] px-6 py-3 font-bold text-[#1d4ed8] hover:bg-[#eff6ff]"
        >
          Dossiers & autorisations (DICT)
        </Link>
      </div>

      <BtpPainLandingMaillage currentHref={PAGE_PATH} />
    </SeoLandingPage>
  );
}
