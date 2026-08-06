import Link from "next/link";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { landingPageMetadataFromPath } from "@/lib/seo-landing-metadata";

const PAGE_PATH = "/assistant-administratif-externalise";

export const metadata = landingPageMetadataFromPath(PAGE_PATH);

const faq = [
  {
    q: "Qu’est-ce qu’une assistance travaux « externalisée » avec BeWork ?",
    a: "Ce n’est pas un prestataire qui fait à votre place : BeWork déploie une plateforme interne BTP. Vos équipes y pilotent analyse DCE, relances, dossiers chantier et suivi marché — sans CDI ni infrastructure lourde à votre charge. BeWork configure, héberge et fait évoluer.",
  },
  {
    q: "Quelles capacités garder en main tout en structurant le bureau ?",
    a: "Typiquement : analyse et structuration de pièces marché, relances devis et factures chantier, comptes rendus, suivi de dossiers, checklists DOE/réserves, coordination écrite fournisseurs. Vous validez tout ce qui engage contractuellement ou financièrement.",
  },
  {
    q: "Comment la plateforme sécurise la validation avant envoi ?",
    a: "Par un circuit clair : brouillon ou proposition, puis validation explicite côté client sur les pièces sensibles. L’historique sur la plateforme permet de tracer qui a quoi, quand.",
  },
  {
    q: "Est-ce une alternative crédible à un recrutement interne ?",
    a: "Oui lorsque la charge est variable ou que vous voulez structurer le bureau avant d’embaucher. La plateforme se met en route plus vite qu’un recrutement, avec une montée en charge progressive — tarification sur étude.",
  },
] as const;

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export default function Page() {
  return (
    <SeoLandingPage
      description="Plateforme interne BTP BeWork : structurer l’admin chantier sans recruter. Vos équipes utilisent ; BeWork configure et fait évoluer. France, Belgique, Suisse, Luxembourg."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Assistant administratif externalisé", href: PAGE_PATH },
      ]}
      h1="Assistant administratif externalisé : une plateforme interne BTP, pas un exécutant"
      intro={
        <>
          « Externaliser » ici ne signifie pas déléguer de la saisie générique ni faire faire à votre place : BeWork
          déploie une <strong>plateforme interne</strong> — analyse DCE, relances, dossiers chantier, appels
          d&apos;offres et suivi marché public. Vos équipes utilisent ; BeWork configure, déploie et fait évoluer.
          France, Belgique, Suisse, Luxembourg.{" "}
          <Link href="/services/externalisation-administrative-btp" className="text-[#1d4ed8] hover:underline">
            Détail du service
          </Link>
          .
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <h2>Structurer le bureau plutôt que recruter trop tôt</h2>
      <p>
        Un recrutement engage sur la durée : charges sociales, temps de formation au poste, risque si la charge
        retombe après un pic. Une plateforme BeWork s&apos;ajuste au volume réel et peut démarrer sur un périmètre
        restreint — un flux, un type de dossier — avant, éventuellement, de monter en charge. La réversibilité est plus
        simple qu&apos;un contrat de travail.
      </p>

      <h2>Comment démarre le déploiement</h2>
      <p>
        Premier échange pour cadrer le besoin et les documents disponibles, définition d&apos;un périmètre écrit (ce
        qui est couvert dans la plateforme, ce qui ne l&apos;est pas), configuration des modules et du circuit de
        validation, puis usage sur des dossiers réels pour valider la méthode avant d&apos;élargir.
      </p>

      <h2>Le contrôle ne change pas de camp</h2>
      <p>
        Équiper le bureau ne signifie pas perdre la main : chaque pièce sensible — prix, engagement contractuel,
        réponse à un client — repasse par une validation explicite de votre entreprise avant envoi. BeWork est
        éditeur et partenaire technologique, pas secrétariat exécutant.
      </p>

      <section className="not-prose" id="faq" aria-label="FAQ assistant administratif externalisé" style={{ scrollMarginTop: "6rem" }}>
        <h2 className="mt-12 text-xl font-bold tracking-tight text-black md:text-2xl">Questions fréquentes</h2>
        <dl className="mt-5 space-y-4">
          {faq.map((item) => (
            <div key={item.q} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <dt className="text-base font-semibold text-black">{item.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-slate-700">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </SeoLandingPage>
  );
}
