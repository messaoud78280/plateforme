import { getTutoPageDescription, tutoPageMetadata } from "@/lib/seo-tuto-metadata";
import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { CopyPromptButton } from "@/components/ressources/CopyPromptButton";
import { buildWebPageAndBreadcrumbJsonLd } from "@/lib/seo-landing-json-ld";
import { absoluteUrl, SITE_URL } from "@/lib/site";

const pagePath = "/ressources/tuto-skill-metre-bework";

const pdfPath = "/ressources/pdf/tuto-skill-metre-bework.pdf";

const pageUrl = absoluteUrl(pagePath);

const PROMPT_CALIBRATION_TEXT = `Je veux que tu m'aides à créer un skill Claude qui s'appelle
"metre-quantitatif-qualitatif".

Mon métier : [tes lots — gros œuvre, étanchéité, électricité…]

Ma zone : [Île-de-France, Grand Ouest, etc.]

Mon CA annuel : [X M€]

Type de marchés : [privé / public / les deux]

Ce que le skill doit faire à chaque dossier que je lui soumettrai :

1. Lire un dossier (plans + CCTP) que je fournis

2. Extraire toutes les quantités par lot et par unité (U, ml, m², m³)

3. Sortir un métré quantitatif structuré au format DPGF

4. Sortir un métré qualitatif (descriptif, marque, classe, repère)

5. Croiser plan / CCTP / DPGF pour détecter écarts et oublis
(avec localisation : page CCTP + numéro de plan)

6. Appliquer mes ratios internes (foisonnement, perte)

7. Générer un fichier Excel téléchargeable

Voici les fichiers que je te transmets :

[joindre 2-3 anciens métrés + nomenclature + ratios + trame DPGF]

Crée le skill, propose-moi la structure avant de coder, et explique-moi
en français comment je l'utiliserai au quotidien.`;

const PROMPT_USAGE_QUOTIDIEN_TEXT = `/metre-quantitatif-qualitatif

Affaire : [Nom du chantier — Maître d'ouvrage]

Lot concerné : [ton lot]

Date limite remise offre : [date]

Mes priorités : [coût, délai, complexité technique, etc.]

[joindre les plans (PDF) + CCTP (PDF) + DPGF vierge (Excel)]

Sors-moi :

1. Le métré quantitatif complet (par lot, par unité)

2. Le métré qualitatif (descriptifs, marques, classes)

3. Les écarts plan / CCTP détectés

4. Les questions à poser à la maîtrise d'œuvre

5. Le DPGF Excel pré-rempli`;

const PROMPT_EXEMPLE_AJUSTEMENT_TEXT = `Modifie le skill : sur ce test :

- Le lot 03 charpente n'inclut pas les pannes intermédiaires

- Le foisonnement terrassement est à 1,15 alors que je travaille à 1,20

- Le DPGF sort sans la colonne "PU HT" (à ajouter)

Corrige ces 3 points et regénère le skill.`;

const H1 = "Crée ton skill — Métré quantitatif et qualitatif";


const breadcrumbItems = [
  { name: "Accueil", href: "/" },
  { name: "Ressources", href: "/ressources" },
  { name: H1, href: pagePath },
] as const;

