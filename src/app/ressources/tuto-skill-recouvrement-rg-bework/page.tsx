import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { BeWorkStatsGrid } from "@/components/marketing/BeWorkStatsGrid";
import { CopyPromptButton } from "@/components/ressources/CopyPromptButton";
import { buildWebPageAndBreadcrumbJsonLd } from "@/lib/seo-landing-json-ld";
import { getTutoPageDescription, tutoPageMetadata } from "@/lib/seo-tuto-metadata";
import { absoluteUrl, SITE_URL } from "@/lib/site";

const pagePath = "/ressources/tuto-skill-recouvrement-rg-bework";
const pageUrl = absoluteUrl(pagePath);
const pdfPath = "/ressources/pdf/tuto-skill-recouvrement-rg-bework.pdf";

const H1 = "Crée ton skill — Recouvrement & retenue de garantie";

const PROMPT_CALIBRATION_TEXT = `Tu es mon assistant juridique recouvrement & retenue de garantie pour [NOM ENTREPRISE], [activité BTP].

Ta mission : m'aider à récupérer les sommes dues — factures impayées, garanties de paiement et retenues de garantie — en t'appuyant sur les textes en vigueur que je te fournis.

Tu connais et appliques :
- C. civil art. 1799-1 + décret 99-658 (garantie de paiement, seuil 12 000 € HT) ;
- loi n° 71-584 du 16/07/1971 (RG marché privé) ;
- Code de la commande publique + décret 2013-269 (RG et délais marché public) ;
- loi n° 75-1334 du 31/12/1975 (action directe / paiement direct sous-traitant) ;
- C. commerce art. L441-10 et D441-5 (délais, pénalités, indemnité 40 €) ;
- C. civil art. 2224 (prescription 5 ans).

Pour chaque dossier que je te décris, tu :
1. identifies marché privé ou public, impayé / garantie / RG ;
2. vérifies les dates (échéance, réception) et le délai de prescription ;
3. me dis l'action possible aujourd'hui et la date de la suivante ;
4. rédiges le courrier adapté, daté, chiffré, prêt à signer ;
5. me signales toujours quand le dossier relève d'un conseil.

Pose-moi tes questions s'il te manque une info. Ne cite jamais un texte dont tu n'es pas sûr.`;

const PROMPT_AJUSTEMENT_TEXT = `Trois corrections :
1. Pour tout marché privé > 12 000 € HT, rappelle-moi de réclamer la garantie de paiement de l'article 1799-1 dès la signature.
2. Pour la RG privée, libération un an après réception, sauf opposition par LRAR.
3. Avant chaque relance, indique-moi la date de prescription du dossier.`;

const PROMPT_USAGE_QUOTIDIEN_TEXT = `Nouveau dossier à traiter :
- Client / MOA : [NOM]        - Marché : [privé / public]
- Montant dû : [€ TTC]        - Sous-traitance : [oui/non]
- Facture émise le : [date]   - Échéance : [date]
- Réception des travaux le : [date si applicable]
- Retenue de garantie : [oui/non, montant]
- Garantie de paiement 1799-1 obtenue : [oui/non]
- Historique : [relances déjà faites]

Dis-moi l'action à mener aujourd'hui, l'échéance suivante, le risque de prescription, et rédige le courrier correspondant prêt à signer.`;

