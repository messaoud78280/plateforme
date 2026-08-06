import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { BtpPainLandingMaillage } from "@/components/seo/BtpPainLandingMaillage";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { BTP_PAIN_PAGE_PATHS } from "@/lib/btp-pain-pages";
import { landingPageMetadataFromPath } from "@/lib/seo-landing-metadata";

const PAGE_PATH = BTP_PAIN_PAGE_PATHS.artisanDeborde;

export const metadata = landingPageMetadataFromPath(PAGE_PATH);

export default function Page() {
  const faq = [
    {
      q: "Est-ce que BeWork remplace un commercial ou un comptable ?",
      a: "Non. La plateforme sécurise la chaîne opérationnelle : devis à préparer ou relancer, factures et situations, dossiers chantier et relances cadrées. Vous gardez prix, technique, validation des envois sensibles et liaison avec votre expertise comptable.",
    },
    {
      q: "Comment ça évite de perdre des chantiers pendant la saison ?",
      a: "Les demandes passent par une plateforme privée avec statuts — elles ne vivent plus uniquement dans votre tête ou une boîte mail saturée. Une file claire évite oublis, doubles relances improvisées ou devis envoyés trop tard après une série de chantiers urgents.",
    },
    {
      q: "Puis-je limiter les modules activés au début ?",
      a: "Oui. Au diagnostic, on cale un périmètre réaliste (ex. uniquement relances clients + situations) puis vous élargissez quand vous voyez les délais gagner terrain.",
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
      description="Artisan sous l’eau administrativement : où ça fait mal, pourquoi, et comment une plateforme interne BeWork remet un rythme de bureau aligné sur le chantier."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Artisan débordé — administratif", href: PAGE_PATH },
      ]}
      h1="Artisan débordé par l’administratif — quand le bureau coupe le chantier"
      intro={
        <>
          Vous passez vos journées sur les ouvrages. Le soir, il reste devis à finir, factures à vérifier, mails
          fournisseur sans réponse et relances qui attendent encore. Ce n’est pas une question de courage : vous
          jonglez déjà trois rôles. BeWork déploie une <strong>plateforme interne BTP</strong> — vos équipes
          l&apos;utilisent au quotidien ; BeWork configure, déploie et fait évoluer (France, Belgique, Suisse,
          Luxembourg francophones).
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h2>Ce que vous perdez aujourd’hui</h2>
      <ul>
        <li>
          <strong>Du temps au volant puis sur l’ordinateur.</strong> Chaque dossier coupé « à la volée » coûte en attention et en
          risque d’erreur.
        </li>
        <li>
          <strong>Du chiffre d’affaires.</strong> Délais de devis trop longs, oublis de relance, dossiers incomplets retardent ou
          annulent une partie des signatures possibles.
        </li>
        <li>
          <strong>Une partie de vos marges dans la fatigue.</strong> Quand tout part en urgence improvisée, on facture tard, mal,
          ou on lâche prise avec un client alors qu’une relance régulière suffisait.
        </li>
      </ul>

      <h2>Pourquoi ça arrive</h2>
      <p>
        Le chantier impose des priorités évidentes. L’administratif, lui, grossit sans bruit jusqu’à devenir hors de contrôle.
        Une seule boîte mail partagée, des pièces sur le téléphone chantier et des chantiers multiples — tout le monde connaît
        la recette du débordement. Ce n’est pas un défaut individuel ; c’est l’effet combiné montée d’activité + absence de
        système.
      </p>

      <h2>Comment BeWork vous aide</h2>
      <p>
        Vous créez vos demandes sur une plateforme privée sécurisée (devis, factures, relances, dossiers chantier).
        Vos équipes tiennent les statuts et les livrables ; l’IA accélère le tri, les recherches répétitives et la mise
        en forme — vous conservez décisions sensibles et validation des envois qui engagent. BeWork configure et fait
        évoluer l&apos;environnement, sans exécuter à votre place.
      </p>

      <h2>Bénéfices concrets</h2>
      <ul>
        <li>Des soirées plus courtes côté bureau — la file est visible et tenue, pas uniquement dans votre tête.</li>
        <li>Une image plus pro (réponses plus rapides, relances propres, rangement par chantier).</li>
        <li>Une structure qui tient quand un ouvrier part en congé ou qu’un client double la surface à traiter.</li>
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
        <CalendlyBookingLink className="inline-flex rounded-lg bg-[#1d4ed8] px-6 py-3 font-bold text-white hover:bg-[#1e40af]">
          Demander une démonstration
        </CalendlyBookingLink>
        <Link
          href="/tarifs"
          className="inline-flex rounded-lg border-2 border-[#1d4ed8] px-6 py-3 font-bold text-[#1d4ed8] hover:bg-[#eff6ff]"
        >
          Voir la tarification
        </Link>
      </div>

      <BtpPainLandingMaillage currentHref={PAGE_PATH} />
    </SeoLandingPage>
  );
}
