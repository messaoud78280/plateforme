import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { landingPageMetadata } from "@/lib/seo-landing-metadata";

const PAGE_PATH = "/admin-btp-sans-recruter";

export const metadata = landingPageMetadata({
  title: "Admin BTP sans recruter | Relais travaux avec BeWork",
  description:
    "BeWork aide les entreprises du BTP à tenir leurs devis, relances, dossiers chantier, documents travaux et suivis bureau-terrain sans recruter immédiatement.",
  path: PAGE_PATH,
  keywords: [
    "admin BTP sans recruter",
    "BTP sans recruter",
    "assistante BTP sans embauche",
    "assistante travaux externalisée",
    "relais travaux",
    "dossiers chantier",
    "bureau chantier",
    "suivi administratif BTP",
    "assistante travaux",
    "assistante BTP",
  ],
});

export default function Page() {
  const faq = [
    {
      q: "Peut-on gérer une entreprise BTP sans recruter d’assistante ?",
      a: "Oui, si vous avez un relais bureau‑terrain structuré. L’enjeu est de tenir le suivi (devis, relances, documents, demandes) sans tout repousser au soir ou au week‑end.",
    },
    {
      q: "Quand faut-il recruter une assistante BTP ?",
      a: "Quand le besoin devient stable et quasi quotidien, et que vous avez un volume constant nécessitant une présence interne. BeWork peut être une étape souple avant cette embauche.",
    },
    {
      q: "Que peut gérer BeWork sans poste interne ?",
      a: "Le suivi côté bureau : devis, relances, situations/factures, dossiers chantier, documents travaux, suivi fournisseurs et demandes en attente — dans un périmètre cadré.",
    },
    {
      q: "BeWork remplace-t-elle une assistante salariée ?",
      a: "Non. BeWork est un relais travaux flexible et cadré : utile quand la charge varie ou quand vous ne voulez pas recruter trop tôt. Un poste interne reste pertinent si vous avez un besoin constant à temps plein.",
    },
    {
      q: "Est-ce adapté à un artisan ou une petite entreprise du bâtiment ?",
      a: "Oui : démarrage progressif, forfaits clairs et validation finale côté client. L’objectif est de sécuriser le suivi bureau‑terrain sans alourdir l’organisation.",
    },
    {
      q: "Puis-je commencer avec un petit forfait avant d’embaucher ?",
      a: "Oui. On peut démarrer sur un volume limité (relances, suivi simple, dossiers) puis ajuster selon vos chantiers et votre charge.",
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
      description="Tenir le bureau sans recruter : devis, relances, dossiers chantier et suivi bureau‑terrain avec un cadre clair et une validation finale côté client."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "BTP sans recruter", href: PAGE_PATH },
      ]}
      h1="Gérer vos dossiers BTP sans recruter : le relais travaux BeWork"
      intro={
        <>
          Une entreprise BTP peut avoir besoin d’un vrai relais bureau‑chantier avant d’avoir la charge suffisante pour recruter.
          BeWork met en place un <strong>relais travaux</strong> cadré (demandes, suivis, livrables) avec <strong>validation finale</strong>{" "}
          côté client.
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h2>Pourquoi recruter n’est pas toujours la première étape</h2>
      <ul>
        <li>Charge irrégulière selon les chantiers et les périodes.</li>
        <li>Besoin urgent, mais pas permanent.</li>
        <li>Coût fixe + temps de formation + gestion RH.</li>
        <li>Besoin d’un cadre souple et d’un volume adaptable.</li>
      </ul>
      <p>
        Recruter devient très pertinent quand le besoin est stable et constant. Avant ça, un relais externe cadré peut éviter une embauche trop tôt.
      </p>

      <h2>Ce qu’il faut quand même tenir (même quand vous êtes sur chantier)</h2>
      <ul>
        <li>Devis à sortir et relances clients</li>
        <li>Situations de travaux et factures</li>
        <li>Dossiers chantier et documents travaux</li>
        <li>Fournisseurs, locations matériel, confirmations</li>
        <li>Comptes rendus, réserves, DOE (selon périmètre)</li>
        <li>Demandes en attente et points bloquants</li>
      </ul>

      <h2>Ce que BeWork apporte sans recruter</h2>
      <ul>
        <li>Relais bureau‑terrain : demandes suivies, statuts et priorités</li>
        <li>Forfait clair et périmètre cadré</li>
        <li>Démarrage progressif et volume adaptable</li>
        <li>Livrables préparés et traçables</li>
        <li>Validation finale côté client sur ce qui engage</li>
      </ul>

      <h2>Quand BeWork est adapté</h2>
      <ul>
        <li>Artisan débordé entre chantier, clients et bureau</li>
        <li>PME BTP en croissance (besoin récurrent mais variable)</li>
        <li>Conducteur de travaux sans appui bureau</li>
        <li>Entreprise qui veut tester un relais avant de recruter</li>
        <li>Surcharge ponctuelle sur plusieurs chantiers</li>
      </ul>

      <h2>Quand recruter peut rester préférable</h2>
      <ul>
        <li>Besoin permanent très élevé et stable</li>
        <li>Présence physique quotidienne indispensable</li>
        <li>Organisation déjà mature avec volume constant</li>
        <li>Sujets internes très sensibles nécessitant un pilotage interne à plein temps</li>
      </ul>

      <h2>Ce que vous gardez (validation finale)</h2>
      <ul>
        <li>Prix, marges et décisions commerciales</li>
        <li>Choix techniques et arbitrages chantier</li>
        <li>Décisions RH, signatures et engagements contractuels</li>
      </ul>

      <h2>Aller plus loin</h2>
      <ul>
        <li>
          <Link href="/tarifs" className="font-semibold text-[#1d4ed8] underline-offset-4 hover:underline">
            Découvrir les forfaits
          </Link>
        </li>
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
          <CalendlyBookingLink className="font-semibold text-[#1d4ed8] underline-offset-4 hover:underline">
            Réserver un échange
          </CalendlyBookingLink>
        </li>
      </ul>

      <h2>Artisan débordé : l’angle terrain</h2>
      <p>
        Si la charge se résume surtout à « tout faire soi-même » entre atelier et bureau, voir{" "}
        <Link href="/artisan-deborde-administratif" className="font-semibold text-[#1d4ed8] underline-offset-4 hover:underline">
          artisan débordé administratif
        </Link>
        .
      </p>
    </SeoLandingPage>
  );
}

