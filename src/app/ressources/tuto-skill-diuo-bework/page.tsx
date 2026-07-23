import { getTutoPageDescription, tutoPageMetadata } from "@/lib/seo-tuto-metadata";
import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { CopyPromptButton } from "@/components/ressources/CopyPromptButton";
import { buildWebPageAndBreadcrumbJsonLd } from "@/lib/seo-landing-json-ld";
import { absoluteUrl, SITE_URL } from "@/lib/site";
import { BeWorkStatsGrid } from "@/components/marketing/BeWorkStatsGrid";

const pagePath = "/ressources/tuto-skill-diuo-bework";

const pageUrl = absoluteUrl(pagePath);

const pdfPath = "/ressources/pdf/tuto-skill-diuo-bework.pdf";

const PROMPT_CALIBRATION_TEXT = `Tu es mon assistant de préparation des pièces DIUO à transmettre au
coordonnateur SPS, pour mon lot [métier].
À partir des pièces que je te donne (plans de récolement, notices,
fiches sécurité, accès), tu prépares une liasse structurée en rubriques :
1. Plans de récolement (tel que réalisé)
2. Dispositifs de sécurité permanents (ancrages, lignes de vie,
   trappes, garde-corps) avec localisation
3. Accès à mes ouvrages (toitures, locaux techniques, gaines)
4. Précautions pour les interventions futures, poste par poste
5. Notices techniques des équipements posés
Tu signales les pièces manquantes au lieu de les inventer. Tu rappelles
que le SPS élabore le DIUO : moi je fournis, lui il compile.`;

const PROMPT_USAGE_QUOTIDIEN_TEXT = `Lot [métier], chantier [nom], réception prévue le [date].
Pièces en PJ : plans de récolement, notices CVC, fiches sécurité toiture.
Prépare ma liasse DIUO pour le SPS, rubrique par rubrique, rédige les
précautions d'intervention en toiture, et liste ce qui me manque.`;

const PROMPT_EXEMPLE_AJUSTEMENT_TEXT = `Ajoute une page de garde par rubrique avec la liste des pièces jointes,
et une checklist finale « fourni / manquant » à cocher avant envoi au SPS.`;

const H1 = "Crée ton skill — Pièces DIUO pour le SPS";

const breadcrumbItems = [
  { name: "Accueil", href: "/" },
  { name: "Ressources", href: "/ressources" },
  { name: H1, href: pagePath },
] as const;

const FAQ_FOR_JSON_LD = [
  {
    question: "C'est à moi de faire le DIUO ?",
    answer:
      "Non. Quand plusieurs entreprises interviennent, c'est le coordonnateur SPS qui élabore et met à jour le DIUO, et il en reste responsable (Code du travail). Ton rôle est de lui fournir les pièces de ton lot. Le skill prépare ces pièces, il ne se substitue pas au SPS.",
  },
  {
    question: "Quelle différence entre DOE et DIUO ?",
    answer:
      "Le DOE est la mémoire technique de ce qui a été construit. Le DIUO se concentre sur la sécurité des interventions futures. Certaines pièces se recoupent (plans, notices), mais pour le DIUO le SPS attend l'angle accès, sécurité permanente et précautions.",
  },
  {
    question: "Quelles pièces le SPS attend-il exactement ?",
    answer:
      "Pour ton lot : plans de récolement, dispositifs de sécurité permanents avec localisation, accès à tes ouvrages, précautions d'intervention et notices des équipements. Le skill en fait la checklist.",
  },
  {
    question: "Le skill invente-t-il des données ?",
    answer:
      "Non, et c'est vital : il structure ce que tu lui donnes et signale les manques. Un accès ou une protection inventés seraient dangereux pour le technicien qui reviendra sur l'ouvrage.",
  },
  {
    question: "Et si je livre mes pièces en retard ?",
    answer:
      "Le SPS relance, la mise à jour du DIUO traîne, et cela peut retarder la réception. Préparer la liasse tôt et complète évite ce blocage.",
  },
  {
    question: "Combien de temps pour créer le skill ?",
    answer:
      "Compte 20 à 30 minutes de cadrage, plus un essai sur un dossier que tu connais déjà pour caler le format attendu par ton SPS.",
  },
  {
    question: "Faut-il un abonnement payant ?",
    answer:
      "Un compte gratuit permet de tester, mais sur un lot avec beaucoup de plans et de notices le plan gratuit sature vite. Pour un usage pro, le plan Pro est recommandé.",
  },
] as const;

