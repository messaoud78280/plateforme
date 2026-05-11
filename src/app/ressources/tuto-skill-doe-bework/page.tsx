import type { Metadata } from "next";
import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { CopyPromptButton } from "@/components/ressources/CopyPromptButton";
import { buildWebPageAndBreadcrumbJsonLd } from "@/lib/seo-landing-json-ld";
import { absoluteUrl, SITE_URL } from "@/lib/site";

const pagePath = "/ressources/tuto-skill-doe-bework";

const CANONICAL_URL = "https://www.bework.fr/ressources/tuto-skill-doe-bework";

const pdfPath = "/ressources/pdf/tuto-skill-doe-bework.pdf";

const PROMPT_CALIBRATION_TEXT = `Je veux que tu créés un skill personnalisé pour générer mes
DOE (Dossiers des Ouvrages Exécutés).
Contexte :
- Je suis [conducteur de travaux / dirigeant] chez [TON ENTREPRISE]
- Métier : [maçonnerie / second œuvre / multi-lots / etc.]
- Marchés : [privés / publics / mixtes]
- Volume : 20 à 40 DOE par an
- Sortie : Word .docx page de garde + sommaire indexé
Je t'ai uploadé : 3 derniers DOE livrés, mon sommaire type,
mes exigences MOA, ma liste sous-traitants, mon template.
Construis un skill qui :
1. Génère la page de garde aux normes (logo, marché, dates)
2. Produit un sommaire indexé conforme aux 9 rubriques DOE
3. Numérote les pièces selon la nomenclature MOA exigée
4. Insère automatiquement la liste des sous-traitants
5. Signale les pièces manquantes ou non fournies
6. Adapte la structure au type de marché (CCAG / privé)
7. Respecte ma charte graphique d'entreprise
Avant de générer, pose-moi 5 à 10 questions de calibrage.`;

const PROMPT_USAGE_QUOTIDIEN_TEXT = `Active le skill doe.
Contexte du chantier :
- Marché : [NOM]
- MOA : [NOM] / MOE : [NOM]
- Type : [neuf / rénovation / TP] / [public / privé]
- Date de réception : [JJ/MM/AAAA]
- Plateforme de dépôt : [Aconex / Kairnial / autre / papier]
Pièces en ma possession (cocher) :
- Plans EXE et TQE : oui/non
- Notes de calcul : oui/non
- PV étanchéité / électricité / autres : préciser
- Fiches techniques : nombre approximatif
- Attestations sous-traitants décennales : nombre
- Notices d'entretien : oui/non
Génère la page de garde + le sommaire indexé + la checklist
des pièces manquantes à récupérer.`;

const PROMPT_EXEMPLE_AJUSTEMENT_TEXT = `Le brouillon est bien mais 3 points à corriger :
1. Pour les marchés publics, ajoute systématiquement une mention
de référence au CCAG-Travaux 2021 (article 30 — délai 60 jours
après réception)
2. Dans la rubrique PV d'essais, distingue clairement les essais
réglementaires (étanchéité, électricité CONSUEL, gaz Qualigaz)
des essais contractuels (acoustique, désenfumage, hydraulique)
3. Ajoute une page « Suivi de la garantie de parfait achèvement »
avec un tableau permettant de tracer les interventions GPA des
12 mois suivant la réception
Régénère le skill avec ces ajustements et propose-moi un nouveau
DOE test sur le même cas fictif.`;

const H1 = "Crée ton skill — DOE";

const META_DESCRIPTION =
  "Tutoriel BeWork gratuit : skill Claude pour compiler un DOE BTP — 9 rubriques, page de garde + sommaire .docx, checklist manquants, prompts.";

const breadcrumbItems = [
  { name: "Accueil", href: "/" },
  { name: "Ressources", href: "/ressources" },
  { name: H1, href: pagePath },
] as const;

