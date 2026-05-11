import type { Metadata } from "next";
import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { CopyPromptButton } from "@/components/ressources/CopyPromptButton";
import { buildWebPageAndBreadcrumbJsonLd } from "@/lib/seo-landing-json-ld";
import { absoluteUrl, SITE_URL } from "@/lib/site";

const pagePath = "/ressources/tuto-skill-analyse-dce-bework";

const CANONICAL_URL = "https://www.bework.fr/ressources/tuto-skill-analyse-dce-bework";

const pdfPath = "/ressources/pdf/tuto-skill-analyse-dce-bework.pdf";

const PROMPT_CALIBRATION_TEXT = `Je suis dirigeant d'une entreprise BTP en [TON MÉTIER], je
réponds à des appels d'offres publics et privés.

Je veux créer un skill Claude qui produit une fiche d'analyse
standardisée à partir d'un DCE complet (CCAP, CCTP, RC, BPU, plans).

J'ai uploadé : ma grille d'analyse type, mes critères Go / No Go,
mes qualifications, et un DCE déjà analysé en exemple.

Le skill doit :
1. Accepter en entrée plusieurs PDF d'un même DCE
2. Extraire et structurer l'info selon ma grille en 8 rubriques
3. Identifier précisément les critères de sélection avec leur
pondération
4. Lister les pièces administratives obligatoires
5. Repérer les pénalités, retenues de garantie et clauses
inhabituelles
6. Vérifier si je remplis les critères de candidature avec mes
qualifications
7. Proposer un avis Go / No Go argumenté en bas de fiche
8. Produire une fiche Word d'1 à 2 pages, prête à imprimer

Avant de créer le skill, pose-moi toutes les questions nécessaires
sur ma typologie de marchés, mes seuils Go / No Go et mes points
de vigilance habituels.`;

const PROMPT_USAGE_QUOTIDIEN_TEXT = `Voici les pièces du DCE pour le marché [NOM DU MARCHÉ].

Génère ma fiche d'analyse standardisée. Cite la page exacte du
DCE pour chaque information extraite. Termine par un avis Go /
No Go argumenté selon mes critères habituels.`;

const PROMPT_EXEMPLE_AJUSTEMENT_TEXT = `Pour les pénalités, mets-les en gras et signale toujours si une
pénalité dépasse 1/3000ème par jour de retard — c'est mon seuil
de vigilance.

Et pour la retenue de garantie : signale systématiquement si elle
est non remplaçable par caution bancaire.`;

const H1 = "Crée ton skill — Analyse de DCE";

const META_DESCRIPTION =
  "Tutoriel BeWork gratuit : skill Claude pour analyser un DCE (CCAP, CCTP, RC, BPU) — fiche standardisée, Go/No Go, PDF et prompts à copier.";

const breadcrumbItems = [
  { name: "Accueil", href: "/" },
  { name: "Ressources", href: "/ressources" },
  { name: H1, href: pagePath },
] as const;

