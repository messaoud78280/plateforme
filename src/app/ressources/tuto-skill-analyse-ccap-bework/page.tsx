import { getTutoPageDescription, tutoPageMetadata } from "@/lib/seo-tuto-metadata";
import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { CopyPromptButton } from "@/components/ressources/CopyPromptButton";
import { buildWebPageAndBreadcrumbJsonLd } from "@/lib/seo-landing-json-ld";
import { absoluteUrl, SITE_URL } from "@/lib/site";
import { BeWorkStatsGrid } from "@/components/marketing/BeWorkStatsGrid";

const pagePath = "/ressources/tuto-skill-analyse-ccap-bework";
const pageUrl = absoluteUrl(pagePath);
const pdfPath = "/ressources/pdf/tuto-skill-analyse-ccap-bework.pdf";

const PROMPT_CALIBRATION_TEXT = `Je veux créer un skill "Analyse CCAP" pour mon entreprise du BTP.
Mon métier : [ex. gros œuvre / second œuvre / TCE].
Ma situation : [taille, trésorerie, marge mini, assurances].

À chaque CCAP que je te donne, tu dois :
1. Repérer les 9 familles de clauses : délais, pénalités,
retenue de garantie, paiement, révision, avance, réception,
assurances, résiliation.
2. Pour chacune : citer l'article, résumer en clair, chiffrer
l'impact, attribuer un niveau VERT / ORANGE / ROUGE.
3. Lister les clauses absentes mais attendues.
4. Proposer mes questions de mise au point au maître d'ouvrage.
5. Produire une fiche d'1 page + verdict Go / sous conditions / No Go.
6. Citer les références utiles (CCAG Travaux 2021, Code de la
commande publique, loi 71-584) sans recopier les textes.
Reformule toujours, ne recopie jamais le texte officiel.`;

const PROMPT_USAGE_QUOTIDIEN_TEXT = `Voici le CCAP du marché [nom de l'opération].
Analyse-le avec le skill : tableau des 9 familles de clauses,
niveaux VERT/ORANGE/ROUGE, clauses manquantes, questions de
mise au point, verdict Go / sous conditions / No Go.
Livre-moi la synthèse en Word.`;

const PROMPT_EXEMPLE_AJUSTEMENT_TEXT = `Sois plus sévère sur les délais de paiement : au-delà de
45 j fin de mois, passe en ROUGE. Et ajoute une ligne
"impact trésorerie estimé sur la durée du chantier".`;

const H1 = "Crée ton skill — Analyse de CCAP";

const breadcrumbItems = [
  { name: "Accueil", href: "/" },
  { name: "Ressources", href: "/ressources" },
  { name: H1, href: pagePath },
] as const;

