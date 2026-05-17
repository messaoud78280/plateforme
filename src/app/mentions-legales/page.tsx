import type { Metadata } from "next";
import Link from "next/link";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";
import { absoluteUrl } from "@/lib/site";

const path = "/mentions-legales";
const pageUrl = absoluteUrl(path);

export const metadata: Metadata = {
  title: { absolute: "Mentions légales | BeWork" },
  description:
    "Mentions légales BeWork : éditeur du site, OFC CREATION D’ENTREPRISE, coordonnées et informations réglementaires.",
  alternates: { canonical: pageUrl, languages: { fr: pageUrl, "x-default": pageUrl } },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: pageUrl,
    siteName: "BeWork",
    title: "Mentions légales | BeWork",
    description:
    "Mentions légales BeWork : éditeur du site, OFC CREATION D’ENTREPRISE, coordonnées et informations réglementaires.",
    images: [{ url: absoluteUrl("/opengraph-image"), width: 1200, height: 630, alt: "Mentions légales — BeWork" }],
  },
};

export default function MentionsLegalesPage() {
  return (
    <SeoLandingPage
      description="Informations légales relatives à l’éditeur du site BeWork, société OFC CREATION D’ENTREPRISE."
      h1="Mentions légales"
      intro={
        <>
          Conformément aux dispositions applicables aux sites internet professionnels, cette page présente les informations légales relatives à
          l’éditeur du site BeWork.
        </>
      }
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Mentions légales", href: path },
      ]}
    >
      <h2>1. Éditeur du site</h2>
      <p>Le site BeWork est édité par&nbsp;:</p>
      <p>
        <strong>OFC CREATION D’ENTREPRISE</strong>
        <br />
        SAS
        <br />
        Siège social&nbsp;: 6 rue Henri Dunant, 78280 Guyancourt, France
        <br />
        SIREN&nbsp;: 905&nbsp;244&nbsp;281
        <br />
        SIRET&nbsp;: 905&nbsp;244&nbsp;281&nbsp;00010
        <br />
        RCS&nbsp;: 905&nbsp;244&nbsp;281 R.C.S. Versailles
        <br />
        TVA intracommunautaire&nbsp;: FR90905244281
      </p>
      <p>
        Présidente et directrice de la publication&nbsp;: <strong>Laure Olivie</strong>
      </p>
      <p className="text-sm text-slate-600">
        Source publique des identifiants d’entreprise&nbsp;: données disponibles notamment via les registres du commerce et des sociétés (ex.
        Pappers, entreprise OFC CREATION D’ENTREPRISE, SIREN 905244281).
      </p>

      <h2>2. Contact</h2>
      <p>
        E-mail&nbsp;:{" "}
        <a
          href="mailto:contact@bework.fr"
          className="font-medium text-[#1d4ed8] underline-offset-2 hover:underline"
          {...plausibleTrackProps(PLAUSIBLE_EVENTS.CLICK_EMAIL, "mentions-legales")}
        >
          contact@bework.fr
        </a>
        <br />
        Téléphone&nbsp;:{" "}
        <a
          href="tel:+33695661818"
          className="font-medium text-[#1d4ed8] underline-offset-2 hover:underline"
          {...plausibleTrackProps(PLAUSIBLE_EVENTS.CLICK_TELEPHONE, "mentions-legales")}
        >
          06&nbsp;95&nbsp;66&nbsp;18&nbsp;18
        </a>
      </p>

      <h2>3. Propriété intellectuelle</h2>
      <p>
        L’ensemble des contenus présents sur le site BeWork, notamment les textes, éléments graphiques, logos, interfaces, images, documents, guides
        et éléments de présentation, sont protégés par le droit de la propriété intellectuelle. Toute reproduction, représentation, modification,
        adaptation ou exploitation, totale ou partielle, sans autorisation préalable écrite, est interdite.
      </p>

      <h2>4. Responsabilité</h2>
      <p>
        BeWork s’efforce de fournir des informations exactes et à jour. Toutefois, les informations publiées sur le site sont fournies à titre
        indicatif et peuvent évoluer. L’éditeur ne saurait être tenu responsable des erreurs, omissions ou indisponibilités temporaires du site.
      </p>

      <h2>5. Données personnelles</h2>
      <p>
        Les données personnelles collectées via les formulaires du site sont utilisées uniquement pour répondre aux demandes des utilisateurs,
        assurer le suivi commercial et améliorer la qualité du service. Pour plus d’informations, consulter la{" "}
        <Link href="/politique-confidentialite">Politique de confidentialité</Link>.
      </p>

      <h2>6. Cookies</h2>
      <p>
        Le site peut utiliser des cookies nécessaires à son fonctionnement (par exemple pour la session ou la sécurité lorsque des comptes
        utilisateurs existent), ainsi que des outils de mesure d’audience ou de suivi si ceux-ci sont activés. L’utilisateur peut gérer ses préférences
        selon les modalités affichées sur le site lorsque des choix sont proposés. À la date de rédaction de cette page, aucun bandeau de consentement
        cookies dédié n’est décrit ici&nbsp;: en l’absence d’outil visible sur le site, seuls les mécanismes techniques strictement nécessaires peuvent
        être en place.
      </p>

      <h2>7. Droit applicable</h2>
      <p>Le présent site est soumis au droit français.</p>
    </SeoLandingPage>
  );
}
