import { getTutoPageDescription, tutoPageMetadata } from "@/lib/seo-tuto-metadata";
import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { CopyPromptButton } from "@/components/ressources/CopyPromptButton";
import { buildWebPageAndBreadcrumbJsonLd } from "@/lib/seo-landing-json-ld";
import { absoluteUrl, SITE_URL } from "@/lib/site";
import { BeWorkStatsGrid } from "@/components/marketing/BeWorkStatsGrid";

const pagePath = "/ressources/tuto-skill-memoire-technique-bework";

const pageUrl = absoluteUrl(pagePath);

const pdfPath = "/ressources/pdf/tuto-skill-memoire-technique-bework.pdf";

const PROMPT_CALIBRATION_TEXT = `Je suis dirigeant d'une entreprise BTP spécialisée en
[TON MÉTIER : carrelage / gros œuvre / électricité / etc.].
Je veux créer un skill Claude qui va m'aider à rédiger
automatiquement mes mémoires techniques pour répondre à
des appels d'offres.
J'ai uploadé :
- Ma structure type de mémoire technique
- 2 anciens mémoires que j'ai utilisés sur des marchés publics
- Mes données entreprise (raison sociale, effectif, CA, qualifications)
- Mon logo et ma charte graphique
- Ma liste de références chantiers
Génère-moi un skill complet pour rédiger mes futurs mémoires
techniques.

Le skill doit :
1. Analyser ma structure type et la rendre réutilisable
2. Intégrer mes données entreprise comme contexte permanent
3. Reproduire mon style à partir de mes anciens mémoires
4. Inclure un prompt par section pour faciliter la rédaction
5. Permettre que je colle juste un CCTP pour qu'il génère un mémoire
adapté

Avant de créer le skill, pose-moi toutes les questions nécessaires
pour bien le calibrer.`;

const PROMPT_USAGE_QUOTIDIEN_TEXT = `Voici le CCTP, le règlement de consultation et la DPGF pour le marché [NOM DU MARCHÉ].

Rédige le mémoire technique pour ce marché selon ma structure habituelle et mon style.`;

const PROMPT_EXEMPLE_AJUSTEMENT_TEXT = `Dans la section méthodologie, ajoute systématiquement une mention
sur les normes DTU applicables.

Et change le ton de la section "valeur ajoutée" : je ne veux pas du
tout sonner commercial, je veux rester factuel.`;

const H1 = "Crée ton skill — Mémoire Technique BTP";


const breadcrumbItems = [
  { name: "Accueil", href: "/" },
  { name: "Ressources", href: "/ressources" },
  { name: H1, href: pagePath },
] as const;

