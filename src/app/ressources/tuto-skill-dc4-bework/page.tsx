import { getTutoPageDescription, tutoPageMetadata } from "@/lib/seo-tuto-metadata";
import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { CopyPromptButton } from "@/components/ressources/CopyPromptButton";
import { BeWorkStatsGrid } from "@/components/marketing/BeWorkStatsGrid";
import { buildWebPageAndBreadcrumbJsonLd } from "@/lib/seo-landing-json-ld";
import { absoluteUrl, SITE_URL } from "@/lib/site";

const pagePath = "/ressources/tuto-skill-dc4-bework";
const pageUrl = absoluteUrl(pagePath);
const pdfPath = "/ressources/pdf/tuto-skill-dc4-bework.pdf";

const PROMPT_CALIBRATION_TEXT = `Je veux créer un skill Claude qui génère mes DC4 — Acte spécial de sous-traitance — pour des marchés publics BTP.

Mon contexte :
— J'interviens sur des marchés publics de [type de travaux]
— Mes lots typiques sous-traités : [X, Y, Z]
— Je sous-traite régulièrement [lots concernés]
— Mon MOA principal : [collectivité / OPH / SDIS / hôpital]
— Je suis titulaire (jamais cotraitant pour cet usage)

Je te transmets :
— 2 DC4 récents acceptés
— L'acte d'engagement d'un marché en cours
— Les pièces admin de mon sous-traitant habituel
— Son DC1 et DC2

Ta mission : analyse ces documents et crée un skill structuré qui :
1. Remplit les 9 rubriques du DC4 dans l'ordre du Cerfa
2. Vérifie la cohérence des montants HT avec l'acte d'engagement
3. Calcule automatiquement le pourcentage sous-traité (alerte si > 30 %)
4. Liste les pièces à joindre et celles qui manquent
5. Rédige le mail de transmission au MOA
6. Anticipe la cascade sous-traitance rang 2 si présente

Avant de coder le skill, pose-moi toutes les questions nécessaires.`;

const PROMPT_USAGE_QUOTIDIEN_TEXT = `Active le skill DC4.

Nouveau dossier :
— Marché : [intitulé + numéro]
— MOA : [collectivité]
— Acte d'engagement joint
— Sous-traitant : [raison sociale, SIRET]
— Lot sous-traité : [nature des prestations]
— Montant HT sous-traité : [X] € HT
— Conditions de paiement : 30 jours à compter de la réception facture

Génère :
1. Le DC4 complet (9 rubriques)
2. Le contrôle de cohérence avec l'acte d'engagement
3. La liste des pièces à joindre + celles qui manquent
4. Le mail de transmission au MOA`;

const PROMPT_EXEMPLE_AJUSTEMENT_TEXT = `Le skill est presque bon. Ajuste ces points :
— Ajoute la vérification automatique de la validité du Kbis (< 3 mois)
— Ajoute un calcul du seuil 600 € TTC pour le paiement direct (obligatoire au-dessus)
— Quand le ST est en TVA auto-liquidation, ajoute la mention CGI 283-2 nonies dans le DC4
— Pour le mail de transmission, ton ferme mais courtois ("vous trouverez ci-joint l'acte spécial de sous-traitance n°[X]...")
— Liste systématiquement les pièces manquantes en tête de réponse`;

const H1 = "Crée ton skill — DC4 (sous-traitance)";

const breadcrumbItems = [
  { name: "Accueil", href: "/" },
  { name: "Ressources", href: "/ressources" },
  { name: H1, href: pagePath },
] as const;

