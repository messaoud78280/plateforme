import { getTutoPageDescription, tutoPageMetadata } from "@/lib/seo-tuto-metadata";
import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { CopyPromptButton } from "@/components/ressources/CopyPromptButton";
import { buildWebPageAndBreadcrumbJsonLd } from "@/lib/seo-landing-json-ld";
import { absoluteUrl, SITE_URL } from "@/lib/site";
import { BeWorkStatsGrid } from "@/components/marketing/BeWorkStatsGrid";

const pagePath = "/ressources/tuto-skill-pv-levee-reserves-bework";

const pageUrl = absoluteUrl(pagePath);

const pdfPath = "/ressources/pdf/tuto-skill-pv-levee-reserves-bework.pdf";

const PROMPT_CALIBRATION_TEXT = `Je veux que tu créés un skill personnalisé pour générer mes
PV de levée de réserves.
Contexte :
- Je suis [conducteur de travaux / dirigeant] chez [TON ENTREPRISE]
- Métier : [maçonnerie / second œuvre / multi-lots / etc.]
- Marchés : [privés / publics / mixtes]
- Volume : 50 à 100 PV par an
- Sortie : Word .docx, A4 portrait, 2 à 4 pages
Je t'ai uploadé : 3 derniers PV de levée signés, 1 PV de réception
type, mes formulations juridiques, mes contraintes contractuelles
et mon template Word.
Construis un skill qui :
1. Accepte le PV de réception + la liste des reprises effectuées
2. Génère le tableau réserves (n° / libellé / reprise / statut)
3. Distingue levées / partielles / maintenues
4. Insère les bonnes formulations juridiques par statut
5. Rappelle la GPA de 1 an article 1792-6 CC
6. Prévoit zone signatures MOA + entreprise + MOE
7. Respecte ma charte graphique
Avant de générer, pose-moi 5 à 10 questions de calibrage.`;

const PROMPT_USAGE_QUOTIDIEN_TEXT = `Active le skill pv-levee-reserves.
Contexte du chantier :
- Opération : [NOM]
- MOA : [NOM]
- Date du PV de réception initial : [JJ/MM/AAAA]
- Nombre total de réserves émises : [N]
Ci-dessous, pour chaque réserve traitée :
N° X : [libellé initial copié du PV]
→ Reprise effectuée le [date] : [description]
→ Statut : [levée / partiellement levée / maintenue]
[répéter pour chaque réserve]
Génère le PV de levée conforme aux 7 blocs obligatoires. Si infos
manquantes, pose-moi les questions en bloc compact.`;

const PROMPT_EXEMPLE_AJUSTEMENT_TEXT = `Le brouillon est bien mais 3 points à corriger :
1. Pour les réserves « partiellement levées », ajoute systématiquement
un nouveau délai de reprise (date butoir + responsable côté
entreprise)
2. Dans la mention GPA, précise le point de départ : 1 an à compter
de la date de réception initiale (pas de la date du PV de levée)
3. Ajoute une clause finale « Le présent procès-verbal vaut levée
définitive des réserves visées. Les réserves maintenues feront
l'objet d'un PV ultérieur. » — pour éviter toute ambiguïté
Régénère le skill avec ces ajustements et propose-moi un nouveau
PV test sur le même cas fictif.`;

const H1 = "Crée ton skill — PV de levée de réserves";


const breadcrumbItems = [
  { name: "Accueil", href: "/" },
  { name: "Ressources", href: "/ressources" },
  { name: H1, href: pagePath },
] as const;

