import { getTutoPageDescription, tutoPageMetadata } from "@/lib/seo-tuto-metadata";
import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { CopyPromptButton } from "@/components/ressources/CopyPromptButton";
import { buildWebPageAndBreadcrumbJsonLd } from "@/lib/seo-landing-json-ld";
import { absoluteUrl, SITE_URL } from "@/lib/site";

const pagePath = "/ressources/tuto-skill-duerp-bework";

const pageUrl = absoluteUrl(pagePath);

const pdfPath = "/ressources/pdf/tuto-skill-duerp-bework.pdf";

const PROMPT_CALIBRATION_TEXT = `Je veux que tu créés un skill personnalisé pour générer
et mettre à jour mes DUERP.
Contexte :
- Je suis [dirigeant / chargé QHSE / RH] chez [TON ENTREPRISE]
- Métier : [maçonnerie / second œuvre / multi-lots / etc.]
- Effectif : [N] salariés, dont [N] sur chantier
- Conservation légale : 40 ans (loi du 2 août 2021)
Je t'ai uploadé : mon DUERP actuel, mes unités de travail,
mon registre AT 5 ans, mes EPI et formations, mon template.
Construis un skill qui :
1. Couvre les 7 éléments obligatoires R4121-1 à R4121-4
2. Inventorie les risques par unité de travail
3. Cote chaque risque Fréquence × Gravité (échelle 1 à 5)
4. Liste les mesures de prévention existantes
5. Génère le plan d'action priorisé (responsables + échéances)
6. Adapte les risques aux spécificités BTP (chute hauteur, TMS,
CMR, bruit, vibrations, intempéries)
7. Respecte ma charte graphique d'entreprise
Avant de générer, pose-moi 5 à 10 questions de calibrage.`;

const PROMPT_USAGE_QUOTIDIEN_TEXT = `Active le skill duerp.
Contexte de la mise à jour :
- Type : [annuelle / suite à AT / nouveau poste / nouvelle activité]
- Date dernière version : [JJ/MM/AAAA]
- Période couverte : [12 derniers mois]
Évolutions depuis la dernière version :
- Nouveaux postes ou activités : [liste]
- Nouveaux équipements ou matériels : [liste]
- AT et incidents survenus : [N° + description]
- Évolutions réglementaires applicables : [oui/non]
Génère la nouvelle version du DUERP avec le tableau d'évaluation
mis à jour et le plan d'action révisé. Si infos manquantes, pose-moi
les questions en bloc compact.`;

const PROMPT_EXEMPLE_AJUSTEMENT_TEXT = `Le brouillon est bien mais 3 points à corriger :
1. Pour les risques CMR (poussières silice, amiante, plomb), ajoute
systématiquement la mention « VLEP applicable » avec la valeur
limite d'exposition professionnelle en vigueur
2. Dans le plan d'action, distingue les actions « court terme »
(< 3 mois), « moyen terme » (3-12 mois) et « long terme » (> 1 an)
3. Pour les risques psychosociaux (RPS), même sur chantier, prévois
une rubrique dédiée — c'est devenu un point de vigilance fort
de l'inspection du travail depuis 2022
Régénère le skill avec ces ajustements et propose-moi un nouveau
DUERP test sur la même unité de travail.`;

const H1 = "Crée ton skill — DUERP";


const breadcrumbItems = [
  { name: "Accueil", href: "/" },
  { name: "Ressources", href: "/ressources" },
  { name: H1, href: pagePath },
] as const;

