import { getTutoPageDescription, tutoPageMetadata } from "@/lib/seo-tuto-metadata";
import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { CopyPromptButton } from "@/components/ressources/CopyPromptButton";
import { buildWebPageAndBreadcrumbJsonLd } from "@/lib/seo-landing-json-ld";
import { absoluteUrl, SITE_URL } from "@/lib/site";

const pagePath = "/ressources/tuto-skill-chiffrage-devis-bework";

const pdfPath = "/ressources/pdf/tuto-skill-chiffrage-devis-bework.pdf";

const pageUrl = absoluteUrl(pagePath);

const PROMPT_CALIBRATION_TEXT = `Je veux que tu créés un skill personnalisé pour générer mes
devis BTP chiffrés.

Contexte :
- Je suis [artisan / dirigeant PME / conducteur de travaux] chez [TON
ENTREPRISE]
- Métiers : [maçonnerie / couverture / électricité / plomberie / plâtrerie
/ multi-lots]
- Type de clientèle : [particuliers / pros / mixte] / [neuf / rénovation /
mixte]
- Volume : entre 25 et 40 devis par an
- Format de sortie attendu : Word .docx + tableau Excel calculs détaillés

Je t'ai uploadé :
- Mes 3 derniers devis finalisés (référence ton et structure)
- Ma bibliothèque de prix unitaires (BPU)
- Mes coefficients d'entreprise (FG, marge, aléas)
- Mon template de devis société

Construis un skill qui :
1. Me demande les caractéristiques du chantier en début de conversation
2. Accepte un métré collé brut ou un descriptif des travaux
3. Applique automatiquement mon BPU et mes coefficients
4. Calcule HT / TVA différenciée / TTC
5. Génère le devis Word complet avec mes 8 blocs standard
6. Sort en parallèle un Excel de chiffrage détaillé pour archive

Avant de générer le skill, pose-moi les questions nécessaires
pour bien calibrer la structure (entre 5 et 10 questions max).`;

const PROMPT_USAGE_QUOTIDIEN_TEXT = `Active le skill devis.

Caractéristiques du chantier :
- Client : [NOM + particulier ou pro]
- Adresse chantier : [ADRESSE]
- Nature : [neuf / rénovation logement +2 ans / entretien / pro]
- Surface ou volume : [QUANTITÉ + UNITÉ]
- Délai souhaité : [JJ/MM/AAAA]
- RGE / aides : [oui MaPrimeRénov' / oui CEE / non]

Métré et descriptif des travaux ci-dessous :
[COLLER TON MÉTRÉ — format libre, abréviations OK, 1 ligne = 1 poste]

Si certaines infos manquent (taux TVA exact, options chiffrage,
fournisseur matériaux), pose-moi les questions manquantes en bloc
compact, puis génère le devis final + l'Excel de calcul détaillé.`;

const PROMPT_EXEMPLE_AJUSTEMENT_TEXT = `Le brouillon est bien mais 3 points à corriger :

1. Pour les chantiers en rénovation logement de plus de 2 ans, applique
automatiquement la TVA à 5,5 % sur les travaux d'amélioration
énergétique
(isolation, chauffage performant) et 10 % sur le reste — ne mets pas
tout
à 10 %
2. Ajoute une ligne « Frais de déplacement et installation chantier » à 3
% du total HT, automatiquement calculée
3. Dans le récapitulatif final, fais apparaître l'acompte demandé (30 %)
et
le solde à la livraison, pas seulement le TTC global

Régénère le skill avec ces ajustements et propose-moi un nouveau
devis test sur le même cas fictif.`;

const H1 = "Crée ton skill — Chiffrage de devis BTP";


const breadcrumbItems = [
  { name: "Accueil", href: "/" },
  { name: "Ressources", href: "/ressources" },
  { name: H1, href: pagePath },
] as const;

