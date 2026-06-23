import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { BeWorkStatsGrid } from "@/components/marketing/BeWorkStatsGrid";
import { CopyPromptButton } from "@/components/ressources/CopyPromptButton";
import { buildWebPageAndBreadcrumbJsonLd } from "@/lib/seo-landing-json-ld";
import { getTutoPageDescription, tutoPageMetadata } from "@/lib/seo-tuto-metadata";
import { absoluteUrl, SITE_URL } from "@/lib/site";

const pagePath = "/ressources/tuto-skill-planning-chantier-bework";
const pageUrl = absoluteUrl(pagePath);
const pdfPath = "/ressources/pdf/tuto-skill-planning-chantier-bework.pdf";

const H1 = "Crée ton skill — Planning chantier (recalage en 30 min)";

const breadcrumbItems = [
  { name: "Accueil", href: "/" },
  { name: "Ressources", href: "/ressources" },
  { name: "Skill planning chantier", href: pagePath },
] as const;

const PROMPT_CALIBRATION_TEXT = `Tu es mon assistant planning de chantier.

Je suis conducteur de travaux. Voici ma matière (en pièces jointes) :
- 3 plannings type finalisés (Gantt PDF + Excel)
- Mon phasage standard par lot
- Mes durées historiques par tâche (ratios m²/jour, ml/jour)
- Mes règles de co-activités et contraintes saisonnières
- Mes jalons MOE/MOA (points de validation, livraisons intermédiaires)

Je veux que tu construises un skill capable de :
1. Lire un planning initial et extraire phases, durées, dépendances
2. Identifier le chemin critique et les marges par phase
3. Recalculer le planning quand je signale un aléa (retard livraison, intempérie, absence, OS, co-activité bloquée)
4. Proposer 2 ou 3 scénarios de rattrapage chiffrés en jours et en coût
5. Rédiger la note d'impact prête à envoyer à la MOA (format CCAG-Travaux)

Objectif : passer de 5 h à 30 min par recalage hebdo.
Cible : conducteur de travaux, marchés privés et publics, tous corps d'état.

Commence par me dire ce qu'il te manque pour que le skill soit fiable.`;

const PROMPT_USAGE_QUOTIDIEN_TEXT = `Voici l'aléa du jour :
- Chantier : [nom du chantier]
- Type d'aléa : [retard livraison / intempérie / absence / co-activité bloquée / OS supplémentaire]
- Durée d'impact : [X jours]
- Tâche(s) touchée(s) : [liste précise des phases concernées]
- Date de l'aléa : [date]

Donne-moi :
1. L'impact sur le chemin critique (en jours)
2. Le planning recalé sous forme de tableau Phase / Initial / Recalé / Écart / Marge
3. Deux ou trois scénarios de rattrapage chiffrés en jours ET en coût
4. La note d'impact prête à signer pour la MOA (format CCAG art. 19)

Si l'impact dépasse la marge contractuelle, signale-le en alerte rouge
et propose la formulation exacte pour la lettre de prolongation de délai.`;

const PROMPT_AJUSTEMENT_INTEMPERIE_TEXT = `J'oublie un cas important : quand une intempérie bloque le gros œuvre
sur 3 jours, ne décale pas mécaniquement TOUT le reste du planning.

Vérifie d'abord, dans cet ordre :
1. Si on peut absorber sur les marges existantes
2. Si on peut démarrer le second œuvre en zone décoffrée plus tôt
3. Si l'équipe peut travailler le samedi suivant (coût majoré +50%)
4. Seulement après tout cela : recalage de la date de livraison

Le recalage de la date contractuelle doit toujours être le dernier recours,
et déclencher automatiquement la rédaction de la note d'impact CCAG art. 19.`;