const OUTILS_REGLEMENTAIRES = [
  {
    besoin: "Être payé dans les délais",
    texte: "C. commerce, art. L441-10 et D441-5",
    exiger: "30 j par défaut (60 j max) ; pénalités de plein droit dès J+1 + indemnité de 40 €/facture",
  },
  {
    besoin: "Sécuriser un marché privé",
    texte: "C. civil, art. 1799-1 + décret n° 99-658 du 30/07/1999",
    exiger: "Caution de paiement dès 12 000 € HT ; à défaut, suspension des travaux après MED de 15 j",
  },
  {
    besoin: "Être payé en sous-traitance",
    texte: "Loi n° 75-1334 du 31/12/1975",
    exiger: "Action directe contre le MOA (privé) ; paiement direct par l'acheteur (public)",
  },
  {
    besoin: "Récupérer la RG — privé",
    texte: "Loi n° 71-584 du 16/07/1971 (ordre public)",
    exiger: "Libération 1 an après réception, sauf opposition par LRAR ; consignation chez un tiers",
  },
  {
    besoin: "Récupérer la RG — public",
    texte: "Code de la commande publique (art. R2191-32 et s.)",
    exiger: "Remboursement sous 30 j après l'expiration du délai de garantie ; taux réduit pour les PME",
  },
  {
    besoin: "Être payé par un acheteur public",
    texte: "Décret n° 2013-269 du 29/03/2013",
    exiger: "30 j (50 j hôpitaux, 60 j EPIC) ; intérêts moratoires + 40 € automatiques ; renonciation interdite",
  },
  {
    besoin: "Agir avant qu'il soit trop tard",
    texte: "C. civil, art. 2224 (5 ans) ; loi n° 68-1250 (4 ans, public)",
    exiger: "Délai pour réclamer en justice ; point de départ = date de la facture",
  },
  {
    besoin: "Forcer le paiement",
    texte: "Injonction de payer / référé provision",
    exiger: "Titre exécutoire rapide quand l'amiable a échoué (avocat ou commissaire de justice)",
  },
] as const;

const breadcrumbItems = [
  { name: "Accueil", href: "/" },
  { name: "Ressources", href: "/ressources" },
  { name: "Tutoriels", href: "/ressources/tutos" },
  { name: H1, href: pagePath },
] as const;