const FAQ_FOR_JSON_LD = [
  {
    question: "Le skill peut-il vraiment remplacer ma lecture du DCE ?",
    answer:
      "Non. Et il ne doit pas. Le skill sert à filtrer et à prioriser. Sur les 10 DCE que tu reçois, il te dit lesquels valent la peine d'être lus en détail. Pour les marchés que tu décides de chiffrer, tu relis le CCTP toi-même — c'est ta responsabilité de dirigeant.",
  },
  {
    question: "Et si Claude rate une clause cachée dans le CCAP ?",
    answer:
      "C'est possible la première fois. Tu lui signales : « Tu as oublié de relever la clause X page Y. Mémorise ce type de clause pour les prochaines analyses. » À chaque correction, le skill devient plus précis. Au bout de 5 ou 6 DCE, il rate beaucoup moins de choses qu'un humain fatigué à 19h.",
  },
  {
    question: "Mes données sont-elles confidentielles ?",
    answer:
      "Sur Claude Pro, Anthropic ne réutilise pas tes données pour entraîner ses modèles. Pour les DCE de marchés sensibles (défense, santé, sites SEVESO), vérifie quand même que le règlement de consultation autorise l'usage d'outils IA externes — certains MOA l'interdisent explicitement.",
  },
  {
    question: "Combien de DCE puis-je analyser par mois ?",
    answer:
      "Avec Claude Pro, tu as une limite d'usage hebdomadaire. En pratique, un DCE complet de 200 pages représente environ 1 à 2 % de ta limite. Tu peux donc analyser facilement 30 à 50 DCE par semaine — bien plus que ce que tu reçois en réalité.",
  },
  {
    question: "Mon associé peut-il utiliser le même skill ?",
    answer:
      "Pas directement. Les skills sont attachés à un compte Claude personnel. Pour le partager : exporte le fichier SKILL.md, et chaque utilisateur l'importe dans son propre compte. Une version Team de Claude existe pour mutualiser au sein d'une entreprise.",
  },
  {
    question: "Et si le DCE est mal scanné ou écrit à la main ?",
    answer:
      "Claude gère bien les scans propres et les PDF natifs. Pour les scans dégradés ou les annotations manuscrites, tu peux d'abord lui demander : « Ce DCE est mal scanné, signale-moi tous les passages où tu n'es pas sûr de la lecture. » Il marquera les zones à vérifier manuellement.",
  },
] as const;

