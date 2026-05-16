import type { Metadata } from "next";
import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { TUTO_TITRE } from "@/components/seo/tuto-section-titles";
import { absoluteUrl } from "@/lib/site";

const pageUrl = absoluteUrl("/ressources/analyse-dce-btp");
const META_DESCRIPTION =
  "Tuto analyse DCE BTP : RC, CCTP, CCAP, BPU et synthèse avant réponse à un appel d’offres. Méthode et pièces clés.";

export const metadata: Metadata = {
  title: "Analyse DCE BTP | Dossier de consultation des entreprises & appels d’offres",
  description: META_DESCRIPTION,
  alternates: { canonical: pageUrl, languages: { fr: pageUrl, "x-default": pageUrl } },
  keywords: [
    "analyse DCE BTP",
    "dossier de consultation des entreprises",
    "appel d’offres BTP",
    "CCTP",
    "CCAP",
    "BPU",
    "DPGF",
    "mémoire technique",
    "assistant travaux",
    "assistant BTP",
    "DQE",
    "DCE",
  ],
  openGraph: {
    type: "article",
    locale: "fr_FR",
    url: pageUrl,
    siteName: "BeWork",
    title: "Analyse DCE BTP | Comprendre les pièces d’un appel d’offres",
    description: META_DESCRIPTION,
    images: [
      {
        url: absoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
        alt: "Analyse DCE BTP — Tuto pratique (BeWork)",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Analyse DCE BTP | Dossier de consultation des entreprises",
    description: META_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

const FAQ_ITEMS = [
  {
    q: "Qu’est-ce qu’un DCE dans le BTP ?",
    a: "Un DCE, ou dossier de consultation des entreprises, regroupe les documents transmis aux entreprises pour répondre à un appel d’offres ou à une consultation. Il peut contenir le règlement de consultation, le CCTP, le CCAP, les pièces de prix, les plans, les annexes et les attentes techniques du maître d’ouvrage.",
  },
  {
    q: "Comment BeWork aide à analyser un DCE ?",
    a: "BeWork aide à lire, trier et synthétiser les pièces du DCE pour faire ressortir les informations importantes : délais, documents à fournir, contraintes techniques, critères de réponse, pièces administratives et éléments à ne pas oublier avant de répondre.",
  },
  {
    q: "Est-ce que BeWork repère les pièces importantes du dossier ?",
    a: "Oui. BeWork peut identifier les documents clés comme le RC, le CCTP, le CCAP, l’acte d’engagement, le BPU, la DPGF, le DQE, les plans et les annexes afin de faciliter la lecture du dossier et éviter les oublis.",
  },
  {
    q: "Est-ce que BeWork peut préparer une synthèse du DCE ?",
    a: "Oui. BeWork peut préparer une synthèse claire du DCE avec les points importants, les pièces à fournir, les échéances, les contraintes du marché et les éléments utiles pour décider de répondre ou préparer le dossier.",
  },
  {
    q: "Est-ce que BeWork remplace un bureau d’études ou un juriste ?",
    a: "Non. BeWork ne remplace pas un bureau d’études, un économiste, un juriste ou le responsable technique de l’entreprise. BeWork intervient comme appui opérationnel pour organiser, synthétiser et préparer les informations afin de faire gagner du temps aux équipes BTP.",
  },
] as const;

function FaqDceJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${pageUrl}#faq`,
    url: pageUrl,
    inLanguage: "fr-FR",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

function ChecklistCard({
  title,
  items,
}: {
  title: string;
  items: readonly string[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-bold tracking-tight text-slate-900">{title}</p>
      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-2">
            <span className="mt-1 inline-block size-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AnalyseDceBtpTutoPage() {
  return (
    <>
      <FaqDceJsonLd />
      <SeoLandingPage
        description={metadata.description as string}
        h1="Analyse DCE BTP : comprendre rapidement les pièces importantes d’un appel d’offres"
        intro={
          <>
            Un <strong>DCE</strong> (dossier de consultation des entreprises) peut être volumineux et technique. Pour un artisan,
            un conducteur de travaux ou une <strong>PME BTP</strong>, le risque est de perdre des heures… et de manquer une pièce
            critique avant la réponse. L’objectif n’est pas de remplacer votre expertise : c’est de{" "}
            <strong>trier</strong>, <strong>structurer</strong> et <strong>rendre lisible</strong> ce qui compte vraiment avant
            décision ou montage de dossier.
          </>
        }
        breadcrumbItems={[
          { name: "Accueil", href: "/" },
          { name: "Ressources", href: "/ressources" },
          { name: "Analyse DCE BTP", href: "/ressources/analyse-dce-btp" },
        ]}
      >
        <section aria-labelledby="objectif-dce" className="not-prose">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p id="objectif-dce" className="text-[13px] font-semibold text-slate-700">
              Objectif : voir clair rapidement — pièces attendues, délais, contraintes, livrables — puis décider avec méthode si
              vous répondez et comment vous organisez (mémoire technique, chiffrage, planification).
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-slate-600">
              BeWork intervient comme <strong>assistant travaux</strong> augmenté par l’IA : aide à la lecture et à la préparation,
              avec <strong>validation finale</strong> côté entreprise sur tout ce qui engage.
            </p>
          </div>
        </section>

        <section className="not-prose">
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 text-[13px] leading-relaxed text-slate-600 shadow-sm">
            Déchiffrer un <strong>CCTP</strong> long avant chiffrage :{" "}
            <Link
              href="/ressources/tuto-skill-analyse-express-cctp-bework"
              className="font-semibold text-[#1d4ed8] underline-offset-4 hover:underline"
            >
              tutoriel PDF + skill Claude « analyse express CCTP »
            </Link>
            .
          </div>
        </section>

        <h2 id="utilite-analyse">{TUTO_TITRE.aQuoi}</h2>
        <ul>
          <li>Savoir si le marché est réaliste pour votre entreprise (délais, moyens, risques).</li>
          <li>Repérer les obligations contractuelles et techniques avant d’engager du temps de chiffrage.</li>
          <li>Lister les pièces à produire pour une réponse complète (administratif + technique + prix).</li>
          <li>Éviter les oublis coûteux (annexes, formats, références, variantes, documents à joindre).</li>
        </ul>

        <h2>{TUTO_TITRE.quand}</h2>
        <ul>
          <li>Dès réception du DCE, avant de bloquer des jours sur le chiffrage.</li>
          <li>Avant de promettre une date de remise ou de mobiliser la production de mémoire technique.</li>
          <li>Quand le dossier est volumineux : prioriser une lecture structurée plutôt qu’un parcours “page par page”.</li>
          <li>Après publication de Q/R ou d’avenants : relecture ciblée des pièces impactées.</li>
        </ul>

        <h2>
          {TUTO_TITRE.etapes} — pièces à recouper (selon le marché)
        </h2>
        <p>
          Les intitulés varient selon l’acheteur et la procédure. Croiser systématiquement le <strong>RC</strong> et le{" "}
          <strong>CCTP</strong>. Pour le volet rédactionnel du mémoire, voir aussi le{" "}
          <Link href="/ressources/memoire-technique-btp" className="font-semibold text-[#1d4ed8] underline-offset-4 hover:underline">
            tuto mémoire technique
          </Link>
          .
        </p>

        <section className="not-prose">
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <ChecklistCard
              title="Cadre & contrat"
              items={[
                "RC : règles, délais, composition du dossier, modalités de réponse.",
                "CCAP / CCAG / clauses : obligations, pénalités, assurance, garanties attendues.",
                "AE (acte d’engagement) : signature, mentions, pièces à joindre.",
              ]}
            />
            <ChecklistCard
              title="Technique & exécution"
              items={[
                "CCTP : prescriptions techniques, interfaces, contraintes d’exécution.",
                "Plans, notices, fichiers BIM si fournis : cohérence avec le lot.",
                "Annexes, variantes, questions / réponses publiées : mise à jour.",
              ]}
            />
            <ChecklistCard
              title="Prix & quantités"
              items={[
                "BPU / bordereau : unités, quantités, postes manquants ou ambigus.",
                "DPGF / décomposition (si présente) : lecture budgétaire et risques d’écarts.",
                "DQE / détail quantitatif estimatif : base pour chiffrage (selon marché).",
              ]}
            />
            <ChecklistCard
              title="Réponse & mémoire"
              items={[
                "Mémoire technique : attentes du jury (méthode, planning, MO, environnement…).",
                "Pièces administratives : attestations, références, capacité, moyens.",
                "Livrables à fournir au dépôt : formats, signature, remise électronique.",
              ]}
            />
          </div>
        </section>

        <h2>Ce que BeWork peut préparer (appui opérationnel)</h2>
        <ul>
          <li>Une <strong>synthèse</strong> du DCE : points importants, pièces à fournir, échéances.</li>
          <li>Un repérage des <strong>points de vigilance</strong> (dates, incohérences, manques, risques).</li>
          <li>Une aide pour <strong>structurer</strong> une lecture (sommaire, checklist, questions à poser à MOA/MOE).</li>
          <li>Un suivi simple des <strong>pièces manquantes</strong> ou à clarifier avant arbitrage interne.</li>
        </ul>
        <p>
          L’entreprise garde la décision de répondre, le chiffrage et la validation des engagements. BeWork accélère la phase{" "}
          <strong>lecture / préparation</strong>, surtout quand le dossier est lourd.
        </p>

        <h2>{TUTO_TITRE.erreurs}</h2>
        <ul>
          <li>Lire uniquement le CCTP sans croiser prix, planning et RC (pièges sur délais et formats).</li>
          <li>Répondre sans avoir vérifié les mises à jour (Q/R, avenants au dossier).</li>
          <li>Sous-estimer le temps de mémoire technique ou d’assemblage des pièces administratives.</li>
          <li>Mélanger variantes : mal les identifier dans le RC / annexes.</li>
          <li>Chiffrer trop tôt avant d’avoir clarifié ambiguïtés quantités / zones / interfaces.</li>
        </ul>

        <h3 className="!mt-10 text-lg font-bold text-black">Synthèse express — ordre de lecture</h3>
        <ol>
          <li>RC : délais, modalités, lots, questions, pièces attendues.</li>
          <li>CCTP + plans : contraintes techniques et interfaces.</li>
          <li>Prix (BPU / DPGF / DQE) : postes sensibles, unités, oublis.</li>
          <li>Mémoire : critères et structure demandée.</li>
          <li>CCAP / administrative : capacités, assurances, engagements.</li>
          <li>Calendrier interne : arbitrage GO / NO-GO avant montage lourd.</li>
        </ol>

        <section className="not-prose" id="faq" aria-label="FAQ analyse DCE" style={{ scrollMarginTop: "6rem" }}>
          <h2 className="mt-12 border-b border-slate-200 pb-3 text-xl font-bold tracking-tight text-black md:text-2xl">
            {TUTO_TITRE.faq} — analyse DCE & appels d’offres BTP
          </h2>
          <dl className="mt-5 space-y-4">
            {FAQ_ITEMS.map((item) => (
              <div key={item.q} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <dt className="text-base font-semibold text-black">{item.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-slate-700">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="not-prose" aria-label="CTA">
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
            <p className="text-base font-bold tracking-tight text-slate-900">Un DCE à analyser et peu de temps devant vous ?</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              BeWork peut vous aider à structurer la lecture, préparer une synthèse et sécuriser le suivi des pièces — avec un
              cadre clair et une validation côté entreprise sur tout ce qui engage.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <CalendlyBookingLink className="inline-flex justify-center rounded-lg bg-[#1d4ed8] px-6 py-3 font-semibold text-white hover:bg-[#1e40af]">
                Réserver un échange
              </CalendlyBookingLink>
              <Link href="/assistants-administratifs-taches" className="inline-flex justify-center rounded-lg border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-900 hover:bg-slate-50">
                Voir les missions
              </Link>
              <Link href="/ressources" className="inline-flex justify-center rounded-lg border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-900 hover:bg-slate-50">
                Retour aux ressources
              </Link>
            </div>
          </div>
        </section>
      </SeoLandingPage>
    </>
  );
}