const FAQ_FOR_JSON_LD = [
  {
    question: "Les courriers générés ont-ils une valeur juridique ?",
    answer:
      "Une mise en demeure rédigée par le skill, datée, signée de votre main et envoyée en recommandé avec accusé de réception a la même valeur qu'un courrier que vous auriez écrit vous-même : c'est l'envoi et la signature qui comptent, pas l'outil. Le skill produit des actes de relance amiable, pas des actes de procédure : dès qu'on passe à l'injonction de payer ou au référé provision, ou si le client conteste sérieusement la dette, il vous le signale et vous renvoie vers un conseil.",
  },
  {
    question: "Pourquoi la distinction public / privé est-elle si importante ?",
    answer:
      "Parce que ce sont deux régimes différents. En marché privé, la RG suit la loi de 1971 : facultative, consignée, libérée un an après réception sauf opposition. En marché public, c'est le Code de la commande publique : remboursement dans les 30 jours suivant l'expiration du délai de garantie, taux réduit pour les PME, et des délais de paiement encadrés par le décret de 2013 avec intérêts moratoires automatiques. Mélanger les deux est l'erreur la plus fréquente — le skill l'évite en posant systématiquement la question.",
  },
  {
    question: "Jusqu'à quand puis-je réclamer une créance ?",
    answer:
      "Entre professionnels, l'action en paiement se prescrit par cinq ans à compter du jour où vous avez connu les faits — en pratique, souvent la date de la facture (article 2224 du Code civil). Sur les créances détenues sur une personne publique, c'est une prescription quadriennale (loi du 31 décembre 1968). Le skill calcule cette échéance pour chaque dossier : c'est ce qui évite de laisser dormir une créance jusqu'à ce qu'elle devienne irrécouvrable.",
  },
  {
    question: "La garantie de paiement de l'article 1799-1, comment l'obtenir ?",
    answer:
      "Sur un marché privé supérieur à 12 000 € HT, votre maître d'ouvrage professionnel doit vous fournir une caution bancaire garantissant le paiement, et il en est débiteur dès la signature. Vous la réclamez par écrit. Tant qu'elle n'est pas fournie et que vous restez impayé, vous pouvez suspendre les travaux après une mise en demeure restée 15 jours sans effet. Le skill rédige cette demande et la mise en demeure associée.",
  },
  {
    question: "Mon sous-traitant n'est pas payé — ou je suis sous-traitant impayé ?",
    answer:
      "La loi du 31 décembre 1975 protège le sous-traitant. En marché public, il bénéficie du paiement direct par l'acheteur. En marché privé, il dispose d'une action directe contre le maître d'ouvrage, qui s'enclenche par une mise en demeure de l'entrepreneur principal, restée sans effet un mois, avec copie au maître d'ouvrage. Le skill connaît la procédure et rédige les courriers dans le bon ordre, mais signale que le recouvrement contentieux relève ensuite d'un conseil.",
  },
  {
    question: "Et si je n'ai pas le temps de tout mettre en place ?",
    answer:
      "C'est le cas le plus courant. Construire le skill, tenir le tableau de créances à jour et envoyer les recommandés au bon moment demande une régularité que le chantier ne laisse pas toujours. C'est là qu'un assistant travaux externalisé prend le relais : vous envoyez vos dossiers, il pilote le recouvrement et la RG à votre place.",
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

export default function TutoSkillRecouvrementRgBeworkPage() {
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
      { "@type": "HowToStep", name: "Activer la fonction Compétences dans Claude" },
      { "@type": "HowToStep", name: "Rassembler ta matière première" },
      { "@type": "HowToStep", name: "Lancer la conversation avec Claude" },
      { "@type": "HowToStep", name: "Affiner et activer ton skill" },
      { "@type": "HowToStep", name: "Tester sur un vrai dossier" },
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
              Tuto PDF gratuit · Recouvrement · Retenue de garantie · BeWork
            </p>
            <h1 className="font-heading mt-3 text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-[2.35rem] md:leading-tight">
              {H1}
            </h1>
            <p className="mt-4 max-w-none text-lg leading-relaxed text-slate-600 sm:text-[1.125rem] sm:leading-[1.7]">
              Transformer une facture impayée ou une retenue de garantie bloquée en dossier de relance argumenté (courriers, dates, pièces).
              Tutoriel pas à pas — 15 minutes au lieu d&apos;une demi-journée. PDF consultable et prompts prêts à coller.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <CalendlyBookingLink className="inline-flex min-h-[3rem] shrink-0 items-center justify-center rounded-xl bg-[#1d4ed8] px-7 text-[0.9375rem] font-semibold text-white shadow-md shadow-[#1d4ed8]/25 transition hover:bg-[#1e40af] md:text-base">
                Réservez un appel
              </CalendlyBookingLink>
              <a
                href={pdfPath}
                download
                className="inline-flex min-h-[3rem] shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-[0.9375rem] font-semibold text-slate-800 transition hover:bg-slate-50 md:text-base"
              >
                Télécharger le PDF (10 pages)
              </a>
              <Link
                href="/ressources/tutos"
                className="inline-flex min-h-[3rem] shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-[0.9375rem] font-semibold text-slate-800 transition hover:bg-slate-50 md:text-base"
              >
                Voir tous les tutos
              </Link>
            </div>
          </header>

          <section
            id="pdf-original"
            className="scroll-mt-[calc(4.55rem+1rem)] mb-14 rounded-3xl border border-slate-200 bg-slate-100/80 p-6 shadow-sm sm:p-10"
            aria-labelledby="pdf-heading"
          >
            <h2 id="pdf-heading" className="text-xl font-semibold tracking-tight text-slate-900">
              Voir le tuto recouvrement & RG dans sa mise en page originale
            </h2>
            <p className="mt-3 w-full leading-relaxed text-slate-600">
              Consultez le guide dans sa mise en page d&apos;origine. Vous pouvez l&apos;agrandir ou le télécharger librement. PDF · 10 pages.
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
                title="Crée ton skill — Recouvrement & retenue de garantie — PDF BeWork"
              />
            </div>
          </section>

          <section className="mb-14" aria-labelledby="outils-reglementaires-heading">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
              <h2 id="outils-reglementaires-heading" className="text-2xl font-bold tracking-tight text-slate-900 md:text-[1.65rem]">
                Ta boîte à outils réglementaire
              </h2>
              <p className="mt-4 text-[1.0625rem] leading-relaxed text-slate-700">
                Les textes à donner à ton skill pour qu&apos;il raisonne juste. Charge-les (ou leurs références) dans ta compétence : c&apos;est ce qui
                transforme un assistant bavard en assistant fiable. Réserve l&apos;injonction de payer et le référé provision à un conseil — le skill
                prépare le dossier, le professionnel le porte devant le juge.
              </p>
              <div className="mt-8 overflow-x-auto">
                <table className="w-full min-w-[720px] border-separate border-spacing-y-2 text-left text-[0.95rem]">
                  <thead>
                    <tr className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                      <th scope="col" className="py-2 pr-4">
                        Besoin
                      </th>
                      <th scope="col" className="py-2 pr-4">
                        Texte de référence
                      </th>
                      <th scope="col" className="py-2 pr-4">
                        Ce que tu peux exiger
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-800">
                    {OUTILS_REGLEMENTAIRES.map((row) => (
                      <tr key={row.besoin} className="rounded-lg bg-slate-50">
                        <th scope="row" className="rounded-l-lg py-3 pl-4 pr-4 align-top font-semibold text-slate-900">
                          {row.besoin}
                        </th>
                        <td className="py-3 pr-4 align-top text-slate-700">{row.texte}</td>
                        <td className="rounded-r-lg py-3 pr-4 align-top text-slate-700">{row.exiger}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <aside
            className="mb-14 rounded-2xl border border-[#1d4ed8]/22 bg-gradient-to-br from-[#eff6ff] to-white p-6 shadow-sm shadow-[#1d4ed8]/06 sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-8"
            aria-label="Réserver un appel découverte"
          >
            <div className="min-w-0 sm:flex-1">
              <p className="text-base font-semibold text-slate-900 md:text-[1.05rem]">
                Pas le temps de tenir le recouvrement et la RG à jour&nbsp;?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 md:text-[0.9375rem]">
                BeWork trace, relance et rédige mises en demeure, demandes de garantie de paiement et de libération de RG — vous validez avant envoi.
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
              <p className="mt-3 text-center text-xl font-semibold text-slate-900">Recouvrement & retenue de garantie</p>
              <p className="mt-2 text-center text-base text-slate-700 md:text-[1.05rem]">
                Le tutoriel pas à pas pour transformer une facture impayée ou une retenue de garantie bloquée en dossier de relance argumenté — 15
                minutes au lieu d&apos;une demi-journée.
              </p>

              <h4 className="mt-14 text-xs font-semibold uppercase tracking-[0.2em] text-slate-800">Ce que tu vas apprendre</h4>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Construire un assistant qui connaît tes propres contrats, CGV et marchés</li>
                <li>▸ Maîtriser les textes qui sécurisent ton paiement, de l&apos;article 1799-1 au Code de la commande publique</li>
                <li>▸ Produire mise en demeure, garantie de paiement et demande de libération de RG en quelques minutes</li>
                <li>▸ Garder une trace écrite, datée et opposable pour chaque créance</li>
              </ul>

              <h3 className="mt-14 text-xl font-semibold tracking-tight text-slate-900">Pourquoi un skill recouvrement & retenue de garantie&nbsp;?</h3>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-slate-900">
                Dans le BTP, la marge se joue rarement sur le chiffrage : elle se joue sur la trésorerie. Deux mécanismes la rongent en silence.
                D&apos;abord les impayés — situations de travaux réglées en retard par le client ou le maître d&apos;ouvrage. Ensuite la retenue de
                garantie : 5&nbsp;% de chaque marché immobilisés pendant un an, qui dorment souvent bien au-delà parce que personne n&apos;a le temps
                de réclamer leur libération.
              </p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Le problème n&apos;est presque jamais juridique : le droit est largement de votre côté. Le problème est administratif. Relancer au bon
                moment, citer le bon texte, envoyer le bon courrier en recommandé, tracer chaque échéance — c&apos;est du temps que le dirigeant ou le
                conducteur de travaux n&apos;a pas.
              </p>

              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Avec un skill bien construit, voilà ce qui change</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Tu décris l&apos;impayé en deux lignes, le skill rédige la mise en demeure conforme, datée et chiffrée</li>
                <li>▸ Il calcule les pénalités de retard et l&apos;indemnité forfaitaire dues de plein droit</li>
                <li>▸ Il distingue automatiquement marché privé et marché public — les règles ne sont pas les mêmes</li>
                <li>▸ Il sait actionner la garantie de paiement, l&apos;action directe du sous-traitant et la libération de RG</li>
                <li>▸ Il tient un tableau de suivi de tes créances avec les prochaines actions et leurs échéances</li>
              </ul>
              <p className="mt-8 text-[1.0625rem] leading-relaxed text-slate-900">
                Tu ne remplaces pas ton avocat. Tu arrêtes de lui confier — ou pire, d&apos;abandonner — les relances que tu peux mener toi-même, vite
                et proprement.
              </p>

              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">L&apos;arme la plus sous-utilisée du bâtiment</p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                L&apos;article 1799-1 du Code civil oblige tout maître d&apos;ouvrage professionnel à vous fournir une garantie de paiement (caution
                bancaire) dès que le marché privé dépasse 12&nbsp;000&nbsp;€ HT. C&apos;est d&apos;ordre public : le maître d&apos;ouvrage en est
                débiteur dès la signature. Tant que cette garantie n&apos;est pas fournie et que vous restez impayé, vous pouvez suspendre les travaux
                après une mise en demeure restée 15 jours sans effet.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">1 </span>
                Active la fonction Compétences dans Claude
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Un skill (« compétence ») est un mode d&apos;emploi permanent que tu donnes à Claude une fois pour toutes. Une fois activé, tu n&apos;as
                plus à réexpliquer ton contexte à chaque relance : Claude sait déjà comment tu travailles.
              </p>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Le chemin précis (interface 2026)</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Connecte-toi sur claude.ai</li>
                <li>▸ Clique sur ton avatar, en bas à gauche, puis sur « Personnaliser »</li>
                <li>▸ Ouvre l&apos;onglet « Compétences »</li>
                <li>▸ Clique sur le bouton « + » en haut à droite</li>
                <li>▸ Choisis « + Créer une compétence » (création assistée) ou « Téléverser » si tu importes un fichier existant</li>
              </ul>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">À activer aussi</p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Dans le même menu « Personnaliser », vérifie que l&apos;option « Exécution de code » est activée. Sans elle, pas de sortie Word ou PDF
                en livrable — donc pas de mise en demeure ni de courrier prêt à signer.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">2 </span>
                Rassemble ta matière première
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Un skill juridique ne vaut que par les documents que tu lui donnes. L&apos;objectif n&apos;est pas que Claude récite la loi en général,
                mais qu&apos;il applique tes contrats et tes habitudes.
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">1. Tes deux ou trois derniers dossiers réglés</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Une mise en demeure que tu as déjà envoyée, une demande de libération de RG aboutie, un échange qui a débloqué un paiement. Claude
                calque le ton et le niveau de fermeté qui te ressemblent.
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">2. Tes CGV, devis-types et marchés courants</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Le skill doit savoir si tes contrats prévoient une retenue de garantie, une clause de garantie de paiement, quel taux de pénalité tu
                mentionnes, quels délais tu accordes.
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">3. Ta boîte à outils réglementaire</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Donne-lui le tableau des textes de référence (1799-1, loi de 1971, Code de la commande publique, décret 2013-269, loi de 1975, L441-10
                / D441-5, article 2224). C&apos;est le socle qui le rend juste.
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">4. L&apos;historique de tes créances en cours</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Un tableau simple : client, montant, date de facture, date d&apos;échéance, marché privé ou public, RG retenue ou non, garantie de
                paiement obtenue ou non.
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">5. Tes modèles de courriers</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Si tu as déjà une trame de relance, de mise en demeure ou de demande de caution, donne-la. Sinon, le skill en construira une que tu
                valideras une fois pour toutes.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">3 </span>
                Lance la conversation avec Claude
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Ouvre une nouvelle conversation, joins ta matière première (contrats, CGV, boîte à outils, modèles, tableau de créances) puis colle le
                prompt ci-dessous. Adapte les passages entre crochets à ton entreprise.
              </p>
              <PromptBlock label="PROMPT — INITIALISATION DU SKILL" promptText={PROMPT_CALIBRATION_TEXT} />
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Le point clé</p>
              <p className="mt-4 text-[1.0625rem] leading-relaxed text-slate-900">
                La dernière consigne — « ne cite jamais un texte dont tu n&apos;es pas sûr » et « signale-moi quand ça relève d&apos;un conseil » — est
                ce qui rend le skill fiable. Un assistant qui sait dire « là, il faut un avocat » vaut bien plus qu&apos;un assistant qui invente un
                article de loi.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">4 </span>
                Affine et active ton skill
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Claude te propose une première version. Avant de l&apos;activer définitivement, vérifie ces points.
              </p>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Ce que tu dois vérifier</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Le skill distingue bien marché privé et marché public dans ses réponses</li>
                <li>▸ Il calcule correctement les échéances (J+1 pénalités, 1 an pour la RG privée, 30 j en public)</li>
                <li>▸ Il pense à la garantie de paiement 1799-1 quand le marché privé dépasse 12 000 € HT</li>
                <li>▸ Il chiffre les pénalités et ajoute systématiquement l&apos;indemnité de 40 €</li>
                <li>▸ Il vérifie que la créance n&apos;est pas prescrite avant de proposer une action</li>
                <li>▸ Il refuse d&apos;inventer un article et te renvoie vers un conseil quand c&apos;est justifié</li>
              </ul>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Ajustement type à demander</p>
              <PromptBlock label="EXEMPLE D&apos;AJUSTEMENT" promptText={PROMPT_AJUSTEMENT_TEXT} />
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Active le skill</p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Quand le comportement te convient, demande à Claude : « Transforme ces consignes en compétence réutilisable ». Tu la retrouveras dans
                ton onglet Compétences, prête pour chaque nouveau dossier.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">5 </span>
                Teste sur un vrai dossier
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Un skill ne se valide jamais sur un cas théorique. Prends une créance réelle qui traîne et déroule-la en entier.
              </p>
              <p className="mt-10 text-lg font-semibold text-slate-900">Le test</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Choisis une facture en retard ou une RG non libérée depuis plus d&apos;un an</li>
                <li>▸ Décris le dossier au skill en quelques lignes (montant, dates, privé ou public)</li>
                <li>▸ Vérifie que l&apos;action proposée, le texte cité et le courrier sont justes</li>
                <li>▸ Imprime, signe, envoie en recommandé — et note la date dans ton tableau de suivi</li>
                <li>▸ Reviens vers le skill à l&apos;échéance suivante pour l&apos;étape d&apos;après</li>
              </ul>
              <p className="mt-10 text-lg font-semibold text-slate-900">Le bon prompt pour un usage quotidien</p>
              <PromptBlock label="PROMPT — UTILISATION QUOTIDIENNE" promptText={PROMPT_USAGE_QUOTIDIEN_TEXT} />
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">La règle d&apos;or</p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Une créance qu&apos;on relance par écrit, datée et chiffrée, se règle dans la grande majorité des cas avant toute procédure.
                L&apos;arme la plus efficace n&apos;est pas l&apos;avocat : c&apos;est la régularité. Le skill existe pour que cette régularité ne
                dépende plus de ton temps disponible.
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
                <li>▸ Vous nous transmettez vos factures impayées, vos marchés et vos dates de réception</li>
                <li>▸ On trace, on relance, on rédige mises en demeure, demandes de garantie de paiement et de libération de RG aux bonnes échéances</li>
                <li>▸ Vous restez 100 % sur le terrain, votre trésorerie se débloque sans vous</li>
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