const MATIERE_CHECKLIST = [
  {
    titre: "Tes 2 ou 3 derniers plannings finalisés",
    detail:
      "Format PDF, Excel ou export MS Project. Idéalement des chantiers de typologies différentes (logement collectif, tertiaire, réhabilitation) pour que le skill apprenne tes habitudes de phasage.",
  },
  {
    titre: "Ton phasage type par lot",
    detail:
      "Terrassement, fondations, gros œuvre, charpente, étanchéité, façade, cloisons, électricité, plomberie, sols, peintures, OPR. Plus la liste est riche, plus le skill colle à ta réalité.",
  },
  {
    titre: "Tes durées historiques par tâche",
    detail:
      "100 m² de chape liquide à 2 ouvriers = 1,5 j. 50 ml de cloison BA13 à 2 plaquistes = 1 j. Un étage de plâtrerie 800 m² = 12 j. Sans ces ratios, le skill recalcule à l'aveugle.",
  },
  {
    titre: "Tes contraintes et règles spécifiques",
    detail:
      "Co-activités interdites, accès chantier centre-ville, DICT et autorisations préalables, saisonnalité (béton à -5 °C, étanchéité hors pluie), exigences MOA (PV de réception intermédiaires).",
  },
  {
    titre: "Tes plans types de recalage",
    detail:
      "Quand un retard survient : glissement, samedi travaillé, anticipation du second œuvre, arbitrage MOA ? Documente ta cascade décisionnelle — le skill la reproduira.",
  },
] as const;

const CONTROLE_6_POINTS = [
  "Les corps d'état sont bien reconnus (gros œuvre, charpente, étanchéité, plâtrerie, électricité, plomberie, peinture, sols)",
  "Les dépendances classiques sont respectées (béton → décoffrage → charpente, plâtrerie → électricité → peinture)",
  "Les durées proposées sont cohérentes avec tes ratios (m²/jour, ml/jour)",
  "Les co-activités interdites sont bien bloquées dans la logique",
  "Le format de sortie te convient (tableau, Gantt simplifié, note d'impact PDF)",
  "La cascade décisionnelle de recalage suit ton arbre de décision",
] as const;

const EXEMPLE_RECALAGE_ROWS = [
  ["Gros œuvre", "S12 → S18", "S12 → S19", "+3 j", "0 j ⚠"],
  ["Étanchéité", "S19 → S22", "S20 → S23", "+3 j", "5 j"],
  ["Cloisons", "S22 → S26", "S22 → S26", "0", "Anticipée"],
  ["Sols", "S27 → S30", "S27 → S30", "0", "OK"],
] as const;

