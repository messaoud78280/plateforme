import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { landingPageMetadataFromPath } from "@/lib/seo-landing-metadata";

const PAGE_PATH = "/checklist-depot-appel-offres-btp";

export const metadata = landingPageMetadataFromPath(PAGE_PATH);

const CHECKLIST_ROWS = [
  ["Règlement de consultation", "Délai, lots, critères, pièces obligatoires, plateforme de dépôt"],
  ["Pièces administratives", "DC1, DC2, attestations fiscales et sociales, assurances, K-bis à jour"],
  ["Offre technique", "Mémoire aligné sur les critères du RC et le formulaire imposé"],
  ["Offre financière", "DPGF / BPU / DQE cohérent avec quantités et unités du bordereau"],
  ["Recoupement CCTP", "Exigences techniques traitées dans le mémoire et reflétées dans les prix"],
  ["Sous-traitance", "DC4, déclarations et plafonds conformes au RC et au CCAP"],
  ["Formats et signatures", "PDF nommés, signatures électroniques selon modalités RC"],
  ["Preuve de dépôt", "Accusé horodaté ou récépissé plateforme conservé"],
] as const;

export default function Page() {
  const faq = [
    {
      q: "Cette checklist suffit-elle pour tous les marchés ?",
      a: "Non — elle est un socle terrain. Chaque RC peut imposer des pièces supplémentaires (visite obligatoire, références spécifiques, certificats). Toujours repasser la liste officielle du RC.",
    },
    {
      q: "Quand faire la relecture finale ?",
      a: "La veille du dépôt, avec une relecture croisée CCTP ↔ mémoire ↔ prix. Bloquer une demi-journée bureau « verrouillage dossier » évite la majorité des rejets administratifs.",
    },
    {
      q: "BeWork peut-il préparer le dépôt ?",
      a: "Oui sur l'analyse DCE, la structuration du mémoire, les tableaux et la checklist — validation et dépôt final chez vous.",
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
      description="Checklist dépôt appel d'offres BTP : pièces administratives, mémoire technique, offre financière et contrôles avant envoi sur la plateforme."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Checklist dépôt AO BTP", href: PAGE_PATH },
      ]}
      h1="Checklist dépôt appel d'offres BTP : ne plus oublier de pièce"
      intro={
        <>
          La majorité des offres rejetées le sont pour des motifs <strong>administratifs</strong>, pas techniques.
          Cette checklist terrain couvre les contrôles avant dépôt — à compléter avec le règlement de consultation de
          chaque DCE.
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h2>Checklist avant dépôt</h2>
      <div className="not-prose overflow-x-auto">
        <table className="w-full min-w-[32rem] border-collapse text-left text-sm text-slate-800">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 font-semibold text-slate-900">Bloc</th>
              <th className="px-4 py-3 font-semibold text-slate-900">À vérifier</th>
            </tr>
          </thead>
          <tbody>
            {CHECKLIST_ROWS.map(([bloc, controle]) => (
              <tr key={bloc} className="border-b border-slate-100">
                <td className="px-4 py-3 align-top font-medium text-slate-900">{bloc}</td>
                <td className="px-4 py-3 align-top">{controle}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Aller plus loin</h2>
      <ul>
        <li>
          <Link href="/blog/comment-repondre-appel-offres-btp" className="font-semibold text-[#1d4ed8] underline-offset-4 hover:underline">
            Guide : répondre à un appel d&apos;offres BTP
          </Link>
        </li>
        <li>
          <Link href="/blog/eviter-rejet-offre-marche-public" className="font-semibold text-[#1d4ed8] underline-offset-4 hover:underline">
            Éviter le rejet d&apos;une offre en marché public
          </Link>
        </li>
        <li>
          <Link href="/reponse-appel-offres-btp" className="font-semibold text-[#1d4ed8] underline-offset-4 hover:underline">
            Landing réponse appels d&apos;offres BeWork
          </Link>
        </li>
        <li>
          <Link href="/services/analyse-dce-btp" className="font-semibold text-[#1d4ed8] underline-offset-4 hover:underline">
            Analyse DCE BTP
          </Link>
        </li>
        <li>
          <CalendlyBookingLink className="font-semibold text-[#1d4ed8] underline-offset-4 hover:underline">
            Envoyer un DCE à analyser
          </CalendlyBookingLink>
        </li>
      </ul>
    </SeoLandingPage>
  );
}
