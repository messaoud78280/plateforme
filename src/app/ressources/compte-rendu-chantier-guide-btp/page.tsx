import { getTutoPageDescription, tutoPageMetadata } from "@/lib/seo-tuto-metadata";
import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { CopyPromptButton } from "@/components/ressources/CopyPromptButton";
import { buildWebPageAndBreadcrumbJsonLd } from "@/lib/seo-landing-json-ld";
import { absoluteUrl, SITE_URL } from "@/lib/site";
import { BeWorkStatsGrid } from "@/components/marketing/BeWorkStatsGrid";

const pagePath = "/ressources/compte-rendu-chantier-guide-btp";

const pageUrl = absoluteUrl(pagePath);

const pdfPath = "/ressources/pdf/tuto-skill-cr-chantier-bework.pdf";

const PROMPT_CALIBRATION_TEXT = `Je veux que tu créés un skill personnalisé pour générer mes comptes rendus de chantier hebdomadaires.

Contexte :
- Je suis conducteur de travaux chez [TON ENTREPRISE]
- Marchés : [privés / publics / mixtes]
- Type de bâtiment : [logement collectif / industriel / tertiaire / TP]
- Volume : entre 30 et 50 CR par an
- Format de sortie attendu : Word .docx, A4 portrait

Je t'ai uploadé :
- Mes 3 derniers CR finalisés (en référence pour le ton et la structure)
- Mon organigramme type d'intervenants
- Mon template Word d'entreprise

Construis un skill qui :
1. Me demande mes notes brutes de chantier en début de conversation
2. Génère un CR Word complet avec mes 8 rubriques standard
3. Numérote automatiquement les réserves et les actions
4. Affecte chaque action à un responsable avec date butoir
5. Respecte ma charte graphique d'entreprise

Avant de générer le skill, pose-moi les questions nécessaires pour bien calibrer la structure (entre 5 et 10 questions max).`;

const PROMPT_USAGE_QUOTIDIEN_TEXT = `Active le skill cr-chantier.

Contexte du CR :
- Opération : [NOM DU CHANTIER]
- N° CR : [CR-XX]
- Date de visite : [JJ/MM/AAAA]
- Météo : [conditions]

Voici mes notes brutes de réunion ci-dessous :

[COLLER TES NOTES BRUTES — désordre accepté, abréviations OK]

Si certaines infos manquent (intervenants présents, dates butoir des actions, n° de réserves antérieures), pose-moi les questions manquantes en bloc compact, puis génère le CR final.`;

const PROMPT_EXEMPLE_AJUSTEMENT_TEXT = `Le brouillon est bien mais 3 points à corriger :

1. Dans la rubrique Réserves, ajoute une colonne « Date de levée souhaitée » à droite du responsable.
2. Dans l'en-tête, place le logo entreprise à gauche et le n° de CR + date à droite, pas centré.
3. Pour les notes vocales ou photos uploadées, transcris-les et intègre-les directement dans la rubrique d'avancement correspondante, ne les laisse pas en annexe.

Régénère le skill avec ces ajustements et propose-moi un nouveau CR test.`;

const H1 = "Crée ton skill — Compte rendu de chantier";


const breadcrumbItems = [
  { name: "Accueil", href: "/" },
  { name: "Ressources", href: "/ressources" },
  { name: H1, href: pagePath },
] as const;

