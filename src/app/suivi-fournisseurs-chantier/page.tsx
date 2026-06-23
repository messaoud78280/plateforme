import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { landingPageMetadataFromPath } from "@/lib/seo-landing-metadata";

const PAGE_PATH = "/suivi-fournisseurs-chantier";

export const metadata = landingPageMetadataFromPath(PAGE_PATH);

export default function Page() {
  const faq = [
    {
      q: "Pourquoi le suivi fournisseurs est-il important sur un chantier ?",
      a: "Parce qu’une commande non confirmée ou une livraison mal suivie peut immobiliser une équipe et décaler le planning. Le suivi évite les surprises de dernière minute.",
    },
    {
      q: "Comment éviter les retards de livraison chantier ?",
      a: "Centralisez les demandes, obtenez une confirmation écrite, notez la date attendue, relancez avant l’échéance et gardez une trace (mail/bon). Le tableau de suivi fait la différence.",
    },
    {
      q: "BeWork peut-elle relancer mes fournisseurs ?",
      a: "Oui : relances de prix, confirmations, livraisons, locations matériel, pièces manquantes, et mise à jour des statuts. Vous gardez la validation finale sur les décisions qui engagent.",
    },
    {
      q: "BeWork peut-elle suivre les locations matériel ?",
      a: "Oui : réservation/confirmation, prolongations, créneaux, contacts et relances. BeWork vous remonte les points à valider avant engagement si nécessaire.",
    },
    {
      q: "Qui valide les prix et les commandes ?",
      a: "Vous. BeWork prépare, suit et relance, mais ne choisit pas vos fournisseurs ni vos matériaux et ne valide pas les achats stratégiques à votre place.",
    },
    {
      q: "Comment suivre plusieurs fournisseurs en même temps ?",
      a: "Avec un tableau simple : fournisseur, commande/BC, date attendue, statut, prochaine relance, contact et preuve. L’important est la régularité et la traçabilité.",
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
      description="Suivi fournisseurs chantier : confirmations, livraisons, locations matériel et relances. Une méthode simple pour éviter les équipes bloquées et les retards."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Suivi fournisseurs chantier", href: PAGE_PATH },
      ]}
      h1="Suivi fournisseurs chantier : évitez les retards de matériaux et de matériel"
      intro={
        <>
          Un chantier peut se bloquer non pas à cause des équipes, mais à cause d’une commande non confirmée, d’une livraison mal
          suivie ou d’une location matériel oubliée. BeWork aide les entreprises du BTP à structurer le suivi fournisseurs côté
          bureau : demandes de prix, bons de commande, confirmations, relances, livraisons, locations et points bloquants.
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h2>Pourquoi le suivi fournisseurs dérape</h2>
      <ul>
        <li>Demande de prix envoyée sans relance, puis oubliée.</li>
        <li>Bon de commande non confirmé (ou confirmation introuvable).</li>
        <li>Livraison non vérifiée : créneau, adresse, dépôt, chauffeur.</li>
        <li>Le délai change, mais l’info arrive trop tard.</li>
        <li>Location matériel non réservée / non prolongée.</li>
        <li>Informations dispersées entre téléphone, mails et WhatsApp.</li>
        <li>Absence de tableau de suivi (statuts, dates attendues, prochaine action).</li>
      </ul>

      <h2>Ce que ça coûte au chantier</h2>
      <ul>
        <li>Équipes immobilisées et productivité qui chute.</li>
        <li>Planning qui dérape, urgences de dernière minute.</li>
        <li>Achat plus cher faute d’anticipation ou de solution de repli.</li>
        <li>Tension client et charge mentale du dirigeant / conducteur de travaux.</li>
      </ul>

      <h2>Méthode simple pour suivre fournisseurs, livraisons et locations</h2>
      <ul>
        <li>Centraliser les demandes fournisseurs (une file unique).</li>
        <li>Créer un tableau de suivi (BC, date attendue, statut, prochaine relance).</li>
        <li>Obtenir une confirmation écrite (prix / délai / créneau / adresse).</li>
        <li>Relancer avant l’échéance (pas le jour même).</li>
        <li>Suivre livraisons et locations (réservation, prolongation, réception).</li>
        <li>Signaler les retards et garder une trace des échanges.</li>
      </ul>

      <h2>Ce que BeWork peut prendre en charge (côté bureau)</h2>
      <ul>
        <li>Tableau de suivi fournisseurs (statuts, dates, points bloquants)</li>
        <li>Préparation des demandes de prix (mail clair, pièces, contexte)</li>
        <li>Suivi des confirmations et des bons de commande</li>
        <li>Relances fournisseurs planifiées (prix, délais, créneaux, AR)</li>
        <li>Suivi livraisons (contacts, créneaux, preuves) et locations matériel</li>
        <li>Alertes sur retards / pièces manquantes + priorisation</li>
        <li>Synthèse hebdomadaire des points bloquants si nécessaire</li>
      </ul>

      <h2>Ce que vous gardez (validation finale)</h2>
      <ul>
        <li>Choix des fournisseurs et des matériaux</li>
        <li>Négociation stratégique et validation des prix</li>
        <li>Choix techniques et arbitrages chantier</li>
        <li>Signature / engagement de commande quand cela engage l’entreprise</li>
      </ul>

      <h2>Exemple concret</h2>
      <p>
        Une équipe doit intervenir lundi matin, mais le matériel n’est pas confirmé. BeWork peut vérifier les confirmations, relancer le fournisseur,
        suivre la livraison ou la location, puis vous signaler les points à valider avant que le chantier ne se bloque.
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
        <li>
          <Link href="/chantier-mal-suivi" className="font-semibold text-[#1d4ed8] underline-offset-4 hover:underline">
            Chantier mal suivi : reprendre le contrôle
          </Link>
        </li>
      </ul>

      <h2>Parler de votre suivi fournisseurs</h2>
      <p>
        Besoin d’une assistance bureau-terrain pour tenir confirmations, relances et statuts sans immobiliser vos équipes ?{" "}
        <CalendlyBookingLink className="font-semibold text-[#1d4ed8] underline-offset-4 hover:underline">
          Réserver un échange
        </CalendlyBookingLink>
        .
      </p>
    </SeoLandingPage>
  );
}