const FAQ_FOR_JSON_LD = [
  {
    question: "Le DUERP généré a-t-il une valeur juridique ?",
    answer:
      "Oui, exactement la même que celui que tu rédigerais à la main. La valeur juridique d'un DUERP vient de sa signature par le dirigeant ou son délégataire, de sa datation, de sa mise à jour annuelle et de son accessibilité aux personnes habilitées (salariés, CSE, médecin du travail, inspection). L'outil utilisé pour le produire est sans incidence sur sa force probante. Word, traitement de texte spécialisé ou IA : c'est ta validation et la traçabilité qui comptent.",
  },
  {
    question: "À quelle fréquence faut-il mettre à jour le DUERP ?",
    answer:
      "Au minimum annuellement (article R4121-2). Mais aussi à chaque modification importante : nouveau poste, nouvelle activité, nouvel équipement, accident grave, évolution réglementaire majeure. En BTP, la pratique consiste à le revoir à chaque rentrée de septembre + à chaque AT supérieur à 24h d'arrêt + à chaque ouverture d'un nouveau type de chantier. Le skill rend ces mises à jour fluides — 2 heures au lieu d'une journée.",
  },
  {
    question: "Suis-je obligé de déposer le DUERP sur le portail national ?",
    answer:
      "Oui, depuis le 1er juillet 2024 pour les entreprises de 150 salariés et plus, et au plus tard juillet 2025 pour les moins de 150 (calendrier qui peut évoluer — vérifier sur travail-emploi.gouv.fr). Le dépôt est dématérialisé sur un portail dédié géré par les organisations patronales. Ne pas déposer expose aux mêmes sanctions que ne pas avoir de DUERP.",
  },
  {
    question: "Que se passe-t-il en cas d'accident grave si mon DUERP est insuffisant ?",
    answer:
      "Risque majeur de faute inexcusable de l'employeur (Cour de cassation, arrêts amiante 2002 puis jurisprudence constante). Conséquences : majoration de la rente AT du salarié, indemnisation des préjudices personnels, exposition pénale du dirigeant pour homicide ou blessures involontaires (article 222-19 du Code pénal). Un DUERP solide est ta première ligne de défense — c'est exactement ce que ce skill produit.",
  },
  {
    question: "Mes données sécurité sont-elles confidentielles ?",
    answer:
      "Anthropic (l'éditeur de Claude) ne réutilise pas le contenu de tes conversations Pro et Team pour entraîner ses modèles. Tes données AT, fiches de poste et matrices de risques restent associées à ton compte et sont supprimables à tout moment. Pour les chantiers ultra-sensibles (sites classés défense, OIV), travaille avec des données anonymisées dans le prompt — c'est une pratique de prudence raisonnable.",
  },
  {
    question: "Le DUERP doit-il être signé par les salariés ou le CSE ?",
    answer:
      "Le DUERP doit être signé par le dirigeant ou son délégataire en sécurité. Il n'a pas à être signé par les salariés. En revanche, il doit être présenté pour information et consultation au CSE (entreprises de 11 salariés et plus) ou à la CSSCT (50 salariés et plus). Les salariés doivent en être informés et avoir un accès permanent (affichage des modalités de consultation, mention dans le règlement intérieur).",
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

export default function TutoSkillDuerpBeworkPage() {
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
      { "@type": "HowToStep", name: "Tester sur ta vraie entreprise" },
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
              Tuto PDF gratuit · DUERP · Claude · BeWork
            </p>
            <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-[2.35rem] md:leading-tight">
              {H1}
            </h1>
            <p className="mt-4 max-w-none text-lg leading-relaxed text-slate-600 sm:text-[1.125rem] sm:leading-[1.7]">
              Tutoriel BeWork pas à pas pour rédiger et mettre à jour votre Document Unique — matrices F × G, plan d&apos;action priorisé et 7 éléments
              obligatoires — PDF en ligne et prompts à copier.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <CalendlyBookingLink className="inline-flex min-h-[3rem] shrink-0 items-center justify-center rounded-xl bg-[#1d4ed8] px-7 text-[0.9375rem] font-semibold text-white shadow-md shadow-[#1d4ed8]/25 transition hover:bg-[#1e40af] md:text-base">
                Réservez un appel
              </CalendlyBookingLink>
              <span className="text-sm leading-snug text-slate-600 sm:max-w-sm">
                20&nbsp;minutes pour cadrer votre besoin (DUERP, prévention BTP, relais administratif) — sans engagement.
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
                title="Crée ton skill — DUERP — PDF BeWork"
              />
            </div>
          </section>

          <aside
            className="mb-14 rounded-2xl border border-[#1d4ed8]/22 bg-gradient-to-br from-[#eff6ff] to-white p-6 shadow-sm shadow-[#1d4ed8]/06 sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-8"
            aria-label="Réserver un appel découverte"
          >
            <div className="min-w-0 sm:flex-1">
              <p className="text-base font-semibold text-slate-900 md:text-[1.05rem]">
                Besoin d&apos;un relais pour votre DUERP, votre plan d&apos;action et le dépôt sur le portail national&nbsp;?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 md:text-[0.9375rem]">
                Parlez-en avec BeWork sur un créneau de 20&nbsp;minutes : mise en forme, priorisation risques et calendrier de mise à jour.
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
              <p className="mt-3 text-center text-xl font-semibold text-slate-900">DUERP</p>
              <p className="mt-2 text-center text-base text-slate-700 md:text-[1.05rem]">
                Le tutoriel pas à pas pour rédiger ton Document Unique — 2 heures au lieu de 1 journée.
              </p>

              <h4 className="mt-14 text-xs font-semibold uppercase tracking-[0.2em] text-slate-800">Ce que tu vas apprendre</h4>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Activer la fonction skills dans Claude (5 minutes, 1 fois pour toutes)</li>
                <li>▸ Calibrer ton skill avec tes unités de travail et ta matrice de risques BTP</li>
                <li>▸ Le prompt prêt à coller pour générer ton skill en 1 conversation</li>
                <li>▸ Le prompt quotidien pour mettre à jour ton DUERP après accident ou nouveau poste</li>
              </ul>

              <h3 className="mt-14 text-xl font-semibold tracking-tight text-slate-900">Pourquoi un skill DUERP&nbsp;?</h3>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-slate-900">
                Le DUERP — Document Unique d&apos;Évaluation des Risques Professionnels — est obligatoire pour toute entreprise dès le premier salarié.
                Article L4121-3 du Code du travail, décret du 5 novembre 2001, renforcé par la loi du 2 août 2021 et le décret du 18 mars 2022. Tu dois
                identifier, évaluer et hiérarchiser tous les risques auxquels tes salariés sont exposés, le mettre à jour annuellement (minimum) et à
                chaque modification importante, et désormais le déposer sur le portail national dématérialisé. Conservation : 40 ans.
              </p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Sanctions en cas d&apos;absence ou de DUERP non à jour : amende de 1 500 € par unité de travail non couverte (article R4741-1), 9 000 € en
                cas de manquement aggravé. Et surtout, en cas d&apos;accident grave, faute inexcusable de l&apos;employeur quasi-automatique (Cour de cassation,
                jurisprudence constante depuis 2002) — avec majoration de la rente AT, dommages-intérêts pour préjudices, exposition pénale du
                dirigeant. Pour une PME BTP qui rédige son DUERP à la main, c&apos;est 1 à 2 jours par an + 4 à 8 heures à chaque mise à jour. Et le risque que
                ce soit fait à moitié.
              </p>

              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Avec un skill bien construit, voilà ce qui change</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Tu décris une unité de travail, le skill sort la matrice risques + plan d&apos;action.</li>
                <li>▸ Les 7 éléments obligatoires sont tous présents — aucun ne peut être oublié.</li>
                <li>▸ Les risques BTP types sont déjà calibrés (chute hauteur, TMS, CMR, bruit, vibrations).</li>
                <li>▸ La cotation Fréquence × Gravité est appliquée systématiquement.</li>
                <li>▸ Tu passes de 1 jour à 2 heures pour la mise à jour annuelle. Et tu dors la nuit.</li>
              </ul>
              <p className="mt-8 text-[1.0625rem] leading-relaxed text-slate-900">
                Le skill ne remplace pas l&apos;observation terrain. Il met en forme et garantit la conformité. L&apos;analyse de risque réelle de ton entreprise
                reste de ta responsabilité de dirigeant.
              </p>

              <h3 className="mt-14 text-xl font-semibold uppercase tracking-wide text-slate-900">Les 7 éléments obligatoires d&apos;un DUERP</h3>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-slate-900">
                (1) Identification de l&apos;entreprise et de ses unités de travail (atelier, chantier, bureau). (2) Inventaire des risques par unité
                (physique, chimique, biologique, psychosocial). (3) Évaluation cotée Fréquence × Gravité. (4) Mesures de prévention existantes
                (collectives + EPI + formation). (5) Plan d&apos;action priorisé : mesures, responsables, échéances. (6) Suivi des actions mises en œuvre.
                (7) Programme annuel de prévention pour entreprises de 50 salariés et plus. Le DUERP doit être daté, signé et accessible aux salariés,
                CSE, médecin du travail et inspection du travail.
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
                Sans Code execution, Claude ne peut pas générer un DUERP au format .docx avec tableaux de risques cotés et plan d&apos;action. Pour un
                document légal opposable que tu dois pouvoir présenter à l&apos;inspection du travail à tout moment, c&apos;est rédhibitoire — tu as besoin du fichier
                mis en forme que tu peux dater, signer, archiver et déposer sur le portail national.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">2 </span>
                Rassemble ta matière première
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Un DUERP générique te sortira un document fade qui ne tiendra pas devant un inspecteur du travail. Pour qu&apos;il soit crédible et
                opposable, il a besoin de tes données spécifiques. Rassemble cette matière avant de lancer la conversation — 30 minutes de
                préparation, des heures gagnées ensuite.
              </p>

              <p className="mt-10 text-[1.0625rem] font-semibold text-slate-900">1. Tes 2 ou 3 derniers DUERP existants (s&apos;ils existent)</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Si tu en as déjà un, le skill l&apos;analysera et le mettra à niveau réglementaire. Si tu n&apos;en as pas, le skill partira d&apos;une trame BTP standard et
                on calibrera ensemble.
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">2. La liste de tes unités de travail</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Une PME BTP a généralement : siège (bureau administratif), dépôt/atelier, et 1 unité « chantier » par grande typologie d&apos;activité (gros
                œuvre, second œuvre, finitions). Liste-les avec effectif moyen et activités principales.
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">3. Tes données accidents et incidents (5 dernières années)</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Registre des AT, presqu&apos;accidents signalés, fiches d&apos;incidents. C&apos;est la matière la plus précieuse pour le skill : il en déduit tes risques réels (vs
                théoriques) et adapte le plan d&apos;action en priorité sur ce qui te coûte vraiment.
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">4. Tes EPI standards et formations sécurité</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Liste des EPI fournis par défaut avec leurs normes (EN 397, EN ISO 20345…), formations obligatoires de tes salariés (CACES, habilitation
                électrique, travail en hauteur, SST), médecin du travail et fréquence des visites.
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">5. Ton template DUERP société</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Si ton entreprise a un modèle Word officiel (en-tête, page de garde, structure de tableau de risques), uploade-le. Sinon, le skill partira d&apos;une trame standard que tu pourras valider avec ton service de prévention ou ton médecin du travail.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">3 </span>
                Lance la conversation avec Claude
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Ouvre une nouvelle conversation sur claude.ai, uploade tous tes documents (DUERP existants, unités de travail, registre AT, EPI, template),
                puis colle ce prompt directement.
              </p>
              <PromptBlock label="PROMPT À COLLER DANS CLAUDE" promptText={PROMPT_CALIBRATION_TEXT} />
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Le point clé</p>
              <p className="mt-4 text-[1.0625rem] leading-relaxed text-slate-900">
                Demande au skill d&apos;intégrer les risques BTP de l&apos;INRS (brochures ED 6079, ED 887, ED 832) comme référentiel. C&apos;est la base reconnue par
                l&apos;inspection du travail — un DUERP qui s&apos;y appuie passe sans question.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">4 </span>
                Affine et active ton skill
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Claude va te proposer un premier brouillon de skill. Ne valide pas tout de suite. Demande-lui de te montrer un DUERP test sur une unité de
                travail fictive (par exemple : équipe maçons sur chantier de gros œuvre R+2), puis ajuste.
              </p>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Ce que tu dois vérifier</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Les 7 éléments R4121 sont tous présents et dans le bon ordre.</li>
                <li>▸ Les risques sont classés par famille (physique, chimique, biologique, psychosocial).</li>
                <li>▸ La cotation F × G est cohérente (un risque chute hauteur ne peut pas être en F1 G2).</li>
                <li>▸ Les EPI cités correspondent à tes équipements réels avec normes EN.</li>
                <li>▸ Le plan d&apos;action a des responsables nommés et des échéances datées.</li>
                <li>▸ Les références réglementaires sont à jour (loi 2 août 2021, décret 18 mars 2022).</li>
              </ul>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Ajustement type à demander</p>
              <PromptBlock label="EXEMPLE D&apos;AJUSTEMENT" promptText={PROMPT_EXEMPLE_AJUSTEMENT_TEXT} />
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Active le skill</p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Une fois le test concluant, demande à Claude : « Sauvegarde ce skill avec le nom duerp-[ton-entreprise] ». Il sera disponible dans toutes tes
                prochaines conversations sans avoir à recoller le prompt.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">5 </span>
                Teste sur ta vraie entreprise
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Le vrai test, c&apos;est ta mise à jour annuelle (échéance dans les 12 mois suivant la dernière version). Workflow recommandé pour la première
                utilisation en condition réelle :
              </p>
              <p className="mt-10 text-lg font-semibold text-slate-900">Le test</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Liste les évolutions depuis la dernière version (nouveau poste, nouvel équipement, AT).</li>
                <li>▸ Note les observations terrain de tes encadrants et les remontées CSE.</li>
                <li>▸ Ouvre Claude, appelle ton skill : « Active le skill duerp ».</li>
                <li>▸ Renseigne les évolutions et les nouvelles données AT/incidents.</li>
                <li>▸ Récupère ton DUERP mis à jour, valide en interne, fais signer, archive 40 ans.</li>
              </ul>
              <p className="mt-10 text-lg font-semibold text-slate-900">Le bon prompt pour les usages quotidiens</p>
              <PromptBlock label="PROMPT — UTILISATION QUOTIDIENNE" promptText={PROMPT_USAGE_QUOTIDIEN_TEXT} />

              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">La règle d&apos;or</p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Date et signe le DUERP à chaque mise à jour. Une version non datée ne fait pas foi devant l&apos;inspection. Dépôt obligatoire sur le portail
                national à venir pour les &lt; 150 salariés — anticipe.
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
                <li>▸ Vous nous transmettez vos unités de travail, AT, observations terrain et CSE</li>
                <li>▸ On rédige le DUERP aux normes R4121, on intègre le plan d&apos;action priorisé</li>
                <li>▸ Vous présentez au CSE, vous archivez 40 ans, vous êtes en règle avec l&apos;inspection</li>
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
