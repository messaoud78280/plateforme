import type { Metadata } from "next";
import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { CopyPromptButton } from "@/components/ressources/CopyPromptButton";
import { buildWebPageAndBreadcrumbJsonLd } from "@/lib/seo-landing-json-ld";
import { absoluteUrl, SITE_URL } from "@/lib/site";

const pagePath = "/ressources/tuto-skill-pic-bework";

const pageUrl = absoluteUrl(pagePath);

const pdfPath = "/ressources/pdf/tuto-skill-pic-bework.pdf";

const PROMPT_CALIBRATION_TEXT = `Je veux que tu m'aides à créer un skill Claude qui s'appelle
"plan-installation-chantier".

Mon métier : [tes lots — gros œuvre, GO+CES, tous corps d'état…]
Mes typologies : [logement, ERP, tertiaire, réhab, industriel]
Ma zone : [Île-de-France, Grand Ouest, etc.]
Effectifs typiques : [10 à 80 compagnons selon chantier]

Ce que le skill doit faire à chaque nouveau chantier :
1. Lire le plan masse + la fiche projet que je fournis
2. Dimensionner la base vie selon le Code du travail
(articles R.4534-138 et suivants : sanitaires, vestiaires, réfectoire)
3. Implanter zones de stockage, grue, accès, bennes, sanitaires
4. Gérer la co-activité (zones tampon, circulations séparées)
5. Intégrer les contraintes du PGCSPS du coordonnateur
6. Lister les autorisations à demander (voirie, ABF, riverains)
7. Générer le PIC complet en Word + checklist de contrôle

Voici les fichiers que je te transmets :
[joindre 2-3 anciens PIC + fiche projet + catalogue base vie + PGCSPS]

Crée le skill, propose-moi la structure avant de coder, et explique-moi
en français comment je l'utiliserai au quotidien.`;

const PROMPT_USAGE_QUOTIDIEN_TEXT = `/plan-installation-chantier

Chantier : [nom du chantier — Maître d'ouvrage]
Adresse : [adresse complète]
Type d'ouvrage : [logements R+5, ERP, bureaux…]
Surface plancher : [m²]
Durée prévisionnelle : [mois]
Effectifs max simultanés : [N compagnons]
Période / saison : [hiver / été / mi-saison]
Contraintes connues : [voirie, ABF, riverains, acoustique…]

[joindre plan masse PDF + fiche projet]

Sors-moi :
1. Le PIC complet structuré (Word)
2. La checklist de contrôle avant validation SPS
3. La liste des autorisations à demander
4. Les points d'attention co-activité`;

const PROMPT_EXEMPLE_AJUSTEMENT_TEXT = `Modifie le skill : sur ce test :
- La base vie est sous-dimensionnée pour 35 compagnons (manque 1 WC)
- L'aire de stockage acier empiète sur la zone de circulation pompiers
- Les BSD pour DIS ne sont pas listés dans le suivi déchets
Corrige ces 3 points et regénère le skill.`;

const H1 = "Crée ton skill — Plan d'Installation de Chantier";

const META_DESCRIPTION =
  "Tutoriel PDF — plan d'installation de chantier avec l’IA (Claude & skills) : produire un PIC complet et conforme en 1 h au lieu de 4 — PDF BeWork et prompts à copier.";

const breadcrumbItems = [
  { name: "Accueil", href: "/" },
  { name: "Ressources", href: "/ressources" },
  { name: H1, href: pagePath },
] as const;