const FAQ_FOR_JSON_LD = [
  {
    question: "Que se passe-t-il si je remets le DOE en retard ?",
    answer:
      "Pour les marchés publics, l'article 30 du CCAG-Travaux 2021 fixe un délai de 60 jours après réception. En cas de dépassement, des pénalités contractuelles s'appliquent (généralement 1/3 000ème par jour de retard du montant du marché) et le solde peut être bloqué jusqu'à remise complète. Pour les marchés privés, les CCAP fixent leurs propres délais (souvent 30 à 90 jours). Dans tous les cas, le DOE conditionne la libération de la retenue de garantie à 1 an.",
  },
  {
    question: "Le DOE et le DIUO sont-ils la même chose ?",
    answer:
      "Non. Le DOE concerne les ouvrages exécutés (plans, notices, fiches techniques) et est destiné à l'exploitation et à la maintenance. Le DIUO — Dossier d'Intervention Ultérieure sur l'Ouvrage — est imposé par l'article R4532-95 du Code du travail pour les ouvrages soumis à coordination SPS. Il est rédigé par le coordonnateur SPS et concerne la sécurité des futures interventions de maintenance. Les deux peuvent être réunis dans un même livrable mais leurs auteurs et leurs finalités diffèrent.",
  },
  {
    question: "Que faire si un sous-traitant ne fournit pas ses fiches ?",
    answer:
      "Procédure standard : relance écrite (mail puis LRAR si nécessaire) avec rappel des obligations contractuelles. La plupart des contrats de sous-traitance imposent la fourniture des PV et fiches dans les 30 jours suivant la fin d'intervention. En dernier recours, retenue sur le solde du sous-traitant jusqu'à fourniture complète. Le skill peut générer le mail de relance type avec les références contractuelles précises.",
  },
  {
    question: "Faut-il livrer le DOE en papier ou en numérique ?",
    answer:
      "Cela dépend du marché. La majorité des MOA publics et privés exige désormais le numérique (PDF indexés sur plateforme type Aconex, Kairnial, SharePoint MOA). Le papier n'est généralement maintenu que pour les ouvrages classés ou les exploitants peu numérisés. Vérifie systématiquement le CCAP et le RC du marché. Le skill peut produire les deux formats si nécessaire.",
  },
  {
    question: "Mes données chantier sont-elles confidentielles ?",
    answer:
      "Anthropic (l'éditeur de Claude) ne réutilise pas le contenu de tes conversations Pro et Team pour entraîner ses modèles. Tes plans, fiches sous-traitants et listes de pièces restent associés à ton compte et sont supprimables à tout moment. Pour les chantiers ultra-sensibles (sites classés défense, OIV), travaille avec des références anonymisées dans le prompt — c'est une pratique de prudence raisonnable.",
  },
  {
    question: "Que faire si le MOA refuse le DOE pour incomplétude ?",
    answer:
      "Le MOA dispose en général d'un délai de 30 jours pour valider ou retourner le DOE avec ses observations. S'il refuse, tu disposes de 30 jours supplémentaires pour fournir les pièces manquantes ou contestables. Le skill peut générer rapidement la version 2 corrigée à partir de la liste d'observations. Ne laisse pas traîner : chaque jour de retard reste imputé à l'entreprise sur le délai initial de 60 jours, donc plus tu corriges vite, mieux tu sécurises ton solde.",
  },
] as const;

