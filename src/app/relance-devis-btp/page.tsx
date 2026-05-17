import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { landingPageMetadataFromPath } from "@/lib/seo-landing-metadata";

const PAGE_PATH = "/relance-devis-btp";

export const metadata = landingPageMetadataFromPath(PAGE_PATH);

export default function Page() {
  const faq = [
    {
      q: "Quand relancer un devis BTP ?",
      a: "Une méthode simple et réaliste : une relance courte après l’envoi (ex. J+2), une relance de clarification (ex. J+7) puis une relance finale propre (ex. J+14). L’essentiel est la régularité et le suivi des statuts.",
    },
    {
      q: "Comment relancer un devis travaux sans paraître insistant ?",
      a: "Restez court, professionnel et contextualisé : rappel de la date d’envoi, question simple, proposition de créneau. Et notez la prochaine action (date/canal) pour éviter les relances au hasard.",
    },
    {
      q: "Pourquoi les devis non relancés font perdre des chantiers ?",
      a: "Parce que le client avance avec l’entreprise la plus réactive. Souvent, ce n’est pas le prix : c’est l’absence de rythme, de relance et de suivi entre mails, appels et WhatsApp.",
    },
    {
      q: "BeWork peut-elle préparer mes relances devis ?",
      a: "Oui : tableau de suivi, mails de relance, relances planifiées, mise à jour des statuts et alertes sur les devis sans retour. Vous validez les points sensibles si besoin.",
    },
    {
      q: "Est-ce que BeWork peut négocier le prix à ma place ?",
      a: "Non. Le prix, la marge et les concessions restent sous votre contrôle. BeWork prépare et structure le suivi, mais vous gardez la validation finale sur ce qui engage.",
    },
    {
      q: "Comment suivre plusieurs devis en même temps ?",
      a: "Avec un tableau simple (statut, prochaine relance, canal, réponse) et des relances planifiées. L’objectif : savoir quoi relancer, quand, et avec quel message.",
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
      description="Suivi devis travaux, relances clients et statuts clairs : une méthode simple pour éviter les opportunités perdues."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Relance devis BTP", href: PAGE_PATH },
      ]}
      h1="Relance devis BTP : ne laissez plus vos chantiers partir ailleurs"
      intro={
        <>
          Un devis envoyé mais non suivi peut faire perdre un chantier. Le problème n’est pas toujours le prix : souvent,
          c’est l’absence de rythme, de relance et de suivi. BeWork aide les entreprises du BTP à structurer le{" "}
          <strong>suivi des devis travaux</strong> : relances préparées, statuts clairs, réponses suivies — avec{" "}
          <strong>validation finale</strong> côté client sur ce qui engage.
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h2>Pourquoi les devis BTP ne sont pas relancés</h2>
      <ul>
        <li>Le chef d’entreprise est sur chantier, et les relances passent après l’urgence du terrain.</li>
        <li>Le devis est envoyé, puis plus de trace : pas de date de relance ni de statut.</li>
        <li>Les infos sont dispersées entre email, téléphone, WhatsApp, photos et notes.</li>
        <li>Le client “réfléchit” et personne ne propose un créneau ou une prochaine étape.</li>
      </ul>

      <h2>Une méthode simple de relance (sans promesse magique)</h2>
      <p>Un scénario réaliste, à adapter à votre activité :</p>
      <ul>
        <li>
          <strong>Relance courte après envoi</strong> (ex. J+2) : vérifier la réception + détecter un point bloquant.
        </li>
        <li>
          <strong>Relance de clarification</strong> (ex. J+7) : question simple + proposition de créneau.
        </li>
        <li>
          <strong>Relance avant décision</strong> (ex. J+14) : cadrer planning/validité/capacité et obtenir une réponse.
        </li>
      </ul>
      <p>Le point clé : un statut clair pour chaque devis.</p>
      <ul>
        <li>
          <strong>Envoyé</strong> → <strong>Relancé</strong> → <strong>En attente</strong> → <strong>Accepté</strong> ou{" "}
          <strong>Perdu</strong>
        </li>
      </ul>

      <h2>Ce que BeWork peut prendre en charge (sur la relance devis)</h2>
      <ul>
        <li>Tableau de suivi des devis (statuts, prochaines relances, échéances)</li>
        <li>Préparation des mails/messages de relance (professionnels, contextualisés)</li>
        <li>Relances planifiées selon vos consignes</li>
        <li>Suivi des réponses clients et mise à jour des statuts</li>
        <li>Alertes sur les devis sans retour + priorisation</li>
      </ul>

      <h2>Ce que vous gardez (validation finale)</h2>
      <ul>
        <li>Prix, marge, concessions et négociations importantes</li>
        <li>Choix techniques et arbitrages</li>
        <li>Signature, engagements contractuels, réponses sensibles</li>
      </ul>

      <h2>Exemple concret</h2>
      <p>
        Un devis envoyé depuis 10 jours sans réponse peut être relancé avec un message court, professionnel et contextualisé.
        BeWork peut préparer la relance, noter le statut, programmer une relance suivante et vous signaler les devis prioritaires.
      </p>

      <h2>Aller plus loin (liens utiles)</h2>
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
          <Link href="/devis-retard-btp" className="font-semibold text-[#1d4ed8] underline-offset-4 hover:underline">
            Devis en retard BTP : éviter les retards dès le départ
          </Link>
        </li>
      </ul>

      <h2>Parler de votre suivi devis</h2>
      <p>
        Besoin d’un relais pour tenir vos relances et vos statuts de devis sans y passer vos soirées ?{" "}
        <CalendlyBookingLink className="font-semibold text-[#1d4ed8] underline-offset-4 hover:underline">
          Réserver un échange
        </CalendlyBookingLink>
        .
      </p>
    </SeoLandingPage>
  );
}