const FAQ_FOR_JSON_LD = [
  {
    question: "Combien de temps pour créer le skill complet ?",
    answer:
      "Compte 1h30 à 2h pour la première création : 30 min pour rassembler la matière (PIC types, plan masse, catalogue base vie, PGCSPS), 30 min de cadrage avec Claude, 30 min d'ajustement et un premier test. Les chantiers suivants sont traités en 30 à 45 minutes chacun. Tu rentabilises l'investissement dès le deuxième PIC produit.",
  },
  {
    question: "Le skill remplace-t-il le coordonnateur SPS ?",
    answer:
      "Non. Le skill produit la trame du PIC : structure, dimensionnement, points de contrôle. La validation finale reste de la responsabilité du conducteur de travaux et du coord SPS. Le skill te fait gagner 70 % du temps de rédaction et garantit que rien n'est oublié — l'arbitrage reste humain.",
  },
  {
    question: "Comment produire le plan dessiné si Claude génère du texte ?",
    answer:
      "Claude produit le PIC en texte structuré avec coordonnées et dimensions des zones. Pour le plan dessiné : reporte les zones sur un calque AutoCAD du plan masse (15 min), ou utilise PlanRadar, Sitematic ou PowerPoint. Si le projet est en BIM, exporte une vue 2D en PDF et fournis-la au skill.",
  },
  {
    question: "Que faire si le terrain est complexe (forte pente, urbain dense) ?",
    answer:
      "Précise-le dans le prompt : « terrain en pente 15 %, accès unique côté nord, riverains à moins de 2 m ». Claude adapte la sortie : stockage en terrasses, base vie en module léger, signalisation renforcée, plage horaire restreinte. Plus tu charges le contexte, plus le PIC est calibré.",
  },
  {
    question: "Comment intégrer les contraintes du PGCSPS du coord SPS ?",
    answer:
      "Upload le PGCSPS dès l'étape 2 (création du skill) et transmets une copie à chaque nouveau chantier. Le skill détecte les exigences (EPI, plages horaires, zones interdites) et les répercute dans le PIC. Tu peux aussi demander : « liste les écarts entre mon PIC et les exigences PGCSPS ».",
  },
  {
    question: "Combien de temps Claude met-il pour produire un PIC ?",
    answer:
      "Pour un chantier classique (plan masse + fiche projet), Claude produit le PIC complet en 3 à 7 minutes. Pour un chantier complexe (urbain dense, multi-phasage, co-activité forte), compte 7 à 15 minutes. Au total, tu passes de 2 à 4 h de saisie manuelle à 30 à 45 min de pilotage avec relecture.",
  },
  {
    question: "Le PIC évolue après démarrage — comment le mettre à jour avec le skill ?",
    answer:
      "À chaque évolution majeure (nouveau lot, changement d'effectifs, accident, modification de phasage), relance le skill avec la nouvelle donne. En 5 minutes tu obtiens une version V2 datée, prête à transmettre au coord SPS et à la MOE.",
  },
  {
    question: "Et si je n'ai pas le temps de mettre tout ça en place ?",
    answer:
      "C'est la raison d'être de BeWork. Tu nous transmets le plan masse, la fiche projet et tes contraintes, on te livre un PIC complet conforme aux exigences SPS en 24 à 48 h. Tu gardes la main sur les arbitrages techniques, on fait le déblayage rédactionnel.",
  },
] as const;

