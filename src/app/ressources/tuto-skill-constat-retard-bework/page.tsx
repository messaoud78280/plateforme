import type { Metadata } from "next";
import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { CopyPromptButton } from "@/components/ressources/CopyPromptButton";
import { buildWebPageAndBreadcrumbJsonLd } from "@/lib/seo-landing-json-ld";
import { absoluteUrl, SITE_URL } from "@/lib/site";

const pagePath = "/ressources/tuto-skill-constat-retard-bework";

const pageUrl = absoluteUrl(pagePath);

const pdfPath = "/ressources/pdf/tuto-skill-constat-retard-bework.pdf";

const PROMPT_CALIBRATION_TEXT = `Je veux que tu créés un skill personnalisé pour générer mes
constats de retard de chantier en LRAR.
Contexte :
- Je suis [conducteur de travaux / dirigeant] chez [TON ENTREPRISE]
- Métier : [maçonnerie / second œuvre / multi-lots / etc.]
- Marchés : [privés / publics / mixtes]
- Volume : 20 à 40 constats par an
- Sortie : Word .docx, A4 portrait, 1 à 2 pages
Je t'ai uploadé : 3 derniers constats acceptés, mes clauses CCAP
et CCAG type, le référentiel CIBTP, mes coordonnées MOA/MOE
récurrents et mon template courrier.
Construis un skill qui :
1. Accepte la description du fait constaté en 3 à 5 lignes
2. Identifie automatiquement le type de retard (intempéries /
défaut MOA / coactivité / autre)
3. Cite la bonne référence contractuelle (CCAG art. 19, CCAP,
référentiel CIBTP, art. 1218 Code civil)
4. Chiffre la conséquence en jours ouvrés d'arrêt
5. Formule la demande de prolongation de délai
6. Génère le courrier au format LRAR avec mention « lettre
recommandée avec accusé de réception »
7. Respecte ma charte graphique d'entreprise
Avant de générer, pose-moi 5 à 10 questions de calibrage.`;

const PROMPT_USAGE_QUOTIDIEN_TEXT = `Active le skill constat-retard.
Contexte du chantier :
- Marché : [NOM]
- MOA : [NOM] / MOE : [NOM]
- Lot concerné : [NUMÉRO + INTITULÉ]
- Date du fait constaté : [JJ/MM/AAAA]
- Heure constatation : [HH:MM]
Description du fait :
[3 à 5 lignes : qui, quoi, où, conséquence sur les travaux]
Type de retard : [intempéries / défaut MOA / coactivité / autre]
Conséquence estimée : [N jours ouvrés d'arrêt]
Génère le constat en LRAR conforme aux 7 éléments. Si infos
manquantes, pose-moi les questions en bloc compact.`;

const PROMPT_EXEMPLE_AJUSTEMENT_TEXT = `Le brouillon est bien mais 3 points à corriger :
1. Pour les retards liés à la coactivité (autres entreprises),
ajoute systématiquement une copie au coordonnateur OPC s'il
y en a un sur le chantier
2. Pour les intempéries, cite précisément les seuils CIBTP
dépassés (ex : « plus de 5 mm de pluie cumulée sur 24h »
pour le gros œuvre)
3. En fin de courrier, ajoute une formule type :
« À défaut de réponse de votre part dans les 15 jours,
nous considérerons que la prolongation de délai sollicitée
est acquise tacitement »
Régénère le skill avec ces ajustements et propose-moi un nouveau
constat test sur le même cas fictif.`;

const H1 = "Crée ton skill — Constat de retard";

const META_DESCRIPTION =
  "Tutoriel BeWork gratuit : skill Claude pour constats de retard chantier — 7 éléments, CCAG art.19, LRAR .docx, prolongation délai, prompts.";

const breadcrumbItems = [
  { name: "Accueil", href: "/" },
  { name: "Ressources", href: "/ressources" },
  { name: H1, href: pagePath },
] as const;

