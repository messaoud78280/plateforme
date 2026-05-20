import { getTutoPageDescription, tutoPageMetadata } from "@/lib/seo-tuto-metadata";
import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { CopyPromptButton } from "@/components/ressources/CopyPromptButton";
import { buildWebPageAndBreadcrumbJsonLd } from "@/lib/seo-landing-json-ld";
import { absoluteUrl, SITE_URL } from "@/lib/site";

const pagePath = "/ressources/tuto-skill-rdv-client-bework";
const pageUrl = absoluteUrl(pagePath);
const pdfPath = "/ressources/pdf/tuto-skill-rdv-client-bework.pdf";

const PROMPT_CALIBRATION_TEXT = `Je veux créer un skill Claude qui m'aide à préparer mes RDV clients.

Mon contexte :
- Entreprise : [NOM] — [MÉTIER BTP : couverture / électricité / TCE...]
- Zone d'intervention : [DÉPARTEMENTS]
- Clients cibles : [MOA publics / privés / particuliers / syndics / archi...]
- Mes 3 différenciateurs : [À COMPLÉTER]

Pièces jointes à analyser :
- 2 comptes rendus de RDV récents
- Plaquette commerciale + fiche entreprise
- Mon barème de chiffrage indicatif
- Mes questions de découverte types
- 3 cas clients phares
- Ma trame de CR post-RDV

À chaque fois que je te dirai « prépare le RDV avec [contact] — [contexte] », tu produiras un livrable Word de 2 pages :
1. Brief contact (qui décide, historique, sujet sensible)
2. Ordre du jour chronométré (60 min standard)
3. 8 questions de découverte adaptées au profil
4. 3 arguments différenciants à sortir, avec preuves chiffrées
5. Trame de CR post-RDV pré-remplie

Génère-moi le SKILL.md complet, prêt à téléverser.`;

const PROMPT_USAGE_QUOTIDIEN_TEXT = `Prépare le RDV avec [NOM DU CONTACT] :
- Entreprise : [NOM CLIENT]
- Date / lieu : [LUNDI 26 MAI · 14H · LEUR SIÈGE]
- Objet annoncé : [ÉTUDE DE FAISABILITÉ COUVERTURE 800 M²]
- Historique : [DÉJÀ UN RDV EN MARS — DEMANDE DE CHIFFRAGE — PAS DE SUITE]
- Sujet sensible : [LE CONCURRENT X EST AUSSI EN COURSE — PRIX 12 % EN DESSOUS]
- Mon objectif : [REQUALIFIER + SORTIR DU JEU PRIX]

Génère le brief complet au format Word.`;

const PROMPT_EXEMPLE_AJUSTEMENT_TEXT = `Modifie le skill :
- Ajoute systématiquement un point « budget pressenti » dans le brief (même si le client ne l'a pas donné, fais une fourchette)
- L'ordre du jour de 60 min doit toujours garder 10 min en fin pour démontrer un cas client similaire (preuve sociale)
- Dans la trame de CR, ajoute une ligne « date de relance proposée »

Régénère le skill avec ces ajustements et propose-moi un nouveau brief test sur le même cas fictif.`;

const H1 = "Crée ton skill — Préparation de RDV client";

const breadcrumbItems = [
  { name: "Accueil", href: "/" },
  { name: "Ressources", href: "/ressources" },
  { name: H1, href: pagePath },
] as const;