const FAQ_FOR_JSON_LD = [
  {
    question: "Le CR généré a-t-il une valeur juridique ?",
    answer:
      "Oui, exactement la même que celui que tu rédigerais à la main. La valeur juridique d'un CR de chantier vient de sa diffusion et de l'absence de contestation par les destinataires dans les délais contractuels, généralement 8 jours. L'outil utilisé pour le rédiger est sans incidence. Word, Excel, manuscrit, généré par IA : c'est la signature du rédacteur, la diffusion contradictoire et le silence des parties qui font la force probante.",
  },
  {
    question: "Et si on me demande des modifications après diffusion ?",
    answer:
      "Procédure standard inchangée : tu intègres les remarques au CR suivant en début de réunion (« Reprise des observations sur le CR n° X »), sans modifier rétroactivement le document diffusé. Le skill peut t'aider à formuler proprement la réponse aux observations dans le CR n+1.",
  },
  {
    question: "Combien de temps prend la première génération ?",
    answer:
      "La première fois, création du skill avec calibrage, compte 30 à 45 minutes : préparation des documents, conversation de calibrage avec Claude, ajustements du brouillon. Les fois suivantes, en utilisation quotidienne : 8 à 12 minutes par CR, relecture comprise. Comparé à 1h30-2h en rédaction manuelle, le ROI est immédiat dès le 3e CR.",
  },
  {
    question: "Le skill couvre-t-il les CR pour des marchés publics ?",
    answer:
      "Oui. Précise dans ton prompt initial que tu travailles sur des marchés publics et donne au skill ton template adapté : CCAG-Travaux applicable, mentions du PRO ou du DCE, n° de marché, ordres de service. Le skill calera la formulation des décisions et des réserves sur les exigences du Code de la commande publique.",
  },
  {
    question: "Mes données de chantier sont-elles confidentielles ?",
    answer:
      "Anthropic, l'éditeur de Claude, ne réutilise pas le contenu de tes conversations pour entraîner ses modèles sur les comptes Pro et Team. Les données restent associées à ton compte et sont supprimées à ta demande. Pour des chantiers ultra-sensibles, défense ou données nominatives RGPD lourdes, utilise des noms anonymisés dans ton prompt — c'est une pratique de prudence raisonnable.",
  },
  {
    question: "Que faire si un événement exceptionnel survient, accident ou sinistre ?",
    answer:
      "Ces événements ont une procédure dédiée — pas un CR. Déclaration accident sous 24h via le registre de sécurité, ouverture d'un sinistre auprès de l'assureur DO/CNR, information immédiate du coordonnateur SPS. Le CR mentionnera l'événement et les mesures conservatoires prises, mais ne s'y substitue pas. Le skill peut générer en parallèle une note de signalement formelle si tu le lui demandes explicitement.",
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

export default function CompteRenduChantierGuideBtpPdfPage() {
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
          <nav className="text-sm text-slate-600 mb-6 md:mb-8" aria-label="Fil d’Ariane">
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
              Tuto PDF gratuit · Compte rendu de chantier · BeWork
            </p>
            <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-[2.35rem] md:leading-tight">
              {H1}
            </h1>
            <p className="mt-4 max-w-none text-lg leading-relaxed text-slate-600 sm:text-[1.125rem] sm:leading-[1.7]">
              Retrouvez ci-dessous le tutoriel complet BeWork pour préparer un compte rendu de chantier à partir de notes, photos ou
              vocaux, avec la version PDF consultable en ligne puis le texte intégral du tuto.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <CalendlyBookingLink className="inline-flex min-h-[3rem] shrink-0 items-center justify-center rounded-xl bg-[#1d4ed8] px-7 text-[0.9375rem] font-semibold text-white shadow-md shadow-[#1d4ed8]/25 transition hover:bg-[#1e40af] md:text-base">
                Réservez un appel
              </CalendlyBookingLink>
              <span className="text-sm leading-snug text-slate-600 sm:max-w-sm">
                20&nbsp;minutes pour cadrer votre besoin (CR chantier, assistance travaux BTP) — sans engagement.
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
            <p className="mt-3 w-full text-slate-600 leading-relaxed">
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
                title="Crée ton skill — Compte rendu de chantier — PDF BeWork"
              />
            </div>
          </section>

          <aside
            className="mb-14 rounded-2xl border border-[#1d4ed8]/22 bg-gradient-to-br from-[#eff6ff] to-white p-6 shadow-sm shadow-[#1d4ed8]/06 sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-8"
            aria-label="Réserver un appel découverte"
          >
            <div className="min-w-0 sm:flex-1">
              <p className="text-base font-semibold text-slate-900 md:text-[1.05rem]">Besoin d’une assistance sur vos CR de chantier&nbsp;?</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 md:text-[0.9375rem]">
                Parlez-en avec BeWork pendant un créneau de 20&nbsp;minutes : organisation, périmètre et première marche suivante.
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
              <p className="mt-3 text-center text-xl font-semibold text-slate-900">Compte rendu de chantier</p>
              <p className="mt-2 text-center text-base text-slate-700 md:text-[1.05rem]">
                Le tutoriel pas à pas pour rédiger ton CR — 10 minutes au lieu de 2 heures.
              </p>

              <h4 className="mt-14 text-xs font-semibold uppercase tracking-[0.2em] text-slate-800">Ce que tu vas apprendre</h4>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Activer la fonction skills dans Claude (5 minutes, 1 fois pour toutes)</li>
                <li>▸ Calibrer ton skill avec tes propres CR (intervenants, lots, codes métier)</li>
                <li>▸ Le prompt prêt à coller pour générer ton skill en 1 conversation</li>
                <li>▸ Le prompt d&apos;utilisation quotidienne pour transformer tes notes brutes en CR pro</li>
              </ul>

              <h3 className="mt-14 text-xl font-semibold tracking-tight text-slate-900">Pourquoi un skill compte rendu de chantier ?</h3>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-slate-900">
                Le CR de chantier n&apos;est pas un document de confort. C&apos;est une pièce contractuelle. Il fixe l&apos;avancement à
                date, acte les décisions, conserve la trace des réserves et engage la responsabilité du rédacteur. La norme NF P03-001
                et les CCAG-Travaux le citent comme document de référence en cas de litige sur les délais ou la qualité
                d&apos;exécution.
              </p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Et pourtant, c&apos;est aussi le document le plus chronophage du conducteur de travaux. Entre 1h30 et 2h30 par CR
                hebdomadaire, multiplié par 30 à 50 chantiers par an : 100 à 200 heures annuelles passées à mettre en forme des
                notes, refaire la liste des intervenants et reformuler les mêmes paragraphes. Toutes les études terrain le confirment
                : la rédaction administrative représente 20 à 25 % du temps d&apos;un CDT.
              </p>

              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Avec un skill bien construit, voilà ce qui change</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Tu colles tes notes brutes (réunion, photos, voix), Claude te sort le CR mis en forme.</li>
                <li>▸ Les rubriques contractuelles obligatoires sont toutes présentes — sans en oublier une seule.</li>
                <li>▸ Les intervenants, lots et entreprises sont déjà calibrés à tes chantiers.</li>
                <li>▸ Le ton, la formulation des réserves et le niveau de précision matchent ton style.</li>
                <li>▸ Tu passes de 2 heures à 10 minutes. Sur 40 CR par an, c&apos;est 75 heures récupérées.</li>
              </ul>
              <p className="mt-10 text-[1.0625rem] leading-relaxed text-slate-900">
                Le skill ne remplace pas ton expertise terrain. Il prend en charge la mise en forme. C&apos;est exactement la bonne
                division du travail.
              </p>

              <h3 className="mt-14 text-xl font-semibold uppercase tracking-wide text-slate-900">Les 8 rubriques standard d&apos;un CR chantier pro</h3>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-slate-900">
                (1) En-tête contractuel : opération, n° CR, date, rédacteur, MOA, MOE.
                <br />
                (2) Liste des intervenants présents / excusés / absents.
                <br />
                (3) Avancement par lot ou par zone.
                <br />
                (4) Décisions actées en réunion.
                <br />
                (5) Réserves et points bloquants (sécurité, qualité, délais).
                <br />
                (6) Demandes en attente (visas, validations MOA, études complémentaires).
                <br />
                (7) Actions à mener : qui, quoi, pour quand.
                <br />
                (8) Diffusion / prochain RDV.
              </p>
              <p className="mt-8 text-[1.0625rem] leading-relaxed text-slate-900">
                Un skill bien fait te garantit que ces 8 blocs y sont, dans le bon ordre, à chaque CR.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">1 </span>
                Active la fonction skills dans Claude
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Pour faire tourner un skill personnalisé, tu as besoin d&apos;un abonnement Claude Pro à 18 €/mois. La fonction skills
                est désactivée par défaut, il faut l&apos;activer manuellement la première fois. C&apos;est rapide et tu ne le fais qu&apos;une fois.
              </p>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Le chemin précis</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Connecte-toi sur claude.ai avec ton compte Pro.</li>
                <li>▸ Clique sur ton avatar en bas à gauche, puis sur Settings.</li>
                <li>▸ Dans le menu de gauche, clique sur Capabilities.</li>
                <li>▸ Active le toggle « Code execution » (indispensable pour générer le .docx).</li>
                <li>▸ Active aussi le toggle « Skills » et « File creation » s&apos;ils ne le sont pas.</li>
              </ul>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Pourquoi c&apos;est indispensable</p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Sans Code execution, Claude ne peut pas générer un fichier Word téléchargeable. Il pourra te rédiger le CR en texte dans la
                conversation, mais pas te livrer le .docx prêt à imprimer ou à diffuser. Pour un CR de chantier, c&apos;est
                rédhibitoire — tu as besoin du fichier que tu peux ouvrir, signer et envoyer.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">2 </span>
                Rassemble ta matière première
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Un skill générique te sortira un CR générique. C&apos;est exactement ce que tu ne veux pas. Pour que le skill parle ton
                métier, ton entreprise et tes chantiers, il a besoin de tes données. Rassemble cette matière avant de lancer la
                conversation — 20 minutes de préparation, des heures gagnées ensuite.
              </p>
              <p className="mt-10 text-[1.0625rem] font-semibold text-slate-900">1. Tes 2 ou 3 derniers CR finalisés</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Le skill va calquer son ton, sa structure et son niveau de détail sur ces exemples. Choisis des CR que tu considères comme
                bien rédigés — pas des brouillons. Format PDF ou Word indifféremment.
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">2. Ton organigramme type d&apos;intervenants</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                MOA, MOE, BET structure, BET fluides, contrôleur technique, coordonnateur SPS, OPC, lots et entreprises sous-traitantes
                habituelles. Donne au skill un tableau type avec les rôles que tu retrouves sur 80 % de tes chantiers.
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">3. Tes données historiques</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Réserves récurrentes (étanchéité, alignement, finitions, fissures…), retards types (livraisons matériaux, intempéries,
                validations MOA), avenants fréquents. Le skill apprend de ce qui revient le plus chez toi.
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">4. Tes contraintes ou règles spécifiques</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                CCAG-Travaux ou CCAG-PI selon le marché, clauses contractuelles particulières (pénalités, délais d&apos;exécution,
                clauses environnementales E+C-, RE2020), niveau de détail attendu par le maître d&apos;ouvrage.
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">5. Tes templates ou plans types</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Si ton entreprise a un template Word officiel (en-tête, charte, pied de page, numérotation), uploade-le. Le skill
                respectera ta charte sans que tu aies à reparamétrer à chaque CR.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">3 </span>
                Lance la conversation avec Claude
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Ouvre une nouvelle conversation sur claude.ai, uploade tous tes documents (CR exemples, organigramme, template), puis
                colle ce prompt directement. Claude va te poser quelques questions de calibrage avant de générer ton skill.
              </p>
              <PromptBlock label="PROMPT À COLLER DANS CLAUDE" promptText={PROMPT_CALIBRATION_TEXT} />
              <p className="mt-8 text-xl font-semibold uppercase tracking-wide text-slate-900">Le point clé</p>
              <p className="mt-4 text-[1.0625rem] leading-relaxed text-slate-900">
                Plus ton prompt est précis sur le contexte (entreprise, type de marché, volume, format), plus le skill sera calibré
                finement. Ne sois pas avare en infos : Claude n&apos;utilise ces données que pour ta conversation, pas pour entraîner un modèle.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">4 </span>
                Affine et active ton skill
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Claude va te proposer un premier brouillon de skill. Ne valide pas tout de suite. Demande-lui de te montrer un CR test
                généré sur des notes fictives, puis ajuste.
              </p>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Ce que tu dois vérifier</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Les 8 rubriques standard sont toutes présentes et dans le bon ordre.</li>
                <li>▸ Le ton matche ce que tu écrirais toi-même (ni trop sec, ni trop verbeux).</li>
                <li>▸ Les réserves et actions sont numérotées, datées, attribuées.</li>
                <li>▸ Le tableau d&apos;intervenants reprend ton organigramme exact.</li>
                <li>▸ La mise en page respecte ton template (en-tête, polices, marges).</li>
                <li>▸ Les paragraphes ne sont pas trop génériques (« il a été décidé que… »).</li>
              </ul>

              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Ajustement type à demander</p>
              <PromptBlock label="EXEMPLE D&apos;AJUSTEMENT" promptText={PROMPT_EXEMPLE_AJUSTEMENT_TEXT} />

              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Active le skill</p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Une fois le test concluant, demande à Claude : « Sauvegarde ce skill avec le nom cr-chantier-[ton-nom] ». Il sera
                disponible dans toutes tes prochaines conversations sans avoir à recoller le prompt.
              </p>

              <h3 className="mt-14 text-2xl font-sem-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">5 </span>
                Teste sur un vrai chantier
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Le vrai test, ce n&apos;est pas un cas fictif — c&apos;est ton prochain CR du lundi matin.
              </p>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Workflow recommandé pour la première utilisation en condition réelle :</p>
              <p className="mt-6 text-lg font-semibold text-slate-900">Le test</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Prends tes notes habituelles pendant la réunion de chantier (papier, vocal, photos).</li>
                <li>▸ Ouvre Claude, appelle ton skill : « Active le skill cr-chantier ».</li>
                <li>▸ Colle ou uploade tes notes brutes et photos.</li>
                <li>▸ Réponds aux 2-3 questions complémentaires que Claude te posera.</li>
                <li>▸ Récupère ton .docx, relis-le 3 minutes, ajuste si besoin, diffuse.</li>
              </ul>
              <p className="mt-10 text-lg font-semibold text-slate-900">Le bon prompt pour les usages quotidiens</p>
              <PromptBlock label="PROMPT — UTILISATION QUOTIDIENNE" promptText={PROMPT_USAGE_QUOTIDIEN_TEXT} />

              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">La règle d&apos;or</p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Tu restes le rédacteur juridique du CR. Le skill est un assistant de mise en forme, pas un substitut à ta validation.
                Relis systématiquement avant diffusion : sur 10 minutes de relecture, tu repèreras 1 ou 2 ajustements à faire —
                c&apos;est normal et c&apos;est ton rôle.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">Questions fréquentes</h3>

              <h4 className="mt-8 text-[1.05rem] font-semibold text-slate-900">
                Le CR généré a-t-il une valeur juridique ?
              </h4>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Oui, exactement la même que celui que tu rédigerais à la main. La valeur juridique d&apos;un CR de chantier vient de sa
                diffusion et de l&apos;absence de contestation par les destinataires dans les délais contractuels, généralement 8 jours.
                L&apos;outil utilisé pour le rédiger est sans incidence. Word, Excel, manuscrit, généré par IA : c&apos;est la signature du
                rédacteur, la diffusion contradictoire et le silence des parties qui font la force probante.
              </p>

              <h4 className="mt-10 text-[1.05rem] font-semibold text-slate-900">Et si on me demande des modifications après diffusion ?</h4>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Procédure standard inchangée : tu intègres les remarques au CR suivant en début de réunion (« Reprise des observations sur
                le CR n° X »), sans modifier rétroactivement le document diffusé. Le skill peut t&apos;aider à formuler proprement la réponse
                aux observations dans le CR n+1.
              </p>

              <h4 className="mt-10 text-[1.05rem] font-semibold text-slate-900">Combien de temps prend la première génération ?</h4>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                La première fois, création du skill avec calibrage, compte 30 à 45 minutes : préparation des documents, conversation de
                calibrage avec Claude, ajustements du brouillon. Les fois suivantes, en utilisation quotidienne : 8 à 12 minutes par CR,
                relecture comprise. Comparé à 1h30-2h en rédaction manuelle, le ROI est immédiat dès le 3e CR.
              </p>

              <h4 className="mt-10 text-[1.05rem] font-semibold text-slate-900">Le skill couvre-t-il les CR pour des marchés publics ?</h4>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Oui. Précise dans ton prompt initial que tu travailles sur des marchés publics et donne au skill ton template adapté :
                CCAG-Travaux applicable, mentions du PRO ou du DCE, n° de marché, ordres de service. Le skill calera la formulation des
                décisions et des réserves sur les exigences du Code de la commande publique.
              </p>

              <h4 className="mt-10 text-[1.05rem] font-semibold text-slate-900">Mes données de chantier sont-elles confidentielles ?</h4>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Anthropic, l&apos;éditeur de Claude, ne réutilise pas le contenu de tes conversations pour entraîner ses modèles sur les comptes
                Pro et Team. Les données restent associées à ton compte et sont supprimées à ta demande. Pour des chantiers
                ultra-sensibles, défense ou données nominatives RGPD lourdes, utilise des noms anonymisés dans ton prompt — c&apos;est une
                pratique de prudence raisonnable.
              </p>

              <h4 className="mt-10 text-[1.05rem] font-semibold text-slate-900">
                Que faire si un événement exceptionnel survient, accident ou sinistre ?
              </h4>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Ces événements ont une procédure dédiée — pas un CR. Déclaration accident sous 24h via le registre de sécurité, ouverture
                d&apos;un sinistre auprès de l&apos;assureur DO/CNR, information immédiate du coordonnateur SPS. Le CR mentionnera
                l&apos;événement et les mesures conservatoires prises, mais ne s&apos;y substitue pas. Le skill peut générer en parallèle une
                note de signalement formelle si tu le lui demandes explicitement.
              </p>

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
                <li>▸ Vous nous envoyez vos notes, photos, vocaux après chaque réunion de chantier.</li>
                <li>▸ On rédige le CR aux normes, on relance les intervenants, on suit les réserves.</li>
                <li>▸ Vous restez 100 % sur le terrain, le bureau roule sans vous.</li>
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