export const metadata: Metadata = {
  title: "Crée ton skill — Analyse de DCE | BeWork",
  description: META_DESCRIPTION,
  alternates: {
    canonical: CANONICAL_URL,
    languages: { fr: CANONICAL_URL, "x-default": CANONICAL_URL },
  },
  openGraph: {
    type: "article",
    locale: "fr_FR",
    url: CANONICAL_URL,
    siteName: "BeWork",
    title: "Crée ton skill — Analyse de DCE | BeWork",
    description: META_DESCRIPTION,
    images: [{ url: absoluteUrl("/opengraph-image"), width: 1200, height: 630, alt: "Crée ton skill — Analyse de DCE — BeWork" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Crée ton skill — Analyse de DCE | BeWork",
    description: META_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

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

export default function TutoSkillAnalyseDceBeworkPage() {
  const webPageBread = buildWebPageAndBreadcrumbJsonLd({
    pagePath,
    h1: H1,
    description: META_DESCRIPTION,
    breadcrumbItems: [...breadcrumbItems],
  });

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: H1,
    description: META_DESCRIPTION,
    url: CANONICAL_URL,
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
    description: META_DESCRIPTION,
    step: [
      { "@type": "HowToStep", name: "Activer la fonction skills dans Claude" },
      { "@type": "HowToStep", name: "Rassembler ta matière première" },
      { "@type": "HowToStep", name: "Lancer la conversation avec Claude" },
      { "@type": "HowToStep", name: "Affiner et activer ton skill" },
      { "@type": "HowToStep", name: "Tester sur un vrai DCE" },
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
              Tuto PDF gratuit · Analyse DCE · Claude · BeWork
            </p>
            <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-[2.35rem] md:leading-tight">
              {H1}
            </h1>
            <p className="mt-4 max-w-none text-lg leading-relaxed text-slate-600 sm:text-[1.125rem] sm:leading-[1.7]">
              Tutoriel BeWork pas à pas : mâcher un gros DCE en quelques minutes avec une fiche standardisée, un avis Go / No Go et des
              pièces citées avec numéro de page — PDF en ligne puis texte intégral et prompts à copier.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <CalendlyBookingLink className="inline-flex min-h-[3rem] shrink-0 items-center justify-center rounded-xl bg-[#1d4ed8] px-7 text-[0.9375rem] font-semibold text-white shadow-md shadow-[#1d4ed8]/25 transition hover:bg-[#1e40af] md:text-base">
                Réservez un appel
              </CalendlyBookingLink>
              <span className="text-sm leading-snug text-slate-600 sm:max-w-sm">
                20&nbsp;minutes pour cadrer votre besoin (DCE, AO, relais administratif BTP) — sans engagement.
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
              Consultez le guide dans sa mise en page originale. Vous pouvez l&apos;agrandir ou le télécharger. PDF · 9 pages
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
                title="Crée ton skill — Analyse de DCE — PDF BeWork"
              />
            </div>
          </section>

          <aside
            className="mb-14 rounded-2xl border border-[#1d4ed8]/22 bg-gradient-to-br from-[#eff6ff] to-white p-6 shadow-sm shadow-[#1d4ed8]/06 sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-8"
            aria-label="Réserver un appel découverte"
          >
            <div className="min-w-0 sm:flex-1">
              <p className="text-base font-semibold text-slate-900 md:text-[1.05rem]">
                Besoin d&apos;un relais sur vos dossiers d&apos;appels d&apos;offres&nbsp;?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 md:text-[0.9375rem]">
                Parlez-en avec BeWork pendant un créneau de 20&nbsp;minutes : lecture DCE, structuration et priorisation avec vous.
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
              <p className="mt-3 text-center text-xl font-semibold text-slate-900">Analyse de DCE</p>
              <p className="mt-2 text-center text-base text-slate-700 md:text-[1.05rem]">
                Le tutoriel pas à pas pour mâcher 220 pages de DCE en 3 minutes — au lieu de 4 heures.
              </p>

              <h4 className="mt-14 text-xs font-semibold uppercase tracking-[0.2em] text-slate-800">Ce que tu vas apprendre</h4>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ La fiche d&apos;analyse standardisée d&apos;un DCE</li>
                <li>▸ 5 étapes pour créer ton skill en 30 minutes</li>
                <li>▸ Le prompt exact à donner à Claude</li>
                <li>▸ Comment l&apos;utiliser pour décider Go / No Go en 3 minutes</li>
              </ul>

              <h3 className="mt-14 text-xl font-semibold tracking-tight text-slate-900">Pourquoi un skill analyse DCE&nbsp;?</h3>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-slate-900">
                Un DCE de 220 pages, c&apos;est 4 heures de lecture. Et tu as déjà 3 autres dossiers en cours. Sur les 47 DCE qui sortent dans le
                mois, tu ne peux pas tous les lire. Du coup, tu choisis au feeling. Tu loupes des opportunités. Ou tu réponds à des marchés mal
                calibrés pour toi.
              </p>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Avec un skill bien construit, voilà ce qui change</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Tu colles le DCE dans Claude (CCAP + CCTP + RC + DPGF).</li>
                <li>▸ Tu écris : « analyse-le ».</li>
                <li>▸ En 3 minutes, tu as une fiche standardisée.</li>
                <li>▸ Tu décides Go / No Go en connaissance de cause.</li>
                <li>▸ Si Go, tu as déjà la base de ta réponse.</li>
              </ul>
              <p className="mt-10 text-[1.0625rem] leading-relaxed text-slate-900">
                L&apos;objectif n&apos;est pas de remplacer ta lecture du DCE — c&apos;est de la prioriser. Tu lis vraiment les dossiers qui en valent la
                peine.
              </p>

              <h3 className="mt-14 text-xl font-semibold uppercase tracking-wide text-slate-900">Ce que la fiche doit contenir</h3>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-slate-900">
                Les 5 critères de sélection avec leur pondération. La date limite et les modalités de remise. Les exigences techniques classées
                par priorité. Les pénalités et points de vigilance. Les pièces administratives à fournir. Pas un résumé général — une fiche
                actionnable, toujours la même structure.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">1 </span>
                Active la fonction skills dans Claude
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Comme pour tous les skills, il te faut un abonnement Claude Pro (18 €/mois). La fonction n&apos;est pas accessible en version
                gratuite. Active ensuite l&apos;option qui permet à Claude de lire des PDF lourds et de générer ta fiche d&apos;analyse :
              </p>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Le chemin précis</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Va sur claude.ai et connecte-toi.</li>
                <li>▸ Clique sur tes initiales en bas à gauche.</li>
                <li>▸ Sélectionne « Settings ».</li>
                <li>▸ Va dans l&apos;onglet « Capabilities ».</li>
                <li>▸ Active le toggle « Code execution and file creation ».</li>
              </ul>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Pourquoi c&apos;est indispensable</p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Un DCE complet pèse souvent 50 à 200 Mo (CCAP, CCTP, RC, plans, BPU). Sans cette capacité activée, Claude ne peut traiter
                qu&apos;une partie du contenu. Avec, il extrait, croise et structure l&apos;ensemble — c&apos;est ce qui te donne une fiche fiable plutôt
                qu&apos;un résumé bancal.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">2 </span>
                Rassemble ta matière première
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                L&apos;analyse DCE est un skill un peu différent : tu ne mets pas en forme un document selon ton style, tu extrais des informations
                selon une grille. La matière à préparer est donc plus courte, mais cruciale.
              </p>
              <p className="mt-10 text-[1.0625rem] font-semibold text-slate-900">1. Ta grille d&apos;analyse type</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Si tu as déjà une fiche de lecture standard, parfait. Sinon voici les 8 rubriques classiques à reprendre :
              </p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Identité du marché (objet, MOA, MOE, n° de marché)</li>
                <li>▸ Calendrier (date limite, durée d&apos;exécution, démarrage prévu)</li>
                <li>▸ Modalités de remise (plateforme, format, signature électronique)</li>
                <li>▸ Critères de sélection avec leur pondération précise</li>
                <li>▸ Exigences techniques classées par priorité</li>
                <li>▸ Conditions financières (variantes, options, pénalités, retenue de garantie)</li>
                <li>▸ Pièces administratives à fournir (DC1, DC2, attestations)</li>
                <li>▸ Points de vigilance (clauses inhabituelles, contraintes site)</li>
              </ul>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">2. Tes critères Go / No Go</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Liste ce qui te fait dire « on y va » ou « on laisse passer » sur un AO. Exemples : montant minimum, distance maximum du chantier,
                présence de pénalités hors barème, exigence de qualifications que tu n&apos;as pas. Claude va intégrer ces critères pour te donner une
                recommandation Go / No Go en bas de fiche.
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">3. Tes qualifications et capacités</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Qualibat, RGE, certifications ISO, MASE, capacités humaines et matérielles. Permet à Claude de te dire si tu remplis les critères de
                candidature dès l&apos;analyse.
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">4. Un exemple de DCE déjà analysé</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Idéalement, prends un DCE que tu as bien décortiqué récemment, avec ta fiche de lecture déjà remplie. Claude apprendra ton niveau
                de précision attendu et le ton de tes commentaires.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">3 </span>
                Lance la conversation avec Claude
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Ouvre une nouvelle conversation. Upload ta grille d&apos;analyse, tes critères Go / No Go, tes qualifications et ton exemple de DCE
                déjà analysé. Puis colle ce prompt :
              </p>
              <PromptBlock label="PROMPT À COLLER DANS CLAUDE" promptText={PROMPT_CALIBRATION_TEXT} />
              <p className="mt-8 text-xl font-semibold uppercase tracking-wide text-slate-900">Le point clé</p>
              <p className="mt-4 text-[1.0625rem] leading-relaxed text-slate-900">
                Demande à Claude de toujours citer la page exacte du DCE pour chaque info extraite. C&apos;est ta garantie en cas de litige : la fiche
                n&apos;invente rien, elle reformule du sourcé.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">4 </span>
                Affine et active ton skill
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Claude génère un fichier SKILL.md. Avant de le sauvegarder, prends 5 minutes pour le relire. Sur un skill d&apos;analyse, la précision
                est plus importante que le style.
              </p>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Ce que tu dois vérifier</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Les 8 rubriques de ta grille sont bien présentes et dans l&apos;ordre.</li>
                <li>▸ La consigne de citer la page exacte est intégrée.</li>
                <li>▸ Les seuils Go / No Go correspondent à tes vrais critères.</li>
                <li>▸ Les qualifications listées sont exactes (Qualibat à jour, RGE actif…).</li>
                <li>▸ Le format de sortie est précisé : Word A4, 1 à 2 pages, à imprimer.</li>
                <li>▸ La consigne anti-hallucination est claire : si l&apos;info n&apos;est pas dans le DCE, ne pas inventer.</li>
              </ul>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Ajustement type à demander</p>
              <PromptBlock label="EXEMPLE D&apos;AJUSTEMENT" promptText={PROMPT_EXEMPLE_AJUSTEMENT_TEXT} />
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Active le skill</p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Quand tu es satisfait, dis à Claude « Sauvegarde ce skill ». Tu le retrouves dans Settings → Customize → Skills. Vérifie que le
                toggle est activé.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">5 </span>
                Teste sur un vrai DCE
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Le moment de vérité. Prends un DCE récent — idéalement un que tu as déjà analysé manuellement, pour comparer.
              </p>
              <p className="mt-10 text-lg font-semibold text-slate-900">Le test</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Ouvre une nouvelle conversation Claude (pas dans un Project).</li>
                <li>▸ Upload tous les PDF du DCE : CCAP, CCTP, RC, BPU, annexes.</li>
                <li>▸ Tape simplement : « Analyse ce DCE ».</li>
                <li>▸ Le skill se déclenche automatiquement.</li>
                <li>▸ Claude produit la fiche complète en 3 à 5 minutes.</li>
              </ul>
              <p className="mt-10 text-lg font-semibold text-slate-900">Le bon prompt à coller pour les usages quotidiens</p>
              <PromptBlock label="PROMPT — UTILISATION QUOTIDIENNE" promptText={PROMPT_USAGE_QUOTIDIEN_TEXT} />

              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Ce qui va se passer</p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                La première fois, tu vas comparer avec ta fiche manuelle et corriger 20 % du contenu. La deuxième fois, 5 %. La troisième, tu fais
                confiance au skill et tu valides en 5 minutes. Ton temps d&apos;analyse passe vraiment de 4h à 3 minutes — mais le temps de décision Go
                / No Go reste à toi.
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
                <li>▸ Vous nous transmettez les DCE qui sortent (CCAP, CCTP, RC, BPU, plans)</li>
                <li>▸ On extrait, on structure, on vous livre la fiche d&apos;analyse + avis Go / No Go</li>
                <li>▸ Vous décidez en 5 minutes, vous chiffrez les bons dossiers, vous gagnez plus d&apos;AO</li>
              </ul>
              <p className="mt-10 text-[1.0625rem] font-semibold text-slate-900">
                Réservez un appel de cadrage de 20 minutes sur{" "}
                <Link href="https://bework.fr" className="text-[#1d4ed8] underline underline-offset-4 hover:no-underline">
                  bework.fr
                </Link>
              </p>

              <div className="mt-14 grid gap-10 border-t border-slate-100 pt-10 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <div className="text-3xl font-extrabold leading-tight text-[#1d4ed8] sm:text-4xl">3 À 5 JOURS</div>
                  <div className="mt-2 text-xl font-bold uppercase tracking-wide text-slate-900">OPÉRATIONNEL</div>
                </div>
                <div>
                  <div className="text-5xl font-extrabold text-[#1d4ed8]">0</div>
                  <div className="mt-2 text-xl font-bold uppercase tracking-wide text-slate-900">RECRUTEMENT À FAIRE</div>
                </div>
                <div>
                  <div className="text-5xl font-extrabold text-[#1d4ed8]">100 %</div>
                  <div className="mt-2 text-xl font-bold uppercase tracking-wide text-slate-900">PILOTÉ EN FRANCE</div>
                </div>
              </div>
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
