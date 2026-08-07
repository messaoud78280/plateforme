import type { Metadata } from "next";
import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { SeoInternalLinks } from "@/components/seo/SeoInternalLinks";
import { landingPageMetadataFromPath } from "@/lib/seo-landing-metadata";
import { getPublicPageSeo } from "@/lib/seo-public-pages";
import { buildWebPageAndBreadcrumbJsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";

const FAQ_PAGE_PATH = "/faq" as const;
const faqUrl = absoluteUrl(FAQ_PAGE_PATH);
const faqSeo = getPublicPageSeo(FAQ_PAGE_PATH)!;

export const metadata: Metadata = landingPageMetadataFromPath(FAQ_PAGE_PATH);

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
      a: "Dans le langage courant, « assistant travaux » désigne souvent l’aide bureau-chantier (devis, relances, pièces, CR, DOE). Chez BeWork, cela correspond à des capacités de la plateforme interne : vos équipes structurent et suivent ces dossiers dans l’outil ; BeWork configure, forme et fait évoluer la solution — sans exécuter les missions à leur place.",
    },
    {
      q: "Quelle différence entre assistant travaux BTP et assistante administrative ?",
      a: "Une assistante administrative généraliste traite le flux courant. Les usages « travaux » portent sur les dossiers chantier (lots, délais, documents techniques, traçabilité). La plateforme BeWork est conçue pour ces usages métier BTP, pas comme un secrétariat généraliste.",
    },
    {
      q: "Comment externaliser la gestion administrative d’un chantier ?",
      a: "Plutôt que d’externaliser l’exécution, BeWork propose d’équiper vos équipes d’une plateforme interne : (1) cadrer les flux à outiller, (2) configurer modules et validations, (3) former et déployer progressivement. Vos collaborateurs restent aux commandes ; BeWork assure configuration, hébergement et évolution.",
    },
    {
      q: "Qui peut aider un conducteur de travaux à préparer un PPSPS ?",
      a: "La responsabilité du PPSPS incombe à l’employeur. Dans BeWork, vos équipes structurent le dossier, les checklists et la mise en forme grâce aux outils de la plateforme — vous ou votre référent sécurité validez le document final.",
    },
    {
      q: "Comment gagner du temps sur les comptes rendus de chantier ?",
      a: "Utilisez un modèle court (décisions, actions, responsable, échéance) et reliez photos ou notes au texte. Dans BeWork, vos équipes préparent et suivent les CR dans la plateforme ; vous validez avant diffusion. Un pas-à-pas est disponible dans le tuto « compte rendu de chantier » sur /ressources.",
    },
    {
      q: "Comment analyser rapidement un DCE ?",
      a: "Priorisez le règlement de consultation, recoupez CCTP et pièces de prix, puis tranchez un Go / No-go. Les outils IA BeWork aident vos équipes à trier et synthétiser les pièces ; la décision d’engagement reste la vôtre. Voir le tuto « analyse DCE » sur /ressources.",
    },
    {
      q: "Comment préparer un DOE sans perdre de temps ?",
      a: "Collectez les pièces au fil de l’eau avec une arborescence claire et une liste des manquants. Dans BeWork, vos équipes organisent classement et relances dans la plateforme — vous validez le contenu transmis au maître d’ouvrage. Le tuto « DOE BTP » sur /ressources détaille le déroulé.",
    },
  ],
} as const;

