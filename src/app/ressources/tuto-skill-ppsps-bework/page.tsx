import { getTutoPageDescription, tutoPageMetadata } from "@/lib/seo-tuto-metadata";
import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { CopyPromptButton } from "@/components/ressources/CopyPromptButton";
import { buildWebPageAndBreadcrumbJsonLd } from "@/lib/seo-landing-json-ld";
import { absoluteUrl, SITE_URL } from "@/lib/site";

const pagePath = "/ressources/tuto-skill-ppsps-bework";

const pageUrl = absoluteUrl(pagePath);

const pdfPath = "/ressources/pdf/tuto-skill-ppsps-bework.pdf";

const PROMPT_CALIBRATION_TEXT = `Je veux que tu créés un skill personnalisé pour générer mes
PPSPS (Plans Particuliers de Sécurité et de Protection de la Santé).

Contexte :
- Je suis [dirigeant / chargé QHSE / conducteur de travaux] chez [TON
ENTREPRISE]
- Métier principal : [maçonnerie / couverture / électricité / plomberie /
etc.]
- Type de marchés : [privés / publics / mixtes]
- Volume : entre 30 et 60 PPSPS par an
- Format de sortie attendu : Word .docx, A4 portrait, 8 à 15 pages

Je t'ai uploadé :
- Mes 3 derniers PPSPS validés par un CSPS (référence ton et structure)
- Mes modes opératoires types par activité
- Ma matrice de risques propres avec niveaux et préventions
- Ma liste d'EPI standards et procédures d'urgence
- Mon template de PPSPS société

Construis un skill qui :
1. Me demande les caractéristiques du chantier en début de conversation
2. Couvre systématiquement les 9 rubriques R4532-64 du Code du travail
3. Adapte les modes opératoires aux activités déclarées sur ce chantier
4. Hiérarchise les risques selon la matrice F×G (fréquence × gravité)
5. Insère les EPI conformes aux normes EN en vigueur
6. Respecte ma charte graphique d'entreprise

Avant de générer le skill, pose-moi les questions nécessaires
pour bien calibrer la structure (entre 5 et 10 questions max).`;

const PROMPT_USAGE_QUOTIDIEN_TEXT = `Active le skill ppsps.

Caractéristiques du chantier :
- MOA : [NOM]
- Adresse chantier : [ADRESSE]
- Coordonnateur SPS : [NOM + niveau 1, 2 ou 3]
- Type d'opération : [neuf / rénovation / démolition / TP]
- Durée prévisionnelle : [X semaines]
- Effectif : [N personnes mon entreprise + total chantier]
- Coactivité : [autres lots / entreprises présentes]

Activités de mon entreprise :
[liste des phases — ex : terrassement, ferraillage, dalle…]

Risques particuliers identifiés :
[ex : amiante, hauteur, voirie ouverte, riverains…]

Génère le PPSPS conforme aux 9 rubriques R4532-64. Si infos
manquantes, pose-moi les questions en bloc compact.`;

const PROMPT_EXEMPLE_AJUSTEMENT_TEXT = `Le brouillon est bien mais 3 points à corriger :

1. Dans la rubrique Risques, sépare clairement « risques importés »
(apportés par les autres entreprises sur le chantier) et « risques
exportés » (que mon entreprise apporte aux autres) — actuellement
c'est mélangé

2. Pour chaque mode opératoire, ajoute une ligne « Compétence requise »
(ex : CACES R486 pour PEMP, habilitation B1V pour électricité,
formation travail en hauteur)

3. La procédure d'évacuation doit citer le point de rassemblement
précis et le délai maximal d'évacuation (3 minutes recommandés
par INRS)

Régénère le skill avec ces ajustements et propose-moi un nouveau
PPSPS test sur le même cas fictif.`;

const H1 = "Crée ton skill — PPSPS (Plan Particulier Sécurité et Santé)";


const breadcrumbItems = [
  { name: "Accueil", href: "/" },
  { name: "Ressources", href: "/ressources" },
  { name: H1, href: pagePath },
] as const;

