import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { landingPageMetadata } from "@/lib/seo-landing-metadata";

const PAGE_PATH = "/impayes-btp-relances";

export const metadata = landingPageMetadata({
  title: "Impayés BTP | Relances factures et situations avec BeWork",
  description:
    "Impayés BTP : suivez factures et situations, relancez clients à temps et limitez les retards de paiement sur chantier.",
  path: PAGE_PATH,
  keywords: [
    "impayés BTP",
    "relance facture BTP",
    "relance situation de travaux",
    "factures impayées bâtiment",
    "retard paiement chantier",
    "trésorerie BTP",
    "suivi factures chantier",
    "assistante travaux",
    "assistante BTP",
  ],
});

export default function Page() {
  const faq = [
    {
      q: "Quand relancer une facture impayée dans le BTP ?",
      a: "Dès le premier retard, avec un rappel courtois et factuel. Ensuite, une relance plus structurée si nécessaire. L’essentiel est de garder un calendrier et des statuts clairs.",
    },
    {
      q: "Comment relancer un client sans dégrader la relation ?",
      a: "En restant court, professionnel et régulier : montant, échéance, pièce jointe, question simple, prochaine action. Le ton compte autant que la traçabilité.",
    },
    {
      q: "BeWork peut-elle préparer mes relances d’impayés ?",
      a: "Oui : tableau de suivi, mails de relance, relances courtoises, suivi des réponses et mise à jour des statuts. Les relances fermes/sensibles restent à valider par vous.",
    },
    {
      q: "BeWork peut-elle suivre les situations de travaux ?",
      a: "Oui : suivi des envois, pièces associées, échéances, relances et statuts (envoyé, relancé, promis, payé, bloqué).",
    },
    {
      q: "BeWork fait-elle du recouvrement juridique ?",
      a: "Non. BeWork structure le suivi et prépare les relances, mais ne remplace pas un avocat, un huissier/commissaire de justice, un service contentieux ou une procédure de recouvrement.",
    },
    {
      q: "Qui valide les relances fermes ou sensibles ?",
      a: "Vous. BeWork prépare et vous propose ; vous validez les messages fermes, les arbitrages (échéancier) et toute étape engageante.",
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
      description="Impayés BTP : suivi des factures et situations, relances professionnelles et statuts clairs pour éviter que les retards s’accumulent."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Impayés BTP", href: PAGE_PATH },
      ]}
      h1="Impayés BTP : relancez vos factures et situations sans laisser traîner"
      intro={
        <>
          Une facture ou une situation non relancée pèse vite sur la trésorerie — surtout en BTP, où les charges continuent
          même si le client tarde à payer. L’objectif ici : un suivi simple, des relances professionnelles et une traçabilité
          claire (statuts, dates, prochaines actions), sans basculer dans du recouvrement juridique.
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h2>Pourquoi les impayés s’accumulent</h2>
      <ul>
        <li>Facture envoyée sans suivi ni prochaine relance planifiée.</li>
        <li>Situation de travaux oubliée ou envoyée sans traçabilité.</li>
        <li>Le client promet de payer, mais aucun rappel n’est prévu.</li>
        <li>Échéances dispersées (mail, téléphone, WhatsApp) et pas de tableau de suivi.</li>
        <li>Le dirigeant est sur chantier et repousse les relances.</li>
        <li>Gêne à relancer : on attend “encore quelques jours”… puis ça s’empile.</li>
      </ul>

      <h2>Ce que ça coûte à l’entreprise</h2>
      <ul>
        <li>Trésorerie tendue alors que fournisseurs, salaires et charges continuent.</li>
        <li>Pression sur le dirigeant et perte de temps.</li>
        <li>Relation client qui se dégrade si la relance arrive trop tard (ou trop sèche).</li>
        <li>Retards qui se cumulent chantier après chantier.</li>
      </ul>

      <h2>Méthode simple de relance (professionnelle et suivie)</h2>
      <p>Un cadre simple, à adapter à votre réalité :</p>
      <ul>
        <li>Vérifier facture/situation, pièces et date d’envoi.</li>
        <li>Noter l’échéance et planifier une relance courtoise dès le premier retard.</li>
        <li>Si nécessaire, préparer une relance plus ferme (à valider) avec une date cible.</li>
        <li>Tenir le statut : envoyé → relancé → promis → payé → bloqué.</li>
        <li>Garder une trace des échanges et remonter les cas sensibles au dirigeant.</li>
      </ul>
      <p>
        Exemple de rythme (indicatif) : J+5 / J+15 / J+30 selon vos habitudes et vos clients — l’important est la régularité
        et la traçabilité.
      </p>

      <h2>Ce que BeWork peut prendre en charge (côté bureau)</h2>
      <ul>
        <li>Tableau de suivi factures / situations (statuts, prochaines actions, échéances)</li>
        <li>Préparation des mails de relance (courtois, factuels, professionnels)</li>
        <li>Relances courtoises selon vos consignes</li>
        <li>Suivi des réponses clients et mise à jour des statuts</li>
        <li>Alertes sur retards et dossiers bloqués</li>
        <li>Classement des échanges et pièces</li>
        <li>Préparation des relances plus fermes à valider</li>
      </ul>

      <h2>Ce que vous gardez (validation finale)</h2>
      <ul>
        <li>Décision commerciale et relation client sensible</li>
        <li>Validation des montants et arbitrage sur un échéancier</li>
        <li>Validation des relances fermes/sensibles</li>
        <li>Mise en demeure éventuelle et action juridique (si nécessaire)</li>
      </ul>

      <h2>Exemple concret</h2>
      <p>
        Une situation de travaux envoyée depuis 20 jours n’a pas été réglée. BeWork peut vérifier la date d’envoi, préparer une relance courtoise, mettre
        à jour le statut, programmer un rappel et vous signaler si une relance plus ferme doit être validée.
      </p>

      <h2>Aller plus loin</h2>
      <ul>
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
          <Link href="/tarifs" className="font-semibold text-[#1d4ed8] underline-offset-4 hover:underline">
            Découvrir les forfaits
          </Link>
        </li>
      </ul>

      <h2>Parler de votre suivi impayés</h2>
      <p>
        Besoin d’un relais côté bureau pour tenir le suivi des factures, situations et relances sans y passer vos soirées ?{" "}
        <CalendlyBookingLink className="font-semibold text-[#1d4ed8] underline-offset-4 hover:underline">
          Réserver un échange
        </CalendlyBookingLink>
        .
      </p>
    </SeoLandingPage>
  );
}

