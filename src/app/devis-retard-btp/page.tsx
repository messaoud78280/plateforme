import Link from "next/link";
import { BtpPainLandingMaillage } from "@/components/seo/BtpPainLandingMaillage";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { BTP_PAIN_PAGE_PATHS } from "@/lib/btp-pain-pages";
import { landingPageMetadata } from "@/lib/seo-landing-metadata";

const PAGE_PATH = BTP_PAIN_PAGE_PATHS.devisRetard;

export const metadata = landingPageMetadata({
  title: "Devis retard BTP : réactivité commerciale = CA sécurisé | BeWork",
  description:
    "Devis bâtiment en retard : coût direct en opportunités perdues. Gestion devis BTP cadrée, préparation et relances pour augmenter le taux de signature — pilotage administratif, forfaits TTC.",
  path: PAGE_PATH,
  keywords: [
    "devis retard BTP",
    "devis bâtiment en retard",
    "gestion devis BTP",
    "augmenter taux de signature devis bâtiment",
    "réactivité devis artisan",
    "relance devis chantier",
  ],
});

export default function Page() {
  const faq = [
    {
      q: "Le problème est-il toujours la rédaction technique ?",
      a: "Souvent non : c’est le creux entre « je sais quoi chiffrer » et « le PDF est parti ». Manque de pièces, attente d’un fournisseur, devis laissé en brouillon après une urgence chantier : BeWork referme la boucle administrative pour que la date d’envoi recolle à votre ambition commerciale.",
    },
    {
      q: "Comment améliorer le taux de signature sans brader ?",
      a: "En sortant plus vite un devis propre, en suivant les relances avec un calendrier et des messages cohérents, en documentant les objections. Le prix compte, mais la régularité et la clarté décident souvent entre deux offres proches.",
    },
    {
      q: "BeWork envoie-t-il le devis sans vous ?",
      a: "Les envois engageants restent sous vos validations si vous le souhaitez. Nous préparons, structurons, relançons les pièces manquantes et tenons le tableau de suivi pour que rien ne reste en attente invisible.",
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
      description="Devis en retard en BTP : ce que ça coûte en CA, pourquoi ça bloque, et comment un pilotage administratif referme le délai entre chiffrage et envoi."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Devis en retard — BTP", href: PAGE_PATH },
      ]}
      h1="Devis en retard en BTP — chaque jour compte pour signer le chantier"
      intro={
        <>
          Un client compare plusieurs entreprises. Si votre devis arrive deux semaines après la concurrence, vous n’êtes même
          plus dans la course — même avec un bon prix. La réactivité commerciale est un levier direct de chiffre d’affaires.
          BeWork muscle la partie « sortir le dossier de l’atelier » : préparation, pièces, mise en forme et suivi des relances
          selon vos règles, avec une équipe qui connaît le vocabulaire chantier.
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h2>Ce que vous perdez aujourd’hui</h2>
      <ul>
        <li>
          <strong>Des chantiers avant même le débat technique.</strong> Sans date d’envoi, il n’y a pas de négociation possible.
        </li>
        <li>
          <strong>De la crédibilité.</strong> Un client entend « on vous envoie ça demain » trois fois — la confiance se fissure.
        </li>
        <li>
          <strong>Des marges sur le mal classé.</strong> Quand le devis part en urgence, on oublie postes, options ou marges de
          risque — vous signez plus bas que prévu.
        </li>
      </ul>

      <h2>Pourquoi ça arrive</h2>
      <p>
        Les devis se bloquent rarement sur un seul « gros calcul ». C’est le cumul : attente d’un tarif fournisseur, photo
        manquante, devis modèle obsolète, interruption par un contrôle chantier, priorisation par émotion du jour. Sans file
        unique et sans quelqu’un qui pousse le dossier comme une tâche production, le retard devient structurel.
      </p>

      <h2>Comment BeWork vous aide</h2>
      <p>
        Nous traitons la gestion devis BTP comme une chaîne : collecte des éléments, structuration, relecture forme, relances
        internes/externes et statuts visibles. L’IA réduit le temps sur les tâches répétitives (reformulation, extractions,
        check-lists) ; les humains gardent le sens client et le respect de votre méthode de chiffrage. Résultat : un rythme
        d’envoi qui suit votre capacité commerciale, pas seulement votre emploi du temps chantier.
      </p>

      <h2>Bénéfices concrets</h2>
      <ul>
        <li>Plus de devis comparables dans le même laps de temps — vous restez dans la short list.</li>
        <li>Moins d’oublis de pièces jointes ou de validité floue sur l’offre.</li>
        <li>Un historique de relance propre si le client temporise — sans improvisation harcelante.</li>
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
        <Link href="/contact" className="inline-flex rounded-lg bg-[#1d4ed8] px-6 py-3 font-bold text-white hover:bg-[#1e40af]">
          Réserver un appel
        </Link>
        <Link
          href="/relance-devis-btp"
          className="inline-flex rounded-lg border-2 border-black px-6 py-3 font-bold text-black hover:bg-slate-100"
        >
          Voir la méthode relances devis
        </Link>
      </div>

      <BtpPainLandingMaillage currentHref={PAGE_PATH} />
    </SeoLandingPage>
  );
}
