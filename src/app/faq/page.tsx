import type { Metadata } from "next";
import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { absoluteUrl } from "@/lib/site";

const faqUrl = absoluteUrl("/faq");
const faqOgImage = absoluteUrl("/opengraph-image");

export const metadata: Metadata = {
  title: "FAQ — Partenaire administratif BTP | BeWork",
  description:
    "Externalisation administrative pour artisans et entreprises du bâtiment : cadre, tarifs TTC, suivi, délais et collaboration. BeWork — France, Belgique, Suisse, Luxembourg.",
  alternates: { canonical: faqUrl, languages: { fr: faqUrl, "x-default": faqUrl } },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: faqUrl,
    siteName: "BeWork",
    title: "FAQ — BeWork, administratif structuré pour le BTP",
    description:
      "Réponses sur le rendez-vous découverte, les forfaits, l’externalisation vs le recrutement et le fonctionnement au quotidien.",
    images: [{ url: faqOgImage, width: 1200, height: 630, alt: "FAQ BeWork — administratif BTP" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ BeWork",
    description: "Administratif externalisé pour le BTP : cadre, tarifs et collaboration.",
  },
  robots: { index: true, follow: true },
};

const FAQ_ITEMS = [
  {
    q: "Pourquoi externaliser plutôt que recruter ?",
    a: "Un poste en interne engage salaire, charges, formation et management — pour une charge qui n’est pas toujours constante. Avec BeWork, vous achetez un cadre de prestation et un niveau d’accompagnement défini : pas de structure RH à alourdir, pas d’absence à pallier seul. L’enjeu n’est pas de « remplacer une personne », mais de tenir un relais administratif fiable pendant que vous restez sur le chantier.",
  },
  {
    q: "En quoi BeWork est-il différent d’un secrétariat généraliste ?",
    a: "Notre socle est le bâtiment : devis, facturation, situations de travaux, relances, démarches chantier, coordination fournisseurs et dossiers sensibles sous votre validation. Les briefs sont lus avec une grille terrain — urgences, créneaux, trésorerie — pas seulement comme une liste de tâches. La prestation est cadrée par forfait, avec des rituels de suivi, pas comme une prestation floue à la demande.",
  },
  {
    q: "Pourquoi ce niveau de prix ?",
    a: "Vous payez un pilotage encadré, des profils qualifiés, une plateforme de suivi et une exécution revue — pas un tarif « au rabais » qui se traduirait par de l’improvisation. Les montants TTC mensuels reflètent ce cadre : Structure 290 €, Suivi 490 €, Pilotage 1 190 € — avec une montée en structuration et en priorité à chaque palier.",
  },
  {
    q: "Est-ce adapté à une entreprise du BTP ?",
    a: "Oui, c’est notre cœur de cible : artisans, TPE et PME du bâtiment dont l’administratif se télescope avec le terrain. Nous traitons les flux habituels du secteur (commercial, réglementaire, logistique) dans le même dispositif, avec une attention particulière aux délais et aux relances qui impactent directement la trésorerie.",
  },
  {
    q: "Comment se passe le suivi au quotidien ?",
    a: "Les demandes passent par la plateforme : consignes, pièces, priorités. Vous voyez l’avancement et les échanges ; les actes sensibles restent sous votre validation. Des points de pilotage permettent d’ajuster le rythme et le périmètre dans les limites du forfait choisi.",
  },
  {
    q: "Comment évitez-vous les débordements et les malentendus ?",
    a: "Le cadre contractuel fixe ce qui est inclus à chaque niveau d’offre. Au-delà, nous en rediscutons plutôt que d’empiler des demandes non prévues. Les priorités sont posées ensemble ; les sujets à risque (relances fermes, mises en demeure, litiges) suivent un circuit de validation explicite.",
  },
  {
    q: "Pour qui ce service est-il fait ?",
    a: "Pour les dirigeants et structures du bâtiment qui veulent un administratif tenu sans recruter, qui acceptent un cadre contractuel et qui cherchent de la rigueur plutôt que le prix minimum. Idéal lorsque les devis, les relances et les dossiers ne peuvent plus attendre le soir ou le week-end.",
  },
  {
    q: "Pour qui ce n’est-il pas adapté ?",
    a: "Si vous cherchez avant tout le coût le plus bas, si vous refusez tout échange préalable de mise au point ou si vous attendez une disponibilité illimitée hors du cadre convenu, notre modèle ne sera probablement pas satisfaisant. Nous préférons une collaboration claire avec peu de clients bien accompagnés qu’une file de demandes non tenables.",
  },
  {
    q: "Comment démarre la collaboration ?",
    a: "Après un échange pour comprendre votre organisation, vos outils et votre charge, nous proposons un rendez-vous découverte et une formule. L’onboarding fixe les rôles, les canaux et les priorités ; les premières missions démarrent une fois les accès et le périmètre validés.",
  },
  {
    q: "Les besoins peuvent-ils évoluer ?",
    a: "Oui. Vous pouvez ajuster de formule en formule selon l’activité, dans la limite des offres proposées. Les évolutions se discutent avec votre interlocuteur pour rester cohérents avec la charge réelle et la qualité de suivi.",
  },
];

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fb] via-[#eef0f4] to-[#e0e4ea]">
      <MarketingSiteHeader plainBg />

      <main className="px-6 py-16 md:py-24">
        <article className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-black md:text-4xl">
            Questions fréquentes
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-black">
            Cadre, tarifs, collaboration et adéquation avec les entreprises du bâtiment : les réponses ci-dessous visent des
            dirigeants qui veulent déléguer proprement, sans promesses creuses.
          </p>
          <p className="mt-4 text-sm font-semibold text-black">
            Tous nos tarifs sont exprimés TTC, sans frais supplémentaires.
          </p>

          <dl className="mt-12 space-y-8">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="rounded-xl surface-metallic-light p-6">
                <dt className="text-lg font-semibold text-black">{item.q}</dt>
                <dd className="mt-3 text-black leading-relaxed">{item.a}</dd>
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
            <h2 className="text-xl font-bold text-black">Vérifier l’adéquation avec votre organisation</h2>
            <p className="mt-3 text-black">
              Un échange permet de poser votre charge administrative, vos outils et le niveau de formule adapté — avant tout
              engagement.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link
                href="/contact"
                className="inline-flex rounded-lg bg-[#1d4ed8] px-6 py-3 font-semibold text-white hover:bg-[#1e40af]"
              >
                Échanger sur vos besoins
              </Link>
              <Link
                href="/tarifs"
                className="inline-flex rounded-lg border-2 border-[#1d4ed8] px-6 py-3 font-semibold text-[#1d4ed8] hover:bg-[#eff6ff]"
              >
                Consulter les forfaits
              </Link>
              <Link
                href="/inscription"
                className="surface-metallic-outline inline-flex rounded-lg px-6 py-3 font-semibold text-black hover:text-[#1d4ed8]"
              >
                Accès client — créer un compte
              </Link>
            </div>
          </div>
        </article>
      </main>

      <footer className="border-t border-[#c8cdd6] bg-[#f8f9fb] px-6 py-12 mt-16">
        <div className="mx-auto max-w-6xl flex flex-col gap-6 md:flex-row md:items-center md:justify-between text-sm text-black">
          <div className="flex items-center gap-3">
            <BeWorkLogo size="sm" />
            <span className="text-black">© {new Date().getFullYear()} BeWork</span>
          </div>
          <div className="flex gap-6">
            <Link href="/" className="font-medium hover:text-black">
              Accueil
            </Link>
            <Link href="/faq" className="font-medium hover:text-black">
              FAQ
            </Link>
            <Link href="/blog" className="font-medium hover:text-black">
              Blog
            </Link>
            <Link href="/contact" className="font-medium hover:text-black">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
