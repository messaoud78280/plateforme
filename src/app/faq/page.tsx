import type { Metadata } from "next";
import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import {
  SEO_OG_ALTERNATE_LOCALES,
  SEO_OG_LOCALE_PRIMARY,
  hreflangFrancophonieLanguages,
} from "@/lib/seo-francophonie";
import { absoluteUrl } from "@/lib/site";

const faqUrl = absoluteUrl("/faq");
const faqOgImage = absoluteUrl("/opengraph-image");

export const metadata: Metadata = {
  title: { absolute: "FAQ assistant travaux BTP : BeWork et documents chantier" },
  description:
    "Questions fréquentes sur BeWork : assistant travaux BTP, externalisation bureau-chantier, PPSPS, DCE, DOE, forfaits et validation avant envoi.",
  keywords: [
    "BeWork",
    "FAQ BeWork",
    "assistante travaux",
    "qu'est-ce qu'une assistante travaux",
    "assistante BTP",
    "différence assistante BTP administrative",
    "externaliser gestion administrative chantier",
    "PPSPS conducteur de travaux",
    "comptes rendus de chantier",
    "analyse DCE rapide",
    "préparer DOE",
    "relais bureau-chantier",
    "dossiers chantier",
    "documents travaux",
    "validation finale",
    "forfaits BeWork",
    "IA BTP",
  ],
  alternates: { canonical: faqUrl, languages: hreflangFrancophonieLanguages("/faq") },
  openGraph: {
    type: "website",
    locale: SEO_OG_LOCALE_PRIMARY,
    alternateLocale: [...SEO_OG_ALTERNATE_LOCALES],
    url: faqUrl,
    siteName: "BeWork",
    title: "FAQ BeWork — assistants travaux augmentés par l’IA (relais bureau-chantier)",
    description:
      "FAQ BeWork : assistants travaux, externalisation bureau-chantier, PPSPS, DCE, DOE, forfaits et validation. Réponses claires pour le BTP.",
    images: [{ url: faqOgImage, width: 1200, height: 630, alt: "FAQ BeWork — assistants travaux augmentés par l’IA" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ BeWork — assistants travaux augmentés par l’IA",
    description:
      "FAQ BeWork : assistants travaux, externalisation, PPSPS, DCE, DOE, forfaits et validation. Réponses claires pour le BTP.",
  },
  robots: { index: true, follow: true },
};

/** Ancre stable par intitulé de question (réutilise la même logique que le sommaire). */
function faqQuestionSlug(question: string): string {
  return (
    "q-" +
    question
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .replace(/-+/g, "-")
      .slice(0, 96)
  );
}

const FAQ_RECHERCHE_IA_CAT = {
  title: "Questions fréquentes (recherche web & assistants IA)",
  items: [
    {
      q: "Qu’est-ce qu’un assistant travaux ?",
      a: "Un assistant travaux (parfois dit « assistante travaux » ou assistante BTP) aide l’entreprise à structurer et suivre tout ce qui touche aux chantiers au-delà du courant administratif : devis, relances, pièces, comptes rendus, réserves, DOE, parfois lecture des pièces marché, avec une logique priorités / échéances / impact terrain. BeWork propose ce rôle en externalisation, augmenté par l’IA, avec validation de votre part avant tout envoi engageant.",
    },
    {
      q: "Quelle différence entre assistant travaux BTP et assistante administrative ?",
      a: "Une assistante administrative généraliste traite le flux courant (accueil, courrier générique, facturation hors chantier). Un assistant travaux BTP travaille sur les dossiers chantier : références chantier, lots, délais, documents techniques, relances client ou fournisseur, traçabilité et livrables adaptés au rythme du terrain. BeWork est pensée comme assistants travaux augmentés par l’IA : périmètre chantier, pas secrétariat généraliste.",
    },
    {
      q: "Comment externaliser la gestion administrative d’un chantier ?",
      a: "En trois temps : (1) lister ce qui peut sortir du terrain (relances, classement, pièces, suivis), (2) fixer un cadre avec un prestataire — canal d’échange, priorités, validation avant envoi, (3) transmettre consignes et documents de façon régulière. BeWork fonctionne comme relais bureau‑chantier : missions détaillées sur la page dédiée, possibilité d’externalisation par zone (France, voisins, Europe) selon votre organisation.",
    },
    {
      q: "Qui peut aider un conducteur de travaux à préparer un PPSPS ?",
      a: "La responsabilité du PPSPS incombe à l’employeur ; le conducteur de travaux ou les personnes désignées peuvent rassembler le contenu opérationnel, et le coordinateur SPS peut commenter ou exiger des compléments sur chantier. BeWork ne remplace pas la validation sécurité : elle peut structurer le dossier, les checklists et la mise en forme à partir de vos consignes — vous ou votre référent sécurité validez le document final.",
    },
    {
      q: "Comment gagner du temps sur les comptes rendus de chantier ?",
      a: "Utilisez un modèle court (décisions, actions, responsable, échéance), envoyez dans les 24 h, reliez les photos ou vocaux au texte. BeWork peut reprendre vos notes brutes pour livrer un compte rendu propre et homogène, à vous de valider avant diffusion. Un pas-à-pas plus détaillé est disponible dans le tuto « compte rendu de chantier » sur /ressources.",
    },
    {
      q: "Comment analyser rapidement un DCE ?",
      a: "Priorisez d’abord le règlement de consultation (délais, lots, modalités), recoupez CCTP et pièces de prix (DQE, bordereaux) pour repérer les exigences critiques et les manquants, puis tranchez un Go / No-go avant un chiffrage lourd. BeWork peut accélérer l’étape de tri et de synthèse des pièces ; la décision d’engagement reste la vôtre. Voir le tuto « analyse DCE » sur /ressources.",
    },
    {
      q: "Comment préparer un DOE sans perdre de temps ?",
      a: "Collectez les pièces au fil de l’eau (plans as-built, notices, attestations) avec une arborescence et des noms de fichiers clairs, et tenez une liste des manquants pour relancer tôt. BeWork peut organiser le classement, les relances fournisseurs et la compilation des lots — vous validez le contenu transmis au maître d’ouvrage. Le tuto « DOE BTP » sur /ressources détaille le déroulé.",
    },
  ],
} as const;

const FAQ_APPELS_OFFRES_CAT = {
  title: "Appels d'offres, marchés publics & Chorus Pro",
  items: [
    {
      q: "BeWork peut-il répondre à un appel d'offres BTP ?",
      a: "Oui sur le volet administratif et documentaire : analyse DCE (RC, CCAP, CCTP, BPU, DPGF), structuration des pièces, mémoire technique et suivi du dépôt. La décision Go/No-go, le prix et la signature restent chez vous. Voir /reponse-appel-offres-btp.",
    },
    {
      q: "BeWork peut-il rédiger un mémoire technique ?",
      a: "Oui : plan, rédaction à partir de vos références et méthodes, mise en forme et relecture. Vous validez le contenu technique avant dépôt. Service détaillé sur /services/memoire-technique-btp.",
    },
    {
      q: "BeWork peut-il gérer Chorus Pro ?",
      a: "Oui sur la préparation des situations, le dépôt encadré, le suivi des statuts et les relances administratives — vous gardez la validation des montants. Voir /facturation-chorus-pro-btp.",
    },
    {
      q: "BeWork peut-il aider une entreprise déjà titulaire d'un marché public ?",
      a: "Oui : suivi après attribution — situations, facturation publique, avenants documentés, DOE, relances et classement du dossier marché. Voir /gestion-marche-public-btp.",
    },
    {
      q: "Comment transmettre un DCE à BeWork ?",
      a: "Via le formulaire /contact ou votre espace client : déposez le dossier, précisez la date limite et le lot visé. Une première analyse peut être proposée en intervention ponctuelle (à partir de 150 € HT) ou en mission structurée (à partir de 250 € HT).",
    },
    {
      q: "Quels documents BeWork peut-il analyser ?",
      a: "DCE et pièces marché (RC, CCAP, CCTP, BPU, DPGF, DQE), dossiers chantier (CR, PPSPS, DOE, DICT), devis, situations, factures et correspondances fournisseurs — selon périmètre cadré.",
    },
    {
      q: "BeWork peut-il suivre les bons de commande d'un accord-cadre ?",
      a: "Oui sur le suivi administratif : échéances, pièces attendues, relances et traçabilité des bons émis — le titulaire garde la responsabilité contractuelle.",
    },
    {
      q: "BeWork intervient-il en France ?",
      a: "Oui, partout en France à distance. Pages dédiées : /assistant-travaux-france et /externalisation-administrative-btp-france.",
    },
    {
      q: "BeWork travaille-t-il avec la Belgique, la Suisse et le Luxembourg ?",
      a: "Oui, en français et à distance pour le relais administratif chantier. Pages pays : assistant travaux et externalisation administrative BTP par pays (BE, CH, LU).",
    },
    {
      q: "BeWork s'adresse-t-il aux artisans et aux PME du BTP ?",
      a: "Oui : artisans, TPE, PME, conducteurs de travaux et chargés d'affaires qui veulent déléguer l'administratif chantier sans recruter — forfaits sur /tarifs.",
    },
  ],
} as const;

const FAQ_CATEGORIES = [
  FAQ_RECHERCHE_IA_CAT,
  FAQ_APPELS_OFFRES_CAT,
  {
    title: "Comprendre BeWork",
    items: [
      {
        q: "Qu’est-ce que BeWork ?",
        a: "BeWork est une plateforme d’assistants travaux augmentés par l’IA : un relais bureau‑chantier pour tenir vos dossiers (devis, relances, documents travaux, suivi) quand vous êtes pris sur le terrain.",
      },
      {
        q: "À qui s’adresse BeWork ?",
        a: "Aux artisans, chefs de chantier, conducteurs de travaux, chargés d’affaires et entreprises du bâtiment qui veulent un suivi bureau‑terrain fiable, sans recruter.",
      },
      {
        q: "Qu’est-ce qui différencie BeWork d’un secrétariat classique ?",
        a: "Un périmètre BTP cadré, des livrables chantier (dossiers, pièces, suivis), de la traçabilité, et un circuit de validation clair. Ce n’est pas une “disponibilité illimitée” à la demande.",
      },
    ],
  },
  {
    title: "Missions et périmètre",
    items: [
      {
        q: "Quelles demandes peut-on confier à BeWork ?",
        a: "Les demandes qui doivent avancer côté bureau : relances devis/clients, documents travaux, situations/factures, suivi fournisseurs, organisation de dossiers chantier. Les décisions sensibles restent sous votre validation.",
      },
      {
        q: "BeWork peut-elle gérer des documents chantier ?",
        a: "Oui : organisation, checklists, mise au propre, compilation et suivi des pièces (selon périmètre). Vous validez avant diffusion sur les éléments sensibles.",
      },
      {
        q: "BeWork intervient-elle sur les devis, relances et situations ?",
        a: "Oui : relances, suivi des réponses, préparation/mise en forme (sur modèle validé) et suivi d’avancement. Vous gardez la main sur les prix et engagements.",
      },
      {
        q: "BeWork remplace-t-elle un conducteur de travaux ou un bureau d’études ?",
        a: "Non. BeWork est un relais bureau‑chantier pour tenir les dossiers et le suivi. Les décisions techniques et responsabilités restent chez vous (ou vos partenaires habilités).",
      },
    ],
  },
  {
    title: "Fonctionnement",
    items: [
      {
        q: "Comment envoyer une demande ?",
        a: "Via la plateforme BeWork (ou le canal cadré au démarrage) avec le contexte, les pièces jointes, l’échéance et ce que vous attendez comme livrable.",
      },
      {
        q: "Comment sont priorisées les demandes ?",
        a: "Selon l’urgence, l’impact terrain et les échéances. Les urgences doivent être signalées explicitement pour éviter les malentendus.",
      },
      {
        q: "Comment suivre l’avancement ?",
        a: "Avec des statuts et un historique (demandes en cours, en attente, livrées) + des points de suivi si nécessaire.",
      },
      {
        q: "Qui valide les documents avant envoi ?",
        a: "Vous. BeWork prépare et propose ; vous validez les prix, choix techniques, signatures, engagements contractuels et réponses sensibles.",
      },
    ],
  },
  {
    title: "Tarifs et accompagnement",
    items: [
      {
        q: "Comment sont présentés les tarifs BeWork ?",
        a: "Par niveau d’accompagnement : intervention ponctuelle (à partir de 150 € HT), mission structurée (à partir de 250 € HT), relais travaux mensuel (à partir de 590 € HT), cellule externalisée ou sur devis. Les prix affichés sont des points de départ — le détail est ajusté selon votre périmètre.",
      },
      {
        q: "BeWork facture-t-il à l’heure ?",
        a: "Non sur le site vitrine : vous achetez un périmètre, des livrables et un niveau de suivi (intervention, mission structurée, forfait mensuel ou sur devis). Voir bework.fr/tarifs pour le détail des offres.",
      },
      {
        q: "Puis-je commencer sans abonnement mensuel ?",
        a: "Oui, par une intervention ponctuelle ou une mission structurée : analyse DCE, DOE, PPSPS, mémoire technique, compte rendu, devis ou relances.",
      },
      {
        q: "Que se passe-t-il si le périmètre évolue ?",
        a: "On ajuste la proposition avec vous : périmètre, fréquence de suivi et livrables — avec un point de validation avant d’étendre la mission.",
      },
    ],
  },
  {
    title: "IA, confidentialité et cadre",
    items: [
      {
        q: "Quel rôle joue l’IA chez BeWork ?",
        a: "L’IA aide à trier, synthétiser, reformuler, repérer les points clés et préparer des brouillons. Il y a une supervision humaine, et vous gardez la validation finale sur ce qui engage.",
      },
      {
        q: "Mes documents sont-ils confidentiels ?",
        a: "Oui : accès encadrés, échanges professionnels et cadre de traitement clair. Les modalités sont définies au démarrage.",
      },
      {
        q: "Qui garde la responsabilité des décisions ?",
        a: "Vous. BeWork prépare, structure et suit, mais ne prend pas de décisions techniques/juridiques à votre place.",
      },
      {
        q: "Quelles sont les limites de l’intervention BeWork ?",
        a: "BeWork ne remplace pas un maître d’œuvre, un bureau d’études, un avocat, un expert technique ou un conducteur de travaux. Les actes engageants passent par votre validation.",
      },
    ],
  },
] as const;

const FAQ_ITEMS_FLAT: { q: string; a: string }[] = FAQ_CATEGORIES.reduce<{ q: string; a: string }[]>((acc, cat) => {
  for (const item of cat.items) {
    acc.push({ q: item.q, a: item.a });
  }
  return acc;
}, []);

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <MarketingSiteHeader plainBg />

      <main className="px-6 py-16 md:py-24">
        <article className="mx-auto max-w-4xl">
          <header className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-bold tracking-tight text-black md:text-4xl">
              FAQ BeWork : assistants travaux, dossiers chantier et relais bureau‑chantier
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-700">
              Retrouvez les réponses aux questions fréquentes sur le fonctionnement de BeWork, les missions possibles, les forfaits, la validation finale,
              l’utilisation de l’IA et le cadre d’intervention. Les réponses sont rédigées en début de phrase pour répondre directement à la question (lisibilité,
              recherche, assistants IA).
            </p>

            <nav
              aria-label="Sommaire des questions type recherche vocale ou assistant IA"
              className="mx-auto mt-8 max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm"
            >
              <p className="text-sm font-semibold text-black">Questions souvent posées telles qu’on les formule à l’oral ou dans une recherche :</p>
              <ul className="mt-3 columns-1 gap-x-8 gap-y-2 text-sm text-[#1d4ed8] sm:columns-2">
                {FAQ_RECHERCHE_IA_CAT.items.map((item) => (
                  <li key={item.q} className="mb-2 break-inside-avoid">
                    <a href={`#${faqQuestionSlug(item.q)}`} className="underline underline-offset-2 hover:text-[#1e40af]">
                      {item.q}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </header>

          <div className="mt-12 space-y-10">
            {FAQ_CATEGORIES.map((cat) => (
              <section key={cat.title} aria-label={cat.title} className="space-y-4">
                <h2 className="text-xl font-bold tracking-tight text-black md:text-2xl">{cat.title}</h2>
                <dl className="space-y-4">
                  {cat.items.map((item) => (
                    <div
                      key={item.q}
                      id={faqQuestionSlug(item.q)}
                      className="scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                    >
                      <dt className="text-base font-semibold text-black md:text-lg">{item.q}</dt>
                      <dd className="mt-2 text-sm leading-relaxed text-slate-700 md:text-base">{item.a}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>

          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "@id": `${faqUrl}#faq`,
                url: faqUrl,
                inLanguage: "fr-FR",
                mainEntity: FAQ_ITEMS_FLAT.map((item) => ({
                  "@type": "Question",
                  name: item.q,
                  acceptedAnswer: { "@type": "Answer", text: item.a },
                })),
              }),
            }}
          />

          <div className="mt-16 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-bold text-black">Vérifier l’adéquation avec votre organisation</h2>
            <p className="mt-3 text-slate-700">
              Un échange permet de cadrer votre besoin, votre circuit de validation et le forfait adapté — avant tout engagement.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <CalendlyBookingLink className="inline-flex rounded-lg bg-[#1d4ed8] px-6 py-3 font-semibold text-white hover:bg-[#1e40af]">
                Échanger sur vos besoins
              </CalendlyBookingLink>
              <Link
                href="/tarifs"
                className="inline-flex rounded-lg border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-900 hover:bg-slate-50"
              >
                Consulter les forfaits
              </Link>
              <Link
                href="/inscription"
                className="inline-flex rounded-lg border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-900 hover:bg-slate-50"
              >
                Accès client — créer un compte
              </Link>
            </div>
          </div>
        </article>
      </main>

      <MarketingSiteFooter />
    </div>
  );
}