const FAQ_FOR_JSON_LD = [
  {
    question: "Combien de temps pour créer le skill complet ?",
    answer:
      "Compte 1h30 à 2h pour la première création : environ 30 min pour rassembler la matière (plans, CCTP, nomenclature, modèle de sortie), 30 min pour la conversation de cadrage avec Claude, 30 min pour l'ajustement et un premier test. Les dossiers suivants sont souvent métrés en une à deux heures chacun. Tu amortis l'investissement dès le deuxième dossier bien traité.",
  },
  {
    question: "Le skill remplace-t-il le métreur ?",
    answer:
      "Non, et il n'a pas vocation à le faire. Le skill fait l'extraction et la synthèse — le métreur garde le chiffrage, l'arbitrage technique, l'optimisation et la connaissance des fournisseurs locaux. Le skill peut libérer une grande partie du temps de saisie pour se concentrer sur la valeur ajoutée.",
  },
  {
    question: "Et si les plans sont au format DWG ou incomplets ?",
    answer:
      "Convertis tes DWG en PDF (AutoCAD ou équivalent → impression PDF). Claude lit très bien les PDF vectoriels ainsi que nombre de scans. Si des cotes manquent ou se contredisent, le skill doit les signaler dans une rubrique « Questions MOE » — que tu pourras poser en RFI à la maîtrise d'œuvre.",
  },
  {
    question: "Comment garantir la fiabilité des quantités ?",
    answer:
      "Trois garde-fous : (1) demander au skill de lister ses sources pour chaque quantité (plan n°X, page Y du CCTP), (2) imposer une vérif croisée plan / CCTP / DPGF avec signalement des écarts, (3) contrôler à la main au moins les premiers dossiers. Un bon calibrage vise très souvent un très haut niveau de fiabilité — le dernier mile reste votre validation.",
  },
  {
    question: "Comment intégrer mes ratios internes ?",
    answer:
      "Tu les fournis à la création du skill sous forme de tableau (poste / coefficient / commentaire). Le skill peut les réappliquer automatiquement et les faire évoluer : « Mets à jour le skill avec ces nouveaux ratios » lorsque tes paramètres changent.",
  },
  {
    question: "Combien de temps Claude met-il pour traiter un dossier complet ?",
    answer:
      "Selon volumétrie, de quelques minutes à une dizaine de minutes peuvent être courants pour de gros dossiers en traitement automatique — à distinguer du temps humain total : contrôle qualité (souvent 15-30 min) et ajustements. L'objectif est de réduire fortement les heures de saisie manuelle pure.",
  },
  {
    question: "Et si je n'ai pas le temps de mettre tout ça en place ?",
    answer:
      "BeWork peut reprendre le déblayage : transmission du dossier à réception pour livrer métré quantitatif + qualitatif et DPGF pré-rempli sous un créneau cadré — vous conservez la main sur les prix unitaires et la stratégie d'offre.",
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

export default function TutoSkillMetreBeworkPage() {
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
      { "@type": "HowToStep", name: "Activer la fonction Skills dans Claude" },
      { "@type": "HowToStep", name: "Rassembler la matière (métrés, nomenclature, ratios, trame DPGF)" },
      { "@type": "HowToStep", name: "Lancer la conversation de cadrage avec le prompt complet" },
      { "@type": "HowToStep", name: "Affiner puis activer le skill métier" },
      { "@type": "HowToStep", name: "Tester sur un dossier réel et comparer au métré de référence" },
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
              Tuto PDF gratuit · Métré BTP · BeWork
            </p>
            <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-[2.35rem] md:leading-tight">
              {H1}
            </h1>
            <p className="mt-4 max-w-none text-lg leading-relaxed text-slate-600 sm:text-[1.125rem] sm:leading-[1.7]">
              Passer des plans et du CCTP à un métré quantitatif + qualitatif structuré, avec croisements, ratios et DPGF Excel — PDF mis en page et transcription
              intégrée.
            </p>
            <p className="mt-3 max-w-xl text-[0.9375rem] leading-relaxed text-slate-600">
              Pour enchaîner sur le prix : voir aussi le{" "}
              <Link href="/ressources/tuto-skill-chiffrage-devis-bework" className="font-semibold text-[#1d4ed8] underline-offset-4 hover:underline">
                tutoriel PDF chiffrage de devis
              </Link>{" "}
              et{" "}
              <Link href="/ressources/chiffrage-devis-btp" className="font-semibold text-[#1d4ed8] underline-offset-4 hover:underline">
                guide chiffrage devis BTP
              </Link>
              .
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <CalendlyBookingLink className="inline-flex min-h-[3rem] shrink-0 items-center justify-center rounded-xl bg-[#1d4ed8] px-7 text-[0.9375rem] font-semibold text-white shadow-md shadow-[#1d4ed8]/25 transition hover:bg-[#1e40af] md:text-base">
                Réservez un appel
              </CalendlyBookingLink>
              <span className="text-sm leading-snug text-slate-600 sm:max-w-sm">
                20&nbsp;minutes pour cadrer métré, DPGF ou relais administratif BTP — sans engagement.
              </span>
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
                title="Crée ton skill — Métré quantitatif et qualitatif — PDF BeWork"
              />
            </div>
          </section>

          <aside
            className="mb-14 rounded-2xl border border-[#1d4ed8]/22 bg-gradient-to-br from-[#eff6ff] to-white p-6 shadow-sm shadow-[#1d4ed8]/06 sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-8"
            aria-label="Réserver un appel découverte"
          >
            <div className="min-w-0 sm:flex-1">
              <p className="text-base font-semibold text-slate-900 md:text-[1.05rem]">Métré sous pression avant date limite d&apos;offre&nbsp;?</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 md:text-[0.9375rem]">
                BeWork peut aider au déblayage (extraction structurée, DPGF pré-rempli selon cadrage) — vous gardez le chiffrage et la validation métier finale.
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
              <p className="mt-3 text-center text-xl font-semibold text-slate-900">Métré quantitatif et qualitatif</p>
              <p className="mt-2 text-center text-base text-slate-700 md:text-[1.05rem]">
                Le tutoriel pas à pas pour transformer plans + CCTP en métré exploitable — quelques heures concentrées au lieu d&apos;une semaine dissoute dans la
                saisie manuelle pure.
              </p>

              <h4 className="mt-14 text-xs font-semibold uppercase tracking-[0.2em] text-slate-800">Ce que tu vas apprendre</h4>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Activer la fonction Skills dans Claude (environ cinq minutes, une fois)</li>
                <li>▸ Préparer la matière utile : plans, CCTP, ratios, DPGF type</li>
                <li>▸ Créer un skill qui sort un métré quantitatif + qualitatif fiable</li>
                <li>▸ L&apos;utiliser au quotidien pour chiffrer plus vite et avec moins d&apos;oublis structurels</li>
              </ul>

              <h3 className="mt-14 text-xl font-semibold tracking-tight text-slate-900">Pourquoi un skill Métré&nbsp;?</h3>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-slate-900">
                Le métré — quantitatif et qualitatif — nourrit tout le cycle commercial : sans quantités lisibles ni descriptifs alignés avec les pièces, le devis
                et la réponse à l&apos;appel d&apos;offres perdent en crédibilité et les marges se fragilisent vite dès les premières anomalies d&apos;unité ou les postes
                oubliés.
              </p>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Avec un skill bien construit, voilà ce qui change</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Plans + CCTP fournis&nbsp;: extraction des quantités par lot avec unités (U, ml, m², m³).</li>
                <li>▸ Croisement plan / CCTP / grille DPGF pour signaler oublis et écarts.</li>
                <li>▸ Ratios métiers (foisonnement, pertes…) calés sur tes tableaux société.</li>
                <li>▸ Volet qualitatif structuré (descriptifs, marque, classe, repère où pertinent).</li>
                <li>▸ Livrable Excel de DPGF pré-rempli avant saisie des prix unitaires.</li>
              </ul>
              <p className="mt-10 text-[1.0625rem] leading-relaxed text-slate-900">
                Un métré propre améliore la compétitivité&nbsp;: votre expertise reste sur l&apos;arbitrage et le prix&nbsp;; le skill accélère l&apos;extraction et la
                structuration répétitive.
              </p>

              <h3 className="mt-14 text-xl font-semibold uppercase tracking-wide text-slate-900">Les 4 unités de base du métré</h3>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-slate-900">
                <strong className="font-semibold text-slate-800">U</strong> — unité comptée (portes, prises, regards…).
                <br />
                <strong className="font-semibold text-slate-800">ml</strong> — mètre linéaire (plinthes, gouttières, joints…).
                <br />
                <strong className="font-semibold text-slate-800">m²</strong> — mètre carré (cloisons, dalles, peinture…).
                <br />
                <strong className="font-semibold text-slate-800">m³</strong> — mètre cube (béton, terrassement, isolant volumique…).
              </p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Classer chaque ligne dans la bonne unité dès le départ limite la majorité des erreurs de chiffrage liées à une confusion m² / m³ ou ml / U.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">1 </span>
                Active la fonction Skills dans Claude
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Un abonnement Claude Pro (de l&apos;ordre de 18&nbsp;€/mois selon l&apos;offre affichée) est en pratique nécessaire pour faire tourner des skills. Depuis{" "}
                <strong className="font-semibold text-slate-800">Settings → Capabilities</strong>, active{" "}
                <strong className="font-semibold text-slate-800">Code execution</strong>, <strong className="font-semibold text-slate-800">Skills</strong> et{" "}
                <strong className="font-semibold text-slate-800">File creation</strong> lorsque tu veux générer des fichiers Excel téléchargeables. Vérifie aussi le
                modèle sélectionné (line-up récent préférable) et reconnecte la session si l&apos;onglet Capabilities n&apos;apparaît pas.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">2 </span>
                Rassemble ta matière
              </h3>
              <p className="mt-6 text-[1.0625rem] font-semibold text-slate-900">1. Tes 2-3 derniers métrés finalisés</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Plans + CCTP + DPGF d&apos;affaires similaires déjà chiffrées : c&apos;est la référence de niveau de détail et de découpage.
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">2. Ta nomenclature interne par lot</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Structure type du DPGF (lots 01, 02… ou codes maison)&nbsp;: gros œuvre, charpente, étanchéité, plomberie, électricité, etc.
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">3. Tes ratios internes</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">Foisonnement, pertes matériaux, productivités, PU de référence si tu en utilises comme garde-fous.</p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">4. Tes contraintes ou règles spécifiques</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Marques imposées, classes de matériaux, normes ou DTU prioritaires, vigilances habituelles (PMR, ERP, fondations spéciales…).
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">5. Une trame de DPGF type</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">Excel ou PDF modèle&nbsp;: plus la grille est nette en entrée, plus la sortie reste exploitable ligne à ligne.</p>
              <p className="mt-8 text-[1.0625rem] leading-relaxed text-slate-900">
                <strong className="font-semibold text-slate-800">Réflexe pro — anonymisation&nbsp;:</strong> avant upload, retire ou masque prix d&apos;achat nets, marges
                confidentielles, noms de sous-traitants sensibles&nbsp;; garde volumes, libellés et structures.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">3 </span>
                Lance la conversation avec Claude
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Nouvelle conversation, tous les fichiers joints, puis le prompt suivant après adaptation des zones entre crochets. Demande systématiquement une proposition
                de structure <em>avant</em> figement du skill.
              </p>
              <PromptBlock label="PROMPT À COLLER DANS CLAUDE" promptText={PROMPT_CALIBRATION_TEXT} />
              <p className="mt-8 text-xl font-semibold uppercase tracking-wide text-slate-900">Le point clé</p>
              <p className="mt-4 text-[1.0625rem] leading-relaxed text-slate-900">
                Quinze minutes de dialogue pour cadrer la logique évite des heures de réécriture une fois le skill sauvegardé.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">4 </span>
                Affine et active ton skill
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">Passe ces six points avant validation finale&nbsp;:</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Unités bien attribuées (m² vs m³, ml vs U).</li>
                <li>▸ Lots découpés selon <em>ta</em> nomenclature, pas un squelette générique.</li>
                <li>▸ Métré qualitatif avec marque + classe + repère là où ça vous sert.</li>
                <li>▸ Foisonnement et pertes alignés avec vos tableaux ratios.</li>
                <li>▸ Écarts plan / CCTP signalés explicitement (alertes lisibles).</li>
                <li>▸ DPGF Excel respectant colonnes, ordre et formules de votre trame.</li>
              </ul>
              <PromptBlock label="EXEMPLE D&apos;AJUSTEMENT" promptText={PROMPT_EXEMPLE_AJUSTEMENT_TEXT} />
              <p className="mt-8 text-[1.0625rem] leading-relaxed text-slate-900">
                Quand la structure te convient&nbsp;: demande à Claude d&apos;activer le skill — il sera invocable ensuite via&nbsp;
                <strong className="font-semibold text-slate-800">/metre-quantitatif-qualitatif</strong> comme dans le tutoriel papier complet.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">5 </span>
                Teste sur un vrai dossier
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Pars d&apos;un dossier dont tu connais déjà les quantités&nbsp;: colle la sortie du skill contre ton métré de vérité ligne à ligne pour affiner tes consignes
                jusqu&apos;au plateau de fiabilité voulu. Joigne plans PDF + CCTP PDF + DPGF vierge&nbsp;; précise lot, deadline et priorités métier dans le même fil.
              </p>
              <PromptBlock label="PROMPT — UTILISATION QUOTIDIENNE" promptText={PROMPT_USAGE_QUOTIDIEN_TEXT} />

              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">La règle d&apos;or</p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Mets à jour le skill quelques fois par an lorsque tes formats ou types de chantiers bougent&nbsp;: nouveau poste récurrent oublié, mise à jour d&apos;une colonne DPGF, ratio revu par le siège —
                quelques lignes ajoutées suffisent souvent à verrouiller l&apos;avantage.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">FAQ — les sept questions récurrentes</h3>

              {FAQ_FOR_JSON_LD.map((q) => (
                <div key={q.question} className="mt-10 border-t border-slate-100 pt-10 first:mt-8 first:border-t-0 first:pt-0">
                  <h4 className="text-[1.05rem] font-semibold text-slate-900">{q.question}</h4>
                  <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">{q.answer}</p>
                </div>
              ))}

              <p className="mt-14 text-xl font-semibold uppercase tracking-wide text-slate-900">Pas le temps de le faire vous-même&nbsp;?</p>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Faire appel à un Assistant Travaux BeWork</p>
              <p className="mt-3 text-[1.0625rem] font-medium text-slate-800">
                Assistant travaux BTP · Relais dossiers chantier · Augmenté par l&apos;IA
              </p>

              <p className="mt-10 text-2xl font-bold uppercase tracking-tight text-slate-900">ON TIENT LE BUREAU, VOUS TENEZ LE CHANTIER</p>
              <ul className="mt-6 list-none space-y-3 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Vous nous envoyez les plans, le CCTP et le DPGF vierge dès réception du dossier.</li>
                <li>▸ On extrait, on structure, on remplit le DPGF — 24&nbsp;à 48&nbsp;h selon complexité.</li>
                <li>▸ Vous chiffrez les prix unitaires avec moins d&apos;erreurs de quantité et moins de postes oubliés.</li>
              </ul>
              <p className="mt-10 text-[1.0625rem] font-semibold text-slate-900">
                Réservez un appel de cadrage de 20&nbsp;minutes sur{" "}
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