const FAQ_ITEMS = [
  {
    q: "Combien de temps pour construire ce skill ?",
    a: "Compte 1 h 30 à 2 h la première fois : 30 min pour rassembler ta matière (étape 2), 1 h pour la conversation avec Claude (étapes 3 et 4). Une fois packagé, tu l'utilises à vie sur tous tes chantiers — la construction est un coût ponctuel.",
  },
  {
    q: "Faut-il MS Project pour utiliser ce skill ?",
    a: "Non. Le skill fonctionne avec un planning au format Excel, PDF, ou même une simple liste de tâches en texte. Si tu travailles sur MS Project, exporte ton planning en PDF ou Excel avant de le charger. Sans logiciel de planning, le skill peut même générer ton planning initial à partir d'un phasage et de durées que tu lui donnes.",
  },
  {
    q: "Le skill respecte-t-il le CCAG-Travaux pour les notes d'impact ?",
    a: "Oui, à condition de le préciser dans le prompt initial. Le CCAG-Travaux 2021 article 19 impose un format précis : objet de la demande, fait générateur daté, nature de l'aléa, conséquences sur le délai, conséquences financières éventuelles, demande motivée de prolongation. Le skill structure automatiquement la note selon ces rubriques.",
  },
  {
    q: "Comment Claude gère-t-il les co-activités ?",
    a: "À condition que tu lui aies donné tes règles à l'étape 2. Si tu lui as dit que la peinture est incompatible avec un ponçage de chape dans la même zone, le skill bloquera l'enchaînement. Plus tes règles métier sont explicites, plus le skill est précis.",
  },
  {
    q: "Le skill intègre-t-il jours fériés et intempéries ?",
    a: "Les jours fériés français sont intégrés par défaut grâce au mode Code execution. Pour les intempéries, deux approches : signaler l'intempérie a posteriori comme un aléa ponctuel (le skill recale ensuite), ou lui donner ta moyenne historique de jours d'intempérie par mois (le skill l'intègre comme tampon dans le planning initial). Sur un chantier de 8 mois en région parisienne, compte 12 à 15 jours d'intempérie statistiques.",
  },
  {
    q: "Le planning recalé est-il acceptable en réunion de chantier ?",
    a: "Le planning recalé sort en format tableau ou Gantt simplifié, immédiatement présentable. La force du skill, c'est surtout la note d'impact associée : elle documente l'aléa, son origine, sa durée, l'impact contractuel, le scénario retenu. C'est ce document signé qui sécurise ton dossier en cas de demande de prolongation ou de litige avec la MOA.",
  },
  {
    q: "Que faire si le retard dépasse les marges contractuelles ?",
    a: "Le skill le signale en alerte rouge et te propose la formulation exacte de la lettre de prolongation à adresser à la MOA, avec rappel des clauses contractuelles concernées (CCAP article délais, CCAG-Travaux article 19, force majeure ou ajournement). C'est typiquement le genre de courrier qui prend 45 minutes manuellement et 2 minutes avec le skill.",
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

export default function TutoSkillPlanningChantierPage() {
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
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  const howToLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: H1,
    description: getTutoPageDescription(pagePath),
    step: [
      { "@type": "HowToStep", name: "Activer la fonction Skills dans Claude Pro (Code execution, Skills, File creation)" },
      { "@type": "HowToStep", name: "Rassembler la matière (plannings, phasage, durées, contraintes, plans de recalage)" },
      { "@type": "HowToStep", name: "Lancer la conversation avec Claude et le prompt de calibrage" },
      { "@type": "HowToStep", name: "Affiner les règles métier et packager le skill" },
      { "@type": "HowToStep", name: "Tester le skill sur un chantier réel et un aléa concret" },
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
              Tuto PDF gratuit · Skill Claude · BeWork
            </p>
            <h1 className="font-heading mt-3 text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-[2.35rem] md:leading-tight">
              {H1}
            </h1>
            <p className="mt-4 max-w-none text-lg leading-relaxed text-slate-600 sm:text-[1.125rem] sm:leading-[1.7]">
              Le tutoriel pas à pas pour piloter ton planning chantier avec Claude : chemin critique extrait du planning initial, recalage en
              quelques secondes après un aléa (intempérie, retard de livraison, OS), scénarios de rattrapage chiffrés et note d’impact
              CCAG-Travaux article 19 prête à signer pour la maîtrise d’ouvrage.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <CalendlyBookingLink className="inline-flex min-h-[3rem] shrink-0 items-center justify-center rounded-xl bg-[#1d4ed8] px-7 text-[0.9375rem] font-semibold text-white shadow-md shadow-[#1d4ed8]/25 transition hover:bg-[#1e40af] md:text-base">
                Faire appel à un Beworker
              </CalendlyBookingLink>
              <a
                href={pdfPath}
                download
                className="inline-flex min-h-[3rem] shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-[0.9375rem] font-semibold text-slate-800 transition hover:bg-slate-50 md:text-base"
              >
                Télécharger le PDF (9 pages)
              </a>
            </div>
          </header>

          <section
            id="pdf-original"
            className="scroll-mt-[calc(4.55rem+1rem)] mb-14 rounded-3xl border border-slate-200 bg-slate-100/80 p-6 shadow-sm sm:p-10"
            aria-labelledby="pdf-heading"
          >
            <h2 id="pdf-heading" className="text-xl font-semibold tracking-tight text-slate-900">
              Voir le PDF original
            </h2>
            <p className="mt-3 w-full leading-relaxed text-slate-600">
              Consultez le tuto dans sa mise en page d’origine. Vous pouvez l’agrandir ou le télécharger. PDF · 9 pages.
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
                title="Skill planning chantier — PDF BeWork"
              />
            </div>
          </section>

          <aside
            className="mb-14 rounded-2xl border border-[#1d4ed8]/22 bg-gradient-to-br from-[#eff6ff] to-white p-6 shadow-sm shadow-[#1d4ed8]/06 sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-8"
            aria-label="Faire appel à un Beworker"
          >
            <div className="min-w-0 sm:flex-1">
              <p className="text-base font-semibold text-slate-900 md:text-[1.05rem]">
                Pas le temps de construire et de maintenir ce skill ?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 md:text-[0.9375rem]">
                Confiez vos plannings, vos aléas et vos notes terrain à un Beworker : on recale, on rédige la note d’impact CCAG et on relance la
                MOA pendant que vous tenez le chantier.
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
              <p className="mt-3 text-center text-xl font-semibold text-slate-900">Planning chantier</p>
              <p className="mt-2 text-center text-base text-slate-700 md:text-[1.05rem]">
                Le tutoriel pas à pas pour piloter ton planning et absorber les aléas — 30 minutes au lieu de 5 heures.
              </p>

              <h4 className="mt-14 text-xs font-semibold uppercase tracking-[0.2em] text-slate-800">Ce que tu vas apprendre</h4>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Activer la fonction Skills dans Claude (3 minutes)</li>
                <li>▸ Construire un skill qui lit ton planning et identifie le chemin critique</li>
                <li>▸ Recaler automatiquement quand un aléa survient (retard, intempérie, OS)</li>
                <li>▸ Générer la note d’impact prête à envoyer à la maîtrise d’ouvrage</li>
              </ul>

              <h3 className="mt-14 text-xl font-semibold tracking-tight text-slate-900">Pourquoi un skill Planning ?</h3>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-slate-900">
                Le planning chantier, c’est l’outil n°1 du conducteur de travaux. C’est lui qui sert de référence en réunion hebdomadaire, qui
                déclenche les commandes matériaux, qui sécurise les délais contractuels et qui protège l’entreprise en cas de litige avec la maîtrise
                d’ouvrage.
              </p>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-slate-900">
                Le problème, c’est qu’aucun planning ne tient face au réel. Une livraison décalée de 4 jours, une intempérie qui bloque le gros
                œuvre, un OS qui arrive en cours de chantier, une co-activité mal anticipée, une équipe en arrêt — et tout est à recaler. Un
                conducteur de travaux passe en moyenne 5 à 8 heures par semaine sur ses plannings et les notes d’impact qui vont avec.
              </p>

              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Avec un skill bien construit</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Le skill lit ton planning initial et en extrait phases, durées, dépendances</li>
                <li>▸ Le chemin critique et les marges par phase sont identifiés automatiquement</li>
                <li>▸ Tu signales l’aléa du jour, le planning est recalé en quelques secondes</li>
                <li>▸ Deux à trois scénarios de rattrapage chiffrés en jours te sont proposés</li>
                <li>▸ La note d’impact à transmettre à la MOA est rédigée prête à signer</li>
              </ul>
              <p className="mt-6 text-[1.0625rem] font-semibold text-slate-900">
                Résultat : 30 minutes de recalage hebdo au lieu de 5 heures.
              </p>

              <div className="mt-10 rounded-2xl border border-[#1d4ed8]/30 bg-[#eff6ff] p-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1d4ed8]">Sécurité juridique — pourquoi c’est critique</p>
                <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                  Le planning n’est pas qu’un outil de pilotage : c’est une pièce contractuelle. Le CCAG-Travaux 2021 (article 19) impose que toute
                  prolongation de délai soit demandée par écrit, datée et justifiée. Sans note d’impact tracée, l’entreprise s’expose à des
                  pénalités de retard (souvent 1/1000ᵉ du montant marché par jour calendaire). Sur un marché à 800 000 € HT, 10 jours de retard non
                  justifiés = 8 000 € de pénalités. Le skill sécurise cette traçabilité automatiquement.
                </p>
              </div>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">1 </span>
                Active la fonction Skills
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Avant tout, vérifie que tu as bien un compte Claude Pro à 18 €/mois. La fonction Skills n’est disponible que sur les comptes Pro —
                pas sur le plan gratuit.
              </p>
              <p className="mt-6 text-[1.0625rem] font-semibold text-slate-900">Le chemin exact</p>
              <ol className="mt-3 list-decimal space-y-2 pl-6 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>Connecte-toi sur claude.ai.</li>
                <li>Clique sur ton initiale en bas à gauche, puis sur Settings.</li>
                <li>Va dans l’onglet Capabilities.</li>
                <li>
                  Active les trois options :
                  <ul className="mt-2 list-none space-y-1 pl-0 text-[1.0625rem] leading-relaxed text-slate-900">
                    <li>▸ <strong>Code execution</strong> — pour que Claude puisse calculer dates et durées</li>
                    <li>▸ <strong>Skills</strong> — pour créer et utiliser tes propres skills</li>
                    <li>▸ <strong>File creation</strong> — pour générer planning Excel, Gantt PDF et notes Word</li>
                  </ul>
                </li>
              </ol>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                <strong className="font-semibold">Point important :</strong> si tu ne vois pas l’onglet Capabilities, ton compte est probablement
                encore en plan gratuit. Le passage Pro est instantané et donne accès aux Skills et au mode Code execution indispensable pour les
                calculs de dates ouvrées, jours fériés et coefficients d’intempéries.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">2 </span>
                Rassemble ta matière
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Plus ta matière est précise, plus ton skill sera juste. Voici les 5 éléments à réunir avant de lancer la conversation avec Claude.
              </p>
              <ol className="mt-6 space-y-5 text-[1.0625rem] leading-relaxed text-slate-900">
                {MATIERE_CHECKLIST.map((item, idx) => (
                  <li key={item.titre}>
                    <strong className="font-semibold">
                      {idx + 1}. {item.titre}
                    </strong>
                    {" — "}
                    {item.detail}
                  </li>
                ))}
              </ol>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">3 </span>
                Lance la conversation avec Claude
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Ouvre une nouvelle conversation Claude. Charge tes documents en pièces jointes, puis colle exactement ce prompt.
              </p>
              <PromptBlock label="PROMPT — CALIBRAGE DU SKILL" promptText={PROMPT_CALIBRATION_TEXT} />
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                <strong className="font-semibold">Le point clé :</strong> la dernière phrase compte autant que les autres — « Commence par me dire ce
                qu’il te manque. » Tu obliges Claude à faire le diagnostic AVANT de produire, au lieu de partir directement et de générer un skill
                bancal. Il va te poser 3 à 5 questions ciblées sur tes contraintes métier — réponds avec précision, c’est ce qui fait la différence
                entre un skill générique et un skill qui pilote vraiment ton chantier.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">4 </span>
                Affine et active ton skill
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Claude te propose une première version du skill. Avant d’activer, contrôle ces 6 points — c’est l’étape qui sépare un skill correct
                d’un skill exploitable au quotidien.
              </p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                {CONTROLE_6_POINTS.map((p) => (
                  <li key={p}>▸ {p}</li>
                ))}
              </ul>
              <PromptBlock label="EXEMPLE D’AJUSTEMENT — RÈGLE INTEMPÉRIE" promptText={PROMPT_AJUSTEMENT_INTEMPERIE_TEXT} />
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Une fois les ajustements faits, demande à Claude de packager le skill. Tu le retrouves dans tes Skills disponibles à chaque nouvelle
                conversation, lançable simplement en mentionnant « planning chantier » dans ta demande.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">5 </span>
                Teste sur un vrai chantier
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Maintenant que ton skill est packagé, mets-le à l’épreuve sur un chantier réel — pas un cas théorique, un vrai dossier en cours.
              </p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Choisis le chantier le plus représentatif de ton activité</li>
                <li>▸ Charge son planning actuel (Gantt PDF ou Excel)</li>
                <li>▸ Donne un aléa réel survenu cette semaine ou la semaine passée</li>
                <li>▸ Vérifie le recalage proposé contre ce que tu aurais fait manuellement</li>
                <li>▸ Si écart, demande à Claude pourquoi — et ajuste les règles si besoin</li>
              </ul>
              <PromptBlock label="PROMPT — UTILISATION QUOTIDIENNE" promptText={PROMPT_USAGE_QUOTIDIEN_TEXT} />

              <p className="mt-10 text-[1.0625rem] font-semibold text-slate-900">
                Exemple de sortie générée par le skill — intempérie 3 jours sur gros œuvre, semaine 12 :
              </p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[560px] border-separate border-spacing-y-2 text-left text-[0.95rem]">
                  <thead>
                    <tr className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                      <th scope="col" className="py-2 pr-4">Phase</th>
                      <th scope="col" className="py-2 pr-4">Initial</th>
                      <th scope="col" className="py-2 pr-4">Recalé</th>
                      <th scope="col" className="py-2 pr-4">Écart</th>
                      <th scope="col" className="py-2 pr-4">Marge</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-800">
                    {EXEMPLE_RECALAGE_ROWS.map((row) => (
                      <tr key={row[0]} className="rounded-lg bg-slate-50">
                        <th scope="row" className="rounded-l-lg py-3 pl-4 pr-4 align-top font-semibold text-slate-900">
                          {row[0]}
                        </th>
                        <td className="py-3 pr-4 align-top">{row[1]}</td>
                        <td className="py-3 pr-4 align-top">{row[2]}</td>
                        <td className="py-3 pr-4 align-top font-semibold text-[#1d4ed8]">{row[3]}</td>
                        <td className="rounded-r-lg py-3 pr-4 align-top text-slate-600">{row[4]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">Questions fréquentes</h3>
              <dl className="mt-6 space-y-7">
                {FAQ_ITEMS.map((item) => (
                  <div key={item.q}>
                    <dt className="text-[1.05rem] font-semibold text-slate-900">{item.q}</dt>
                    <dd className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">{item.a}</dd>
                  </div>
                ))}
              </dl>

              <p className="mt-14 text-xl font-semibold uppercase tracking-wide text-slate-900">Pas le temps de le faire vous-même ?</p>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Faire appel à un Beworker</p>
              <p className="mt-3 text-[1.0625rem] font-medium text-slate-800">
                Assistants travaux BTP · Relais dossiers chantier · Augmentés par l’IA
              </p>

              <p className="mt-10 text-2xl font-bold uppercase tracking-tight text-slate-900">
                ON TIENT LE BUREAU, VOUS TENEZ LE CHANTIER
              </p>
              <ul className="mt-6 list-none space-y-3 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Vous nous envoyez vos plannings, vos aléas, vos notes terrain.</li>
                <li>▸ On recale le planning, on rédige les notes d’impact CCAG, on relance la MOA.</li>
                <li>▸ Vous restez 100 % sur le chantier, le pilotage admin roule sans vous.</li>
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

          <div className="mt-12 flex justify-center pb-14">
            <BeWorkLogo className="opacity-95" aria-label="Logo BeWork" />
          </div>
        </main>
      </div>
    </>
  );
}