export const metadata: Metadata = {
  title: "Tutoriel PDF — Plan d'installation de chantier avec l’IA (Claude & skills) | BeWork",
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
    title: "Tutoriel PDF — Plan d'installation de chantier avec l’IA (Claude & skills) | BeWork",
    description: META_DESCRIPTION,
    images: [{ url: absoluteUrl("/opengraph-image"), width: 1200, height: 630, alt: "Crée ton skill — Plan d'Installation de Chantier — BeWork" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tutoriel PDF — Plan d'installation de chantier avec l’IA (Claude & skills) | BeWork",
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

export default function TutoSkillPicBeworkPage() {
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
      { "@type": "HowToStep", name: "Activer la fonction Skills" },
      { "@type": "HowToStep", name: "Rassembler ta matière" },
      { "@type": "HowToStep", name: "Lancer la conversation avec Claude" },
      { "@type": "HowToStep", name: "Affine et active ton skill" },
      { "@type": "HowToStep", name: "Teste sur un vrai chantier" },
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
              Tuto PDF gratuit · Plan d&apos;Installation de Chantier · Claude &amp; skills · BeWork
            </p>
            <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-[2.35rem] md:leading-tight">
              {H1}
            </h1>
            <p className="mt-4 max-w-none text-lg leading-relaxed text-slate-600 sm:text-[1.125rem] sm:leading-[1.7]">
              Tutoriel PDF — plan d&apos;installation de chantier avec l&apos;IA (Claude &amp; skills)&nbsp;: produire un PIC complet et
              conforme en 1&nbsp;heure au lieu de 4. PDF consultable en ligne, texte intégral et prompts prêts à coller.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <CalendlyBookingLink className="inline-flex min-h-[3rem] shrink-0 items-center justify-center rounded-xl bg-[#1d4ed8] px-7 text-[0.9375rem] font-semibold text-white shadow-md shadow-[#1d4ed8]/25 transition hover:bg-[#1e40af] md:text-base">
                Réservez un appel
              </CalendlyBookingLink>
              <span className="text-sm leading-snug text-slate-600 sm:max-w-sm">
                20&nbsp;minutes pour cadrer votre besoin (PIC, SPS, relais administratif BTP) — sans engagement.
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
                title="Crée ton skill — Plan d'Installation de Chantier — PDF BeWork"
              />
            </div>
          </section>

          <aside
            className="mb-14 rounded-2xl border border-[#1d4ed8]/22 bg-gradient-to-br from-[#eff6ff] to-white p-6 shadow-sm shadow-[#1d4ed8]/06 sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-8"
            aria-label="Réserver un appel découverte"
          >
            <div className="min-w-0 sm:flex-1">
              <p className="text-base font-semibold text-slate-900 md:text-[1.05rem]">
                Besoin d&apos;un relais sur vos PIC / installation chantier&nbsp;?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 md:text-[0.9375rem]">
                Parlez-en avec BeWork pendant un créneau de 20&nbsp;minutes : PIC structuré, dimensionnement base vie, validation SPS.
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
              <p className="mt-3 text-center text-xl font-semibold text-slate-900">Plan d&apos;Installation de Chantier</p>
              <p className="mt-2 text-center text-base text-slate-700 md:text-[1.05rem]">
                Le tutoriel pas à pas pour produire un PIC complet et conforme — 1 heure au lieu de 4 heures.
              </p>

              <h4 className="mt-14 text-xs font-semibold uppercase tracking-[0.2em] text-slate-800">Ce que tu vas apprendre</h4>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Activer la fonction Skills dans Claude (5 minutes)</li>
                <li>▸ Préparer la matière utile : plan masse, PIC types, contraintes site</li>
                <li>▸ Créer un skill qui structure ton PIC : zones, dimensions, règles SPS</li>
                <li>▸ L&apos;utiliser au quotidien sur tous tes chantiers, du R+1 au tertiaire</li>
              </ul>

              <h3 className="mt-14 text-xl font-semibold tracking-tight text-slate-900">Pourquoi un skill PIC ?</h3>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-slate-900">
                Le PIC — Plan d&apos;Installation de Chantier — matérialise l&apos;organisation physique du chantier avant travaux&nbsp;: base vie,
                stockage matériaux, circulation engins, grue, bennes. Sans PIC, pas d&apos;autorisation de démarrage. Avec un PIC bâclé, tu paies en
                co-activité, accidents, remontées MOA et blocages SPS.
              </p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Sur un chantier moyen, la rédaction du PIC prend 2 à 4&nbsp;heures à un conducteur expérimenté. Les oublis classiques&nbsp;: co-activité
                non gérée, base vie sous-dimensionnée, gestion des déchets manquante, signalisation incomplète — retours du coord SPS et pertes de
                jours au démarrage.
              </p>

              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Avec un skill bien construit, voilà ce qui change</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Tu fournis le plan masse + fiche projet, le skill structure le PIC (texte + repères graphiques).</li>
                <li>▸ Il dimensionne la base vie selon le Code du travail (R.4534-138 et suivants).</li>
                <li>▸ Il gère la co-activité : zones tampon, plages horaires, circulations séparées.</li>
                <li>▸ Il intègre les contraintes du PGCSPS et signale les points à valider avec le coord SPS.</li>
                <li>▸ Il génère un livrable Word + checklist de contrôle, prêt à transmettre à la MOE.</li>
              </ul>
              <p className="mt-10 text-[1.0625rem] leading-relaxed text-slate-900">
                Un PIC carré au démarrage, c&apos;est 5 à 15 jours gagnés sur la phase préparation et zéro retour SPS bloquant.
              </p>

              <p className="mt-10 rounded-xl border border-amber-200/80 bg-amber-50/60 px-4 py-3 text-[1.0625rem] leading-relaxed text-slate-900">
                <strong className="font-semibold text-slate-900">Obligation légale —</strong> Le PIC est obligatoire pour tout chantier soumis à
                coordination SPS (loi du 31 décembre 1993, articles L.4532-1 et suivants). Il doit être validé par le coordonnateur SPS avant
                ouverture du chantier — sans validation, l&apos;inspection du travail peut prononcer un arrêt immédiat des travaux.
              </p>

              <h3 className="mt-14 text-xl font-semibold uppercase tracking-wide text-slate-900">Les 4 blocs à couvrir dans un PIC</h3>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>
                  <strong>Vie</strong> — Base vie, sanitaires, vestiaires, réfectoire.
                </li>
                <li>
                  <strong>Flux</strong> — Accès &amp; circulation, voies, signalisation.
                </li>
                <li>
                  <strong>Engins</strong> — Grue &amp; levage, position, charge, périmètre.
                </li>
                <li>
                  <strong>Déchets</strong> — Tri &amp; évacuation, bennes DIB, DIS, gravats.
                </li>
              </ul>

              <p className="mt-10 text-[1.0625rem] leading-relaxed text-slate-900">
                <strong className="font-semibold">Cas concret —</strong> Sur un chantier de 30 logements en Île-de-France, un PIC bâclé sans aire de
                tri déchets a coûté 7 jours de retard et une mise en demeure du coord SPS. Coût direct&nbsp;: 38&nbsp;K€ de pénalités +
                immobilisation des équipes. Un skill bien construit aurait sorti l&apos;aire de tri en 2 minutes, avec dimensionnement et règles de
                tri associés.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">1 </span>
                Active la fonction Skills
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Avant de créer ton skill, active la bonne version de Claude et les fonctionnalités qui font tourner les skills.
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">Le bon abonnement</p>
              <ul className="mt-3 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Claude Pro à 18&nbsp;€/mois (ou 17&nbsp;€ si paiement annuel).</li>
                <li>▸ Indispensable pour utiliser les skills&nbsp;: la version gratuite ne les exécute pas.</li>
                <li>▸ Le retour sur investissement est immédiat dès le premier PIC produit.</li>
              </ul>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">Activer les capabilities (3 clics)</p>
              <ul className="mt-3 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Ouvre claude.ai → ton avatar en bas à gauche → Settings.</li>
                <li>▸ Onglet Capabilities.</li>
                <li>▸ Coche les trois cases&nbsp;: Code execution, Skills et File creation.</li>
                <li>▸ Reviens dans la conversation&nbsp;: un petit ⚙ apparaît sous la zone de message.</li>
              </ul>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">Si tu ne vois pas la section Skills</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Vérifie que tu es bien en Claude Sonnet 4.5 ou Opus 4.5 (en haut de la fenêtre). En Claude Haiku, certaines fonctionnalités sont
                limitées. Si l&apos;onglet Capabilities est absent, déconnecte-toi et reconnecte-toi&nbsp;: la section apparaît systématiquement après
                cette manipulation.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">2 </span>
                Rassemble ta matière
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Un skill performant repose sur tes vraies données. Plus tu donnes de matière à Claude au moment de la création, plus il est
                calibré pour ton métier, ton type de chantier et tes habitudes d&apos;organisation.
              </p>
              <p className="mt-10 text-[1.0625rem] font-semibold text-slate-900">1. Tes 2-3 derniers PIC validés</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Un PIC logement collectif, un PIC tertiaire, un PIC réhabilitation par exemple. Plus tu varies les typologies, plus le skill saura
                adapter sa sortie. Joins le plan masse + le document PIC complet (Word ou PDF).
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">2. Ta fiche projet type</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Format que tu utilises pour synthétiser un nouveau chantier&nbsp;: adresse, type d&apos;ouvrage, surface, durée, effectifs estimés,
                contraintes connues (riverain, voirie, zone classée).
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">3. Ton catalogue base vie / clôtures / signalétique</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Les références que tu loues ou possèdes&nbsp;: modules base vie, type de clôtures (Heras, palissades), panneaux de signalisation,
                bennes (capacités, fournisseurs habituels). Le skill tirera dans ce catalogue plutôt que d&apos;inventer.
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">4. Les contraintes réglementaires de ta zone</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Arrêtés de voirie type, DICT à déposer (concessionnaires réseaux), règles ABF si secteur sauvegardé, contraintes acoustiques,
                horaires de chantier autorisés, tonnage maximum sur les voies d&apos;accès.
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">5. Un PGCSPS type</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Plan général de coordination SPS d&apos;un chantier similaire. Le skill saura intégrer les exigences du coordonnateur et les
                répercuter automatiquement dans ton PIC.
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">6. Tes notes et photos de visite de site</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Sans visite de site, le skill travaille à l&apos;aveugle. Tes photos (accès, riverains, contraintes terrain), tes notes (pente,
                plantations, mitoyennetés) et tes mesures sur place sont la matière qui calibre le PIC sur la réalité physique du chantier.
              </p>
              <p className="mt-10 text-[1.0625rem] font-semibold text-slate-900">Réflexe pro — anonymisation</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Avant d&apos;uploader des PIC récents, anonymise les données sensibles&nbsp;: noms de riverains, coordonnées personnelles, codes
                d&apos;accès badge, conditions financières des locations. Le contenu utile au skill, c&apos;est la structure et les dimensions, pas les
                données nominatives.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">3 </span>
                Lance la conversation avec Claude
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Ouvre une nouvelle conversation, joins tes fichiers, et colle le prompt ci-dessous. Adapte les zones entre crochets à ton
                entreprise. Claude va te répondre avec une proposition de structure&nbsp;: tu valides ou tu ajustes avant de générer le skill.
              </p>
              <PromptBlock label="PROMPT À COLLER DANS CLAUDE" promptText={PROMPT_CALIBRATION_TEXT} />
              <p className="mt-8 text-xl font-semibold uppercase tracking-wide text-slate-900">Le point clé</p>
              <p className="mt-4 text-[1.0625rem] leading-relaxed text-slate-900">
                Ne saute pas l&apos;étape «&nbsp;propose-moi la structure avant de coder&nbsp;». C&apos;est ce qui te permet de valider la logique du skill
                avant qu&apos;il soit figé. Une fois le skill créé, c&apos;est plus long de le réécrire que de bien le cadrer dès le départ. Compte 15
                minutes de discussion avec Claude pour aboutir à la bonne structure.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">4 </span>
                Affine et active ton skill
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Claude te propose une structure. C&apos;est le moment de la passer au filtre métier&nbsp;: est-ce qu&apos;elle ressemble à un PIC que tu
                signerais en toute confiance&nbsp;? Est-ce qu&apos;il manque quelque chose&nbsp;? Vérifie systématiquement les points suivants avant de
                valider.
              </p>
              <ul className="mt-6 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ La base vie est-elle dimensionnée selon les effectifs (sanitaires, réfectoire, vestiaires)&nbsp;?</li>
                <li>▸ Les flux engins / piétons / livraisons sont-ils bien séparés&nbsp;?</li>
                <li>▸ La position grue intègre-t-elle le périmètre de levage et les survols interdits&nbsp;?</li>
                <li>▸ La gestion des déchets est-elle complète&nbsp;: DIB, DIS, gravats, BSD&nbsp;?</li>
                <li>▸ Les moyens de secours sont-ils intégrés (extincteurs, point de rassemblement, accès pompiers)&nbsp;?</li>
                <li>▸ Les contraintes PGCSPS et co-activité sont-elles explicitement reprises&nbsp;?</li>
                <li>▸ La checklist de contrôle finale liste-t-elle bien les autorisations à obtenir&nbsp;?</li>
              </ul>
              <PromptBlock label="EXEMPLE D&apos;AJUSTEMENT" promptText={PROMPT_EXEMPLE_AJUSTEMENT_TEXT} />
              <p className="mt-8 text-[1.0625rem] leading-relaxed text-slate-900">
                Une fois la structure validée, demande à Claude&nbsp;: «&nbsp;Active maintenant le skill&nbsp;». Il devient disponible dans le menu skills
                (sous l&apos;icône ⚙). À chaque nouveau chantier, tu pourras l&apos;invoquer en tapant simplement{" "}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">/plan-installation-chantier</code>.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">5 </span>
                Teste sur un vrai chantier
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Choisis un chantier que tu connais bien (idéalement un déjà installé) et compare la sortie de Claude à ton PIC réel. Tu vas voir
                où le skill est juste, où il faut l&apos;affiner.
              </p>
              <ul className="mt-6 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Joins le plan masse au format PDF + la fiche projet.</li>
                <li>▸ Précise effectifs, durée, contraintes connues (voirie, riverains).</li>
                <li>▸ Demande la sortie complète&nbsp;: PIC Word + checklist + plan repéré.</li>
                <li>▸ Compare avec ton PIC de référence et la version validée par le SPS.</li>
                <li>▸ Si tu repères des manques, retourne en étape 4 et ajuste.</li>
              </ul>
              <PromptBlock label="PROMPT — UTILISATION QUOTIDIENNE" promptText={PROMPT_USAGE_QUOTIDIEN_TEXT} />
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Extrait de sortie type</p>
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5 font-mono text-sm leading-relaxed text-slate-800">
                <p className="font-semibold text-slate-900">PIC — SECTION BASE VIE (extrait)</p>
                <p className="mt-4">Effectifs : 25 compagnons (R.4534-139 à 143)</p>
                <p className="mt-2">Sanitaires : 3 WC + 2 urinoirs + 4 lavabos</p>
                <p className="mt-2">Vestiaires : 2 modules de 12 places</p>
                <p className="mt-2">Réfectoire : 25 m² avec lave-mains</p>
                <p className="mt-2">Implantation : angle nord-est (cf plan repéré)</p>
                <p className="mt-2">Surface au sol : 65 m² · raccordements eau + 16 A</p>
              </div>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">La règle d&apos;or</p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Un PIC, ça vit. À chaque évolution majeure (nouveau lot, changement d&apos;effectifs, accident), repasse 5 min dans le skill pour
                produire une mise à jour. Tu transmets la nouvelle version au coord SPS et à la MOE. C&apos;est ce qui te couvre en cas d&apos;incident.
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
                <li>▸ Vous nous transmettez le plan masse, la fiche projet et vos contraintes</li>
                <li>▸ On structure le PIC, on dimensionne, on flague les points SPS — 24 à 48&nbsp;h</li>
                <li>▸ Vous validez, le SPS signe, le chantier démarre sans retour</li>
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