const FAQ_FOR_JSON_LD = [
  {
    question: "Et si je n'ai pas d'ancien mémoire technique ?",
    answer:
      "Demande à Claude de te générer une trame standard pour ton métier, puis adapte-la avec tes données. Le skill sera moins personnalisé au début, mais s'enrichira au fil de tes corrections.",
  },
  {
    question: "Mon skill peut-il être utilisé par toute mon équipe ?",
    answer:
      "Pas en l'état. Les skills sont attachés à un compte Claude personnel. Pour le partager : exporte le fichier SKILL.md, et chaque membre de l'équipe peut l'importer dans son propre compte. Une version Team est disponible chez Claude pour les entreprises.",
  },
  {
    question: "Mes données sont-elles confidentielles ?",
    answer:
      "Anthropic, l'éditeur de Claude, ne réutilise pas tes données pour entraîner ses modèles si tu es en plan payant. Évite quand même d'y mettre des données nominatives sensibles (numéros de sécu, infos médicales).",
  },
  {
    question: "Combien de temps ça prend pour créer le skill ?",
    answer:
      "30 à 45 minutes la première fois, en suivant ce tuto. Les ajustements après les premiers tests prennent 10 minutes par session.",
  },
  {
    question: "Le skill marche-t-il aussi avec ChatGPT ?",
    answer:
      "Pas directement. ChatGPT a un système équivalent appelé GPTs personnalisés, mais la logique est différente. Si tu veux utiliser ChatGPT, fais-toi accompagner pour adapter la méthode.",
  },
  {
    question: "Et si Claude se trompe sur des points techniques BTP ?",
    answer:
      "Tu corriges, et tu lui dis de mémoriser la correction. Plus tu utilises le skill, plus il devient précis sur ton métier. C'est de l'apprentissage par usage.",
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

export default function TutoSkillMemoireTechniqueBeworkPage() {
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
              Tuto PDF gratuit · Mémoire technique · Claude · BeWork
            </p>
            <h1 className="font-heading mt-3 text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-[2.35rem] md:leading-tight">
              {H1}
            </h1>
            <p className="mt-4 max-w-none text-lg leading-relaxed text-slate-600 sm:text-[1.125rem] sm:leading-[1.7]">
              Tutoriel BeWork pas à pas : faire de Claude votre assistant qui rédige vos mémoires techniques à votre structure et à votre
              style — PDF en ligne puis texte intégral et prompts à copier.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <CalendlyBookingLink className="inline-flex min-h-[3rem] shrink-0 items-center justify-center rounded-xl bg-[#1d4ed8] px-7 text-[0.9375rem] font-semibold text-white shadow-md shadow-[#1d4ed8]/25 transition hover:bg-[#1e40af] md:text-base">
                Réservez un appel
              </CalendlyBookingLink>
              <span className="text-sm leading-snug text-slate-600 sm:max-w-sm">
                20&nbsp;minutes pour cadrer votre besoin (mémoire tech, AO, assistance travaux BTP) — sans engagement.
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
                title="Crée ton skill — Mémoire Technique BTP — PDF BeWork"
              />
            </div>
          </section>

          <aside
            className="mb-14 rounded-2xl border border-[#1d4ed8]/22 bg-gradient-to-br from-[#eff6ff] to-white p-6 shadow-sm shadow-[#1d4ed8]/06 sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-8"
            aria-label="Réserver un appel découverte"
          >
            <div className="min-w-0 sm:flex-1">
              <p className="text-base font-semibold text-slate-900 md:text-[1.05rem]">
                Besoin d&apos;une assistance pour vos dossiers AO et mémoires techniques&nbsp;?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 md:text-[0.9375rem]">
                Parlez-en avec BeWork pendant un créneau de 20&nbsp;minutes : structuration documents, aide à la rédaction, calage sur vos
                références.
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
              <p className="mt-3 text-center text-xl font-semibold text-slate-900">Mémoire Technique BTP</p>
              <p className="mt-2 text-center text-base text-slate-700 md:text-[1.05rem]">
                Le tutoriel pas à pas pour transformer Claude en assistant qui rédige tes mémoires techniques à ta place.
              </p>

              <h4 className="mt-14 text-xs font-semibold uppercase tracking-[0.2em] text-slate-800">Ce que tu vas apprendre</h4>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Ce qu&apos;est un skill Claude (et pourquoi un Project ne suffit pas)</li>
                <li>▸ 5 étapes pour créer ton skill en 30 minutes</li>
                <li>▸ Le prompt exact à donner à Claude</li>
                <li>▸ Comment l&apos;utiliser sur ton prochain DCE</li>
              </ul>

              <h3 className="mt-14 text-xl font-semibold tracking-tight text-slate-900">C&apos;est quoi un skill Claude&nbsp;?</h3>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-slate-900">
                Un skill, c&apos;est un mode d&apos;emploi permanent que tu donnes à Claude. Tu lui apprends ton métier, ta boîte, ton style — une fois
                pour toutes. À chaque nouvelle conversation, le skill s&apos;active automatiquement quand tu mentionnes ton sujet. Tu n&apos;as plus
                jamais besoin de réexpliquer ton contexte.
              </p>

              <h4 className="mt-10 text-[1rem] font-semibold uppercase tracking-wide text-slate-800">Skill vs Project — la différence</h4>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-5">
                  <p className="text-sm font-bold uppercase tracking-wider text-slate-900">PROJECT</p>
                  <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                    <li>▸ Un dossier de conversations</li>
                    <li>▸ Tu dois aller dedans pour l&apos;utiliser</li>
                    <li>▸ Stocke surtout des fichiers et l&apos;historique</li>
                    <li>▸ Bon pour suivre un projet client</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-[#1d4ed8]/22 bg-[#eff6ff]/50 p-5">
                  <p className="text-sm font-bold uppercase tracking-wider text-[#1e40af]">SKILL</p>
                  <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                    <li>▸ Un savoir-faire réutilisable</li>
                    <li>▸ S&apos;active tout seul quand tu en as besoin</li>
                    <li>▸ Stocke des instructions et une méthode</li>
                    <li>▸ Bon pour automatiser une tâche récurrente</li>
                  </ul>
                </div>
              </div>

              <h4 className="mt-14 text-xl font-semibold uppercase tracking-wide text-slate-900">Pourquoi un skill mémoire technique&nbsp;?</h4>
              <ul className="mt-6 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Tu rédiges plusieurs mémoires par mois et la trame est toujours la même.</li>
                <li>▸ Tu te répètes : présentation entreprise, références, méthodologie, QSE.</li>
                <li>▸ Tu colles toujours les mêmes infos dans Claude pour qu&apos;il comprenne ta boîte.</li>
                <li>▸ Tu adaptes le style à chaque marché public, sans changer la structure.</li>
              </ul>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                → C&apos;est exactement le cas d&apos;usage où un skill divise ton temps par 5.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">1 </span>
                Active la fonction skills dans Claude
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Avant tout, il te faut un abonnement Claude Pro (18 €/mois). C&apos;est obligatoire — la fonction skill n&apos;est pas accessible en
                version gratuite. Ensuite, tu dois activer une option cachée :
              </p>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Le chemin précis</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Va sur claude.ai et connecte-toi.</li>
                <li>▸ Clique sur tes initiales en bas à gauche.</li>
                <li>▸ Sélectionne « Settings ».</li>
                <li>▸ Va dans l&apos;onglet « Capabilities ».</li>
                <li>▸ Active le toggle « Code execution and file creation ».</li>
              </ul>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Pourquoi cette étape</p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Un skill est un fichier que Claude lit et écrit dans son environnement. Sans la capacité d&apos;exécuter du code et de créer des
                fichiers, il ne peut pas générer ton skill.
              </p>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Vérifie que c&apos;est bien activé</p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Ouvre une nouvelle conversation et tape : « Liste-moi mes skills disponibles ». Si Claude te répond avec une liste (même vide),
                c&apos;est bon. Si rien ne se passe, retourne dans Settings et vérifie le toggle.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">2 </span>
                Rassemble ta matière première
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Avant de parler à Claude, tu dois préparer les ingrédients. Plus tu lui donnes de matière, plus ton skill sera fidèle à ton
                entreprise. Voici les 5 éléments à réunir dans un dossier sur ton ordinateur :
              </p>
              <p className="mt-10 text-[1.0625rem] font-semibold text-slate-900">1. La structure de ton mémoire technique</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Si tu as déjà une trame, parfait. Sinon, voici les 11 sections classiques d&apos;un mémoire BTP :
              </p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Présentation entreprise</li>
                <li>▸ Parcours du dirigeant</li>
                <li>▸ Organigramme</li>
                <li>▸ Références chantiers similaires</li>
                <li>▸ Moyens humains affectés</li>
                <li>▸ Moyens matériels</li>
                <li>▸ Méthodologie d&apos;exécution</li>
                <li>▸ Gestion qualité</li>
                <li>▸ QSE — Sécurité Santé Environnement</li>
                <li>▸ Planning prévisionnel</li>
                <li>▸ Valeur ajoutée et différenciation</li>
              </ul>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">2. Tes 2 ou 3 derniers mémoires gagnés</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                En PDF ou en Word. Claude va analyser ton style, tes formulations, ton ton. Si tu n&apos;as que des mémoires perdus, donne-les quand
                même : on apprend autant des échecs.
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">3. Tes données entreprise</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Raison sociale, SIRET, année de création, effectif, CA, qualifications, zone d&apos;intervention. Mets tout dans un fichier texte.
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">4. Tes assets visuels</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Logo, organigramme, charte graphique (couleurs principales si tu en as une), photos de chantiers récents.
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">5. Ta liste de références</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Tableau Excel ou Word avec : maître d&apos;ouvrage, lieu, montant, surface, année, nature des travaux, référent contactable.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">3 </span>
                Lance la conversation avec Claude
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Ouvre une nouvelle conversation. Upload tous tes fichiers préparés à l&apos;étape 2 (glisser-déposer dans le chat). Puis colle ce
                prompt :
              </p>
              <PromptBlock label="PROMPT À COLLER DANS CLAUDE" promptText={PROMPT_CALIBRATION_TEXT} />
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Ce que Claude va faire</p>
              <p className="mt-4 text-[1.0625rem] leading-relaxed text-slate-900">
                Il va te poser 5 à 10 questions pour clarifier ton positionnement, ton style, tes contraintes habituelles. Réponds avec
                précision : la qualité de ton skill dépend de la qualité de tes réponses.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">4 </span>
                Affine et active ton skill
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Une fois les questions posées, Claude va générer un fichier appelé SKILL.md. Il te le présentera à l&apos;écran avant de te demander
                si tu veux qu&apos;il le sauvegarde. Ne te précipite pas. Prends 5 minutes pour le relire.
              </p>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Ce que tu dois vérifier</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Les noms et données de ton entreprise sont corrects.</li>
                <li>▸ La structure du mémoire correspond à ce que tu utilises vraiment.</li>
                <li>▸ Le ton décrit ressemble à ton style (direct, technique, etc.).</li>
                <li>▸ Les prompts par section sont actionnables (pas vagues).</li>
                <li>▸ Les références à tes qualifications (Qualibat, RGE) sont exactes.</li>
              </ul>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Demande des ajustements</p>
              <p className="mt-4 text-[1.0625rem] leading-relaxed text-slate-900">Si quelque chose cloche, dis-le simplement. Par exemple :</p>
              <PromptBlock label="EXEMPLE D&apos;AJUSTEMENT" promptText={PROMPT_EXEMPLE_AJUSTEMENT_TEXT} />
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Active le skill</p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Quand tu es satisfait, demande à Claude : « Sauvegarde ce skill ». Il l&apos;enregistre dans tes skills disponibles. Tu peux le
                retrouver dans Settings → Customize → Skills. Vérifie que le toggle est activé (à droite).
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">5 </span>
                Teste sur un vrai DCE
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Le moment de vérité. Prends un DCE que tu as déjà reçu (peu importe s&apos;il est encore ouvert ou pas). Ouvre une nouvelle conversation
                Claude (pas dans un Project, juste une conversation neuve).
              </p>
              <p className="mt-10 text-lg font-semibold text-slate-900">Le test</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Upload le CCTP, le règlement de consultation et la DPGF.</li>
                <li>▸ Tape simplement : « Rédige le mémoire technique pour ce marché ».</li>
                <li>▸ Le skill se déclenche automatiquement.</li>
                <li>▸ Claude produit la trame complète, adaptée à l&apos;AO.</li>
              </ul>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Ce qui va se passer</p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                La première fois, tu vas corriger 30 % du contenu — c&apos;est normal. La deuxième fois, 10 %. La troisième fois, tu relis et tu
                envoies. Le skill apprend de tes corrections si tu lui dis : « Mémorise cette correction pour les prochains mémoires. »
              </p>
              <p className="mt-10 text-lg font-semibold text-slate-900">Optimisations courantes après le premier test</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Demander des prompts plus spécifiques pour la section méthodologie.</li>
                <li>▸ Ajouter des formulations gagnantes que tu utilises souvent.</li>
                <li>▸ Préciser les normes techniques par type de chantier.</li>
                <li>▸ Standardiser les visuels (planning Gantt, organigramme).</li>
              </ul>
              <p className="mt-10 text-lg font-semibold text-slate-900">Le bon prompt à coller pour les usages quotidiens</p>
              <PromptBlock label="PROMPT — UTILISATION QUOTIDIENNE" promptText={PROMPT_USAGE_QUOTIDIEN_TEXT} />

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
                <li>▸ Vous nous transmettez le DCE (CCTP, RC, DPGF) et vos références</li>
                <li>▸ On rédige votre mémoire technique calé sur votre style, votre charte, vos références</li>
                <li>▸ Vous restez sur le chantier, votre offre part en temps et en heure, sans nuit blanche</li>
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