export const metadata: Metadata = {
  title: "Crée ton skill — DOE | BeWork",
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
    title: "Crée ton skill — DOE | BeWork",
    description: META_DESCRIPTION,
    images: [{ url: absoluteUrl("/opengraph-image"), width: 1200, height: 630, alt: "Crée ton skill — DOE — BeWork" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Crée ton skill — DOE | BeWork",
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

export default function TutoSkillDoeBeworkPage() {
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
              Tuto PDF gratuit · DOE BTP · Claude · BeWork
            </p>
            <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-[2.35rem] md:leading-tight">
              {H1}
            </h1>
            <p className="mt-4 max-w-none text-lg leading-relaxed text-slate-600 sm:text-[1.125rem] sm:leading-[1.7]">
              Tutoriel BeWork pas à pas : passer d&apos;une semaine bureau à environ une journée pour structurer votre DOE — page de garde,
              sommaire indexé aux 9 rubriques et checklist des manquants — PDF en ligne et prompts à copier.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <CalendlyBookingLink className="inline-flex min-h-[3rem] shrink-0 items-center justify-center rounded-xl bg-[#1d4ed8] px-7 text-[0.9375rem] font-semibold text-white shadow-md shadow-[#1d4ed8]/25 transition hover:bg-[#1e40af] md:text-base">
                Réservez un appel
              </CalendlyBookingLink>
              <span className="text-sm leading-snug text-slate-600 sm:max-w-sm">
                20&nbsp;minutes pour cadrer votre besoin (DOE, livrables chantier, relais administratif BTP) — sans engagement.
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
                title="Crée ton skill — DOE — PDF BeWork"
              />
            </div>
          </section>

          <aside
            className="mb-14 rounded-2xl border border-[#1d4ed8]/22 bg-gradient-to-br from-[#eff6ff] to-white p-6 shadow-sm shadow-[#1d4ed8]/06 sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-8"
            aria-label="Réserver un appel découverte"
          >
            <div className="min-w-0 sm:flex-1">
              <p className="text-base font-semibold text-slate-900 md:text-[1.05rem]">
                Besoin d&apos;un relais pour compiler et déposer votre DOE dans les délais&nbsp;?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 md:text-[0.9375rem]">
                Parlez-en avec BeWork sur un créneau de 20&nbsp;minutes : indexation, relances sous-traitants, conformité CCAG / MOA.
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
              <p className="mt-3 text-center text-xl font-semibold text-slate-900">DOE</p>
              <p className="mt-2 text-center text-base text-slate-700 md:text-[1.05rem]">
                Le tutoriel pas à pas pour compiler ton Dossier des Ouvrages Exécutés — 1 jour au lieu d&apos;1 semaine.
              </p>

              <h4 className="mt-14 text-xs font-semibold uppercase tracking-[0.2em] text-slate-800">Ce que tu vas apprendre</h4>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Activer la fonction skills dans Claude (5 minutes, 1 fois pour toutes)</li>
                <li>▸ Calibrer ton skill avec ton sommaire type et tes exigences MOA</li>
                <li>▸ Le prompt prêt à coller pour générer ton skill en 1 conversation</li>
                <li>▸ Le prompt quotidien pour assembler ton DOE complet aux normes</li>
              </ul>

              <h3 className="mt-14 text-xl font-semibold tracking-tight text-slate-900">Pourquoi un skill DOE&nbsp;?</h3>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-slate-900">
                Le DOE — Dossier des Ouvrages Exécutés — c&apos;est le livrable qui clôt ton chantier. Il regroupe l&apos;ensemble des documents techniques,
                plans, PV, fiches et garanties qui décrivent ce que tu as réellement construit. Sa remise au maître d&apos;ouvrage est obligatoire (article
                30 du CCAG-Travaux 2021 pour les marchés publics, clauses contractuelles pour les marchés privés). Le délai standard : 60 jours
                après la réception. Au-delà, pénalités contractuelles applicables, voire blocage du paiement du solde.
              </p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Et pourtant, c&apos;est l&apos;un des livrables les plus repoussés. Pourquoi&nbsp;? Parce qu&apos;il faut compiler 50 à 200 documents (plans EXE et
                TQE, PV d&apos;essais, fiches techniques, attestations, notices, garanties), les indexer, les mettre en forme cohérente. Un DOE
                complet, c&apos;est 2 à 5 jours de bureau pour un chantier moyen. Une PME qui livre 30 chantiers par an passe 80 à 150 heures à monter
                ses DOE — du temps qui n&apos;est ni terrain ni commercial.
              </p>

              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Avec un skill bien construit, voilà ce qui change</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Tu colles ta liste de pièces, le skill génère le sommaire structuré et numéroté.</li>
                <li>▸ Les 9 rubriques obligatoires sont toutes présentes, dans le bon ordre.</li>
                <li>▸ La page de garde et l&apos;index sont calibrés au format MOA (CCAG-Travaux ou privé).</li>
                <li>
                  ▸ Les manques sont signalés : « PV d&apos;essais étanchéité non fourni — à demander au lot 12 ».
                </li>
                <li>▸ Tu passes de 1 semaine à 1 jour. Sur 30 DOE par an, c&apos;est 120 heures récupérées.</li>
              </ul>
              <p className="mt-8 text-[1.0625rem] leading-relaxed text-slate-900">
                Le skill ne collecte pas les pièces à ta place. Il structure, indexe, met en forme et identifie les manques. La compilation physique
                reste de ton ressort, mais elle devient guidée.
              </p>

              <h3 className="mt-14 text-xl font-semibold uppercase tracking-wide text-slate-900">Les 9 rubriques obligatoires d&apos;un DOE BTP</h3>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-slate-900">
                (1) Page de garde + sommaire indexé. (2) Plans d&apos;exécution et plans de récolement (TQE — Tel Que Exécuté). (3) Notes de calcul et
                notes techniques. (4) Fiches techniques produits (FT, DTA, ATEx). (5) PV d&apos;essais (étanchéité, électricité, hydrauliques,
                désenfumage, acoustique). (6) Attestations de conformité et certificats (CONSUEL, Qualigaz, etc.). (7) Notices d&apos;utilisation,
                d&apos;entretien et de maintenance. (8) Liste des sous-traitants et leurs assurances décennales. (9) Garanties produits et déclarations de
                conformité CE. Le DIUO peut être joint en annexe pour les ouvrages soumis à coordination SPS.
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
                Sans Code execution, Claude ne peut pas générer un sommaire structuré en .docx, ni produire la page de garde de ton DOE prête à
                imprimer. Pour un livrable contractuel qui peut représenter 200 pages indexées, c&apos;est rédhibitoire — tu as besoin du fichier mis en
                forme que tu peux fusionner avec tes PDF de pièces.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">2 </span>
                Rassemble ta matière première
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Un skill DOE générique te sortira un sommaire fade et générique. Pour qu&apos;il parle ton métier, ton entreprise et tes chantiers, il a
                besoin de tes données. Rassemble cette matière avant de lancer la conversation — 30 minutes de préparation, des heures gagnées
                ensuite.
              </p>

              <p className="mt-10 text-[1.0625rem] font-semibold text-slate-900">1. Tes 2 ou 3 derniers DOE livrés sans contestation</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Le skill va calquer son sommaire, son indexation et son ton sur ces exemples. Choisis si possible des DOE de marchés différents
                (privé / public, neuf / rénovation) pour couvrir le spectre. Format PDF ou Word indifféremment.
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">2. Ton sommaire type DOE</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                La trame standard que tu utilises pour structurer tes DOE (plans → notes → fiches → PV → attestations → notices → garanties). Si
                elle varie selon le type de marché, donne au skill 2 versions distinctes (publique CCAG / privée).
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">3. Tes exigences MOA récurrentes</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Format de remise (papier / numérique / les deux), nombre d&apos;exemplaires, plateforme de dépôt (Aconex, Kairnial, SharePoint MOA),
                dénomination des fichiers (« LotXX_TypeDoc_AAAAMMJJ.pdf »), résolution requise pour les plans (300 dpi minimum).
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">4. Ta liste de sous-traitants type</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Avec leurs coordonnées, qualifications (Qualibat, RGE), n° d&apos;attestation décennale et assureur. Le skill saura les insérer
                automatiquement dans la rubrique sous-traitants quand tu mentionneras leurs interventions.
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">5. Ton template de page de garde et footer</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Si ton entreprise a un modèle officiel (en-tête avec logo, footer avec mentions, structure de pied de page numéroté), uploade-le. Le
                skill respectera ta charte sans que tu aies à reparamétrer à chaque DOE.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">3 </span>
                Lance la conversation avec Claude
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Ouvre une nouvelle conversation sur claude.ai, uploade tous tes documents (DOE livrés, sommaire type, exigences MOA, liste sous-
                traitants, template), puis colle ce prompt directement.
              </p>
              <PromptBlock label="PROMPT À COLLER DANS CLAUDE" promptText={PROMPT_CALIBRATION_TEXT} />
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Le point clé</p>
              <p className="mt-4 text-[1.0625rem] leading-relaxed text-slate-900">
                Demande au skill de toujours sortir une checklist des pièces manquantes en fin de génération. C&apos;est ce qui transforme le DOE d&apos;une
                corvée en outil de pilotage : tu vois en un coup d&apos;œil ce qu&apos;il te reste à récupérer auprès des lots.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">4 </span>
                Affine et active ton skill
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Claude va te proposer un premier brouillon de skill. Ne valide pas tout de suite. Demande-lui de te montrer un DOE test généré sur un
                cas fictif (par exemple : chantier de réhabilitation tertiaire 1 200 m², 8 lots, 15 sous-traitants), puis ajuste.
              </p>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Ce que tu dois vérifier</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Les 9 rubriques obligatoires sont toutes présentes et dans le bon ordre.</li>
                <li>▸ La nomenclature des fichiers correspond aux exigences MOA (Aconex, Kairnial…).</li>
                <li>▸ La page de garde mentionne bien marché, MOA, MOE, dates de réception et livraison DOE.</li>
                <li>▸ La rubrique sous-traitants est exhaustive (assurance décennale + qualifications).</li>
                <li>▸ La checklist des pièces manquantes est en fin de document, claire et actionnable.</li>
                <li>▸ Le sommaire est cliquable (avec liens internes) si format numérique demandé.</li>
              </ul>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Ajustement type à demander</p>
              <PromptBlock label="EXEMPLE D&apos;AJUSTEMENT" promptText={PROMPT_EXEMPLE_AJUSTEMENT_TEXT} />
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Active le skill</p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Une fois le test concluant, demande à Claude : « Sauvegarde ce skill avec le nom doe-[ton-entreprise] ». Il sera disponible dans
                toutes tes prochaines conversations sans avoir à recoller le prompt.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">5 </span>
                Teste sur un vrai chantier
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Le vrai test, c&apos;est ton prochain chantier en phase de livraison. Workflow recommandé pour la première utilisation en condition réelle
                :
              </p>
              <p className="mt-10 text-lg font-semibold text-slate-900">Le test</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Récupère ta liste de pièces du chantier (plans EXE, PV essais, fiches techniques).</li>
                <li>▸ Note les sous-traitants intervenus et les attestations en ta possession.</li>
                <li>▸ Ouvre Claude, appelle ton skill : « Active le skill doe ».</li>
                <li>▸ Renseigne le contexte chantier et liste les pièces disponibles.</li>
                <li>▸ Récupère la page de garde + sommaire + checklist manquants. Compile les PDF.</li>
              </ul>
              <p className="mt-10 text-lg font-semibold text-slate-900">Le bon prompt pour les usages quotidiens</p>
              <PromptBlock label="PROMPT — UTILISATION QUOTIDIENNE" promptText={PROMPT_USAGE_QUOTIDIEN_TEXT} />

              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">La règle d&apos;or</p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Lance le skill dès la phase de réception, pas à la fin. Tu auras la checklist des manquants 60 jours avant la deadline — le temps de
                tout récupérer sans courir.
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
                <li>▸ Vous nous transmettez vos plans, PV essais, fiches techniques au fur et à mesure</li>
                <li>▸ On compile, on indexe, on relance les sous-traitants, on dépose le DOE complet</li>
                <li>▸ Vous livrez dans les 60 jours CCAG, votre solde est payé sans pénalité de retard</li>
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