const FAQ_APPELS_OFFRES_CAT = {
  title: "Appels d'offres, marchés publics & Chorus Pro",
  items: [
    {
      q: "BeWork peut-il répondre à un appel d'offres BTP ?",
      a: "La plateforme aide vos équipes sur l’analyse DCE (RC, CCAP, CCTP, BPU, DPGF), la structuration des pièces et le suivi du dépôt. La décision Go/No-go, le prix et la signature restent chez vous. Voir /reponse-appel-offres-btp.",
    },
    {
      q: "BeWork peut-il rédiger un mémoire technique ?",
      a: "Vos équipes préparent plan, rédaction et mise en forme dans la plateforme à partir de vos références. Vous validez le contenu technique avant dépôt. Détail : /services/memoire-technique-btp.",
    },
    {
      q: "BeWork peut-il gérer Chorus Pro ?",
      a: "La plateforme accompagne la préparation des situations, le suivi des statuts et les relances administratives — vous gardez la validation des montants. Voir /facturation-chorus-pro-btp.",
    },
    {
      q: "BeWork peut-il aider une entreprise déjà titulaire d'un marché public ?",
      a: "Oui via les modules de suivi post-attribution : documents d'exécution, situations, réserves, DOE. Détail sur /assistants-administratifs-taches#marches-publics-accords-cadres et /gestion-marche-public-btp.",
    },
    {
      q: "Comment démarrer une analyse DCE dans BeWork ?",
      a: "Via /contact : présentez votre organisation et le type de dossiers à traiter. BeWork compose ensuite votre plateforme (modules, droits, IA) lors de la démonstration / étude.",
    },
    {
      q: "Quels documents la plateforme peut-elle aider à analyser ?",
      a: "DCE et pièces marché (RC, CCAP, CCTP, BPU, DPGF, DQE), dossiers chantier (CR, PPSPS, DOE, DICT), devis, situations et correspondances — selon les modules activés.",
    },
    {
      q: "BeWork peut-il suivre les bons de commande d'un accord-cadre ?",
      a: "Oui côté outillage : échéances, pièces attendues, relances et traçabilité dans votre environnement. Voir /assistants-administratifs-taches#marches-publics-accords-cadres.",
    },
    {
      q: "BeWork peut-il limiter les pénalités sur un marché public ?",
      a: "BeWork ne supprime pas les pénalités contractuelles. La plateforme peut structurer un tableau d’alertes (délais documents, réserves, facturation, DOE) pour vos équipes. Selon le CCAP, les retards peuvent générer des pénalités.",
    },
    {
      q: "BeWork intervient-il en France ?",
      a: "Oui : déploiement et accompagnement pour entreprises en France. Pages : /assistant-travaux-france et /externalisation-administrative-btp-france.",
    },
    {
      q: "BeWork travaille-t-il avec la Belgique, la Suisse et le Luxembourg ?",
      a: "Oui, en français, pour le déploiement de plateformes internes BTP. Pages pays : plateforme travaux et déploiement par pays (BE, CH, LU).",
    },
    {
      q: "BeWork s'adresse-t-il aux artisans et aux PME du BTP ?",
      a: "Oui : artisans, TPE, PME, conducteurs de travaux et chargés d'affaires qui veulent outiller leurs équipes sans alourdir immédiatement la masse salariale. Méthode de tarification sur /tarifs.",
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
        a: "BeWork est une plateforme d’assistants travaux augmentés par l’IA : une assistance technique et administrative BTP pour tenir vos dossiers (devis, relances, documents travaux, suivi) quand vous êtes pris sur le terrain.",
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
        a: "Non. BeWork apporte une assistance technique et administrative pour tenir les dossiers et le suivi. Les décisions techniques et responsabilités restent chez vous (ou vos partenaires habilités).",
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
        a: "Vous. Vos équipes préparent dans la plateforme ; vous validez les prix, choix techniques, signatures, engagements contractuels et réponses sensibles.",
      },
    ],
  },
  {
    title: "Tarifs et accompagnement",
    items: [
      {
        q: "Comment sont présentés les tarifs BeWork ?",
        a: "Sans grille publique fixe : mise en place initiale + abonnement mensuel, sur étude (utilisateurs, modules, personnalisation, IA, accompagnement). Vous recevez une proposition claire correspondant au périmètre retenu. Détail : /tarifs.",
      },
      {
        q: "BeWork facture-t-il à l’heure ?",
        a: "Non sur la vitrine : la proposition repose sur le périmètre de plateforme et le niveau d’accompagnement. Voir /tarifs.",
      },
      {
        q: "Puis-je commencer sans abonnement mensuel ?",
        a: "Le modèle standard combine mise en place puis abonnement. Une démonstration et une étude permettent de cadrer le périmètre avant engagement.",
      },
      {
        q: "Que se passe-t-il si le périmètre évolue ?",
        a: "Les adaptations courantes peuvent être intégrées selon votre formule. Les développements spécifiques importants font l’objet d’un cadrage et d’une proposition distincte.",
      },
    ],
  },
  {
    title: "IA, confidentialité et cadre",
    items: [
      {
        q: "Quel rôle joue l’IA chez BeWork ?",
        a: "L’IA aide vos équipes à trier, synthétiser, reformuler et préparer des brouillons dans la plateforme. Vous gardez la validation finale sur ce qui engage.",
      },
      {
        q: "Mes documents sont-ils confidentiels ?",
        a: "Chaque entreprise dispose d’un environnement et d’accès propres. Les modalités sont précisées au démarrage ; voir aussi /politique-confidentialite.",
      },
      {
        q: "Qui garde la responsabilité des décisions ?",
        a: "Vous. BeWork configure et fait évoluer la plateforme, mais ne prend pas de décisions techniques ou juridiques à votre place.",
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

const faqWebPageLd = buildWebPageAndBreadcrumbJsonLd({
  pagePath: FAQ_PAGE_PATH,
  h1: "FAQ BeWork : assistants travaux, dossiers chantier et assistance technique et administrative BTP",
  description: faqSeo.description,
  breadcrumbItems: [
    { name: "Accueil", href: "/" },
    { name: "FAQ", href: FAQ_PAGE_PATH },
  ],
});

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqWebPageLd) }} />
      <MarketingSiteHeader plainBg />

      <main className="px-6 py-16 md:py-24">
        <article className="mx-auto max-w-4xl">
          <header className="mx-auto max-w-3xl text-center">
            <h1 className="font-heading text-3xl font-bold tracking-tight text-black md:text-4xl">
              FAQ BeWork : assistants travaux, dossiers chantier et assistance technique et administrative BTP
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

          <SeoInternalLinks path={FAQ_PAGE_PATH} />
        </article>
      </main>

      <MarketingSiteFooter />
    </div>
  );
}