const FAQ_FOR_JSON_LD = [
  {
    question: "Faut-il un DC4 pour chaque sous-traitant, même petit ?",
    answer:
      "Oui. Dès qu'il y a sous-traitance d'une partie du marché, un DC4 par sous-traitant et par rang est obligatoire. Le seuil de 600 € TTC concerne le paiement direct, pas l'obligation de déclarer.",
  },
  {
    question: "Le DC4 peut-il être transmis après le démarrage du chantier ?",
    answer:
      "Légalement non : la sous-traitance doit être déclarée et acceptée avant l'intervention du sous-traitant. En pratique, beaucoup régularisent en cours de chantier — c'est un risque contractuel et pénal (sous-traitance occulte).",
  },
  {
    question: "Quel est le délai d'acceptation par le MOA ?",
    answer:
      "21 jours à compter de la réception du DC4 complet. Passé ce délai, l'acceptation est réputée acquise pour la nature des prestations — pas pour les conditions de paiement. Relancer à J+15.",
  },
  {
    question: "Que se passe-t-il si je dépasse 30 % de sous-traitance ?",
    answer:
      "Le pouvoir adjudicateur peut exiger que vous justifiiez vos capacités à exécuter vous-même les prestations. Vérifiez l'article « Sous-traitance » du CCAP avant transmission.",
  },
  {
    question: "Faut-il un nouveau DC4 si le ST change de RIB en cours de marché ?",
    answer:
      "Oui. Toute modification des conditions de paiement nécessite un avenant au DC4 ou un nouveau DC4 transmis au MOA.",
  },
  {
    question: "Quelle différence entre DC1, DC2, DC3 et DC4 ?",
    answer:
      "DC1 = candidature, DC2 = déclaration candidat, DC3 = acte d'engagement, DC4 = acte spécial de sous-traitance en cours d'exécution. Le skill DC4 ne traite que la sous-traitance.",
  },
  {
    question: "Et si je n'ai pas le temps de mettre tout ça en place ?",
    answer:
      "BeWork rédige le DC4 conforme, contrôle la cohérence avec le marché et relance le MOA jusqu'à acceptation. Vous validez et restez sur le terrain.",
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

export default function TutoSkillDc4BeworkPage() {
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
      { "@type": "HowToStep", name: "Rassembler ta matière DC4" },
      { "@type": "HowToStep", name: "Lancer la conversation avec Claude" },
      { "@type": "HowToStep", name: "Affiner et activer ton skill" },
      { "@type": "HowToStep", name: "Tester sur un vrai dossier de sous-traitance" },
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
              Tuto PDF gratuit · DC4 sous-traitance · Claude &amp; skills · BeWork
            </p>
            <h1 className="font-heading mt-3 text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-[2.35rem] md:leading-tight">
              {H1}
            </h1>
            <p className="mt-4 max-w-none text-lg leading-relaxed text-slate-600 sm:text-[1.125rem] sm:leading-[1.7]">
              Tutoriel PDF — déclaration de sous-traitance (DC4) avec l&apos;IA&nbsp;: produire un acte spécial conforme en 12
              minutes au lieu de 2 heures. PDF consultable en ligne, texte intégral et prompts prêts à coller.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <CalendlyBookingLink className="inline-flex min-h-[3rem] shrink-0 items-center justify-center rounded-xl bg-[#1d4ed8] px-7 text-[0.9375rem] font-semibold text-white shadow-md shadow-[#1d4ed8]/25 transition hover:bg-[#1e40af] md:text-base">
                Réservez un appel
              </CalendlyBookingLink>
              <span className="text-sm leading-snug text-slate-600 sm:max-w-sm">
                20&nbsp;minutes pour cadrer vos DC4 et votre assistance marchés publics BTP — sans engagement.
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
                title="Crée ton skill — DC4 sous-traitance — PDF BeWork"
              />
            </div>
          </section>

          <aside
            className="mb-14 rounded-2xl border border-[#1d4ed8]/22 bg-gradient-to-br from-[#eff6ff] to-white p-6 shadow-sm shadow-[#1d4ed8]/06 sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-8"
            aria-label="Réserver un appel découverte"
          >
            <div className="min-w-0 sm:flex-1">
              <p className="text-base font-semibold text-slate-900 md:text-[1.05rem]">
                Besoin d&apos;une assistance sur vos DC4 et sous-traitance&nbsp;?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 md:text-[0.9375rem]">
                Parlez-en avec BeWork : DC4 conforme, contrôle marché et relance MOA jusqu&apos;à acceptation.
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
              <p className="mt-3 text-center text-xl font-semibold text-slate-900">DC4 — Déclaration de sous-traitance</p>
              <p className="mt-2 text-center text-base text-slate-700 md:text-[1.05rem]">
                Le tutoriel pas à pas pour produire un DC4 conforme — 12 minutes au lieu de 2 heures.
              </p>

              <h4 className="mt-14 text-xs font-semibold uppercase tracking-[0.2em] text-slate-800">Ce que tu vas apprendre</h4>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Construire ton skill DC4 dans Claude en 30 minutes</li>
                <li>▸ Remplir les 9 rubriques officielles sans rien oublier</li>
                <li>▸ Anticiper l&apos;acceptation du sous-traitant par le MOA</li>
                <li>▸ Sécuriser le paiement direct dès la première sous-traitance</li>
              </ul>

              <h3 className="mt-14 text-xl font-semibold tracking-tight text-slate-900">Pourquoi un skill DC4 ?</h3>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-slate-900">
                Le DC4 — Acte spécial de sous-traitance — matérialise l&apos;agrément de ton sous-traitant par le maître
                d&apos;ouvrage public (loi n° 75-1334, articles L.2193-1 à L.2193-14 du Code de la commande publique). Sans DC4
                signé et accepté, la sous-traitance est occulte&nbsp;: tu restes responsable de tout, le sous-traitant perd son droit au
                paiement direct, le pouvoir adjudicateur peut résilier le marché.
              </p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Un DC4 mal rempli, c&apos;est 2 à 3 allers-retours avec le MOA, 4 à 6 semaines de blocage, un sous-traitant qui
                démarre sans être déclaré, des règlements bloqués.
              </p>

              <p className="mt-10 rounded-xl border border-amber-200/80 bg-amber-50/60 px-4 py-3 text-[1.0625rem] leading-relaxed text-slate-900">
                <strong className="font-semibold text-slate-900">Obligation légale —</strong> Les 4 mentions sans lesquelles le DC4
                est rejeté&nbsp;: nature et montant HT des prestations, conditions de paiement, coordonnées bancaires du ST (paiement
                direct &gt; 600&nbsp;€ TTC), identité et capacités du sous-traitant.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">1 </span>
                Active la fonction Skills dans Claude
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Avatar en bas à gauche → Personnaliser → Compétences → «&nbsp;+ Créer une compétence&nbsp;». Active aussi
                «&nbsp;Exécution de code&nbsp;» pour obtenir une sortie .docx ou .pdf, pas seulement du texte brut.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">2 </span>
                Rassemble ta matière DC4
              </h3>
              <ul className="mt-6 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ 2-3 DC4 récemment acceptés par un MOA public</li>
                <li>▸ Acte d&apos;engagement du marché concerné</li>
                <li>▸ Pièces admin du ST (Kbis, Escale, Urssaf, RC pro, RIB, qualifications)</li>
                <li>▸ DC1 + DC2 du sous-traitant</li>
                <li>▸ Formulaire DC4 officiel à jour (economie.gouv.fr/daj)</li>
              </ul>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">3 </span>
                Lance la conversation avec Claude
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Nouveau projet «&nbsp;Skill DC4&nbsp;», téléverse tes documents, colle le prompt ci-dessous. Ne demande pas un DC4
                ponctuel&nbsp;: demande un skill réutilisable.
              </p>
              <PromptBlock label="PROMPT À COLLER DANS CLAUDE" promptText={PROMPT_CALIBRATION_TEXT} />

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">4 </span>
                Affine et active ton skill
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Vérifie les 9 rubriques, le pourcentage sous-traité (&gt; 30&nbsp;% = alerte), le paiement direct 600&nbsp;€ TTC, la
                TVA auto-liquidation (CGI 283-2 nonies) et le mail de transmission au MOA.
              </p>
              <PromptBlock label="EXEMPLE D&apos;AJUSTEMENT" promptText={PROMPT_EXEMPLE_AJUSTEMENT_TEXT} />

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">5 </span>
                Teste sur un vrai dossier
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Téléverse l&apos;acte d&apos;engagement + pièces du ST, donne les 4 infos clés (nom ST, lot, montant HT, prestations).
                Relis 5 minutes, envoie au MOA avec toutes les pièces jointes.
              </p>
              <PromptBlock label="PROMPT — UTILISATION QUOTIDIENNE" promptText={PROMPT_USAGE_QUOTIDIEN_TEXT} />
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">La règle d&apos;or</p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Un DC4 transmis sans pièces complètes = un DC4 rejeté. Mieux vaut attendre 48&nbsp;h le Kbis manquant que relancer le
                MOA 3 semaines plus tard.
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
              <p className="mt-10 text-2xl font-bold uppercase tracking-tight text-slate-900">
                ON TIENT LE BUREAU, VOUS TENEZ LE CHANTIER
              </p>
              <ul className="mt-6 list-none space-y-3 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Vous nous envoyez l&apos;acte d&apos;engagement, les pièces du sous-traitant et son périmètre</li>
                <li>▸ On rédige le DC4 conforme, on contrôle la cohérence avec le marché, on relance le MOA jusqu&apos;à acceptation</li>
                <li>▸ Vous restez sur le terrain — le sous-traitant est agréé et payé directement</li>
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