const FAQ_FOR_JSON_LD = [
  {
    question: "Le PV généré permet-il de libérer la retenue de garantie ?",
    answer:
      "Oui, à condition d'être signé par le MOA et que toutes les réserves soient levées. La retenue de garantie de 5 % (article 122 du Code de la commande publique pour les marchés publics, ou clause contractuelle pour les marchés privés) est libérée à l'expiration de la GPA d'un an, à condition qu'il n'y ait plus de réserve active. Si certaines réserves sont maintenues, la libération est différée jusqu'à leur levée définitive.",
  },
  {
    question: "Que faire si le MOA refuse de signer le PV ?",
    answer:
      "D'abord comprendre le motif de refus : a-t-il constaté une reprise insuffisante, ou conteste-t-il une formulation juridique ? Tu reprends ce qui doit l'être et tu lui retransmets une version 2. Si le refus persiste sans motif technique fondé, tu peux mettre en demeure par LRAR avec rappel des articles 1792-6 du Code civil et 122 du Code de la commande publique. En dernier recours, recours au médiateur ou tribunal compétent.",
  },
  {
    question: "Combien de temps après la réception faut-il faire les levées ?",
    answer:
      "La garantie de parfait achèvement court 1 an à compter de la date de réception. Toutes les réserves doivent être levées dans ce délai, sauf prolongation contractuelle. En pratique, un bon rythme : levée à 1 mois pour les finitions, à 3 mois pour les ajustements techniques, à 6 mois pour les vices apparus en exploitation. Au-delà de la GPA non levée, l'entreprise peut être condamnée à des dommages-intérêts.",
  },
  {
    question: "Que faire si une réserve ne peut pas être levée techniquement ?",
    answer:
      "Tu la documentes comme « maintenue » avec justification technique (ex : pièce de remplacement non disponible, désordre relevant en réalité d'un autre lot, contestation sur l'origine du désordre). Le PV est tout de même signé pour acter les autres levées. La réserve maintenue continuera de courir jusqu'à résolution. Si elle relève d'un autre intervenant, demande au MOA un avenant clarifiant la responsabilité.",
  },
  {
    question: "Mes données chantier sont-elles confidentielles ?",
    answer:
      "Anthropic (l'éditeur de Claude) ne réutilise pas le contenu de tes conversations Pro et Team pour entraîner ses modèles. Tes PV, références chantiers et noms de clients restent associés à ton compte et sont supprimables à tout moment. Pour les chantiers ultra-sensibles (sites classés défense, OIV), travaille avec des références anonymisées dans le prompt — c'est une pratique de prudence raisonnable.",
  },
  {
    question: "Le PV de levée vaut-il décharge de la garantie de parfait achèvement ?",
    answer:
      "Non. Le PV de levée acte que les réserves émises à la réception ont été traitées, mais la GPA d'1 an continue de courir pour tout désordre apparent ou caché qui se révélerait dans les 12 mois suivant la réception. La décharge complète de la GPA intervient à l'échéance du délai légal, sauf désordre nouveau signalé par LRAR avant cette échéance. Le PV de levée ne ferme pas la GPA, il ferme uniquement les réserves nommées.",
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

export default function TutoSkillPvLeveeReservesBeworkPage() {
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
              Tuto PDF gratuit · PV levée réserves · Claude · BeWork
            </p>
            <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-[2.35rem] md:leading-tight">
              {H1}
            </h1>
            <p className="mt-4 max-w-none text-lg leading-relaxed text-slate-600 sm:text-[1.125rem] sm:leading-[1.7]">
              Tutoriel BeWork pas à pas : du PV de réception et des preuves de reprise à un procès-verbal signable en 7 blocs — PDF en ligne,
              texte intégral et prompts à copier.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <CalendlyBookingLink className="inline-flex min-h-[3rem] shrink-0 items-center justify-center rounded-xl bg-[#1d4ed8] px-7 text-[0.9375rem] font-semibold text-white shadow-md shadow-[#1d4ed8]/25 transition hover:bg-[#1e40af] md:text-base">
                Réservez un appel
              </CalendlyBookingLink>
              <span className="text-sm leading-snug text-slate-600 sm:max-w-sm">
                20&nbsp;minutes pour cadrer votre besoin (PV, réception, assistance travaux BTP) — sans engagement.
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
                title="Crée ton skill — PV de levée de réserves — PDF BeWork"
              />
            </div>
          </section>

          <aside
            className="mb-14 rounded-2xl border border-[#1d4ed8]/22 bg-gradient-to-br from-[#eff6ff] to-white p-6 shadow-sm shadow-[#1d4ed8]/06 sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-8"
            aria-label="Réserver un appel découverte"
          >
            <div className="min-w-0 sm:flex-1">
              <p className="text-base font-semibold text-slate-900 md:text-[1.05rem]">
                Besoin d&apos;une assistance pour vos PV de levée et la libération des garanties&nbsp;?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 md:text-[0.9375rem]">
                Parlez-en avec BeWork sur un créneau de 20&nbsp;minutes : aide à la formalisation et au suivi jusqu&apos;à signature MOA.
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
              <p className="mt-3 text-center text-xl font-semibold text-slate-900">PV de levée de réserves</p>
              <p className="mt-2 text-center text-base text-slate-700 md:text-[1.05rem]">
                Le tutoriel pas à pas pour rédiger ton PV de levée — 15 minutes au lieu de 1 heure.
              </p>

              <h4 className="mt-14 text-xs font-semibold uppercase tracking-[0.2em] text-slate-800">Ce que tu vas apprendre</h4>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Activer la fonction skills dans Claude (5 minutes, 1 fois pour toutes)</li>
                <li>▸ Calibrer ton skill avec tes PV antérieurs et tes formulations type</li>
                <li>▸ Le prompt prêt à coller pour générer ton skill en 1 conversation</li>
                <li>▸ Le prompt quotidien pour transformer tes preuves de reprise en PV signable</li>
              </ul>

              <h3 className="mt-14 text-xl font-semibold tracking-tight text-slate-900">Pourquoi un skill PV de levée de réserves&nbsp;?</h3>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-slate-900">
                Le PV de levée de réserves, c&apos;est le document qui débloque ta trésorerie. Tant qu&apos;il n&apos;est pas signé par le maître d&apos;ouvrage, ta
                retenue de garantie reste séquestrée (5 % du marché en moyenne), la garantie de parfait achèvement (article 1792-6 du Code
                civil) continue de courir, et le solde du chantier peut être bloqué. Sur un chantier de 200 000 €, c&apos;est 10 000 € qui dorment chez
                le MOA pendant des mois.
              </p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Et pourtant, c&apos;est l&apos;un des documents que les conducteurs de travaux remettent au plus tard. Pourquoi&nbsp;? Parce que reprendre
                les réserves, c&apos;est urgent&nbsp;; mais formaliser le PV qui les acte, c&apos;est jamais. Résultat : sur un chantier moyen, on compte 5 à
                15 réserves, 3 à 5 PV à produire (plusieurs vagues de levée), et 30 à 60 minutes de rédaction par PV. Une PME qui livre 30
                chantiers par an passe 50 à 100 heures à rédiger ces PV — du temps qui n&apos;est ni terrain ni commercial.
              </p>

              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Avec un skill bien construit, voilà ce qui change</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Tu colles la liste des réserves et les preuves de reprise, le skill sort le PV signable.</li>
                <li>▸ Les 7 blocs obligatoires sont tous présents, dans le bon ordre, à chaque PV.</li>
                <li>▸ Les formulations juridiques (« levée définitive », « réserve maintenue ») sont calibrées.</li>
                <li>▸ Les références au marché initial et au PV de réception sont systématiquement insérées.</li>
                <li>▸ Tu passes de 1 heure à 15 minutes. Sur 80 PV par an, c&apos;est 60 heures récupérées.</li>
              </ul>
              <p className="mt-8 text-[1.0625rem] leading-relaxed text-slate-900">
                Le skill ne signe pas à ta place et ne remplace pas le constat visuel sur site. Il met en forme et garantit que rien ne manque pour
                que le MOA puisse signer en confiance.
              </p>

              <h3 className="mt-14 text-xl font-semibold uppercase tracking-wide text-slate-900">Les 7 blocs obligatoires d&apos;un PV de levée de réserves</h3>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-slate-900">
                (1) Identification du marché : MOA, MOE, n° de marché, adresse chantier. (2) Référence du PV de réception initial : date et n° de
                réserves émises. (3) Date et participants à la visite de levée. (4) Tableau des réserves traitées : n° / libellé initial / nature de la
                reprise / statut (levée / partiellement levée / maintenue). (5) Photos avant/après pour les reprises visibles. (6) Mention du
                démarrage ou maintien de la garantie de parfait achèvement (1 an article 1792-6 CC). (7) Signatures MOA + entreprise + MOE si
                présent. Sans ces 7 blocs, le PV peut être contesté.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">1 </span>
                Active la fonction skills dans Claude
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Pour faire tourner un skill personnalisé, tu as besoin d&apos;un abonnement Claude Pro à 18 €/mois. La fonction skills est
                désactivée par défaut, il faut l&apos;activer manuellement la première fois. C&apos;est rapide et tu ne le fais qu&apos;une fois.
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
                Sans Code execution, Claude ne peut pas générer un fichier Word téléchargeable. Il pourra te rédiger le PV en texte dans la
                conversation, mais pas te livrer le .docx prêt à imprimer et à faire signer sur site. Pour un document qui débloque ta retenue de
                garantie, c&apos;est rédhibitoire — tu as besoin du fichier mis en page que tu peux imprimer ou envoyer en pièce jointe.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">2 </span>
                Rassemble ta matière première
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Un skill PV de levée générique te sortira un document fade et générique. Pour qu&apos;il parle ton métier, ton entreprise et tes
                chantiers, il a besoin de tes données. Rassemble cette matière avant de lancer la conversation — 20 minutes de préparation, des
                heures gagnées ensuite.
              </p>

              <p className="mt-10 text-[1.0625rem] font-semibold text-slate-900">1. Tes 2 ou 3 derniers PV de levée signés</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Le skill va calquer son ton, sa structure et son niveau de détail sur ces exemples. Choisis si possible des PV qui ont été signés sans
                contestation par le MOA. Format PDF ou Word indifféremment.
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">2. Un PV de réception initial type</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Avec sa liste de réserves numérotées et leur libellé. Le skill comprend ainsi le format d&apos;entrée standard, sait reprendre les n° de
                réserves à l&apos;identique et n&apos;invente pas de nouvelle numérotation.
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">3. Tes formulations juridiques type</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                « Réserve levée à la satisfaction du maître d&apos;ouvrage », « Reprise effectuée conformément aux exigences du CCTP », « Réserve
                maintenue, nouveau délai de reprise au [date] ». Donne au skill ta bibliothèque de formulations habituelles.
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">4. Tes contraintes contractuelles</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Modalités de signature MOA (sur site / par courrier / dématérialisée), délais GPA particuliers (au-delà du 1 an légal), clauses
                spéciales de retenue de garantie (caution remplaçante, libération anticipée). Le skill s&apos;y adaptera.
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">5. Ton template société</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Si ton entreprise a un modèle Word officiel (en-tête avec logo, footer avec mentions légales et coordonnées, structure de tableau de
                réserves), uploade-le. Le skill respectera ta charte sans que tu aies à reparamétrer à chaque PV.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">3 </span>
                Lance la conversation avec Claude
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Ouvre une nouvelle conversation sur claude.ai, uploade tous tes documents (PV signés, PV de réception, formulations type,
                template), puis colle ce prompt directement. Claude va te poser quelques questions de calibrage avant de générer ton skill.
              </p>
              <PromptBlock label="PROMPT À COLLER DANS CLAUDE" promptText={PROMPT_CALIBRATION_TEXT} />
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Le point clé</p>
              <p className="mt-4 text-[1.0625rem] leading-relaxed text-slate-900">
                Demande au skill de toujours reprendre la numérotation exacte des réserves du PV initial. Un MOA reconnaît plus facilement «
                réserve n° 7 levée » que « la fissure du hall reprise ». La traçabilité fait la signature.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">4 </span>
                Affine et active ton skill
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Claude va te proposer un premier brouillon de skill. Ne valide pas tout de suite. Demande-lui de te montrer un PV test généré sur un
                cas fictif (par exemple : 5 réserves dont 3 levées, 1 partiellement levée et 1 maintenue), puis ajuste.
              </p>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Ce que tu dois vérifier</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Les 7 blocs obligatoires sont tous présents et dans le bon ordre.</li>
                <li>▸ Les n° de réserves sont repris à l&apos;identique du PV de réception initial.</li>
                <li>▸ Les statuts (levée / partielle / maintenue) sont visuellement distincts.</li>
                <li>▸ Les formulations juridiques correspondent à ta bibliothèque.</li>
                <li>▸ La zone photos avant/après est prévue (insertion possible après génération).</li>
                <li>▸ Les signatures MOA + entreprise + MOE sont à la bonne place.</li>
              </ul>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Ajustement type à demander</p>
              <PromptBlock label="EXEMPLE D&apos;AJUSTEMENT" promptText={PROMPT_EXEMPLE_AJUSTEMENT_TEXT} />
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Active le skill</p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Une fois le test concluant, demande à Claude : « Sauvegarde ce skill avec le nom pv-levee-reserves-[ton-entreprise] ». Il sera
                disponible dans toutes tes prochaines conversations sans avoir à recoller le prompt.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">5 </span>
                Teste sur un vrai chantier
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Le vrai test, c&apos;est ton prochain chantier en phase de levée. Workflow recommandé pour la première utilisation en condition réelle
                :
              </p>
              <p className="mt-10 text-lg font-semibold text-slate-900">Le test</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Récupère le PV de réception initial avec la liste des réserves.</li>
                <li>▸ Liste les reprises effectuées (avec photos avant/après si possible).</li>
                <li>▸ Ouvre Claude, appelle ton skill : « Active le skill pv-levee-reserves ».</li>
                <li>▸ Colle le PV initial + ta liste de reprises + le statut souhaité par réserve.</li>
                <li>▸ Récupère ton .docx, relis 5 minutes, valide en interne, transmets au MOA.</li>
              </ul>
              <p className="mt-10 text-lg font-semibold text-slate-900">Le bon prompt pour les usages quotidiens</p>
              <PromptBlock label="PROMPT — UTILISATION QUOTIDIENNE" promptText={PROMPT_USAGE_QUOTIDIEN_TEXT} />

              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">La règle d&apos;or</p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Tu restes le constatant. Le skill met en forme ce que tu as vu et validé sur site. Ne signe jamais un PV sans avoir vérifié
                physiquement chaque reprise — c&apos;est ta responsabilité de conducteur de travaux et c&apos;est ce qui sécurise la libération de la retenue
                de garantie.
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
                <li>▸ Vous nous transmettez le PV de réception et les preuves de reprise (photos, mails MOE)</li>
                <li>▸ On rédige le PV de levée, on le transmet au MOA, on relance jusqu&apos;à signature</li>
                <li>▸ Vous récupérez votre retenue de garantie sans courir derrière les signatures</li>
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
