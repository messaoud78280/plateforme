import Link from "next/link";
import { BtpPainLandingMaillage } from "@/components/seo/BtpPainLandingMaillage";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { BTP_PAIN_PAGE_PATHS } from "@/lib/btp-pain-pages";
import { landingPageMetadata } from "@/lib/seo-landing-metadata";

const PAGE_PATH = BTP_PAIN_PAGE_PATHS.chantierMalSuivi;

export const metadata = landingPageMetadata({
  title: "Chantier mal suivi | Suivi dossiers travaux avec BeWork",
  description:
    "BeWork aide les entreprises du BTP à structurer le suivi de leurs dossiers chantier : relances, preuves, comptes rendus, réserves, DOE, fournisseurs et documents travaux.",
  path: PAGE_PATH,
  keywords: [
    "chantier mal suivi",
    "suivi chantier BTP",
    "suivi dossiers chantier",
    "documents chantier",
    "réserves chantier",
    "DOE",
    "comptes rendus chantier",
    "relais bureau-chantier",
    "assistante travaux",
    "assistante BTP",
  ],
});

export default function Page() {
  const faq = [
    {
      q: "Comment savoir si un chantier est mal suivi ?",
      a: "Quand les infos sont dispersées, que le client relance, que les comptes rendus manquent, que les réserves traînent, que les preuves sont introuvables et que personne ne sait “où on en est” sans fouiller mails/WhatsApp.",
    },
    {
      q: "Quels documents faut-il suivre pendant un chantier ?",
      a: "Les comptes rendus, preuves (photos/échanges), pièces chantier et validations, suivi des réserves/OPR, et le fil des demandes (client, fournisseurs, locations). L’objectif est la traçabilité, pas la paperasse.",
    },
    {
      q: "Comment éviter que les réserves traînent ?",
      a: "Avec un suivi simple : réserve → responsable → preuve → date → relance → levée. Sans statut et prochaine action, une réserve devient vite “un sujet de fin de chantier” qui s’éternise.",
    },
    {
      q: "BeWork peut-elle préparer un tableau de suivi chantier ?",
      a: "Oui : tableau de suivi (statuts, prochaines actions, pièces, points bloquants), comptes rendus, classement des preuves et relances planifiées. Vous validez les décisions sensibles.",
    },
    {
      q: "BeWork peut-elle suivre les réserves et préparer le DOE ?",
      a: "Oui sur un périmètre cadré : organisation des pièces, checklists, relances documents, compilation progressive. La conduite technique reste chez vous.",
    },
    {
      q: "BeWork remplace-t-elle un conducteur de travaux ?",
      a: "Non. BeWork est un relais bureau‑chantier pour tenir les dossiers, la traçabilité et le suivi. Le conducteur de travaux, le maître d’œuvre et/ou le bureau d’études gardent la conduite technique et les arbitrages.",
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
      description="Chantier mal suivi : informations dispersées, relances oubliées, preuves manquantes, réserves qui traînent. Une méthode simple pour reprendre le contrôle côté dossiers travaux."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Chantier mal suivi", href: PAGE_PATH },
      ]}
      h1="Chantier mal suivi : reprenez le contrôle de vos dossiers travaux"
      intro={
        <>
          Un chantier peut déraper même si le terrain est bien tenu, simplement parce que les informations, documents et relances
          ne suivent pas : demandes client oubliées, comptes rendus manquants, preuves dispersées, réserves non suivies, DOE
          repoussé. BeWork vous aide à structurer le suivi côté bureau (dossiers, relances, traçabilité) sans remplacer la
          conduite technique du chantier.
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h2>Les signes d’un chantier mal suivi</h2>
      <ul>
        <li>Le client relance plusieurs fois, mails sans réponse, décisions qui traînent.</li>
        <li>Comptes rendus non envoyés ou introuvables.</li>
        <li>Réserves notées, mais pas de suivi (qui / quand / preuve / relance).</li>
        <li>Photos, preuves, échanges dispersés (WhatsApp, mail, téléphone).</li>
        <li>Documents chantier mal classés : “on ne retrouve plus”.</li>
        <li>Fournisseurs / locations non confirmés, planning mis à jour trop tard.</li>
        <li>DOE repoussé à la fin, puis impossible à reconstituer proprement.</li>
      </ul>

      <h2>Ce que ça coûte à l’entreprise</h2>
      <ul>
        <li>Perte de crédibilité et tensions avec le client.</li>
        <li>Réserves qui traînent et fin de chantier compliquée.</li>
        <li>Situations / factures retardées (trésorerie qui se tend).</li>
        <li>Risque de litiges faute de preuves et de traçabilité.</li>
        <li>Charge mentale du dirigeant / conducteur de travaux.</li>
      </ul>

      <h2>Méthode simple pour reprendre le contrôle</h2>
      <ul>
        <li>Centraliser les demandes (une file unique) et garder une trace.</li>
        <li>Créer un tableau de suivi chantier (statut, prochaine action, échéance).</li>
        <li>Classer les documents chantier (CR, photos, PV, validations).</li>
        <li>Suivre les relances (client / fournisseurs) et les points bloquants.</li>
        <li>Suivre les réserves avec une boucle claire jusqu’à levée.</li>
        <li>Préparer le DOE progressivement, pas “à la fin”.</li>
      </ul>

      <h2>Ce que BeWork peut prendre en charge (côté bureau)</h2>
      <ul>
        <li>Tableau de suivi chantier (demandes, statuts, échéances, points bloquants)</li>
        <li>Préparation des comptes rendus et diffusion (sur votre circuit)</li>
        <li>Suivi des demandes client et relances</li>
        <li>Classement des pièces, preuves et documents</li>
        <li>Suivi des réserves (OPR → relance → preuve → levée)</li>
        <li>Préparation/organisation du DOE (checklists, relances pièces, compilation progressive)</li>
        <li>Relances fournisseurs ou locations (confirmations, créneaux, AR)</li>
        <li>Alertes sur les points bloquants et priorisation</li>
      </ul>

      <h2>Ce que vous gardez (validation finale)</h2>
      <ul>
        <li>Conduite technique du chantier et arbitrages terrain</li>
        <li>Choix techniques et décisions contractuelles</li>
        <li>Relations sensibles client et réponses engageantes</li>
        <li>Validation finale, signatures et engagements</li>
      </ul>

      <h2>Exemple concret</h2>
      <p>
        Sur un chantier avec plusieurs réserves, des photos dispersées et des mails clients en attente, BeWork peut structurer un tableau de suivi,
        classer les preuves, préparer les relances et vous signaler les points à valider. Vous gardez la conduite technique et les décisions sensibles.
      </p>

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
          href="/assistants-administratifs-taches"
          className="inline-flex rounded-lg border border-slate-200 bg-white px-6 py-3 font-bold text-slate-900 hover:bg-slate-50"
        >
          Voir les missions
        </Link>
        <Link href="/notre-facon-de-travailler" className="inline-flex rounded-lg border border-slate-200 bg-white px-6 py-3 font-bold text-slate-900 hover:bg-slate-50">
          Voir la méthode
        </Link>
        <Link href="/tarifs" className="inline-flex rounded-lg border border-slate-200 bg-white px-6 py-3 font-bold text-slate-900 hover:bg-slate-50">
          Voir les forfaits
        </Link>
        <Link href="/dict-dt-travaux" className="inline-flex rounded-lg border border-slate-200 bg-white px-6 py-3 font-bold text-slate-900 hover:bg-slate-50">
          DICT / DT : dossier & suivi
        </Link>
      </div>

      <BtpPainLandingMaillage currentHref={PAGE_PATH} />
    </SeoLandingPage>
  );
}
