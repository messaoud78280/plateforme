import type { Metadata } from "next";
import Link from "next/link";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import {
  BEWORK_EXTENSION_PRICE_EUR,
  TRAINING_OFFERS,
} from "@/lib/bework-formation";
import { absoluteUrl } from "@/lib/site";

const path = "/conditions-generales-vente";
const pageUrl = absoluteUrl(path);

export const metadata: Metadata = {
  title: { absolute: "Conditions générales de vente | BeWork" },
  description:
    "Conditions générales de vente de la formation BeWork : parcours, tarifs, inscription, exécution et responsabilités.",
  alternates: { canonical: pageUrl, languages: { fr: pageUrl, "x-default": pageUrl } },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: pageUrl,
    siteName: "BeWork",
    title: "Conditions générales de vente | BeWork",
    description:
      "Conditions applicables aux parcours de formation BeWork de 7 h et 14 h.",
    images: [
      {
        url: absoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
        alt: "Conditions générales de vente — BeWork",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Conditions générales de vente | BeWork",
    description: "Conditions applicables aux parcours de formation BeWork de 7 h et 14 h.",
  },
};

export default function ConditionsGeneralesVentePage() {
  return (
    <SeoLandingPage
      description="Conditions générales de vente applicables aux parcours de formation BeWork."
      h1="Conditions générales de vente"
      intro={
        <>
          Les présentes conditions encadrent la vente des formations BeWork. Les modalités
          particulières communiquées avant l’inscription complètent ces conditions et prévalent
          en cas de disposition plus précise.
        </>
      }
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Conditions générales de vente", href: path },
      ]}
    >
      <h2>1. Identité du prestataire</h2>
      <p>
        La formation BeWork est proposée par <strong>OFC CREATION D’ENTREPRISE</strong>,
        société éditrice du site BeWork. Les coordonnées complètes figurent dans les{" "}
        <Link href="/mentions-legales" className="font-medium text-[#1d4ed8] underline hover:no-underline">
          mentions légales
        </Link>
        .
      </p>

      <h2>2. Objet</h2>
      <p>
        BeWork propose une formation pratique pour apprendre à créer avec l’intelligence
        artificielle sans prérequis en programmation. Elle est organisée selon un parcours
        progressif&nbsp;: un Jour&nbsp;1 commun, puis un Jour&nbsp;2 d’approfondissement pour
        les participants ayant choisi le parcours complet.
      </p>
      <p>
        La formation transmet une méthode et accompagne la pratique. Elle ne constitue ni une
        certification professionnelle, ni une promesse de devenir développeur ou expert en
        quelques heures.
      </p>

      <h2>3. Parcours et tarifs publics</h2>
      <ul>
        <li>
          <strong>Parcours essentiel</strong> — {TRAINING_OFFERS.essential.hours}&nbsp;h,
          {` ${TRAINING_OFFERS.essential.price}`}&nbsp;€ par participant.
        </li>
        <li>
          <strong>Parcours complet</strong> — {TRAINING_OFFERS.complete.hours}&nbsp;h,
          {` ${TRAINING_OFFERS.complete.price}`}&nbsp;€ par participant.
        </li>
        <li>
          Prolongation après le Jour&nbsp;1&nbsp;: Jour&nbsp;2 à{" "}
          {BEWORK_EXTENSION_PRICE_EUR}&nbsp;€ supplémentaires par participant.
        </li>
      </ul>
      <p>
        Les tarifs applicables sont ceux confirmés par écrit au moment de l’inscription. Toute
        prestation complémentaire éventuelle fait l’objet d’une information et d’un accord
        préalables.
      </p>

      <h2>4. Modalités de participation</h2>
      <p>
        Les sessions peuvent être organisées en présentiel ou en visioconférence. La modalité,
        le lieu éventuel, les horaires et les prérequis pratiques sont précisés avant
        l’inscription définitive. Le participant doit disposer d’un ordinateur compatible avec
        les consignes communiquées.
      </p>

      <h2>5. Demande de place et inscription</h2>
      <p>
        Le formulaire du site constitue une demande de contact et non une inscription
        automatique. L’inscription devient effective après confirmation écrite de BeWork et
        acceptation par le client des informations propres à la session, notamment le parcours,
        la modalité et les conditions de règlement.
      </p>
      <p>
        Aucune date, place disponible ou priorité d’inscription n’est garantie par la seule
        transmission du formulaire.
      </p>

      <h2>6. Paiement</h2>
      <p>
        Le montant, l’échéance et le moyen de paiement sont indiqués sur le document transmis
        avant la validation définitive. Aucun coût non annoncé ne doit être engagé sans accord
        du client.
      </p>

      <h2>7. Modification, report ou annulation</h2>
      <p>
        Les conditions de modification, de report ou d’annulation applicables à la session sont
        communiquées avant l’inscription définitive. En cas d’empêchement, le participant doit
        contacter BeWork dès que possible afin d’examiner les solutions disponibles.
      </p>

      <h2>8. Droit de rétractation</h2>
      <p>
        Les droits applicables dépendent notamment de la qualité du client, des conditions de
        conclusion du contrat et de la date prévue pour la prestation. Lorsque la réglementation
        prévoit un droit de rétractation ou une information particulière, les modalités
        correspondantes sont communiquées avant la conclusion du contrat.
      </p>

      <h2>9. Exécution de la formation</h2>
      <p>
        BeWork est tenue à une obligation de moyens. Le contenu peut être ajusté au rythme du
        groupe sans dénaturer les objectifs annoncés. Le résultat obtenu dépend également de la
        participation, du niveau de départ, du projet choisi et du temps de pratique de chaque
        participant.
      </p>

      <h2>10. Responsabilité du participant</h2>
      <p>
        Le participant reste responsable des informations, fichiers et accès qu’il utilise, ainsi
        que des décisions prises à partir de ses réalisations. Il lui appartient de ne pas
        communiquer de données confidentielles ou personnelles qui ne seraient pas nécessaires à
        la formation.
      </p>

      <h2>11. Propriété intellectuelle</h2>
      <p>
        Les supports, contenus pédagogiques et éléments de méthode BeWork restent protégés par les
        droits applicables. Leur utilisation personnelle dans le cadre de l’apprentissage est
        autorisée. Toute diffusion, reproduction commerciale ou transmission substantielle à un
        tiers nécessite un accord préalable.
      </p>

      <h2>12. Données personnelles</h2>
      <p>
        Le traitement des données collectées lors d’une demande de place ou d’un contact est
        décrit dans la{" "}
        <Link
          href="/politique-confidentialite"
          className="font-medium text-[#1d4ed8] underline hover:no-underline"
        >
          politique de confidentialité
        </Link>
        .
      </p>

      <h2>13. Droit applicable et règlement des litiges</h2>
      <p>
        Les présentes conditions sont soumises au droit français. En cas de difficulté, les
        parties recherchent d’abord une solution amiable. Les règles impératives relatives à la
        compétence juridictionnelle restent applicables.
      </p>

      <p className="mt-8 text-sm text-slate-600">
        Une question sur ces conditions&nbsp;?{" "}
        <Link href="/contact" className="underline hover:no-underline">
          Contactez BeWork
        </Link>
        {" · "}
        <Link href="/tarifs" className="underline hover:no-underline">
          Voir les parcours et tarifs
        </Link>
      </p>
    </SeoLandingPage>
  );
}