const FAQ_FOR_JSON_LD = [
  {
    question: "Le PPSPS généré a-t-il une valeur juridique ?",
    answer:
      "Oui, exactement la même que celui que tu rédigerais à la main. La valeur juridique d'un PPSPS vient de sa signature par le dirigeant ou son délégataire, de sa transmission au coordonnateur SPS avant le début des travaux et de son archivage avec preuve de remise. L'outil utilisé pour le produire est sans incidence sur sa force probante. Word, traitement de texte spécialisé ou IA : c'est ta validation et la traçabilité de la transmission qui comptent.",
  },
  {
    question: "Et si le coordonnateur SPS demande des modifications ?",
    answer:
      "Procédure standard : tu intègres ses observations dans une version 2 du PPSPS, datée et identifiée comme « PPSPS révision 2 — observations CSPS du JJ/MM/AAAA ». Le skill peut produire la version mise à jour en 5 minutes à partir de ses remarques. Tu archives les 2 versions et tu lui retransmets la nouvelle pour validation finale.",
  },
  {
    question: "Quelles sont les sanctions en cas d'absence de PPSPS ?",
    answer:
      "Amende administrative pouvant aller jusqu'à 9 000 € par travailleur non couvert (article L4744-3 du Code du travail). En cas d'accident grave, responsabilité pénale du dirigeant pour homicide ou blessures involontaires (jusqu'à 5 ans de prison et 75 000 € d'amende). Refus possible de la part du CSPS de laisser démarrer le chantier. Pour un AO public, défaut de PPSPS = motif de résiliation aux torts de l'entreprise.",
  },
  {
    question: "Le skill couvre-t-il les chantiers avec amiante ou plomb ?",
    answer:
      "Pour l'amiante, le PPSPS doit être complété par un Plan de Retrait ou de Confinement (PRC) spécifique soumis à la DRIEETS au moins 1 mois avant les travaux (sous-section 3) ou un mode opératoire (sous-section 4). Le skill peut produire la trame du PPSPS et signaler les obligations spécifiques amiante, mais le PRC reste un document distinct, à faire valider par votre certification SS3/SS4.",
  },
  {
    question: "Mes données sécurité sont-elles confidentielles ?",
    answer:
      "Anthropic (l'éditeur de Claude) ne réutilise pas le contenu de tes conversations Pro et Team pour entraîner ses modèles. Tes modes opératoires, matrices de risques et procédures restent associés à ton compte et sont supprimables à tout moment. Pour les chantiers ultra-sensibles (sites classés défense, OIV, données nominatives travailleurs), travaille avec des données anonymisées dans le prompt — c'est une pratique de prudence raisonnable.",
  },
  {
    question: "Que faire en cas d'évolution des modes opératoires en cours de chantier ?",
    answer:
      "Le PPSPS est un document vivant. Toute modification significative des activités, de la coactivité ou des risques doit faire l'objet d'une mise à jour transmise au CSPS et signée. Le skill peut générer un additif ou une révision en quelques minutes à partir de la description de l'évolution. Ne jamais continuer un chantier dont les conditions ont changé sans actualiser le PPSPS — c'est la règle d'or.",
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

export default function TutoSkillPpspsBeworkPage() {
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
              Tuto PDF gratuit · Skill PPSPS · Claude · BeWork
            </p>
            <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-[2.35rem] md:leading-tight">
              {H1}
            </h1>
            <p className="mt-4 max-w-none text-lg leading-relaxed text-slate-600 sm:text-[1.125rem] sm:leading-[1.7]">
              Retrouvez ci-dessous le tutoriel BeWork pour construire un skill Claude qui produit un PPSPS structuré aux 9 rubriques
              R4532-64 : PDF original en ligne, puis texte intégral et prompts prêts à coller.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <CalendlyBookingLink className="inline-flex min-h-[3rem] shrink-0 items-center justify-center rounded-xl bg-[#1d4ed8] px-7 text-[0.9375rem] font-semibold text-white shadow-md shadow-[#1d4ed8]/25 transition hover:bg-[#1e40af] md:text-base">
                Réservez un appel
              </CalendlyBookingLink>
              <span className="text-sm leading-snug text-slate-600 sm:max-w-sm">
                20&nbsp;minutes pour cadrer votre besoin (PPSPS, QHSE, relais administratif BTP) — sans engagement.
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
              Consultez le guide dans sa mise en page originale. Vous pouvez l&apos;agrandir ou le télécharger. PDF · 10 pages
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
                title="Crée ton skill — PPSPS — PDF BeWork"
              />
            </div>
          </section>

          <aside
            className="mb-14 rounded-2xl border border-[#1d4ed8]/22 bg-gradient-to-br from-[#eff6ff] to-white p-6 shadow-sm shadow-[#1d4ed8]/06 sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-8"
            aria-label="Réserver un appel découverte"
          >
            <div className="min-w-0 sm:flex-1">
              <p className="text-base font-semibold text-slate-900 md:text-[1.05rem]">
                Besoin d&apos;un relais sur vos PPSPS ou dossiers SPS&nbsp;?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 md:text-[0.9375rem]">
                Parlez-en avec BeWork pendant un créneau de 20&nbsp;minutes : organisation, conformité et première marche suivante.
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
              <p className="mt-3 text-center text-xl font-semibold text-slate-900">PPSPS (Plan Particulier Sécurité et Santé)</p>
              <p className="mt-2 text-center text-base text-slate-700 md:text-[1.05rem]">
                Réduisez fortement le temps passé sur vos PPSPS grâce à un skill Claude calibré sur votre métier.
              </p>

              <h4 className="mt-14 text-xs font-semibold uppercase tracking-[0.2em] text-slate-800">Pourquoi un skill PPSPS ?</h4>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-slate-900">
                Le PPSPS n&apos;est pas un document optionnel. C&apos;est une obligation légale fixée par les articles R4532-56 à R4532-74 du Code
                du travail, issue de la loi du 31 décembre 1993 transposant la directive européenne « chantiers temporaires ou mobiles ». Tout
                chantier soumis à coordination SPS — c&apos;est-à-dire dès que 2 entreprises ou plus interviennent sur un même site — exige un
                PPSPS de chaque entreprise intervenante, remis au coordonnateur SPS avant le démarrage des travaux.
              </p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Et pourtant, c&apos;est l&apos;un des documents les plus chronophages à produire : 4 à 6 heures par chantier complexe en première
                rédaction, 2 à 3 heures en mise à jour. Multiplié par 30 à 60 chantiers annuels pour une PME du bâtiment, c&apos;est 150 à 250
                heures de bureau par an. La sanction en cas de défaut : amende de 9 000 € par travailleur non couvert, et responsabilité
                pénale du dirigeant en cas d&apos;accident grave (article 222-19 du Code pénal — homicide involontaire ou blessures involontaires).
              </p>

              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Avec un skill bien construit, voilà ce qui change</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Tu décris ton intervention en 5 lignes, le skill sort le PPSPS complet aux normes.</li>
                <li>▸ Les 9 rubriques obligatoires sont toutes présentes — aucune ne peut être oubliée.</li>
                <li>▸ Tes modes opératoires types et ta matrice risques sont déjà calibrés à ton métier.</li>
                <li>▸ Les EPI, premiers secours et procédures urgence sont insérés automatiquement.</li>
                <li>▸ Tu passes de 4 heures à 45 minutes. Sur 40 chantiers par an, c&apos;est 130 heures récupérées.</li>
              </ul>
              <p className="mt-10 text-[1.0625rem] leading-relaxed text-slate-900">
                Le skill ne remplace pas l&apos;analyse de risque que toi seul peux faire sur ton chantier. Il prend en charge la mise en forme et
                la conformité. C&apos;est exactement la bonne division du travail.
              </p>

              <h3 className="mt-14 text-xl font-semibold uppercase tracking-wide text-slate-900">Les 9 rubriques obligatoires d&apos;un PPSPS</h3>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-slate-900">
                (1) Identification de l&apos;opération et de l&apos;entreprise. (2) Effectif prévisionnel et qualifications. (3) Description des
                travaux et modes opératoires. (4) Mesures de protection collective. (5) EPI individuels et formation associée. (6) Risques importés
                (apportés par autres entreprises) et risques exportés. (7) Premiers secours et procédure d&apos;évacuation. (8) Hygiène :
                vestiaires, sanitaires, restauration. (9) Mesures particulières de coactivité. Article R4532-64 du Code du travail. Un skill bien
                fait te garantit que ces 9 blocs y sont, à chaque PPSPS.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">1 </span>
                Active la fonction skills dans Claude
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Pour faire tourner un skill personnalisé, tu as besoin d&apos;un abonnement Claude Pro à 18 €/mois. La fonction skills est désactivée
                par défaut, il faut l&apos;activer manuellement la première fois. C&apos;est rapide et tu ne le fais qu&apos;une fois.
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
                Sans Code execution, Claude ne peut pas générer un fichier Word téléchargeable. Il pourra te rédiger le PPSPS en texte dans la
                conversation, mais pas te livrer le .docx prêt à signer et à transmettre au coordonnateur SPS. Pour un document légal opposable,
                c&apos;est rédhibitoire — tu as besoin du fichier que tu peux dater, signer et archiver.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">2 </span>
                Rassemble ta matière première
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Un skill PPSPS générique te sortira un PPSPS générique. C&apos;est exactement ce que tu ne veux pas, parce qu&apos;un coordonnateur SPS sérieux le
                détectera immédiatement et te demandera de le refaire. Pour que le skill produise du sur-mesure conforme à ton métier, il a besoin de
                tes données. Rassemble cette matière avant de lancer la conversation — 30 minutes de préparation, des heures gagnées ensuite.
              </p>
              <p className="mt-10 text-[1.0625rem] font-semibold text-slate-900">1. Tes 2 ou 3 derniers PPSPS validés par un CSPS</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Le skill va calquer son ton, sa structure et son niveau de détail sur ces exemples. Choisis si possible des PPSPS qui ont passé
                sans réserve la validation d&apos;un coordonnateur SPS (pas tes brouillons). Format PDF ou Word indifféremment.
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">2. Tes modes opératoires types par activité</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Selon ton métier : maçonnerie banchée, pose d&apos;enduit, étanchéité de toiture, raccordement électrique, soudure, pose de carrelage,
                démolition, etc. Pour chaque mode opératoire, donne au skill : description des phases, outils utilisés, EPI requis, points de
                vigilance.
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">3. Ta matrice de risques propres</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Liste des risques que tu rencontres régulièrement : chute de hauteur, manutention manuelle, chute d&apos;objets, électrisation,
                exposition poussières, bruit, TMS, coupure, brûlure, exposition CMR. Pour chaque risque : niveau, mesure de prévention, EPI,
                formation requise.
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">4. Tes EPI standards et procédures d&apos;urgence</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Liste des EPI fournis par défaut (casque, chaussures, gants, harnais, masque FFP3, lunettes…), avec les normes (EN 397, EN ISO 20345…).
                Procédure d&apos;alerte SAMU/pompiers, secouriste désigné, contenu de la trousse de premiers secours, point de rassemblement.
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">5. Ton template de PPSPS société</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Si ton entreprise a un modèle Word officiel (en-tête avec logo et qualifications, pied de page avec mentions, structure d&apos;un sommaire
                conforme), uploade-le. Le skill respectera ta charte sans que tu aies à reparamétrer à chaque chantier.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">3 </span>
                Lance la conversation avec Claude
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Ouvre une nouvelle conversation sur claude.ai, uploade tous tes documents (PPSPS exemples, modes opératoires, matrice risques,
                template), puis colle ce prompt directement. Claude va te poser quelques questions de calibrage avant de générer ton skill.
              </p>
              <PromptBlock label="PROMPT À COLLER DANS CLAUDE" promptText={PROMPT_CALIBRATION_TEXT} />
              <p className="mt-8 text-xl font-semibold uppercase tracking-wide text-slate-900">Le point clé</p>
              <p className="mt-4 text-[1.0625rem] leading-relaxed text-slate-900">
                Plus ta matrice de risques et tes modes opératoires sont précis, plus le skill produira un PPSPS sérieux. Un PPSPS « copier-coller »
                est repéré en 30 secondes par un CSPS expérimenté. La précision de ta matière fait la différence.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">4 </span>
                Affine et active ton skill
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Claude va te proposer un premier brouillon de skill. Ne valide pas tout de suite. Demande-lui de te montrer un PPSPS test généré sur
                un cas fictif (par exemple : pose d&apos;étanchéité sur toiture-terrasse R+3 avec coactivité bardeurs et électriciens), puis ajuste.
              </p>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Ce que tu dois vérifier</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Les 9 rubriques R4532-64 sont toutes présentes et dans le bon ordre.</li>
                <li>▸ Les risques importés et exportés sont distincts et bien identifiés.</li>
                <li>▸ Les EPI sont nommés avec leur norme EN précise (pas juste « casque »).</li>
                <li>▸ Les modes opératoires sont adaptés aux activités du chantier, pas génériques.</li>
                <li>▸ La procédure d&apos;urgence est complète : alerter, secourir, évacuer, point rassemblement.</li>
                <li>▸ Les références réglementaires citées sont à jour (Code du travail, INRS, OPPBTP).</li>
              </ul>
              <PromptBlock label="EXEMPLE D&apos;AJUSTEMENT" promptText={PROMPT_EXEMPLE_AJUSTEMENT_TEXT} />
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Active le skill</p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Une fois le test concluant, demande à Claude : « Sauvegarde ce skill avec le nom ppsps-[ton-entreprise] ». Il sera disponible dans
                toutes tes prochaines conversations sans avoir à recoller le prompt.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">5 </span>
                Teste sur un vrai chantier
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Le vrai test, c&apos;est ton prochain chantier réel — pas un cas fictif.
              </p>
              <p className="mt-10 text-lg font-semibold text-slate-900">Workflow recommandé pour la première utilisation en condition réelle :</p>
              <p className="mt-6 text-lg font-semibold text-slate-900">Le test</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Récupère le PGCSPS (Plan Général de Coordination) du coordonnateur SPS.</li>
                <li>▸ Ouvre Claude, appelle ton skill : « Active le skill ppsps ».</li>
                <li>▸ Renseigne les caractéristiques du chantier et les activités prévues.</li>
                <li>▸ Réponds aux 2-3 questions complémentaires que Claude te posera.</li>
                <li>▸ Récupère ton .docx, relis 10 minutes, valide en interne, transmets au CSPS.</li>
              </ul>
              <p className="mt-10 text-lg font-semibold text-slate-900">Le bon prompt pour les usages quotidiens</p>
              <PromptBlock label="PROMPT — UTILISATION QUOTIDIENNE" promptText={PROMPT_USAGE_QUOTIDIEN_TEXT} />
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">La règle d&apos;or</p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Tu restes le rédacteur juridique du PPSPS. Le skill produit la mise en forme et garantit la complétude des rubriques. L&apos;analyse de
                risque réelle sur ton chantier reste de ta responsabilité de dirigeant — c&apos;est ton rôle.
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

              <p className="mt-10 text-2xl font-bold uppercase tracking-tight text-slate-900">
                ON TIENT LE BUREAU, VOUS TENEZ LE CHANTIER
              </p>
              <ul className="mt-6 list-none space-y-3 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Vous nous transmettez le PGCSPS et les caractéristiques de votre intervention</li>
                <li>▸ On rédige le PPSPS aux normes R4532, on le transmet au CSPS, on suit les retours</li>
                <li>▸ Vous démarrez votre chantier sans risque administratif, le bureau roule sans vous</li>
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
