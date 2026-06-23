import { getTutoPageDescription, tutoPageMetadata } from "@/lib/seo-tuto-metadata";
import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { CopyPromptButton } from "@/components/ressources/CopyPromptButton";
import { buildWebPageAndBreadcrumbJsonLd } from "@/lib/seo-landing-json-ld";
import { absoluteUrl, SITE_URL } from "@/lib/site";

const pagePath = "/ressources/tuto-skill-ordre-de-service-bework";

const pageUrl = absoluteUrl(pagePath);

const pdfPath = "/ressources/pdf/tuto-skill-ordre-de-service-bework.pdf";

const PROMPT_CALIBRATION_TEXT = `Je veux que tu m'aides à créer un skill Claude qui s'appelle
"traitement-ordre-de-service".

Mon métier : [GO / second oeuvre / TCE / lot spécifique]
Mes marchés : [public / privé / mixte]
Effectif : [X] salariés
Référence légale principale : CCAG Travaux 2021, article 3.8
(en marché privé : NF P 03-001 + CCAP du chantier)
Seuil de réserves systématique : à partir de [X] EUR HT de plus-value
Marge cible sur travaux supplémentaires : [X] %
Délai cible de réponse : 10 jours ouvrés (avant forclusion à 15)

À chaque OS que je te transmettrai, tu produiras :
1. Le résumé des modifications par rapport au marché initial
2. La liste des postes générant une plus-value ou un impact planning
3. Un courrier de réserves prêt à signer, conforme CCAG Travaux
4. Un chiffrage fourchette basse / haute avec impact planning en jours
5. La date butoir d'envoi du courrier (notification + 15 j)

Voici les fichiers que je te transmets :
[joindre 2-3 OS récents + CCAP/CCTP/BPU + modèle de courrier]

Crée le skill, propose-moi la structure avant de coder, et explique-moi
en français comment je l'utiliserai au quotidien.`;

const PROMPT_USAGE_QUOTIDIEN_TEXT = `/traitement-ordre-de-service

Chantier : [nom — Maître d'ouvrage]
Marché : [n° marché + lot]
Date de notification de l'OS : [JJ/MM/AAAA]
Date de réception physique : [JJ/MM/AAAA]
Mode de réception : [mail / courrier RAR / plateforme MOE]

[joindre OS reçu + CCAP/CCTP de référence]

Sors-moi :
1. Le résumé des modifications par rapport au marché initial
2. Le courrier de réserves prêt à envoyer
3. Le chiffrage fourchette basse / haute avec impact planning
4. La date butoir d'envoi du courrier (notification + 15 j)`;

const PROMPT_EXEMPLE_AJUSTEMENT_TEXT = `Modifie le skill : sur ce test :
- Le courrier ne cite pas la date de notification de l'OS
- Le chiffrage propose un prix unique, pas de fourchette
- Aucune demande de réunion de cadrage sous 8 jours
Corrige ces 3 points et regénère le skill.`;

const H1 = "Crée ton skill — Ordre de Service";


const breadcrumbItems = [
  { name: "Accueil", href: "/" },
  { name: "Ressources", href: "/ressources" },
  { name: H1, href: pagePath },
] as const;