const FAQ_FOR_JSON_LD = [
  {
    question: "Le skill fonctionne pour les RDV en présentiel et en visio ?",
    answer:
      "Oui. Précise « RDV en visio » dans le prompt pour ajouter rappels son et partage d'écran. Brief, questions et trame de CR restent identiques.",
  },
  {
    question: "Mes informations clients restent-elles confidentielles ?",
    answer:
      "Les conversations Claude Pro ne servent pas à l'entraînement du modèle. Évite données bancaires ou personnelles inutiles ; noms de prospects et contextes projet sont nécessaires à la pertinence du brief.",
  },
  {
    question: "Combien de temps pour créer le skill ?",
    answer:
      "25 à 40 minutes une fois pour toutes si vos documents sont prêts. Ensuite, chaque RDV se prépare en quelques minutes au lieu d'une heure.",
  },
  {
    question: "Et si le contact est un client existant, pas un prospect ?",
    answer:
      "Joignez dernier CR, dernier devis et historique : le skill produit un brief « point de relation » plutôt qu'une découverte — idéal pour fidélisation et points annuels.",
  },
  {
    question: "Puis-je partager le skill avec mon commercial ?",
    answer:
      "Oui : transmettez le ZIP du skill à téléverser sur son compte Claude. Même méthode, mêmes différenciateurs, même trame de CR — utile pour l'onboarding.",
  },
  {
    question: "Le skill peut-il générer le mail de confirmation avant le RDV ?",
    answer:
      "Oui, à préciser à la création : mail J-2, brief jour J et CR post-RDV avec relance programmée.",
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

export default function TutoSkillRdvClientBeworkPage() {
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
      { "@type": "HowToStep", name: "Rassembler ta matière commerciale" },
      { "@type": "HowToStep", name: "Lancer la conversation avec Claude" },
      { "@type": "HowToStep", name: "Affiner et activer ton skill" },
      { "@type": "HowToStep", name: "Tester sur un vrai RDV à venir" },
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
              Tuto PDF gratuit · RDV client · Claude · BeWork
            </p>
            <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-[2.35rem] md:leading-tight">
              {H1}
            </h1>
            <p className="mt-4 max-w-none text-lg leading-relaxed text-slate-600 sm:text-[1.125rem] sm:leading-[1.7]">
              Tutoriel BeWork pas à pas : préparer un RDV client en 15 minutes — brief contact, ordre du jour, questions clés
              et trame de compte rendu — PDF en ligne et prompts à copier.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <CalendlyBookingLink className="inline-flex min-h-[3rem] shrink-0 items-center justify-center rounded-xl bg-[#1d4ed8] px-7 text-[0.9375rem] font-semibold text-white shadow-md shadow-[#1d4ed8]/25 transition hover:bg-[#1e40af] md:text-base">
                Réservez un appel
              </CalendlyBookingLink>
              <span className="text-sm leading-snug text-slate-600 sm:max-w-sm">
                20&nbsp;minutes pour cadrer votre méthode commerciale ou un relais BeWork sur vos RDV — sans engagement.
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
                download="Tuto_Skill_RDV_Client_BeWork.pdf"
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
                Ouvrir en plein écran
              </a>
            </div>
            <div className="mx-auto mt-8 w-full max-w-none">
              <iframe
                src={`${pdfPath}#toolbar=1&navpanes=0&scrollbar=1`}
                className="h-[650px] w-full rounded-2xl border border-slate-200 bg-white shadow-sm md:h-[900px]"
                title="Crée ton skill — Préparation de RDV client — PDF BeWork"
              />
            </div>
          </section>

          <aside
            className="mb-14 rounded-2xl border border-[#1d4ed8]/22 bg-gradient-to-br from-[#eff6ff] to-white p-6 shadow-sm shadow-[#1d4ed8]/06 sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-8"
            aria-label="Réserver un appel découverte"
          >
            <div className="min-w-0 sm:flex-1">
              <p className="text-base font-semibold text-slate-900 md:text-[1.05rem]">
                Pas le temps de le faire vous-même&nbsp;?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 md:text-[0.9375rem]">
                BeWork prépare brief, ordre du jour et CR post-RDV à partir de votre contexte (mail, vocal).
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
              <p className="mt-3 text-center text-xl font-semibold text-slate-900">Préparation de RDV client</p>
              <p className="mt-2 text-center text-base text-slate-700 md:text-[1.05rem]">
                Le tutoriel pas à pas pour préparer un RDV client en 15 minutes — au lieu de 2 heures.
              </p>

              <h4 className="mt-14 text-xs font-semibold uppercase tracking-[0.2em] text-slate-800">Ce que tu vas apprendre</h4>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Activer la fonction Skills de Claude (procédure mai 2026)</li>
                <li>▸ Construire un skill « Préparation RDV client » nourri par tes vrais dossiers</li>
                <li>▸ Générer brief contact, ordre du jour et trame de CR en une seule demande</li>
                <li>▸ Arriver aligné à chaque RDV, repartir avec le compte rendu déjà rédigé</li>
              </ul>

              <h3 className="mt-14 text-xl font-semibold tracking-tight text-slate-900">Pourquoi un skill « Préparation de RDV client »&nbsp;?</h3>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-slate-900">
                Un dirigeant ou un conducteur enchaîne 5 à 10 RDV par semaine : prospects, clients fidèles, MOA, architectes,
                sous-traitants, fournisseurs. Chaque RDV mérite 1 à 2 h de préparation — en pratique, on ouvre la fiche contact 5
                minutes avant, on improvise, on oublie le sujet sensible du mois dernier.
              </p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Avec un skill bien construit : brief synthétique, ordre du jour chronométré, questions de découverte adaptées,
                arguments différenciants avec preuves chiffrées, trame de CR post-RDV. 15 minutes pour préparer, quelques secondes
                pour le CR final.
              </p>

              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">
                Les 6 éléments d&apos;un brief RDV pro
              </p>
              <p className="mt-4 text-[1.0625rem] leading-relaxed text-slate-900">
                Identité (qui parle, qui décide, qui paie) · Historique de relation · Contexte projet · Objectif du RDV · Arguments
                prêts · Trame de CR avec actions et relance.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">1 </span>
                Active la fonction Skills
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Skills accessibles sur tous les plans Claude. Pour un usage pro quotidien (documents lourds), le plan Pro est
                recommandé. Active « Exécution de code » pour générer les Word en sortie.
              </p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Chemin (mai 2026)&nbsp;: Avatar → Personnaliser → Compétences → vérifier Exécution de code → + Créer ou
                Téléverser. L&apos;ancien chemin Settings → Capabilities est obsolète.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">2 </span>
                Rassemble ta matière commerciale
              </h3>
              <ul className="mt-6 list-none space-y-3 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ 2 ou 3 derniers CR de RDV signés ou qualifiants</li>
                <li>▸ Plaquette ou fiche entreprise (certifications, références)</li>
                <li>▸ Barème ou ratios de chiffrage indicatifs</li>
                <li>▸ Questions de découverte types</li>
                <li>▸ 3 cas clients phares chiffrés</li>
                <li>▸ Trame de CR post-RDV (Word, PDF ou mail-type)</li>
              </ul>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">3 </span>
                Lance la conversation avec Claude
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Nouvelle conversation, joignez vos documents, collez le prompt de création (ci-dessous). Adaptez les champs en
                MAJUSCULES à votre métier et zone.
              </p>
              <PromptBlock label="Prompt — création du skill" promptText={PROMPT_CALIBRATION_TEXT} />

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">4 </span>
                Affine et active ton skill
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Vérifiez ton, questions de qualification, arguments personnalisés (pas génériques BTP), structure du CR, durées
                réalistes, absence de données client en dur dans le skill. Téléversez puis activez.
              </p>
              <PromptBlock label="Exemple d'ajustement" promptText={PROMPT_EXEMPLE_AJUSTEMENT_TEXT} />

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">5 </span>
                Teste sur un vrai RDV à venir
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Le matin : « prépare le RDV avec [nom] — [contexte] ». Imprimez ou gardez le brief sur mobile. Pendant le RDV,
                notes sur la trame. Après : renvoyez vos notes pour le CR propre.
              </p>
              <PromptBlock label="Prompt — utilisation quotidienne" promptText={PROMPT_USAGE_QUOTIDIEN_TEXT} />

              <h3 className="mt-14 text-xl font-semibold uppercase tracking-wide text-slate-900">FAQ</h3>
              <dl className="mt-6 space-y-8">
                {FAQ_FOR_JSON_LD.map((item) => (
                  <div key={item.question}>
                    <dt className="text-[1.0625rem] font-semibold text-slate-900">{item.question}</dt>
                    <dd className="mt-2 text-[1.0625rem] leading-relaxed text-slate-800">{item.answer}</dd>
                  </div>
                ))}
              </dl>

              <p className="mt-14 text-center text-xl font-bold uppercase tracking-wide text-slate-900">
                Pas le temps de le faire vous-même&nbsp;?
              </p>
              <p className="mt-4 text-center text-[1.0625rem] leading-relaxed text-slate-900">
                Faites appel à un Assistant Travaux BeWork : vous envoyez contact et contexte, nous préparons brief et CR, vous
                arrivez aligné.
              </p>
              <p className="mt-6 text-center text-[1.0625rem] font-semibold text-slate-900">
                <Link href={SITE_URL} className="text-[#1d4ed8] underline underline-offset-4 hover:no-underline">
                  Réservez un appel sur bework.fr
                </Link>
              </p>
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