const FAQ_FOR_JSON_LD = [
  {
    question: "Le devis généré a-t-il une valeur juridique ?",
    answer:
      "Oui, exactement la même que celui que tu aurais rédigé manuellement. Un devis devient juridiquement engageant à partir du moment où il est signé par le client (devis accepté = contrat formé selon l'article 1101 du Code civil). Peu importe l'outil utilisé pour le produire : Excel, Word, logiciel métier ou IA. Ce qui compte, c'est ta signature, ta validation finale et l'accord du client.",
  },
  {
    question: "Comment intégrer ma bibliothèque de prix Batiprix ou Le Moniteur ?",
    answer:
      "Si tu as un abonnement Batiprix ou un BPU type DTU, tu peux exporter les références qui te concernent en Excel et les uploader au skill comme bibliothèque. Le skill ira chercher les prix dans ce fichier en priorité avant d'utiliser ses estimations génériques. Pour les prix qui changent souvent (acier, cuivre, bois), prévois une mise à jour trimestrielle.",
  },
  {
    question: "Le skill peut-il calculer un métré à partir de plans ?",
    answer:
      "Partiellement. Si tu uploades un plan PDF avec les cotes lisibles, Claude peut extraire les dimensions principales et estimer surfaces et volumes. Pour un métré précis (linéaire de plinthe, surface de carrelage avec découpes, hauteur sous plafond), il faut toujours le ressaisir manuellement ou utiliser un logiciel de métré dédié. Le skill complète, il ne remplace pas le métreur.",
  },
  {
    question: "Couvre-t-il les marchés publics (DPGF, BPU, DQE) ?",
    answer:
      "Oui, à condition de le préciser dès le prompt initial. Les marchés publics ont leur propre format (DPGF = Décomposition du Prix Global et Forfaitaire, BPU = Bordereau des Prix Unitaires, DQE = Devis Quantitatif Estimatif). Donne au skill un exemple de DPGF déjà rendu sur un AO antérieur, et il calera la structure sur les exigences du Code de la commande publique.",
  },
  {
    question: "Mes prix et marges sont-ils confidentiels ?",
    answer:
      "Anthropic (l'éditeur de Claude) ne réutilise pas le contenu de tes conversations Pro et Team pour entraîner ses modèles. Tes BPU, coefficients et marges restent associés à ton compte et sont supprimables à tout moment. Pour une prudence maximale sur des chantiers stratégiques (gros AO concurrentiel), tu peux travailler avec des prix anonymisés et appliquer les vrais coefficients à la main en relecture.",
  },
  {
    question: "Que faire si le client demande un avenant après signature ?",
    answer:
      "Procédure standard : tu actives le skill et tu lui demandes un avenant numéroté qui fait référence au devis initial (numéro et date), liste précisément les travaux ajoutés ou modifiés, chiffre l'écart en plus ou en moins, et recalcule le nouveau total. L'avenant doit être signé par le client comme le devis initial pour avoir force contractuelle. Le skill garde la même structure pour cohérence administrative.",
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

export default function TutoSkillChiffrageDevisBeworkPage() {
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
              Tuto PDF gratuit · Chiffrage de devis BTP · BeWork
            </p>
            <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-[2.35rem] md:leading-tight">
              {H1}
            </h1>
            <p className="mt-4 max-w-none text-lg leading-relaxed text-slate-600 sm:text-[1.125rem] sm:leading-[1.7]">
              Tutoriel pas à pas pour chiffrer un devis BTP avec un skill Claude : BPU, coefficients, fichier Word et Excel alignés avec votre structure
              société — PDF gratuit intégré et transcription ci-dessous.
            </p>
            <p className="mt-3 max-w-xl text-[0.9375rem] leading-relaxed text-slate-600">
              Pour la méthode générale hors skill IA (hypothèses, DQE, interfaces), voyez aussi la page{" "}
              <Link href="/ressources/chiffrage-devis-btp" className="font-semibold text-[#1d4ed8] underline-offset-4 hover:underline">
                Chiffrage devis BTP
              </Link>
              .
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <CalendlyBookingLink className="inline-flex min-h-[3rem] shrink-0 items-center justify-center rounded-xl bg-[#1d4ed8] px-7 text-[0.9375rem] font-semibold text-white shadow-md shadow-[#1d4ed8]/25 transition hover:bg-[#1e40af] md:text-base">
                Réservez un appel
              </CalendlyBookingLink>
              <span className="text-sm leading-snug text-slate-600 sm:max-w-sm">
                20&nbsp;minutes pour cadrer vos devis et relais administratif BTP — sans engagement.
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
                title="Crée ton skill — Chiffrage de devis BTP — PDF BeWork"
              />
            </div>
          </section>

          <aside
            className="mb-14 rounded-2xl border border-[#1d4ed8]/22 bg-gradient-to-br from-[#eff6ff] to-white p-6 shadow-sm shadow-[#1d4ed8]/06 sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-8"
            aria-label="Réserver un appel découverte"
          >
            <div className="min-w-0 sm:flex-1">
              <p className="text-base font-semibold text-slate-900 md:text-[1.05rem]">
                Pas le temps sur les devis après les visites chantier&nbsp;?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 md:text-[0.9375rem]">
                BeWork peut tenir une partie du relais dossier&nbsp;: envoyez vos métrés et notes après le RDV, nous structurons et préparons
                les livrables selon vos règles — vous gardez le positionnement prix.
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
              <p className="mt-3 text-center text-xl font-semibold text-slate-900">Chiffrage de devis BTP</p>
              <p className="mt-2 text-center text-base text-slate-700 md:text-[1.05rem]">
                Le tutoriel pas à pas pour chiffrer un devis BTP — 30 minutes au lieu de 3 heures.
              </p>

              <h4 className="mt-14 text-xs font-semibold uppercase tracking-[0.2em] text-slate-800">Ce que tu vas apprendre</h4>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Activer la fonction skills dans Claude (5 minutes, 1 fois pour toutes)</li>
                <li>▸ Calibrer ton skill avec ton BPU, tes coefficients et tes derniers devis</li>
                <li>▸ Le prompt prêt à coller pour générer ton skill en 1 conversation</li>
                <li>▸ Le prompt d&apos;utilisation quotidienne pour transformer un métré en devis chiffré</li>
              </ul>

              <h3 className="mt-14 text-xl font-semibold tracking-tight text-slate-900">Pourquoi un skill chiffrage de devis ?</h3>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-slate-900">
                Le devis, c&apos;est l&apos;engagement contractuel n°1 de l&apos;entreprise BTP. Il fixe le prix, le périmètre, les délais. Une fois signé par le
                client, il devient une obligation de résultat. Une erreur de chiffrage de 5&nbsp;% sur un poste mal estimé, c&apos;est 5&nbsp;% de marge en
                moins, voire un litige si le client conteste un avenant.
              </p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Pour une grande partie des PME du bâtiment, c&apos;est aussi le levier commercial le plus chronophage : entre la visite, le métré, le
                chiffrage et la mise en forme, on est souvent à 3 ou 4 heures par devis — et vous n&apos;êtes pas sur le chantier. La FFB et la CAPEB
                soulignent qu&apos;un dirigeant d&apos;entreprise BTP de 5 à 20 personnes passe 30 à 40&nbsp;% de son temps en gestion administrative et
                commerciale, dont une part importante au chiffrage. Sur 25 à 40 devis par an, ça représente des dizaines d&apos;heures à retrouver les
                mêmes prix, les mêmes paragraphes et les mêmes TVA.
              </p>

              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Avec un skill bien construit, voilà ce qui change</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Vous donnez votre métré ou vos notes de visite ; le skill sort le devis chiffré et mis en page.</li>
                <li>▸ Votre BPU (bibliothèque de prix unitaires) est intégré : prix cohérents avec vos habitudes.</li>
                <li>▸ Les coefficients sont appliqués (frais généraux, marge, aléas).</li>
                <li>▸ La TVA peut être différenciée selon la nature des travaux (5,5&nbsp;% / 10&nbsp;% / 20&nbsp;%).</li>
                <li>
                  ▸ Gain de temps : viser environ 30 minutes au lieu de plusieurs heures par dossier lorsque votre matière première (BPU, modèles) est à
                  jour.
                </li>
              </ul>
              <p className="mt-10 text-[1.0625rem] leading-relaxed text-slate-900">
                Le skill ne décide pas pour vous. Il met en forme, calcule, complète. La marge commerciale, le positionnement prix et la stratégie face à la
                concurrence restent votre métier.
              </p>

              <h3 className="mt-14 text-xl font-semibold uppercase tracking-wide text-slate-900">Les 8 blocs standard d&apos;un devis BTP pro</h3>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-slate-900">
                (1) En-tête société : raison sociale, SIRET, RGE, assurance décennale.
                <br />
                (2) Identification client + adresse du chantier.
                <br />
                (3) Descriptif des travaux par poste ou par lot, avec spécifications techniques.
                <br />
                (4) Métré quantitatif (m², ml, m³, U, forfait).
                <br />
                (5) Prix unitaires HT × quantité = prix poste.
                <br />
                (6) Récapitulatif HT, TVA (taux différenciés selon nature des travaux), TTC, acompte demandé.
                <br />
                (7) Conditions particulières : délai d&apos;exécution, validité de l&apos;offre, modalités de paiement, exclusions.
                <br />
                (8) Mentions légales : médiateur, droit de rétractation, clause de propriété, etc.
              </p>
              <p className="mt-8 text-[1.0625rem] leading-relaxed text-slate-900">
                Un skill bien fait te garantit que ces 8 blocs sont présents à chaque devis dans le bon ordre.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">1 </span>
                Active la fonction skills dans Claude
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Pour faire tourner un skill personnalisé, tu as besoin d&apos;un abonnement Claude Pro à environ 18&nbsp;€/mois. Les skills peuvent être
                désactivés par défaut : active-les depuis les paramètres. Tu ne fais cette configuration qu&apos;une fois.
              </p>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Le chemin précis</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Connecte-toi sur claude.ai avec ton compte Pro.</li>
                <li>▸ Clique sur ton avatar en bas à gauche, puis sur Settings.</li>
                <li>▸ Dans le menu de gauche, clique sur Capabilities.</li>
                <li>▸ Active le toggle «&nbsp;Code execution&nbsp;» (indispensable pour générer le .docx ou .xlsx téléchargeables).</li>
                <li>▸ Active aussi «&nbsp;Skills&nbsp;» et «&nbsp;File creation&nbsp;» si besoin.</li>
              </ul>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Pourquoi c&apos;est indispensable</p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Sans exécution de code adaptée, Claude peut rédiger le devis dans la fenêtre de chat, mais tu manques souvent du fichier Word ou Excel
                prêt à envoyer au client ou à faire signer électroniquement. Pour du chiffrage client, avoir un fichier téléchargeable structuré est en
                pratique nécessaire.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">2 </span>
                Rassemble ta matière première
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Un skill chiffrage générique te sortira des prix génériques — à éviter. Pour calibrer le skill sur ton entreprise, rassemble tes documents avant
                la conversation (+/- 30&nbsp;minutes de préparation pour des heures gagnées ensuite).
              </p>

              <p className="mt-10 text-[1.0625rem] font-semibold text-slate-900">1. Tes 2 ou 3 derniers devis finalisés (signés ou refusés)</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Le skill s&apos;aligne sur le ton, la structure et le niveau de détail de ces exemples. Idéal : un simple, un moyen, un plus complexe. PDF ou
                Word.
              </p>

              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">2. Ta bibliothèque de prix unitaires (BPU)</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Excel ou PDF&nbsp;: prix main-d&apos;œuvre (&euro;/h), matériaux (&euro;/m², ml, unité), sous-traitance courante. Un BPU tenu à jour (au moins
                quelques fois par an) rend le résultat beaucoup plus fiable.
              </p>

              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">3. Tes coefficients d&apos;entreprise</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Frais généraux (souvent 1,15–1,25), marge (1,10–1,20), aléas (1,03–1,08), TVA applicables selon vos chantiers habituels.
              </p>

              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">4. Tes contraintes ou règles spécifiques</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Mécanismes d&apos;aides ou labels (RGE, attestations TVA réduite), garanties décennale / biennale, paiements habituels, retenues de garantie…
              </p>

              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">5. Ton template de devis société</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Modèle Word ou Excel officiel avec logo et mentions légales : le skill pourra mieux respecter votre charte sans ressaisie à chaque fois.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">3 </span>
                Lance la conversation avec Claude
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Ouvre une nouvelle conversation, téléverse tes pièces (devis exemples, BPU, coefficients, gabarit), puis colle le prompt de calibrage. Claude peut
                te poser des questions avant de formaliser ton skill.
              </p>
              <PromptBlock label="PROMPT À COLLER DANS CLAUDE" promptText={PROMPT_CALIBRATION_TEXT} />
              <p className="mt-8 text-xl font-semibold uppercase tracking-wide text-slate-900">Le point clé</p>
              <p className="mt-4 text-[1.0625rem] leading-relaxed text-slate-900">
                Plus ton BPU est complet et tes coefficients précis, plus le chiffrage sort «&nbsp;dans tes rails&nbsp;». Si ton BPU n&apos;est pas formalisé, investir un peu
                de temps dessus avant le skill est souvent le meilleur ROI.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">4 </span>
                Affine et active ton skill
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Ne valide pas le premier jet sans contrôle : demande un devis test sur un cas fictif (ex.&nbsp;rénove salle de bain, réfection toiture) et corrige avant de figer
                ton skill en production interne.
              </p>

              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Ce que tu dois vérifier</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Les 8 blocs standard sont tous présents et dans le bon ordre.</li>
                <li>▸ Les prix unitaires reflètent ton BPU (contrôle quelques lignes au hasard).</li>
                <li>▸ FG / marge / aléas appliqués au bon niveau dans la logique de calcul.</li>
                <li>▸ TVA différenciée lorsque plusieurs natures de travaux coexistent.</li>
                <li>▸ Mentions légales et aide / RGE cohérentes avec tes scénarios types.</li>
                <li>▸ Totaux HT / TVA / TTC : recoupement manuel sur un ou deux exemples.</li>
              </ul>

              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Exemple d&apos;ajustement à demander</p>
              <PromptBlock label="EXEMPLE D&apos;AJUSTEMENT" promptText={PROMPT_EXEMPLE_AJUSTEMENT_TEXT} />

              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Active le skill</p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Quand un test est concluant, demande&nbsp;: «&nbsp;Sauvegarde ce skill avec le nom{" "}
                <span className="whitespace-nowrap">devis-[ton-entreprise]</span>.&nbsp;» Il sera réutilisable dans tes prochains fils Claude.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">5 </span>
                Teste sur un vrai chantier
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Étape décisive : ton prochain vrai dossier après visite. Garde tes habitudes de relevé puis fais jouer le skill sur des données terrain réelles ;
                relisez toujours le positionnement commercial avant envoi définitif.
              </p>
              <p className="mt-10 text-lg font-semibold text-slate-900">Workflow recommandé</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Visite et notes comme d&apos;habitude&nbsp;: métré, photos, observations.</li>
                <li>▸ Dans Claude&nbsp;: «&nbsp;Active le skill devis&nbsp;» (ou le nom que tu lui as donné).</li>
                <li>▸ Tu colles métré, descriptif, infos client&nbsp;; tu réponds aux questions de précision éventuelles.</li>
                <li>▸ Tu récupères ton .docx + .xlsx, tu relies 5–10 minutes pour marges ou politique commerciale, puis diffusion.</li>
              </ul>
              <p className="mt-10 text-lg font-semibold text-slate-900">Le bon prompt pour les usages quotidiens</p>
              <PromptBlock label="PROMPT — UTILISATION QUOTIDIENNE" promptText={PROMPT_USAGE_QUOTIDIEN_TEXT} />

              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">La règle d&apos;or</p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Tu restes le décideur commercial. Le skill chiffre depuis ton cadre financier&nbsp;; le niveau auquel vous signez, les remises, la politique prix et la
                négociation restent vos arbitrages après relecture.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">Questions fréquentes</h3>

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

              <p className="mt-10 text-2xl font-bold uppercase tracking-tight text-slate-900">
                ON TIENT LE BUREAU, VOUS TENEZ LE CHANTIER
              </p>
              <ul className="mt-6 list-none space-y-3 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Vous nous envoyez vos métrés, plans et notes de visite après chaque RDV chantier.</li>
                <li>▸ On chiffre avec votre BPU, on met en page votre devis, on relance jusqu&apos;à signature.</li>
                <li>▸ Vous restez orienté RDV client et terrain&nbsp;; BeWork tient le dossier et le suivi lorsque vous le décidez.</li>
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