export const metadata = tutoPageMetadata(pagePath);

function PromptBlock({ label, promptText }: { label: string; promptText: string }) {
  return (
    <div className="mt-4 rounded-xl border border-slate-300 bg-slate-100 p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</p>
        <CopyPromptButton text={promptText} />
      </div>
      <pre className="max-h-[min(70vh,520px)] overflow-auto whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-slate-800">
        {promptText}
      </pre>
    </div>
  );
}

export default function TutoSkillDiuoBeworkPage() {
  const webPageBread = buildWebPageAndBreadcrumbJsonLd({
    pagePath,
    h1: H1,
    description: getTutoPageDescription(pagePath),
    breadcrumbItems: [...breadcrumbItems],
  });

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: H1,
    description: getTutoPageDescription(pagePath),
    url: pageUrl,
    author: { "@type": "Organization" as const, name: "BeWork", url: SITE_URL },
    publisher: {
      "@type": "Organization" as const,
      name: "BeWork",
      url: SITE_URL,
      logo: { "@type": "ImageObject" as const, url: absoluteUrl("/opengraph-image") },
    },
    inLanguage: "fr-FR",
    image: absoluteUrl("/opengraph-image"),
    isAccessibleForFree: true,
    numberOfPages: 9,
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_FOR_JSON_LD.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  const howToLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: H1,
    description: getTutoPageDescription(pagePath),
    step: [
      { "@type": "HowToStep", name: "Activer la fonction skills dans Claude" },
      { "@type": "HowToStep", name: "Rassembler ta matière première" },
      { "@type": "HowToStep", name: "Lancer la conversation avec Claude" },
      { "@type": "HowToStep", name: "Affiner et activer ton skill" },
      { "@type": "HowToStep", name: "Tester sur un vrai dossier" },
    ],
  };

  const graphJson = {
    "@context": "https://schema.org",
    "@graph": [...((webPageBread as { "@graph": unknown[] })["@graph"] ?? []), articleLd, faqLd, howToLd],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graphJson) }} />

      <div className="min-h-dvh bg-slate-50 text-slate-900">
        <MarketingSiteHeader plainBg />

        <main className="mx-auto flex w-full max-w-6xl flex-col px-6 pb-20 pt-[calc(4.55rem+0.375rem)] sm:pb-28 sm:pt-[calc(4.55rem+0.5rem)] md:pt-[calc(4.55rem+0.625rem)]">
          <nav className="mb-6 text-sm text-slate-600 md:mb-8" aria-label="Fil d’Ariane">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {breadcrumbItems.map((crumb, idx) => (
                <li key={`${crumb.href}-${idx}`} className="flex items-center gap-2">
                  {idx ? <span className="select-none text-slate-400">&nbsp;/ </span> : null}
                  {idx === breadcrumbItems.length - 1 ? (
                    <span className="font-medium text-slate-900">{crumb.name}</span>
                  ) : (
                    <Link href={crumb.href} className="font-medium text-[#1d4ed8] hover:underline">
                      {crumb.name}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>

          <header className="mb-12 w-full">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-600">
              Tuto PDF gratuit · DIUO BTP · Claude · BeWork
            </p>
            <h1 className="font-heading mt-3 text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-[2.35rem] md:leading-tight">
              {H1}
            </h1>
            <p className="mt-4 max-w-none text-lg leading-relaxed text-slate-600 sm:text-[1.125rem] sm:leading-[1.7]">
              Tutoriel BeWork pas à pas : préparer ta liasse de pièces DIUO pour le coordonnateur SPS — plans de
              récolement, sécurité permanente, accès et notices — PDF en ligne et prompts à copier.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <CalendlyBookingLink className="inline-flex min-h-[3rem] shrink-0 items-center justify-center rounded-xl bg-[#1d4ed8] px-7 text-[0.9375rem] font-semibold text-white shadow-md shadow-[#1d4ed8]/25 transition hover:bg-[#1e40af] md:text-base">
                Réservez un appel
              </CalendlyBookingLink>
              <span className="text-sm leading-snug text-slate-600 sm:max-w-sm">
                20&nbsp;minutes pour cadrer votre besoin (DIUO, livrables sécurité chantier, assistance travaux BTP) —
                sans engagement.
              </span>
            </div>
          </header>

          <section
            id="pdf-original"
            className="mb-14 scroll-mt-[calc(4.55rem+1rem)] rounded-3xl border border-slate-200 bg-slate-100/80 p-6 shadow-sm sm:p-10"
            aria-labelledby="pdf-heading"
          >
            <h2 id="pdf-heading" className="text-xl font-semibold tracking-tight text-slate-900">
              Voir le PDF original
            </h2>
            <p className="mt-3 w-full leading-relaxed text-slate-600">
              Consultez le guide dans sa mise en page originale. Vous pouvez l&apos;agrandir ou le télécharger. PDF · 9
              pages
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4 border-b border-slate-200/80 pb-6">
              <a
                href={pdfPath}
                download
                className="rounded-full bg-[#1f6fe0] px-6 py-[0.6875rem] text-xs font-semibold uppercase tracking-[0.18em] text-white hover:opacity-[0.96]"
              >
                Télécharger ce PDF
              </a>
              <a
                href={pdfPath}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex max-w-[min(100%,24rem)] items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-center text-sm font-semibold leading-snug text-[#475569] transition hover:bg-slate-50"
              >
                Ouvrir en plein écran avec le pdf complet
              </a>
            </div>
            <div className="mx-auto mt-8 w-full max-w-none">
              <iframe
                src={`${pdfPath}#toolbar=1&navpanes=0&scrollbar=1`}
                className="h-[650px] w-full rounded-2xl border border-slate-200 bg-white shadow-sm md:h-[900px]"
                title="Crée ton skill — Pièces DIUO pour le SPS — PDF BeWork"
              />
            </div>
          </section>

          <aside
            className="mb-14 rounded-2xl border border-[#1d4ed8]/22 bg-gradient-to-br from-[#eff6ff] to-white p-6 shadow-sm shadow-[#1d4ed8]/06 sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-8"
            aria-label="Réserver un appel découverte"
          >
            <div className="min-w-0 sm:flex-1">
              <p className="text-base font-semibold text-slate-900 md:text-[1.05rem]">
                Besoin d&apos;une assistance pour préparer votre liasse DIUO dans les délais&nbsp;?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 md:text-[0.9375rem]">
                Parlez-en avec BeWork sur un créneau de 20&nbsp;minutes : pièces manquantes, mise en forme, envoi au
                coordonnateur SPS.
              </p>
            </div>
            <div className="mt-5 shrink-0 sm:mt-0">
              <CalendlyBookingLink className="inline-flex min-h-[3rem] w-full min-w-[12.5rem] items-center justify-center rounded-xl bg-[#1d4ed8] px-6 text-sm font-semibold text-white shadow-md shadow-[#1d4ed8]/22 transition hover:bg-[#1e40af] sm:w-auto md:px-8 md:text-base">
                Réservez un appel
              </CalendlyBookingLink>
            </div>
          </aside>

          <section className="mb-14" aria-labelledby="tuto-heading">
            <h2 id="tuto-heading" className="mb-6 text-xl font-semibold tracking-tight text-slate-900">
              Texte intégral du tuto
            </h2>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
              <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-900">TUTO OFFERT PAR BEWORK</p>
              <h3 className="mt-8 text-center text-2xl font-bold text-slate-900 md:text-[1.65rem]">Crée ton skill</h3>
              <p className="mt-3 text-center text-xl font-semibold text-slate-900">Pièces DIUO pour le SPS</p>
              <p className="mt-2 text-center text-base text-slate-700 md:text-[1.05rem]">
                Le tutoriel pas à pas pour préparer ta liasse DIUO — 30 minutes au lieu d&apos;une demi-journée de
                course.
              </p>

              <h4 className="mt-14 text-xs font-semibold uppercase tracking-[0.2em] text-slate-800">Ce que tu vas apprendre</h4>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Réunir les pièces DIUO que le coordonnateur SPS attend de ton lot</li>
                <li>▸ Structurer la liasse par rubrique : plans, sécurité, accès, notices</li>
                <li>▸ Repérer ce qui manque avant d&apos;envoyer, pour ne pas être relancé</li>
                <li>▸ Remettre un dossier carré du premier coup, sans bloquer la réception</li>
              </ul>

              <h3 className="mt-14 text-xl font-semibold tracking-tight text-slate-900">Pourquoi un skill Pièces DIUO pour le SPS&nbsp;?</h3>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-slate-900">
                Sur un chantier où plusieurs entreprises interviennent, c&apos;est le coordonnateur SPS qui élabore le
                DIUO — Dossier d&apos;Intervention Ultérieure sur l&apos;Ouvrage — qui permettra aux entreprises
                intervenant plus tard (maintenance, réparation, rénovation) de travailler en sécurité. Pour cela, il
                réclame à chaque entreprise les pièces de son lot. Le DIUO relève du Code du travail (art. R.4532-95
                et suivants) et le SPS en reste responsable. Ton rôle : lui fournir des pièces propres et complètes,
                dans les délais.
              </p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                En pratique, ces pièces sont éparpillées entre le bureau, les mails et le chef de chantier. On les
                rassemble en catastrophe à l&apos;approche de la réception. Résultat : envois incomplets, relances du
                SPS, réception qui traîne. Et une pièce sécurité oubliée — un ancrage, une trappe — c&apos;est un
                risque pour le technicien qui reviendra dans cinq ans.
              </p>

              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Avec un skill bien construit, voilà ce qui change</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Il liste les pièces DIUO attendues pour ton lot et repère celles qui manquent.</li>
                <li>▸ Il structure la liasse par rubrique : plans, sécurité permanente, accès, notices.</li>
                <li>▸ Il rédige les précautions d&apos;intervention future sur tes ouvrages.</li>
                <li>▸ Il te prépare un envoi carré, prêt à transmettre au coordonnateur SPS.</li>
                <li>▸ Il te fait gagner la course aux pièces de dernière minute.</li>
              </ul>
              <p className="mt-8 text-[1.0625rem] leading-relaxed text-slate-900">
                Tu arrêtes de courir après tes propres pièces la veille de la réception.
              </p>

              <h3 className="mt-14 text-xl font-semibold uppercase tracking-wide text-slate-900">Ce que le SPS attend de ton lot</h3>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-slate-900">
                Plans de récolement (tel que réalisé) · Notices techniques des équipements posés · Dispositifs de
                sécurité permanents (ancrages, lignes de vie, trappes, garde-corps) · Accès et précautions pour les
                interventions futures. — À ne pas confondre&nbsp;: PAQ = qualité pendant les travaux · DOE = ce qui a
                été construit · DIUO = sécurité des interventions futures (compilé par le SPS).
              </p>

              <h3 className="mt-14 text-xl font-semibold uppercase tracking-wide text-slate-900">Cas concret — pourquoi tes pièces comptent</h3>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-slate-900">
                5 ans après la livraison, un couvreur remonte en toiture.
              </p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Il cherche tes ancrages ............. dans TON dossier DIUO</li>
                <li>▸ Il cherche l&apos;accès sécurisé .......... dans TON dossier DIUO</li>
                <li>▸ Il cherche les précautions .......... dans TON dossier DIUO</li>
              </ul>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Si tes pièces manquent&nbsp;: il découvre tout sur place, au risque de l&apos;accident. Bien
                préparées&nbsp;: il intervient en sécurité — et ta réception n&apos;a pas traîné.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">1 </span>
                Active la fonction skills dans Claude
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Pré-requis — un compte Claude. Le compte gratuit suffit pour démarrer (plus de « Pro obligatoire »
                depuis fin 2025). Attention&nbsp;: le plan gratuit est limité en tokens par session et sature vite sur
                les dossiers BTP lourds avec pièces jointes (plans, notices, fiches sécurité). Pour un usage pro
                quotidien, le plan Pro à 18&nbsp;€ HT/mois est recommandé.
              </p>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Le chemin d&apos;activation (interface 2026)</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Clique sur ton avatar en bas à gauche, puis sur « Personnaliser » (ou « Customize »).</li>
                <li>▸ Ouvre l&apos;onglet « Compétences » (ou « Skills »).</li>
                <li>▸ Clique sur le bouton « + » en haut à droite.</li>
                <li>
                  ▸ Choisis « + Créer une compétence » (création assistée par Claude) ou « Téléverser une
                  compétence » pour importer un ZIP existant.
                </li>
              </ul>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Pré-requis technique</p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Active aussi l&apos;option « Exécution de code » dans le même menu Personnaliser&nbsp;: sans elle, pas
                de sortie Word ou PDF en livrable. À ne plus utiliser&nbsp;: l&apos;ancien chemin Settings →
                Capabilities → 3 toggles, qui est obsolète.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">2 </span>
                Rassemble ta matière première
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Plus tu donnes de contexte réel à Claude, plus le skill colle à ce que ton SPS attend. Réunis ces cinq
                éléments avant de lancer la conversation.
              </p>
              <p className="mt-10 text-[1.0625rem] font-semibold text-slate-900">1. Tes plans de récolement</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Le « tel que réalisé » de ton lot&nbsp;: c&apos;est la base sur laquelle le futur intervenant se
                repérera.
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">2. Les notices techniques</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Les notices des équipements que tu as posés (CVC, électricité, serrurerie…), utiles à la maintenance.
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">3. Tes dispositifs de sécurité permanents</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Ancrages, lignes de vie, trappes, garde-corps&nbsp;: ce qui protègera l&apos;intervenant, avec leur
                localisation.
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">4. Les accès à tes ouvrages</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Toitures, locaux techniques, gaines&nbsp;: comment on atteint tes ouvrages en sécurité.
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">5. Une liasse DIUO déjà transmise</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Un modèle de la structure attendue par le SPS&nbsp;: le skill reproduira ce format plutôt qu&apos;un
                générique.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">3 </span>
                Lance la conversation avec Claude
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Ouvre une nouvelle conversation et colle le prompt de cadrage ci-dessous. Il définit le rôle, la
                structure de sortie et les règles que le skill devra respecter à chaque usage.
              </p>
              <PromptBlock label="PROMPT DE CRÉATION" promptText={PROMPT_CALIBRATION_TEXT} />
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Le point clé</p>
              <p className="mt-4 text-[1.0625rem] leading-relaxed text-slate-900">
                Le SPS n&apos;attend pas un DIUO fini de ta part — il attend TES pièces, propres et repérées. Demande
                au skill de sortir une liste de contrôle « fourni / manquant » avant tout envoi&nbsp;: c&apos;est ce
                qui évite les allers-retours.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">4 </span>
                Affine et active ton skill
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Teste la première sortie sur un cas que tu connais déjà, puis vérifie&nbsp;:
              </p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Le ton et la structure correspondent-ils à ce que ton SPS attend ?</li>
                <li>▸ Les rubriques sont-elles complètes (plans, sécurité, accès, précautions, notices) ?</li>
                <li>▸ Le skill demande-t-il les pièces manquantes au lieu de les inventer ?</li>
                <li>▸ La checklist « fourni / manquant » est-elle bien présente ?</li>
                <li>▸ Les localisations (ancrages, trappes, accès) sont-elles repérées ?</li>
                <li>▸ Le livrable s&apos;exporte-t-il au bon format (Word / PDF) ?</li>
              </ul>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Exemple d&apos;ajustement</p>
              <PromptBlock label="EXEMPLE D&apos;AJUSTEMENT" promptText={PROMPT_EXEMPLE_AJUSTEMENT_TEXT} />
              <p className="mt-8 text-[1.0625rem] leading-relaxed text-slate-900">
                Quand le rendu te convient, enregistre la conversation comme compétence&nbsp;: Personnaliser →
                Compétences → « + Créer une compétence ». Donne-lui un nom clair et une description qui dit quand le
                déclencher. Il sera réutilisable en un clic sur tous tes prochains chantiers.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">5 </span>
                Teste sur un vrai dossier
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Le skill est prêt. Voici le réflexe à prendre sur un dossier réel&nbsp;:
              </p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Ouvre une conversation et appelle ton skill Pièces DIUO.</li>
                <li>▸ Joins tes pièces (plans de récolement, notices, fiches sécurité).</li>
                <li>▸ Précise ton lot, le chantier et la date de réception prévue.</li>
                <li>▸ Relis la liasse, complète ce que le skill te réclame.</li>
                <li>▸ Vérifie la checklist « fourni / manquant » avant d&apos;envoyer au SPS.</li>
              </ul>
              <p className="mt-10 text-lg font-semibold text-slate-900">Le bon prompt pour les usages quotidiens</p>
              <PromptBlock label="PROMPT — UTILISATION QUOTIDIENNE" promptText={PROMPT_USAGE_QUOTIDIEN_TEXT} />

              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">La règle d&apos;or</p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Prépare tes pièces au fil du chantier, pas la veille de la réception. Lance le skill à chaque phase
                (pose, mise en service) pour compléter ta liasse — le SPS te réclame moins, la réception avance.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">Questions fréquentes</h3>
              {FAQ_FOR_JSON_LD.map((item, i) => (
                <div key={item.question} className={i === 0 ? "mt-8" : "mt-10"}>
                  <h4 className="text-[1.05rem] font-semibold text-slate-900">{item.question}</h4>
                  <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">{item.answer}</p>
                </div>
              ))}

              <p className="mt-14 text-xl font-semibold uppercase tracking-wide text-slate-900">Pas le temps de le faire vous-même ?</p>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Faire appel à un Assistant Travaux BeWork</p>
              <p className="mt-3 text-[1.0625rem] font-medium text-slate-800">
                Assistant travaux BTP · Relais dossiers chantier · Augmenté par l&apos;IA
              </p>

              <p className="mt-10 text-2xl font-bold uppercase tracking-tight text-slate-900">ON TIENT LE BUREAU, VOUS TENEZ LE CHANTIER</p>
              <ul className="mt-6 list-none space-y-3 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Vous nous envoyez vos plans, notices et fiches sécurité au fil du chantier.</li>
                <li>▸ On prépare votre liasse DIUO aux attentes du SPS, structurée et à jour.</li>
                <li>▸ Vous transmettez un dossier complet du premier coup, sans bloquer la réception.</li>
              </ul>
              <p className="mt-10 text-[1.0625rem] font-semibold text-slate-900">
                Réservez un appel de cadrage de 20 minutes sur{" "}
                <Link href={SITE_URL} className="text-[#1d4ed8] underline underline-offset-4 hover:no-underline">
                  bework.fr
                </Link>
              </p>

              <BeWorkStatsGrid />
            </div>
          </section>

          <div className="mt-28 flex justify-center pb-14">
            <BeWorkLogo className="opacity-95" aria-label="Logo BeWork" />
          </div>
        </main>
      </div>
    </>
  );
}
