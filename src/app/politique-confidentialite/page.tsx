import type { Metadata } from "next";
import Link from "next/link";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";
import { absoluteUrl } from "@/lib/site";

const path = "/politique-confidentialite";
const pageUrl = absoluteUrl(path);

export const metadata: Metadata = {
  title: { absolute: "Politique de confidentialité | BeWork" },
  description:
    "Politique de confidentialité BeWork : collecte, usage et protection de vos données personnelles sur le site et la plateforme.",
  alternates: { canonical: pageUrl, languages: { fr: pageUrl, "x-default": pageUrl } },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: pageUrl,
    siteName: "BeWork",
    title: "Politique de confidentialité | BeWork",
    description:
    "Politique de confidentialité BeWork : collecte, usage et protection de vos données personnelles sur le site et la plateforme.",
    images: [{ url: absoluteUrl("/opengraph-image"), width: 1200, height: 630, alt: "Politique de confidentialité — BeWork" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Politique de confidentialité | BeWork",
    description:
      "Politique de confidentialité BeWork : collecte, usage et protection de vos données personnelles sur le site et la plateforme.",
  },
};

export default function PolitiqueConfidentialitePage() {
  return (
    <SeoLandingPage
      description="Informations sur la collecte, l’utilisation et la protection des données personnelles sur le site BeWork."
      h1="Politique de confidentialité"
      intro={
        <>
          La présente politique informe les utilisateurs du site BeWork sur les traitements de données personnelles
          susceptibles d’être mis en œuvre lors de la consultation du site ou de l’utilisation des services proposés.
        </>
      }
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Politique de confidentialité", href: path },
      ]}
    >
      <h2>1. Responsable du traitement</h2>
      <p>Les données personnelles collectées sur le site BeWork sont traitées par&nbsp;:</p>
      <p>
        <strong>OFC CREATION D’ENTREPRISE</strong>
        <br />
        SAS
        <br />
        Siège social&nbsp;: 6 rue Henri Dunant, 78280 Guyancourt, France
        <br />
        SIREN&nbsp;: 905&nbsp;244&nbsp;281
      </p>
      <p>
        Responsable de publication&nbsp;: <strong>Laure Olivie</strong>
        <br />
        Contact RGPD&nbsp;:{" "}
        <a
          href="mailto:contact@bework.fr"
          className="font-medium text-[#1d4ed8] underline-offset-2 hover:underline"
          {...plausibleTrackProps(PLAUSIBLE_EVENTS.CLICK_EMAIL, "politique-confidentialite-rgpd")}
        >
          contact@bework.fr
        </a>
      </p>

      <h2>2. Données collectées</h2>
      <p>Le site peut collecter les données suivantes lorsque l’utilisateur remplit un formulaire ou prend contact avec BeWork&nbsp;:</p>
      <ul>
        <li>nom&nbsp;;</li>
        <li>prénom&nbsp;;</li>
        <li>adresse e-mail&nbsp;;</li>
        <li>numéro de téléphone&nbsp;;</li>
        <li>nom de l’entreprise&nbsp;;</li>
        <li>fonction ou rôle dans l’entreprise&nbsp;;</li>
        <li>message transmis&nbsp;;</li>
        <li>besoins exprimés&nbsp;;</li>
        <li>informations nécessaires à l’étude d’une demande&nbsp;;</li>
        <li>données techniques de navigation si des outils de mesure d’audience sont activés.</li>
      </ul>

      <h2>3. Finalités du traitement</h2>
      <p>Les données collectées peuvent être utilisées pour&nbsp;:</p>
      <ul>
        <li>répondre aux demandes envoyées via le site&nbsp;;</li>
        <li>assurer le suivi commercial&nbsp;;</li>
        <li>préparer un échange ou un rendez-vous&nbsp;;</li>
        <li>comprendre les besoins transmis par l’utilisateur&nbsp;;</li>
        <li>améliorer les services et contenus proposés par BeWork&nbsp;;</li>
        <li>sécuriser les échanges et le fonctionnement du site.</li>
      </ul>

      <h2>4. Bases légales</h2>
      <p>Les traitements peuvent reposer sur&nbsp;:</p>
      <ul>
        <li>le consentement de l’utilisateur lorsqu’il remplit volontairement un formulaire&nbsp;;</li>
        <li>l’intérêt légitime de BeWork à répondre aux demandes reçues&nbsp;;</li>
        <li>l’exécution de mesures précontractuelles lorsque la demande concerne une offre ou un service.</li>
      </ul>

      <h2>5. Durée de conservation</h2>
      <p>
        Les données sont conservées pendant une durée limitée, proportionnée aux finalités pour lesquelles elles ont été collectées. À titre indicatif
        &nbsp;:
      </p>
      <ul>
        <li>les demandes de contact peuvent être conservées jusqu’à 3 ans après le dernier échange&nbsp;;</li>
        <li>
          les données liées à une relation commerciale peuvent être conservées pendant la durée nécessaire au suivi de la relation&nbsp;;
        </li>
        <li>certaines données peuvent être conservées plus longtemps lorsque la loi l’exige.</li>
      </ul>
      <p>
        Ces durées sont indicatives. Pour toute question sur la conservation de vos données, contactez{" "}
        <a
          href="mailto:contact@bework.fr"
          className="font-medium text-[#1d4ed8] underline-offset-2 hover:underline"
          {...plausibleTrackProps(PLAUSIBLE_EVENTS.CLICK_EMAIL, "politique-confidentialite-duree")}
        >
          contact@bework.fr
        </a>
        .
      </p>

      <h2>6. Destinataires des données</h2>
      <p>
        Les données personnelles sont destinées à BeWork et aux prestataires techniques strictement nécessaires au fonctionnement du site, à la
        gestion des formulaires, à la prise de contact ou au suivi commercial. Aucune donnée personnelle n’est vendue à des tiers.
      </p>

      <h2>7. Outils techniques</h2>
      <p>
        Les données peuvent être traitées via des prestataires techniques strictement nécessaires au fonctionnement du site et des services associés,
        selon la configuration effectivement déployée.
      </p>
      <p>
        Selon la configuration effectivement déployée en production, les traitements techniques peuvent notamment
        impliquer&nbsp;:
      </p>
      <ul>
        <li>
          <strong>Base de données</strong> (comptes, données métier)&nbsp;: PostgreSQL (Prisma). Lorsque les variables
          d&apos;environnement pointent vers ce prestataire, l&apos;hébergement de base peut être assuré via{" "}
          <strong>Supabase</strong>.
        </li>
        <li>
          <strong>Envoi d&apos;e-mails transactionnels</strong>&nbsp;: <strong>Brevo</strong> (API), lorsque les clés et
          paramètres d&apos;expéditeur sont configurés.
        </li>
        <li>
          <strong>Formulaire de contact</strong>&nbsp;: les demandes saisies sur le site sont enregistrées dans la base
          BeWork et traitées par l&apos;équipe (voir finalités ci-dessus).
        </li>
        <li>
          <strong>Authentification</strong> des espaces connectés&nbsp;: <strong>NextAuth.js</strong> (cookies de
          session).
        </li>
        <li>
          <strong>Fonctions d&apos;intelligence artificielle</strong> (lorsque activées)&nbsp;: appels à des API de
          modèles de langage (notamment OpenAI) pour certaines fonctionnalités métier de la plateforme. Les données
          transmises dépendent de la fonction utilisée ; les utilisateurs restent responsables de ne pas y inclure de
          données inutiles.
        </li>
      </ul>
      <p>
        La liste des sous-traitants techniques peut évoluer. Pour toute demande de précision, contactez{" "}
        <a
          href="mailto:contact@bework.fr"
          className="font-medium text-[#1d4ed8] underline-offset-2 hover:underline"
          {...plausibleTrackProps(PLAUSIBLE_EVENTS.CLICK_EMAIL, "politique-confidentialite-outils")}
        >
          contact@bework.fr
        </a>
        .
      </p>

      <h2>8. Droits des utilisateurs</h2>
      <p>
        Conformément à la réglementation applicable, l’utilisateur dispose d’un droit d’accès, de rectification, d’effacement, d’opposition, de
        limitation et, lorsque cela est applicable, d’un droit à la portabilité de ses données.
      </p>
      <p>
        Pour exercer ses droits, l’utilisateur peut contacter BeWork à l’adresse suivante&nbsp;:{" "}
        <a
          href="mailto:contact@bework.fr"
          className="font-medium text-[#1d4ed8] underline-offset-2 hover:underline"
          {...plausibleTrackProps(PLAUSIBLE_EVENTS.CLICK_EMAIL, "politique-confidentialite-droits")}
        >
          contact@bework.fr
        </a>
      </p>

      <h2>9. Réclamation auprès de la CNIL</h2>
      <p>
        Si l’utilisateur estime que ses droits ne sont pas respectés, il peut adresser une réclamation auprès de la CNIL (
        <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">
          www.cnil.fr
        </a>
        ).
      </p>

      <h2>10. Cookies</h2>
      <p>
        Le site peut utiliser des cookies nécessaires à son fonctionnement. Des cookies de mesure d’audience ou de suivi peuvent également être
        utilisés si ces outils sont activés. Lorsque cela est nécessaire au regard de la réglementation, l’utilisateur doit pouvoir accepter, refuser
        ou paramétrer les cookies non essentiels. À la date de rédaction de cette page, aucun bandeau de consentement cookies dédié n’est décrit ici
        &nbsp;: tant qu’aucun choix n’est proposé explicitement sur l’interface, seuls des mécanismes strictement nécessaires au fonctionnement ou à la
        sécurité peuvent être en place.
      </p>

      <p className="not-prose mt-10 text-sm text-slate-600">
        Pour les mentions légales de l’éditeur, voir également la page{" "}
        <Link href="/mentions-legales" className="font-semibold text-[#1d4ed8] hover:underline">
          Mentions légales
        </Link>
        .
      </p>
    </SeoLandingPage>
  );
}