const FAQ_FOR_JSON_LD = [
  {
    question: "Le skill remplace-t-il un juriste ?",
    answer:
      "Non. Il fait gagner un temps considérable sur la lecture et structure ta décision, mais sur un montage complexe ou un litige potentiel, l’avis d’un juriste reste indispensable. Le skill te dit où regarder ; il ne plaide pas.",
  },
  {
    question: "Le skill connaît-il le CCAG applicable ?",
    answer:
      "Oui, si tu le précises. En marché public de travaux, le CCAP renvoie au CCAG Travaux 2021 : demande au skill de signaler les articles où le CCAP y déroge, car ce sont souvent les plus défavorables.",
  },
  {
    question: "Et si le CCAP renvoie à des conditions générales ?",
    answer:
      "Signale-le au skill : il intégrera l’analyse des documents annexes (CCAG, CGV, CCAP-type) et te dira lesquels priment en cas de contradiction. C’est souvent là que se cachent les pénalités oubliées.",
  },
  {
    question: "Et si le CCAP est mal scanné ?",
    answer:
      "Claude lit la plupart des PDF, même scannés. Si la qualité est mauvaise, vérifie les articles critiques (pénalités, paiement, RG) sur le document d’origine et redemande à Claude de relire l’article précis.",
  },
  {
    question: "Public ou privé : faut-il deux skills ?",
    answer:
      "Pas forcément. Les 9 familles existent dans les deux. Précise dans le prompt que le skill adapte sa grille : CCAG Travaux et Code de la commande publique côté public, conditions générales et délais de paiement côté privé.",
  },
  {
    question: "Le skill peut-il comparer plusieurs CCAP ?",
    answer:
      "Oui, sur demande. Il produit un tableau comparatif de deux ou trois marchés sur les mêmes critères (pénalités, RG, paiement) pour arbitrer où concentrer tes moyens en période de forte activité.",
  },
  {
    question: "Mes données restent-elles confidentielles ?",
    answer:
      "Sur les plans professionnels, tes conversations ne servent pas à entraîner les modèles. Pour un cadre d’hébergement encadré (serveurs en Europe, traitement supervisé), c’est précisément ce que BeWork gère pour ses clients.",
  },
  {
    question: "Combien de temps avant qu’il soit fiable ?",
    answer:
      "Une à deux heures de réglage, puis quelques ajustements sur les trois premiers CCAP réels. Dès le premier marché où il repère une pénalité non plafonnée, il a payé son temps de mise au point.",
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

export default function TutoSkillAnalyseCcapBeworkPage() {
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
    numberOfPages: 10,
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
      { "@type": "HowToStep", name: "Activer la fonction Skills dans Claude" },
      { "@type": "HowToStep", name: "Rassembler ta matière" },
      { "@type": "HowToStep", name: "Lancer la conversation avec Claude" },
      { "@type": "HowToStep", name: "Affiner et activer ton skill" },
      { "@type": "HowToStep", name: "Tester sur un vrai CCAP" },
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
              Tuto PDF gratuit · Analyse de CCAP · BeWork
            </p>
            <h1 className="font-heading mt-3 text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-[2.35rem] md:leading-tight">
              {H1}
            </h1>
            <p className="mt-4 max-w-none text-lg leading-relaxed text-slate-600 sm:text-[1.125rem] sm:leading-[1.7]">
              Le tutoriel pas à pas pour décrypter un CCAP et repérer les clauses à risque — 20&nbsp;minutes au lieu de
              3&nbsp;heures. PDF · 10 pages · prompts inclus.
            </p>
            <p className="mt-3 max-w-xl text-[0.9375rem] leading-relaxed text-slate-600">
              Complément méthodo : voir aussi le{" "}
              <Link
                href="/ressources/tuto-skill-analyse-dce-bework"
                className="font-semibold text-[#1d4ed8] underline-offset-4 hover:underline"
              >
                tuto skill analyse de DCE
              </Link>{" "}
              et l&apos;{" "}
              <Link
                href="/ressources/tuto-skill-analyse-express-cctp-bework"
                className="font-semibold text-[#1d4ed8] underline-offset-4 hover:underline"
              >
                analyse express CCTP
              </Link>{" "}
              — ici on cible spécifiquement le <strong className="font-semibold text-slate-800">CCAP</strong>.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <CalendlyBookingLink className="inline-flex min-h-[3rem] shrink-0 items-center justify-center rounded-xl bg-[#1d4ed8] px-7 text-[0.9375rem] font-semibold text-white shadow-md shadow-[#1d4ed8]/25 transition hover:bg-[#1e40af] md:text-base">
                Réservez un appel
              </CalendlyBookingLink>
              <span className="text-sm leading-snug text-slate-600 sm:max-w-sm">
                20&nbsp;minutes pour cadrer votre analyse CCAP ou une assistance travaux — sans engagement.
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
              Consultez le guide dans sa mise en page originale. Vous pouvez l&apos;agrandir ou le télécharger. PDF · 10
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
                title="Crée ton skill — Analyse de CCAP — PDF BeWork"
              />
            </div>
          </section>

          <aside
            className="mb-14 rounded-2xl border border-[#1d4ed8]/22 bg-gradient-to-br from-[#eff6ff] to-white p-6 shadow-sm shadow-[#1d4ed8]/06 sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-8"
            aria-label="Réserver un appel découverte"
          >
            <div className="min-w-0 sm:flex-1">
              <p className="text-base font-semibold text-slate-900 md:text-[1.05rem]">
                CCAP de 40 pages à digérer avant la remise d&apos;offre&nbsp;?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 md:text-[0.9375rem]">
                BeWork décortique le CCAP, liste les clauses à risque et prépare vos questions de mise au point — vous
                gardez la décision Go / No Go.
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
              <p className="mt-3 text-center text-xl font-semibold text-slate-900">Analyse de CCAP</p>
              <p className="mt-2 text-center text-base text-slate-700 md:text-[1.05rem]">
                Le tutoriel pas à pas pour décrypter un CCAP et repérer les clauses à risque — 20&nbsp;minutes au lieu de
                3&nbsp;heures.
              </p>

              <h4 className="mt-14 text-xs font-semibold uppercase tracking-[0.2em] text-slate-800">Ce que tu vas apprendre</h4>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Construire un skill Claude qui lit un CCAP et en extrait les clauses qui engagent votre marge</li>
                <li>▸ Repérer délais, pénalités, retenue de garantie, révision de prix et délais de paiement</li>
                <li>▸ Obtenir une fiche de synthèse claire avec les points de vigilance avant de répondre ou de signer</li>
                <li>▸ Préparer vos questions de mise au point sans relire 40 pages de clauses juridiques</li>
              </ul>

              <h3 className="mt-14 text-xl font-semibold tracking-tight text-slate-900">Pourquoi un skill Analyse CCAP&nbsp;?</h3>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-slate-900">
                Le CCAP — Cahier des Clauses Administratives Particulières — est le cœur contractuel d&apos;un marché.
                Pendant que tout le monde se concentre sur le CCTP (la technique) et la DPGF (les prix), c&apos;est le
                CCAP qui fixe ce à quoi vous vous engagez vraiment&nbsp;: délais, pénalités, retenue de garantie,
                modalités et délais de paiement, révision des prix, conditions de réception, assurances, cas de
                résiliation.
              </p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Lire un CCAP de 30 à 50 pages prend 2 à 3 heures, et l&apos;essentiel se cache toujours dans 8 ou 10
                articles que l&apos;on survole sous la pression du délai de remise. Avec un skill bien construit, la
                lecture devient exhaustive, les pièges sont chiffrés, et chaque clause sensible est notée vert / orange /
                rouge selon le risque pour votre trésorerie.
              </p>
              <p className="mt-6 text-[1.0625rem] font-medium text-slate-900">
                Vous ne signez plus jamais sans savoir ce que le CCAP vous coûtera vraiment.
              </p>

              <h3 className="mt-14 text-xl font-semibold tracking-tight text-slate-900">
                Ce qu&apos;une mauvaise lecture du CCAP coûte
              </h3>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-slate-900">
                Sur un marché de second œuvre à 250&nbsp;000&nbsp;€&nbsp;HT avec 8&nbsp;% de marge prévisionnelle
                (20&nbsp;000&nbsp;€), quatre clauses lues trop vite peuvent tout changer&nbsp;: pénalités non plafonnées,
                retenue de garantie immobilisée, délai de paiement allongé, révision absente. Sans même un litige, la
                marge peut passer de 8&nbsp;% à 2 ou 3&nbsp;%. Le prix affiché dans la DPGF n&apos;a pas bougé&nbsp;:
                c&apos;est le CCAP qui a tout changé.
              </p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                <strong className="font-semibold">Le réflexe à retenir</strong> — Une marge ne se calcule jamais sur la
                DPGF seule. Elle se calcule DPGF + clauses du CCAP.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">1 </span>
                Active la fonction Skills dans Claude
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Clique sur ton avatar → «&nbsp;Personnaliser&nbsp;» → onglet «&nbsp;Compétences&nbsp;» → bouton «&nbsp;+&nbsp;»
                → «&nbsp;Créer une compétence&nbsp;». Active aussi «&nbsp;Exécution de code&nbsp;» dans le même menu&nbsp;:
                sans elle, Claude ne pourra pas te livrer la fiche en Word ou PDF. Le plan Pro (~18&nbsp;€&nbsp;HT/mois)
                reste recommandé pour un usage professionnel quotidien.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">2 </span>
                Rassemble ta matière
              </h3>
              <ul className="mt-6 list-none space-y-3 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Vos 2 ou 3 derniers CCAP analysés (idéalement annotés)</li>
                <li>▸ Votre nomenclature des clauses à surveiller et vos seuils internes</li>
                <li>▸ Votre historique de pénalités ou litiges</li>
                <li>▸ Vos contraintes propres (trésorerie, marge mini, assurances)</li>
                <li>▸ Votre trame de fiche d&apos;analyse (tableau, fiche Go/No Go)</li>
              </ul>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">3 </span>
                Lance la conversation avec Claude
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Ouvre la création de compétence et colle ce prompt. Adapte les éléments entre crochets. Plus tu es précis
                sur tes seuils et tes pièges récurrents, plus le skill sera tranchant.
              </p>
              <PromptBlock label="PROMPT À COPIER — CRÉATION DU SKILL" promptText={PROMPT_CALIBRATION_TEXT} />
              <p className="mt-8 text-xl font-semibold uppercase tracking-wide text-slate-900">Le point clé</p>
              <p className="mt-4 text-[1.0625rem] leading-relaxed text-slate-900">
                Donne tes seuils chiffrés (pénalité acceptable, délai de paiement maxi, RG tolérée). C&apos;est ce qui
                transforme un résumé poli en outil de décision&nbsp;: le skill ne se contente plus de lire, il juge selon
                TES règles.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">4 </span>
                Affine et active ton skill
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Avant d&apos;enregistrer, vérifie sur un CCAP test&nbsp;: les 9 familles sont repérées, l&apos;impact est
                chiffré (montant ou jours), le code VERT / ORANGE / ROUGE colle à tes seuils, et les clauses manquantes
                sont signalées.
              </p>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Exemple d&apos;ajustement</p>
              <PromptBlock label="EXEMPLE D&apos;AJUSTEMENT" promptText={PROMPT_EXEMPLE_AJUSTEMENT_TEXT} />

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">5 </span>
                Teste sur un vrai CCAP
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Dépose le CCAP (idéalement avec le RC et le CCTP), lance le skill, confronte chaque alerte ROUGE à ta
                connaissance du chantier, envoie les questions de mise au point avant la date limite, et classe la fiche
                dans ton dossier.
              </p>
              <PromptBlock label="PROMPT — UTILISATION QUOTIDIENNE" promptText={PROMPT_USAGE_QUOTIDIEN_TEXT} />
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">La règle d&apos;or</p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Le skill éclaire, il ne décide pas à ta place. Il te fait gagner 2 à 3 heures de lecture et t&apos;évite
                une clause coûteuse. La décision Go / No Go et la signature restent toujours de ta responsabilité.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">FAQ — Analyse CCAP</h3>
              {FAQ_FOR_JSON_LD.map((q) => (
                <div key={q.question} className="mt-10 border-t border-slate-100 pt-10 first:mt-8 first:border-t-0 first:pt-0">
                  <h4 className="text-[1.05rem] font-semibold text-slate-900">{q.question}</h4>
                  <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">{q.answer}</p>
                </div>
              ))}

              <p className="mt-14 text-xl font-semibold uppercase tracking-wide text-slate-900">
                Pas le temps de le faire vous-même&nbsp;?
              </p>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">
                Faire appel à un Assistant Travaux BeWork
              </p>
              <p className="mt-3 text-[1.0625rem] font-medium text-slate-800">
                Assistant travaux BTP · Relais dossiers chantier · Augmenté par l&apos;IA
              </p>
              <p className="mt-10 text-2xl font-bold uppercase tracking-tight text-slate-900">
                ON TIENT LE BUREAU, VOUS TENEZ LE CHANTIER
              </p>
              <ul className="mt-6 list-none space-y-3 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Vous nous envoyez le DCE complet (CCAP, CCTP, RC) dès réception de la consultation</li>
                <li>▸ On décortique le CCAP, on liste les clauses à risque et on prépare vos questions de mise au point</li>
                <li>▸ Vous décidez de répondre ou non en connaissant tous les pièges, sans relire 40 pages vous-même</li>
              </ul>
              <p className="mt-10 text-[1.0625rem] font-semibold text-slate-900">
                Réservez un appel de cadrage de 20&nbsp;minutes sur{" "}
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
