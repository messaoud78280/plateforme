import type { Metadata } from "next";
import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { absoluteUrl } from "@/lib/site";

const faqUrl = absoluteUrl("/faq");

export const metadata: Metadata = {
  title: "FAQ Assistant administratif externalisé | BeWork",
  description:
    "Questions fréquentes sur l'assistant administratif externalisé, le coût, le fonctionnement et les délais. BeWork — PME France, Belgique, Suisse, Luxembourg.",
  alternates: { canonical: faqUrl, languages: { fr: faqUrl } },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: faqUrl,
    siteName: "BeWork",
    title: "FAQ — Assistant administratif externalisé | BeWork",
    description:
      "Réponses sur les tarifs TTC, le fonctionnement, les délais et l'externalisation administrative pour les PME.",
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ BeWork",
    description: "Assistant administratif externalisé : tarifs, fonctionnement, délais.",
  },
  robots: { index: true, follow: true },
};

const FAQ_ITEMS = [
  {
    q: "Combien coûte un assistant administratif ?",
    a: "Chez BeWork, tous les tarifs affichés sont TTC, sans frais supplémentaires. Les offres démarrent à 215 € TTC/mois pour la formule Standard (120 actions/mois, soit environ 20 h d'assistance), 415 € TTC/mois pour Business (240 actions) et 630 € TTC/mois pour Premium (360 actions). L'offre Découverte à 109 € TTC permet de tester le service. Tout est inclus : pas de coût caché, pas de recrutement.",
  },
  {
    q: "Comment fonctionne un assistant administratif externalisé ?",
    a: "Vous envoyez vos tâches via la plateforme BeWork, un assistant dédié les traite à distance (devis, factures, relances, suivi dossiers), vous suivez l'avancement en temps réel et recevez les livrables. Le tout sans recrutement ni infrastructure : externaliser administratif PME en toute simplicité.",
  },
  {
    q: "Qui réalise les missions ?",
    a: "Des assistants francophones diplômés Bac+5, formés à l'IA, encadrés par notre agence en région parisienne. La direction et la supervision sont en France ; la plateforme opérationnelle permet une exécution réactive et de qualité.",
  },
  {
    q: "Quel est le délai de traitement ?",
    a: "Réponse moyenne en moins de 2 heures. Les tâches urgentes sont priorisées. Le délai dépend du type de mission et de la complexité ; notre équipe en France assure une coordination fluide pour respecter vos échéances.",
  },
  {
    q: "L'assistant administratif à distance travaille-t-il avec mes outils ?",
    a: "Oui. Nous travaillons avec Google Workspace, Microsoft 365, CRM (Salesforce, HubSpot, etc.) selon vos usages. L'assistant s'adapte à votre environnement.",
  },
  {
    q: "Pour quels secteurs ?",
    a: "PME, TPE, indépendants, BTP, immobilier, cabinets : nous nous adaptons à votre secteur. Consultez nos pages assistant administratif BTP et assistant administratif immobilier pour des exemples par secteur.",
  },
];

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fb] via-[#eef0f4] to-[#e0e4ea]">
      <header className="sticky top-0 z-20 border-b border-[#c8cdd6] bg-[#f8f9fb]">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="shrink-0">
            <BeWorkLogo size="sm" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/tarifs" className="rounded-lg surface-metallic-light px-5 py-2.5 text-sm font-medium text-[#1e293b] hover:bg-[#f8f9fb]">
              Tarifs
            </Link>
            <Link href="/inscription" className="rounded-lg bg-[#1d4ed8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1e40af]">
              Tester BeWork
            </Link>
          </div>
        </div>
      </header>

      <main className="px-6 py-16 md:py-24">
        <article className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-[#0f172a] md:text-4xl">
            FAQ — Assistant administratif externalisé
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-[#334155]">
            Réponses aux questions les plus posées sur l&apos;assistant administratif externalisé, l&apos;assistant
            administratif à distance et l&apos;externalisation administrative pour les PME.
          </p>
          <p className="mt-4 text-sm font-semibold text-[#0f172a]">
            Tous nos tarifs sont exprimés TTC, sans frais supplémentaires.
          </p>

          <dl className="mt-12 space-y-8">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="rounded-xl surface-metallic-light p-6">
                <dt className="text-lg font-semibold text-[#0f172a]">{item.q}</dt>
                <dd className="mt-3 text-[#334155] leading-relaxed">{item.a}</dd>
              </div>
            ))}
          </dl>

          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "@id": `${faqUrl}#faq`,
                url: faqUrl,
                inLanguage: "fr-FR",
                mainEntity: FAQ_ITEMS.map((item) => ({
                  "@type": "Question",
                  name: item.q,
                  acceptedAnswer: { "@type": "Answer", text: item.a },
                })),
              }),
            }}
          />

          <div className="mt-16 rounded-xl border-2 border-[#1d4ed8]/30 bg-[#eff6ff] p-8">
            <h2 className="text-xl font-bold text-[#0f172a]">Prêt à externaliser votre administratif ?</h2>
            <p className="mt-3 text-[#334155]">
              BeWork accompagne les PME francophones. Assistant administratif externalisé dès 215 € TTC/mois.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link
                href="/inscription"
                className="inline-flex rounded-lg bg-[#1d4ed8] px-6 py-3 font-semibold text-white hover:bg-[#1e40af]"
              >
                Tester BeWork
              </Link>
              <Link
                href="/inscription"
                className="inline-flex rounded-lg border-2 border-[#1d4ed8] px-6 py-3 font-semibold text-[#1d4ed8] hover:bg-[#eff6ff]"
              >
                Créer un compte
              </Link>
              <Link
                href="/contact"
                className="surface-metallic-outline inline-flex rounded-lg px-6 py-3 font-semibold text-[#334155] hover:text-[#1d4ed8]"
              >
                Déléguer une première tâche
              </Link>
            </div>
          </div>
        </article>
      </main>

      <footer className="border-t border-[#c8cdd6] bg-[#f8f9fb] px-6 py-12 mt-16">
        <div className="mx-auto max-w-6xl flex flex-col gap-6 md:flex-row md:items-center md:justify-between text-sm text-[#334155]">
          <div className="flex items-center gap-3">
            <BeWorkLogo size="sm" />
            <span className="text-[#0f172a]">© {new Date().getFullYear()} BeWork</span>
          </div>
          <div className="flex gap-6">
            <Link href="/" className="font-medium hover:text-[#0f172a]">Accueil</Link>
            <Link href="/faq" className="font-medium hover:text-[#0f172a]">FAQ</Link>
            <Link href="/blog" className="font-medium hover:text-[#0f172a]">Blog</Link>
            <Link href="/contact" className="font-medium hover:text-[#0f172a]">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