const FAQ_FOR_JSON_LD = [
  {
    question: "Le constat généré a-t-il une valeur juridique ?",
    answer:
      "Oui, exactement la même que celui que tu rédigerais à la main. La valeur juridique d'un constat de retard vient de sa rédaction circonstanciée, de ses références contractuelles précises, de l'envoi en LRAR avec accusé de réception et du respect des délais contractuels (généralement 5 à 8 jours suivant le fait constaté). L'outil utilisé pour le produire est sans incidence sur sa force probante. Word ou IA : c'est ta signature, l'horodatage du fait et la traçabilité de l'envoi qui comptent.",
  },
  {
    question: "Et si le MOA refuse la prolongation de délai ?",
    answer:
      "Le refus doit être motivé par écrit dans le délai contractuel (souvent 15 jours). Si le refus est non motivé ou hors délais, la prolongation est tacitement acquise — d'où l'importance de la formule type en fin de courrier. Si le refus est motivé mais que tu le contestes, tu peux demander une réunion contradictoire, saisir le médiateur du marché, ou en dernier recours engager une action en justice avec constat d'huissier antérieur si tu en as un.",
  },
  {
    question: "Quels sont les seuils CIBTP pour les intempéries ?",
    answer:
      "Les seuils dépendent de l'activité. Exemples : pluie cumulée > 5 mm sur 24h pour le gros œuvre, gel à 0 °C pour le terrassement, vent > 50 km/h pour la couverture, neige au sol > 1 cm pour la peinture extérieure. Le référentiel complet est disponible sur le site CIBTP. Pour qu'un jour soit indemnisé, il faut qu'il soit déclaré dans les 30 jours auprès de la caisse CIBTP avec relevé météo officiel à l'appui.",
  },
  {
    question: "Faut-il toujours envoyer en LRAR ou un mail suffit ?",
    answer:
      "LRAR pour les marchés publics et les marchés privés à enjeux. Le mail peut compléter (envoi simultané pour information rapide), mais ne remplace pas la LRAR pour la valeur probante. Pour les petits chantiers et les MOA récurrents avec qui la relation est fluide, certains se contentent de mails datés horodatés — c'est risqué en cas de désaccord ultérieur. Règle simple : LRAR dès qu'il y a un risque de pénalité réel.",
  },
  {
    question: "Mes données chantier sont-elles confidentielles ?",
    answer:
      "Anthropic (l'éditeur de Claude) ne réutilise pas le contenu de tes conversations Pro et Team pour entraîner ses modèles. Tes constats, références chantier et noms de MOA restent associés à ton compte et sont supprimables à tout moment. Pour les chantiers ultra-sensibles (sites classés défense, OIV), travaille avec des références anonymisées dans le prompt — c'est une pratique de prudence raisonnable.",
  },
  {
    question: "Que faire si le retard est partiellement de ma faute ?",
    answer:
      "Honnêteté avant tout. Tu décris le fait extérieur réel et tu reconnais ta part. Exemple : « 3 jours d'intempéries gel + 2 jours d'absence de mon compagnon → demande de prolongation de 3 jours ouvrés ». Un MOA professionnel respecte cette honnêteté et accorde la part justifiée. Cacher une part de responsabilité, c'est s'exposer à un refus global du constat et à une dégradation de la relation. Le skill peut formuler ça proprement sans te désavantager.",
  },
] as const;