const FAQ_FOR_JSON_LD = [
  {
    question: "Combien de temps pour créer le skill complet ?",
    answer:
      "Compte 1h à 1h30 pour la première création : 30 min pour rassembler la matière (OS, marchés, modèle courrier), 30 min de cadrage avec Claude, 15 min d'ajustement et un premier test. Les OS suivants sont traités en 5 à 10 minutes chacun. Tu rentabilises l'investissement dès le deuxième OS.",
  },
  {
    question: "Le skill remplace-t-il le conducteur de travaux ?",
    answer:
      "Non. Claude rédige le courrier et chiffre la plus-value, mais c'est toi qui valides, signes et envoies. La traçabilité juridique et la responsabilité contractuelle restent les tiennes. Le skill te fait gagner 70 % du temps de rédaction et garantit que rien n'est oublié — l'arbitrage reste humain.",
  },
  {
    question: "Que faire si l'OS reçu n'a aucun chiffre ?",
    answer:
      "C'est le piège classique. Le skill détectera la modification technique et te proposera une fourchette de chiffrage basée sur ton métier et des déboursés moyens. Tu corriges ensuite avec tes propres prix d'études. Un OS sans chiffre n'est jamais neutre — il y a toujours un impact à formaliser.",
  },
  {
    question: "Et si je suis en marché privé, pas en marché public ?",
    answer:
      "Le squelette reste valable. Remplace « CCAG Travaux 2021 » par « norme NF P 03-001 » dans le prompt principal et précise ton CCAP. Le délai de contestation peut différer — certains CCAP privés imposent 8 jours au lieu de 15. Vérifie chantier par chantier.",
  },
  {
    question: "Comment être certain que le délai de 15 jours est respecté ?",
    answer:
      "Le délai court à compter de la notification, pas de la signature. Notification = réception du courrier, du mail ou de la mise à disposition sur la plateforme du MOE. Demande à Claude de te calculer systématiquement la date butoir d'envoi dans le résumé de l'OS, et bloque-toi un rappel agenda à J-3.",
  },
  {
    question: "Et si le maître d'œuvre refuse mes réserves ?",
    answer:
      "Tu maintiens tes réserves par un second courrier RAR sous 15 jours après le refus, en demandant une réunion de cadrage formelle. Si le MOE persiste, tu enclenches la procédure du CCAG (mémoire en réclamation puis saisine du comité consultatif de règlement amiable). Demande à Claude de te rédiger le second courrier — il connaît la mécanique.",
  },
  {
    question: "L'OS modifie le planning sans plus-value financière — il faut quand même réserver ?",
    answer:
      "Oui, et c'est même critique. Un OS qui décale le planning sans contrepartie te fait porter un préjudice : main d'œuvre immobilisée, location matériel allongée, pénalités de retard potentielles. Le skill chiffre l'impact en jours ouvrés et te génère un courrier de réserves spécifique « décalage de délai sans incidence financière annoncée ».",
  },
  {
    question: "Et si je n'ai pas le temps de mettre tout ça en place ?",
    answer:
      "C'est la raison d'être de BeWork. Tu nous transmets l'OS reçu dès sa notification, on te livre l'analyse + le courrier de réserves + le chiffrage sous 48 h. Tu gardes la main sur la validation et la signature, on fait le déblayage rédactionnel et le calcul du délai.",
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

export default function TutoSkillOrdreDeServiceBeworkPage() {
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
      { "@type": "HowToStep", name: "Activer la fonction Skills" },
      { "@type": "HowToStep", name: "Rassembler ta matière" },
      { "@type": "HowToStep", name: "Lancer la conversation avec Claude" },
      { "@type": "HowToStep", name: "Affine et active ton skill" },
      { "@type": "HowToStep", name: "Teste sur un vrai Ordre de Service" },
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
              Tuto PDF gratuit · Ordre de Service · Claude &amp; skills · BeWork
            </p>
            <h1 className="font-heading mt-3 text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-[2.35rem] md:leading-tight">
              {H1}
            </h1>
            <p className="mt-4 max-w-none text-lg leading-relaxed text-slate-600 sm:text-[1.125rem] sm:leading-[1.7]">
              Tutoriel PDF — ordre de service avec l&apos;IA (Claude &amp; skills)&nbsp;: décortiquer, contester et chiffrer un OS en 5
              minutes au lieu d&apos;une après-midi. PDF consultable en ligne, texte intégral et prompts prêts à coller.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <CalendlyBookingLink className="inline-flex min-h-[3rem] shrink-0 items-center justify-center rounded-xl bg-[#1d4ed8] px-7 text-[0.9375rem] font-semibold text-white shadow-md shadow-[#1d4ed8]/25 transition hover:bg-[#1e40af] md:text-base">
                Réservez un appel
              </CalendlyBookingLink>
              <span className="text-sm leading-snug text-slate-600 sm:max-w-sm">
                20&nbsp;minutes pour cadrer votre besoin (OS, plus-values, assistance travaux BTP) — sans engagement.
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
                title="Crée ton skill — Ordre de Service — PDF BeWork"
              />
            </div>
          </section>

          <aside
            className="mb-14 rounded-2xl border border-[#1d4ed8]/22 bg-gradient-to-br from-[#eff6ff] to-white p-6 shadow-sm shadow-[#1d4ed8]/06 sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-8"
            aria-label="Réserver un appel découverte"
          >
            <div className="min-w-0 sm:flex-1">
              <p className="text-base font-semibold text-slate-900 md:text-[1.05rem]">
                Besoin d&apos;une assistance sur vos ordres de service&nbsp;?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 md:text-[0.9375rem]">
                Parlez-en avec BeWork pendant un créneau de 20&nbsp;minutes : analyse, réserves CCAG et chiffrage sous 48&nbsp;h.
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
              <p className="mt-3 text-center text-xl font-semibold text-slate-900">Ordre de Service</p>
              <p className="mt-2 text-center text-base text-slate-700 md:text-[1.05rem]">
                Le tutoriel pas à pas pour décortiquer, contester et chiffrer un OS — 5 minutes au lieu d&apos;une après-midi.
              </p>

              <h4 className="mt-14 text-xs font-semibold uppercase tracking-[0.2em] text-slate-800">Ce que tu vas apprendre</h4>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Décortiquer un OS reçu en 2 minutes, écart par écart avec ton marché initial</li>
                <li>▸ Rédiger un courrier de réserves conforme CCAG Travaux, prêt à signer</li>
                <li>▸ Chiffrer la plus-value avec déboursé sec + fourchette + impact planning</li>
                <li>▸ Tenir systématiquement le délai de 15 jours après notification</li>
              </ul>

              <h3 className="mt-14 text-xl font-semibold tracking-tight text-slate-900">Pourquoi un skill Ordre de Service ?</h3>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-slate-900">
                L&apos;OS — Ordre de Service — c&apos;est le document par lequel le maître d&apos;œuvre ou le maître d&apos;ouvrage prescrit toute
                modification, instruction ou décision qui s&apos;impose à l&apos;entrepreneur dans l&apos;exécution du marché. Sans réaction de ta
                part dans les 15 jours suivant sa notification, il vaut acceptation tacite. Y compris quand l&apos;OS modifie le marché sans
                contrepartie financière annoncée.
              </p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Sur les chantiers de bâtiment, 60 à 70&nbsp;% des plus-values acceptables ne sont jamais facturées. Une seule cause
                derrière&nbsp;: un OS signé sans réserves, sans chiffrage, sans courrier dans les 15 jours. À la clé&nbsp;: des dizaines de
                milliers d&apos;euros de marge perdue par chantier.
              </p>

              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Avec un skill bien construit, voilà ce qui change</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Tu identifies en 2 minutes toutes les modifications par rapport au marché initial.</li>
                <li>▸ Tu génères un courrier de réserves conforme CCAG Travaux, prêt à signer.</li>
                <li>▸ Tu chiffres la plus-value avec déboursé sec, fourchette basse/haute et impact planning.</li>
                <li>▸ Tu n&apos;es plus jamais hors délai sur les 15 jours après notification.</li>
                <li>▸ Tu construis un historique réutilisable d&apos;OS, classés par chantier et par MOE.</li>
              </ul>
              <p className="mt-10 text-[1.0625rem] leading-relaxed text-slate-900">
                Un OS traité dans les règles, c&apos;est 5 à 25&nbsp;K€ de marge sécurisée par chantier — et plus aucun courrier oublié dans le
                brouhaha du terrain.
              </p>

              <p className="mt-10 rounded-xl border border-amber-200/80 bg-amber-50/60 px-4 py-3 text-[1.0625rem] leading-relaxed text-slate-900">
                <strong className="font-semibold text-slate-900">Obligation légale —</strong> Le traitement de l&apos;OS est encadré par le
                CCAG Travaux 2021 (article 3.8). Le délai de contestation court 15 jours après la notification — pas après la signature.
                Au-delà&nbsp;: l&apos;OS est réputé accepté sans réserves, et toute plus-value devient juridiquement irrécupérable (forclusion).
              </p>

              <h3 className="mt-14 text-xl font-semibold uppercase tracking-wide text-slate-900">Les 4 blocs à couvrir dans un traitement d&apos;OS</h3>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>
                  <strong>Analyse</strong> — Écarts au marché, modifications listées, postes identifiés.
                </li>
                <li>
                  <strong>Réserves</strong> — Courrier CCAG, lettre conforme art.&nbsp;3.8, prête à signer.
                </li>
                <li>
                  <strong>Chiffrage</strong> — Plus-value &amp; planning, fourchette basse/haute + impact en jours.
                </li>
                <li>
                  <strong>Délai</strong> — Date butoir calculée (notification + 15&nbsp;j), recommandé envoyé.
                </li>
              </ul>

              <p className="mt-10 text-[1.0625rem] leading-relaxed text-slate-900">
                <strong className="font-semibold">Cas concret —</strong> Sur un chantier de gros œuvre en Île-de-France, un patron reçoit un OS
                «&nbsp;modification de la profondeur des fondations, +30&nbsp;cm&nbsp;». Pas de chiffre dans l&apos;OS. Il signe entre deux chantiers,
                sans réserves. Trois mois plus tard, il envoie sa plus-value&nbsp;: 22&nbsp;000&nbsp;€. Refusée. Forclos sur le délai de 15 jours. Un skill
                bien construit aurait sorti l&apos;analyse + le courrier de réserves en 5 minutes.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">1 </span>
                Active la fonction Skills
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Claude Pro à 18&nbsp;€/mois — indispensable pour les skills. Dans Settings → Capabilities, coche Code execution, Skills et File
                creation. Un petit ⚙ apparaît sous la zone de message.
              </p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Si tu ne vois pas la section Skills&nbsp;: vérifie Claude Sonnet 4.5 ou Opus 4.5 en haut de fenêtre. Déconnecte-toi et
                reconnecte-toi si l&apos;onglet Capabilities est absent.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">2 </span>
                Rassemble ta matière
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Un skill performant repose sur tes vraies données&nbsp;: OS variés, marchés actifs (CCAP, CCTP, BPU), organigramme administratif,
                règles internes de plus-value et modèle de courrier de réserves.
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">Réflexe pro — anonymisation</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Avant d&apos;uploader des OS récents, anonymise noms MOE/MOA, conditions financières confidentielles et références nominatives. Le
                contenu utile au skill, c&apos;est la structure et la mécanique.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">3 </span>
                Lance la conversation avec Claude
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Ouvre une nouvelle conversation, joins tes fichiers, colle le prompt ci-dessous. Claude propose une structure — tu valides
                avant qu&apos;il code le skill.
              </p>
              <PromptBlock label="PROMPT À COLLER DANS CLAUDE" promptText={PROMPT_CALIBRATION_TEXT} />
              <p className="mt-8 text-xl font-semibold uppercase tracking-wide text-slate-900">Le point clé</p>
              <p className="mt-4 text-[1.0625rem] leading-relaxed text-slate-900">
                Ne saute pas l&apos;étape «&nbsp;propose-moi la structure avant de coder&nbsp;». Compte 15 minutes de discussion — tu gagneras des
                heures sur chaque OS futur.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">4 </span>
                Affine et active ton skill
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Passe la sortie au filtre métier&nbsp;: courrier que tu signerais en confiance&nbsp;? Vérifie analyse écart par écart, CCAG art.&nbsp;3.8,
                fourchette de chiffrage, impact planning en jours ouvrés, date butoir notification + 15&nbsp;j, ton factuel.
              </p>
              <PromptBlock label="EXEMPLE D&apos;AJUSTEMENT" promptText={PROMPT_EXEMPLE_AJUSTEMENT_TEXT} />
              <p className="mt-8 text-[1.0625rem] leading-relaxed text-slate-900">
                Une fois validé&nbsp;: «&nbsp;Active maintenant le skill&nbsp;». Invoque-le avec{" "}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">/traitement-ordre-de-service</code>.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">5 </span>
                Teste sur un vrai Ordre de Service
              </h3>
              <ul className="mt-6 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Réceptionne l&apos;OS (mail, courrier ou plateforme MOE).</li>
                <li>▸ Colle le contenu ou téléverse le PDF dans le skill.</li>
                <li>▸ Vérifie l&apos;extraction des modifications — corrige si besoin.</li>
                <li>▸ Récupère le courrier, fais relire, signe, envoie en recommandé sous 10 jours.</li>
              </ul>
              <PromptBlock label="PROMPT — UTILISATION QUOTIDIENNE" promptText={PROMPT_USAGE_QUOTIDIEN_TEXT} />
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">La règle d&apos;or</p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Ne signe jamais un OS sans avoir passé l&apos;analyse de Claude. Même un OS qui paraît anodin peut cacher une modification qui
                pèse 5&nbsp;% du marché.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">Questions fréquentes</h3>
              {FAQ_FOR_JSON_LD.map((item, i) => (
                <div key={item.question} className={i === 0 ? "mt-8" : "mt-10"}>
                  <h4 className="text-[1.05rem] font-semibold text-slate-900">{item.question}</h4>
                  <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">{item.answer}</p>
                </div>
              ))}

              <p className="mt-14 text-xl font-semibold uppercase tracking-wide text-slate-900">
                Pas le temps de le faire vous-même ?
              </p>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Faire appel à un Assistant Travaux BeWork</p>
              <p className="mt-3 text-[1.0625rem] font-medium text-slate-800">
                Assistant travaux BTP · Relais dossiers chantier · Augmenté par l&apos;IA
              </p>
              <p className="mt-10 text-2xl font-bold uppercase tracking-tight text-slate-900">
                ON TIENT LE BUREAU, VOUS TENEZ LE CHANTIER
              </p>
              <ul className="mt-6 list-none space-y-3 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Vous nous transférez l&apos;OS reçu, dès sa notification</li>
                <li>▸ On décortique, on rédige le courrier, on chiffre la plus-value sous 48&nbsp;h</li>
                <li>▸ Vous validez, vous signez — le délai de 15 jours est tenu sans y penser</li>
              </ul>
              <p className="mt-10 text-[1.0625rem] font-semibold text-slate-900">
                Réservez un appel de cadrage de 20 minutes sur{" "}
                <Link href={SITE_URL} className="text-[#1d4ed8] underline underline-offset-4 hover:no-underline">
                  bework.fr
                </Link>
              </p>

              <div className="mt-14 grid gap-10 border-t border-slate-100 pt-10 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <div className="text-3xl font-extrabold leading-tight text-[#1d4ed8] sm:text-4xl">48 H</div>
                  <div className="mt-2 text-xl font-bold uppercase tracking-wide text-slate-900">DÉLAI LIVRAISON</div>
                </div>
                <div>
                  <div className="text-5xl font-extrabold text-[#1d4ed8]">0</div>
                  <div className="mt-2 text-xl font-bold uppercase tracking-wide text-slate-900">RECRUTEMENT</div>
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
