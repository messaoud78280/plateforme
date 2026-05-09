import type { Metadata } from "next";
import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { absoluteUrl } from "@/lib/site";

const faqUrl = absoluteUrl("/faq");
const faqOgImage = absoluteUrl("/opengraph-image");

export const metadata: Metadata = {
  title: "FAQ BeWork | Assistante travaux BTP & relais bureau-chantier",
  description:
    "FAQ BeWork : assistante travaux BTP, différence avec l’administratif, externalisation administrative de chantier, PPSPS, comptes rendus, DCE, DOE — plus fonctionnement, forfaits, IA et validation.",
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
  alternates: { canonical: faqUrl, languages: { fr: faqUrl, "x-default": faqUrl } },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: faqUrl,
    siteName: "BeWork",
    title: "FAQ BeWork — assistante travaux BTP (relais bureau-chantier)",
    description:
      "Assistante travaux, missions chantier, DCE, DOE, PPSPS, externalisation — et fonctionnement BeWork (forfaits, IA, validation).",
    images: [{ url: faqOgImage, width: 1200, height: 630, alt: "FAQ BeWork — assistante travaux BTP" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ BeWork — assistante travaux BTP",
    description: "Questions BTP type recherche vocale ; forfaits, IA et validation.",
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
      q: "Qu’est-ce qu’une assistante travaux ?",
      a: "Une assistante travaux (souvent dite assistante BTP) est la personne qui aide l’entreprise à structurer et suivre tout ce qui touche aux chantiers au-delà du simple courant administratif : devis, relances, pièces, comptes rendus, réserves, DOE, parfois lecture des pièces marché, avec une logique priorités / échéances / impact terrain. BeWork propose ce rôle en externalisation, augmenté par l’IA, avec validation de votre part avant tout envoi engageant.",
    },
    {
      q: "Quelle différence entre assistante BTP et assistante administrative ?",
      a: "Une assistante administrative généraliste traite le flux courant (accueil, courrier générique, facturation hors chantier). Une assistante BTP travaille sur les dossiers chantier : références chantier, lots, délais, documents techniques, relances client ou fournisseur, traçabilité et livrables adaptés au rythme du terrain. BeWork est pensée comme assistante travaux BTP : périmètre chantier, pas secrétariat généraliste.",
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

const FAQ_CATEGORIES = [
  FAQ_RECHERCHE_IA_CAT,
  {
    title: "Comprendre BeWork",
    items: [
      {
        q: "Qu’est-ce que BeWork ?",
        a: "BeWork est une assistante travaux / assistante BTP augmentée par l’IA : un relais bureau‑chantier pour tenir vos dossiers (devis, relances, documents travaux, suivi) quand vous êtes pris sur le terrain.",
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
    title: "Tarifs et forfaits",
    items: [
      {
        q: "Comment fonctionnent les actions ?",
        a: "Vous achetez un volume mensuel de traitement : chaque demande consomme des actions/crédits selon le temps réellement passé (relance, mail, appel, suivi, préparation de document, etc.).",
      },
      {
        q: "À quoi correspondent les heures incluses ?",
        a: "C’est un repère de conversion des actions/crédits. Le forfait achète surtout un niveau de suivi et de priorisation dans un périmètre cadré.",
      },
      {
        q: "Puis-je changer de forfait ?",
        a: "Oui. On ajuste selon votre charge et vos priorités, pour rester cohérent avec le volume réel et la qualité de suivi attendue.",
      },
      {
        q: "Que se passe-t-il si une demande dépasse le temps prévu ?",
        a: "On vous propose un découpage, une estimation et un point de validation avant d’aller trop loin, pour garder de la visibilité.",
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
              FAQ BeWork : assistante travaux, dossiers chantier et relais bureau‑chantier
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

      <footer className="mt-16 border-t border-slate-200 bg-white px-6 py-12">
        <div className="mx-auto flex max-w-site flex-col gap-6 text-sm text-black md:flex-row md:items-center md:justify-between">
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
            <Link href="/ressources/tutos" className="font-medium hover:text-black">
              Tutoriels
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