export const metadata: Metadata = {
  title: "Crée ton skill — Constat de retard | BeWork",
  description: META_DESCRIPTION,
  alternates: {
    canonical: pageUrl,
    languages: { fr: pageUrl, "x-default": pageUrl },
  },
  openGraph: {
    type: "article",
    locale: "fr_FR",
    url: pageUrl,
    siteName: "BeWork",
    title: "Crée ton skill — Constat de retard | BeWork",
    description: META_DESCRIPTION,
    images: [{ url: absoluteUrl("/opengraph-image"), width: 1200, height: 630, alt: "Crée ton skill — Constat de retard — BeWork" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Crée ton skill — Constat de retard | BeWork",
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

export default function TutoSkillConstatRetardBeworkPage() {
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
    description: META_DESCRIPTION,
    step: [
      { "@type": "HowToStep", name: "Activer la fonction skills dans Claude" },
      { "@type": "HowToStep", name: "Rassembler ta matière première" },
      { "@type": "HowToStep", name: "Lancer la conversation avec Claude" },
      { "@type": "HowToStep", name: "Affiner et activer ton skill" },
      { "@type": "HowToStep", name: "Tester sur un vrai chantier" },
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
              Tuto PDF gratuit · Constat de retard · Claude · BeWork
            </p>
            <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-[2.35rem] md:leading-tight">
              {H1}
            </h1>
            <p className="mt-4 max-w-none text-lg leading-relaxed text-slate-600 sm:text-[1.125rem] sm:leading-[1.7]">
              Tutoriel BeWork pas à pas : formaliser un retard non imputable, viser une prolongation de délai et sécuriser l&apos;opposabilité (LRAR, délais) — PDF en ligne et prompts à copier.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <CalendlyBookingLink className="inline-flex min-h-[3rem] shrink-0 items-center justify-center rounded-xl bg-[#1d4ed8] px-7 text-[0.9375rem] font-semibold text-white shadow-md shadow-[#1d4ed8]/25 transition hover:bg-[#1e40af] md:text-base">
                Réservez un appel
              </CalendlyBookingLink>
              <span className="text-sm leading-snug text-slate-600 sm:max-w-sm">
                20&nbsp;minutes pour cadrer votre besoin (constats, planning, relais administratif BTP) — sans engagement.
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
                title="Crée ton skill — Constat de retard — PDF BeWork"
              />
            </div>
          </section>

          <aside
            className="mb-14 rounded-2xl border border-[#1d4ed8]/22 bg-gradient-to-br from-[#eff6ff] to-white p-6 shadow-sm shadow-[#1d4ed8]/06 sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-8"
            aria-label="Réserver un appel découverte"
          >
            <div className="min-w-0 sm:flex-1">
              <p className="text-base font-semibold text-slate-900 md:text-[1.05rem]">
                Besoin d&apos;un relais pour vos constats de retard et suivi prolongation MOA&nbsp;?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 md:text-[0.9375rem]">
                Parlez-en avec BeWork sur un créneau de 20&nbsp;minutes : mise en forme LRAR et calendrier d&apos;envoi.
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
              <p className="mt-3 text-center text-xl font-semibold text-slate-900">Constat de retard</p>
              <p className="mt-2 text-center text-base text-slate-700 md:text-[1.05rem]">
                Le tutoriel pas à pas pour acter un retard non imputable — 5 minutes au lieu de 45 minutes.
              </p>

              <h4 className="mt-14 text-xs font-semibold uppercase tracking-[0.2em] text-slate-800">Ce que tu vas apprendre</h4>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Activer la fonction skills dans Claude (5 minutes, 1 fois pour toutes)</li>
                <li>▸ Calibrer ton skill avec tes constats antérieurs et tes clauses contractuelles</li>
                <li>▸ Le prompt prêt à coller pour générer ton skill en 1 conversation</li>
                <li>▸ Le prompt quotidien pour transformer un fait terrain en LRAR opposable</li>
              </ul>

              <h3 className="mt-14 text-xl font-semibold tracking-tight text-slate-900">Pourquoi un skill constat de retard&nbsp;?</h3>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-slate-900">
                Le retard sur chantier, c&apos;est rarement de ta faute. Intempéries qui arrêtent le terrassement, validations MOA qui traînent 3 semaines,
                lot précédent qui prend du retard et bloque ton intervention, modifications en cours d&apos;exécution non anticipées au planning. Mais sans
                constat formalisé et envoyé en LRAR au MOA et MOE, c&apos;est toi qui paies. Pénalités contractuelles à 1/3 000ème ou 1/1 000ème par
                jour, parfois plus. Sur un chantier de 300 000 €, c&apos;est 100 à 300 € par jour de retard imputé.
              </p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Et pourtant, c&apos;est l&apos;un des actes administratifs les plus négligés. Pourquoi&nbsp;? Parce qu&apos;il est urgent (souvent à formaliser dans la
                semaine du fait constaté), parce qu&apos;il est juridique (références CCAG, articles du Code civil), parce qu&apos;il faut nommer le bon responsable
                sans se louper. Résultat : les conducteurs de travaux le repoussent, le MOA refuse la prolongation de délai par défaut de constat dans
                les délais, et l&apos;entreprise paie des pénalités qu&apos;elle aurait pu éviter.
              </p>

              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Avec un skill bien construit, voilà ce qui change</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Tu décris le fait en 3 lignes, le skill sort le constat en LRAR prêt à envoyer.</li>
                <li>▸ Les 7 éléments d&apos;un constat valable sont tous présents (sinon, refus garanti).</li>
                <li>▸ Les bonnes références contractuelles sont citées (CCAG art. 19, code civil 1218).</li>
                <li>▸ La demande de prolongation de délai est chiffrée et argumentée.</li>
                <li>▸ Tu passes de 45 minutes à 5 minutes. Sur 30 constats par an, c&apos;est 20 heures et zéro pénalité oubliée.</li>
              </ul>
              <p className="mt-8 text-[1.0625rem] leading-relaxed text-slate-900">
                Le skill ne constate pas à ta place. Il met en forme et sécurise juridiquement. Le fait constaté, sa réalité, son imputabilité réelle
                restent de ta responsabilité.
              </p>

              <h3 className="mt-14 text-xl font-semibold uppercase tracking-wide text-slate-900">Les 7 éléments d&apos;un constat de retard valable</h3>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-slate-900">
                (1) Identification du marché : MOA, MOE, n° de marché, lot. (2) Date et heure précises du fait constaté. (3) Description circonstanciée du
                fait (intempéries / défaut MOA / coactivité / autre). (4) Référence contractuelle invoquée (CCAG art. 19 ou clause CCAP). (5) Conséquence
                chiffrée sur le planning (jours d&apos;arrêt, postes impactés). (6) Demande explicite de prolongation de délai (en nombre de jours ouvrés). (7)
                Envoi en LRAR avec accusé de réception et copie MOE. Sans LRAR ou hors délais contractuels, le constat est inopposable.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">1 </span>
                Active la fonction skills dans Claude
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Pour faire tourner un skill personnalisé, tu as besoin d&apos;un abonnement Claude Pro à 18 €/mois. La fonction skills est désactivée par
                défaut, il faut l&apos;activer manuellement la première fois. C&apos;est rapide et tu ne le fais qu&apos;une fois.
              </p>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Le chemin précis</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Connecte-toi sur claude.ai avec ton compte Pro.</li>
                <li>▸ Clique sur ton avatar en bas à gauche, puis sur Settings.</li>
                <li>▸ Dans le menu de gauche, clique sur Capabilities.</li>
                <li>▸ Active le toggle « Code execution » (indispensable pour générer le .docx).</li>
                <li>▸ Active aussi les toggles « Skills » et « File creation » s&apos;ils ne le sont pas.</li>
              </ul>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Pourquoi c&apos;est indispensable</p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Sans Code execution, Claude ne peut pas générer un courrier .docx prêt à imprimer et à envoyer en LRAR. Pour un acte juridique
                opposable que tu dois envoyer dans les 5 à 8 jours du fait constaté, c&apos;est rédhibitoire — tu as besoin du fichier mis en forme avec en-tête
                société, signature et coordonnées MOA correctement renseignées.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">2 </span>
                Rassemble ta matière première
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Un constat de retard générique te sortira un courrier flou que le MOA contestera facilement. Pour qu&apos;il soit opposable et que la
                prolongation de délai soit accordée, il a besoin de tes données précises. Rassemble cette matière avant de lancer la conversation — 20
                minutes de préparation, des heures gagnées ensuite.
              </p>

              <p className="mt-10 text-[1.0625rem] font-semibold text-slate-900">1. Tes 2 ou 3 derniers constats acceptés par le MOA</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Le skill va calquer son ton, sa structure et son niveau de précision juridique sur ces exemples. Choisis si possible des constats qui ont
                effectivement abouti à une prolongation de délai accordée. Format PDF ou Word indifféremment.
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">2. Tes clauses CCAP et CCAG type</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Article 19 du CCAG-Travaux 2021 (prolongation de délai), clauses CCAP particulières sur les pénalités et les cas de force majeure. Si tu
                travailles surtout en marché privé, donne au skill tes conditions générales d&apos;intervention.
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">3. Le référentiel CIBTP intempéries</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Le tableau des seuils CIBTP par activité (gros œuvre, second œuvre, étanchéité, peinture extérieure) avec les conditions météo qui justifient
                l&apos;arrêt et l&apos;indemnisation. C&apos;est ton arme principale pour les constats météo — ne laisse pas le MOA contester.
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">4. Tes coordonnées types MOA / MOE</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Liste des MOA et MOE avec lesquels tu travailles régulièrement (raison sociale, adresse, contact LRAR). Le skill insérera automatiquement
                les bonnes coordonnées à chaque constat sans que tu les retapes à chaque fois.
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">5. Ton template de courrier société</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Si ton entreprise a un modèle Word officiel (en-tête avec logo, footer avec mentions, formules de politesse et signature), uploade-le. Le skill
                respectera ta charte sans que tu aies à reparamétrer à chaque LRAR.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">3 </span>
                Lance la conversation avec Claude
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Ouvre une nouvelle conversation sur claude.ai, uploade tous tes documents (constats acceptés, CCAP/CCAG, référentiel CIBTP,
                coordonnées, template), puis colle ce prompt directement.
              </p>
              <PromptBlock label="PROMPT À COLLER DANS CLAUDE" promptText={PROMPT_CALIBRATION_TEXT} />
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Le point clé</p>
              <p className="mt-4 text-[1.0625rem] leading-relaxed text-slate-900">
                Demande au skill de toujours horodater le fait constaté (date + heure) et d&apos;imposer un envoi sous 5 jours. Hors délais contractuels, le
                constat devient inopposable, même parfaitement rédigé. Le timing fait l&apos;opposabilité.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">4 </span>
                Affine et active ton skill
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Claude va te proposer un premier brouillon de skill. Ne valide pas tout de suite. Demande-lui de te montrer un constat test sur un cas fictif
                (par exemple : 3 jours d&apos;intempéries gel + neige sur chantier de gros œuvre), puis ajuste.
              </p>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Ce que tu dois vérifier</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Les 7 éléments du constat valable sont tous présents et dans le bon ordre.</li>
                <li>▸ La référence contractuelle citée correspond bien au type de retard (CCAG / CIBTP / Code civil).</li>
                <li>▸ Les coordonnées MOA + MOE sont correctement insérées (avec mention LRAR).</li>
                <li>▸ La conséquence est chiffrée en jours ouvrés (pas calendaires) sauf clause contraire.</li>
                <li>▸ La demande de prolongation est explicite et chiffrée.</li>
                <li>▸ Le ton reste professionnel et factuel — pas accusatoire, pas conflictuel.</li>
              </ul>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Ajustement type à demander</p>
              <PromptBlock label="EXEMPLE D&apos;AJUSTEMENT" promptText={PROMPT_EXEMPLE_AJUSTEMENT_TEXT} />
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Active le skill</p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Une fois le test concluant, demande à Claude : « Sauvegarde ce skill avec le nom constat-retard-[ton-entreprise] ». Il sera disponible dans
                toutes tes prochaines conversations sans avoir à recoller le prompt.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">5 </span>
                Teste sur un vrai chantier
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Le vrai test, c&apos;est ton prochain fait constaté sur chantier. Workflow recommandé pour la première utilisation en condition réelle :
              </p>
              <p className="mt-10 text-lg font-semibold text-slate-900">Le test</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Note le fait à chaud avec date, heure et témoins (compagnons, MOE, riverain).</li>
                <li>▸ Photographie ou archive les preuves (relevé météo, mail MOA, PV chantier).</li>
                <li>▸ Ouvre Claude, appelle ton skill : « Active le skill constat-retard ».</li>
                <li>▸ Renseigne les caractéristiques du chantier et la description du fait.</li>
                <li>▸ Récupère ton .docx, relis 5 minutes, signe, envoie en LRAR sous 5 jours max.</li>
              </ul>
              <p className="mt-10 text-lg font-semibold text-slate-900">Le bon prompt pour les usages quotidiens</p>
              <PromptBlock label="PROMPT — UTILISATION QUOTIDIENNE" promptText={PROMPT_USAGE_QUOTIDIEN_TEXT} />

              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">La règle d&apos;or</p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Envoie le constat sous 5 jours du fait, en LRAR avec accusé de réception. Sans LRAR ou hors délais, même le plus beau constat est
                inopposable. Le timing protège ta marge, pas les mots choisis.
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
                <li>▸ Vous nous transmettez le fait constaté (intempéries, défaut MOA, coactivité)</li>
                <li>▸ On rédige le constat, on l&apos;envoie en LRAR au MOA et MOE, on suit la prolongation</li>
                <li>▸ Vous évitez les pénalités de retard, votre marge est protégée jour après jour</li>
              </ul>
              <p className="mt-10 text-[1.0625rem] font-semibold text-slate-900">
                Réservez un appel de cadrage de 20 minutes sur{" "}
                <Link href={SITE_URL} className="text-[#1d4ed8] underline underline-offset-4 hover:no-underline">
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
