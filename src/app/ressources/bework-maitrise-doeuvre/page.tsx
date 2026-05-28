import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { buildWebPageAndBreadcrumbJsonLd } from "@/lib/seo-landing-json-ld";
import { getTutoPageDescription, tutoPageMetadata } from "@/lib/seo-tuto-metadata";
import { absoluteUrl, SITE_URL } from "@/lib/site";
import {
  PLAN_KEYS,
  SUBSCRIPTION_PLANS,
  creditsToDisplayHours,
  formatPlanPriceMonthlyHt,
} from "@/lib/subscription-plans";

const pagePath = "/ressources/bework-maitrise-doeuvre";
const pageUrl = absoluteUrl(pagePath);
const pdfPath = "/ressources/pdf/bework-maitrise-doeuvre.pdf";

const H1 = "BeWork × Maîtrise d’œuvre — tenir le rythme des dossiers MOE et BET";

const breadcrumbItems = [
  { name: "Accueil", href: "/" },
  { name: "Ressources", href: "/ressources" },
  { name: "BeWork × Maîtrise d’œuvre", href: pagePath },
] as const;

const TACHES_MOE = [
  {
    titre: "Rédaction CCTP",
    detail: "Trames par lot, articles techniques, références normes / DTU.",
    complexite: "Complexe",
    credits: "15 à 35 crédits / lot",
  },
  {
    titre: "DPGF — mise en forme & cohérence",
    detail: "Vérification quantités, cohérence avec CCTP, contrôles croisés.",
    complexite: "Moyen",
    credits: "6 à 12 crédits",
  },
  {
    titre: "Compte rendu OPC",
    detail: "Mise au propre des notes, structuration, diffusion sous 48 h.",
    complexite: "Simple",
    credits: "2 à 4 crédits",
  },
  {
    titre: "RAO — analyse offres entreprises",
    detail: "Tableau comparatif multi-lots, vérification des prix, synthèse motivée.",
    complexite: "Moyen",
    credits: "8 à 15 crédits",
  },
  {
    titre: "DOE structuré (fin de chantier)",
    detail: "Compilation plans EXE, fiches techniques, PV de réception, sommaire.",
    complexite: "Complexe",
    credits: "10 à 20 crédits",
  },
  {
    titre: "Mémoire technique MOE (AO public)",
    detail: "Réponse complète en tant que candidat MOE, plan attendu et critères.",
    complexite: "Complexe",
    credits: "20 à 35 crédits",
  },
  {
    titre: "Planning OPC — mise à jour",
    detail: "Recalage, alertes glissements, diffusion entreprises.",
    complexite: "Simple",
    credits: "2 à 4 crédits",
  },
  {
    titre: "Suivi co-traitants & pièces",
    detail: "Relances BET fluides / structure, centralisation, statuts à jour.",
    complexite: "Moyen",
    credits: "3 à 6 crédits",
  },
] as const;

const LOTS_TCE = [
  "Gros œuvre, structure, VRD",
  "Charpente, couverture, étanchéité",
  "Façades, menuiseries extérieures",
  "Cloisons, plâtrerie, sols, peinture",
  "CVC, plomberie, électricité",
  "Aménagements extérieurs, espaces verts",
  "Tous corps d’état — neuf et réhabilitation",
] as const;

const PACKS = PLAN_KEYS.map((key) => {
  const p = SUBSCRIPTION_PLANS[key];
  const copyByKey = {
    DECOUVERTE: {
      cible: "Pour tenir les dossiers chantier et éviter les oublis sur de petits projets MOE.",
      inclus: ["Relances devis & pièces", "Mails clients et entreprises", "Classement documents travaux"],
    },
    STANDARD: {
      cible: "Pour ne plus perdre d’opportunités et tenir un rythme constant côté production documentaire.",
      inclus: ["Suivi devis & relances", "Situations / factures chantier", "Fournisseurs & commandes"],
    },
    PREMIUM: {
      cible: "Pour un relais à forte capacité sur plusieurs dossiers, multi-agences, multi-projets.",
      inclus: ["Suivi multi-dossiers MOE", "Réserves / DOE", "Coordination renforcée"],
    },
  } as const;
  const hoursApprox = creditsToDisplayHours(p.actionsIncluded);
  const c = copyByKey[key];
  return {
    nom: p.name,
    prix: formatPlanPriceMonthlyHt(p.priceLabel),
    capacite: `≈ ${hoursApprox} h incluses · ≈ ${p.actionsIncluded} crédits`,
    cible: c.cible,
    inclus: c.inclus,
  };
});

const FAQ_ITEMS = [
  {
    q: "À qui s’adresse BeWork × Maîtrise d’œuvre ?",
    a: "Aux cabinets de maîtrise d’œuvre, bureaux d’études techniques, économistes de la construction et architectes qui pilotent des marchés en MOE complète, partielle ou OPC. Le relais convient pour les pics de production (CCTP, RAO, DOE) comme pour le suivi régulier multi-projets.",
  },
  {
    q: "Mes ingénieurs gardent-ils la validation technique ?",
    a: "Oui. BeWork prépare, met en forme et structure (CCTP, DPGF, RAO, OPC, DOE). Vos ingénieurs et économistes valident le contenu technique avant diffusion au maître d’ouvrage. Aucun document engageant n’est envoyé sans votre relecture.",
  },
  {
    q: "Comment fonctionne le chiffrage en crédits ?",
    a: "1 crédit = 12 minutes de travail BeWork. Le nombre de crédits par tâche est indicatif (par exemple 15 à 35 crédits pour un CCTP par lot, 8 à 15 pour une RAO). Les fourchettes sont affinées après audit d’un premier dossier réel.",
  },
  {
    q: "Quels lots techniques BeWork peut couvrir en CCTP ?",
    a: "Tous corps d’état : gros œuvre, structure, VRD, charpente, couverture, étanchéité, façades, menuiseries, cloisons, plâtrerie, sols, peinture, CVC, plomberie, électricité, aménagements extérieurs. En neuf comme en réhabilitation.",
  },
  {
    q: "Comment démarrer concrètement ?",
    a: "Vous transmettez un CCTP existant, un dossier OPC ou une RAO récente. Retour clair sous 48 h sur ce que BeWork peut prendre en charge, puis calibrage sur vos trames et un démarrage opérationnel en 3 à 5 jours.",
  },
  {
    q: "Mes données sont-elles protégées ?",
    a: "Données hébergées en France, supervision humaine 100 %, NDA signé sur demande. BeWork n’a accès qu’aux pièces nécessaires aux missions confiées, et vous gardez la validation finale sur tout document engageant.",
  },
] as const;

export const metadata = tutoPageMetadata(pagePath);

export default function BeworkMaitriseDoeuvrePage() {
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
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  const graphJson = {
    "@context": "https://schema.org",
    "@graph": [...((webPageBread as { "@graph": unknown[] })["@graph"] ?? []), articleLd, faqLd],
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
              Plaquette PDF gratuite · Maîtrises d’œuvre & bureaux d’études · BeWork
            </p>
            <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-[2.35rem] md:leading-tight">
              {H1}
            </h1>
            <p className="mt-4 max-w-none text-lg leading-relaxed text-slate-600 sm:text-[1.125rem] sm:leading-[1.7]">
              Le relais documentaire BeWork pensé pour les maîtrises d’œuvre, bureaux d’études techniques et économistes : rédaction CCTP par lot,
              DPGF, RAO, comptes rendus OPC, mémoires techniques et DOE. Vos ingénieurs valident, BeWork absorbe la production et le suivi.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <CalendlyBookingLink className="inline-flex min-h-[3rem] shrink-0 items-center justify-center rounded-xl bg-[#1d4ed8] px-7 text-[0.9375rem] font-semibold text-white shadow-md shadow-[#1d4ed8]/25 transition hover:bg-[#1e40af] md:text-base">
                Demander un audit MOE
              </CalendlyBookingLink>
              <a
                href={pdfPath}
                download
                className="inline-flex min-h-[3rem] shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-[0.9375rem] font-semibold text-slate-800 transition hover:bg-slate-50 md:text-base"
              >
                Télécharger le PDF (10 pages)
              </a>
            </div>
          </header>

          <section
            id="pdf-original"
            className="scroll-mt-[calc(4.55rem+1rem)] mb-14 rounded-3xl border border-slate-200 bg-slate-100/80 p-6 shadow-sm sm:p-10"
            aria-labelledby="pdf-heading"
          >
            <h2 id="pdf-heading" className="text-xl font-semibold tracking-tight text-slate-900">
              Voir la plaquette MOE/BET dans sa mise en page originale
            </h2>
            <p className="mt-3 w-full leading-relaxed text-slate-600">
              Consultez la plaquette dans sa mise en page d’origine. Vous pouvez l’agrandir ou la télécharger librement. PDF · 10 pages.
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
                title="BeWork × Maîtrise d’œuvre — PDF BeWork"
              />
            </div>
          </section>

          <section className="mb-14" aria-labelledby="taches-moe-heading">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
              <h2 id="taches-moe-heading" className="text-2xl font-bold tracking-tight text-slate-900 md:text-[1.65rem]">
                Tâches couvertes pour les maîtrises d’œuvre
              </h2>
              <p className="mt-4 text-[1.0625rem] leading-relaxed text-slate-700">
                Le vrai problème d’un bureau d’études n’est pas la technique. C’est le volume documentaire qui tombe sur les mêmes épaules.
                BeWork prend en charge les tâches répétitives et chronophages qui ne devraient plus reposer sur vos équipes.
              </p>
              <div className="mt-8 overflow-x-auto">
                <table className="w-full min-w-[640px] border-separate border-spacing-y-2 text-left text-[0.95rem]">
                  <thead>
                    <tr className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                      <th scope="col" className="py-2 pr-4">Tâche</th>
                      <th scope="col" className="py-2 pr-4">Description</th>
                      <th scope="col" className="py-2 pr-4">Complexité</th>
                      <th scope="col" className="py-2 pr-4">Crédits indicatifs</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-800">
                    {TACHES_MOE.map((t) => (
                      <tr key={t.titre} className="rounded-lg bg-slate-50">
                        <th scope="row" className="rounded-l-lg py-3 pl-4 pr-4 align-top font-semibold text-slate-900">
                          {t.titre}
                        </th>
                        <td className="py-3 pr-4 align-top text-slate-700">{t.detail}</td>
                        <td className="py-3 pr-4 align-top text-slate-600">{t.complexite}</td>
                        <td className="rounded-r-lg py-3 pr-4 align-top font-semibold text-[#1d4ed8]">{t.credits}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-5 text-sm leading-relaxed text-slate-500">
                1 crédit = 12 minutes de travail BeWork. Fourchettes indicatives — affinées après audit d’un premier dossier réel.
              </p>
            </div>
          </section>

          <section className="mb-14" aria-labelledby="lots-tce-heading">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
              <h2 id="lots-tce-heading" className="text-2xl font-bold tracking-tight text-slate-900 md:text-[1.65rem]">
                Lots techniques couverts (TCE — neuf et réhabilitation)
              </h2>
              <ul className="mt-6 grid gap-3 text-[1.0625rem] leading-relaxed text-slate-800 sm:grid-cols-2">
                {LOTS_TCE.map((lot) => (
                  <li key={lot} className="flex items-start gap-3">
                    <span aria-hidden className="mt-[0.55rem] inline-block size-1.5 shrink-0 rounded-full bg-[#2563eb]" />
                    <span>{lot}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="mb-14" aria-labelledby="focus-cctp-heading">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
              <h2 id="focus-cctp-heading" className="text-2xl font-bold tracking-tight text-slate-900 md:text-[1.65rem]">
                Focus rédaction CCTP — le cas d’usage central
              </h2>
              <p className="mt-4 text-[1.0625rem] leading-relaxed text-slate-700">
                Là où BeWork dégage le plus de temps pour vos économistes et ingénieurs. Quatre étapes structurées pour produire un CCTP propre,
                aux normes de votre cabinet.
              </p>
              <ol className="mt-6 space-y-5 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>
                  <strong className="font-semibold">01 · Brief & matrice</strong> — récupération des plans, programme, choix techniques validés par
                  votre cabinet. Trame par lot (TCE).
                </li>
                <li>
                  <strong className="font-semibold">02 · Rédaction des articles</strong> — articles techniques produits par lot : généralités,
                  matériaux, mise en œuvre, contrôles, références normes.
                </li>
                <li>
                  <strong className="font-semibold">03 · Cohérence DPGF / CCTP</strong> — vérification croisée des prestations entre CCTP et DPGF.
                  Détection des oublis et incohérences.
                </li>
                <li>
                  <strong className="font-semibold">04 · Mise en forme & livraison</strong> — document final aux normes de votre cabinet. Vous
                  validez et vous diffusez au maître d’ouvrage.
                </li>
              </ol>
            </div>
          </section>

          <section className="mb-14" aria-labelledby="packs-heading">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
              <h2 id="packs-heading" className="text-2xl font-bold tracking-tight text-slate-900 md:text-[1.65rem]">
                Trois packs, un seul rythme pour un bureau d’études multi-projets
              </h2>
              <p className="mt-4 text-[1.0625rem] leading-relaxed text-slate-700">
                Forfaits HT publics, alignés sur la grille tarifs BeWork. Vous démarrez avec le pack qui correspond à votre charge réelle et vous
                ajustez librement d’un mois sur l’autre.
              </p>
              <div className="mt-8 grid gap-5 md:grid-cols-3">
                {PACKS.map((p) => (
                  <article key={p.nom} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50 p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1d4ed8]">Pack {p.nom}</p>
                    <p className="mt-3 text-xl font-bold text-slate-900">{p.prix}</p>
                    <p className="mt-1 text-sm font-medium text-slate-600">{p.capacite}</p>
                    <p className="mt-4 text-[0.95rem] leading-relaxed text-slate-700">{p.cible}</p>
                    <ul className="mt-5 space-y-2 text-[0.95rem] leading-relaxed text-slate-800">
                      {p.inclus.map((i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span aria-hidden className="mt-[0.55rem] inline-block size-1.5 shrink-0 rounded-full bg-[#2563eb]" />
                          <span>{i}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
              <p className="mt-6 text-sm text-slate-600">
                Voir la grille détaillée :{" "}
                <Link href="/tarifs" className="font-semibold text-[#1d4ed8] underline underline-offset-2 hover:text-[#1e40af]">
                  Tarifs BeWork
                </Link>
              </p>
            </div>
          </section>

          <section className="mb-14" aria-labelledby="demarrage-heading">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
              <h2 id="demarrage-heading" className="text-2xl font-bold tracking-tight text-slate-900 md:text-[1.65rem]">
                Démarrer en 4 étapes — de l’audit au mode opérationnel
              </h2>
              <ol className="mt-6 space-y-5 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>
                  <strong className="font-semibold">01 · Audit du 1er dossier</strong> — vous transmettez un CCTP existant ou un dossier OPC.
                  Retour clair sous 48 h.
                </li>
                <li>
                  <strong className="font-semibold">02 · Calibrage des process</strong> — alignement sur vos trames, vos normes internes et la
                  charte de votre cabinet.
                </li>
                <li>
                  <strong className="font-semibold">03 · Démarrage en 3 à 5 jours</strong> — premier lot de tâches traité en mode pilote sur un
                  projet en cours.
                </li>
                <li>
                  <strong className="font-semibold">04 · Mode opérationnel</strong> — rythme cruise, consommation des crédits selon votre charge
                  réelle.
                </li>
              </ol>
              <p className="mt-6 text-sm leading-relaxed text-slate-600">
                Données hébergées en France · NDA signé sur demande · 100 % supervision humaine · Vous gardez la validation finale.
              </p>
            </div>
          </section>

          <section className="mb-14" aria-labelledby="faq-heading">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
              <h2 id="faq-heading" className="text-2xl font-bold tracking-tight text-slate-900 md:text-[1.65rem]">
                Questions fréquentes — BeWork × Maîtrise d’œuvre
              </h2>
              <dl className="mt-8 space-y-8">
                {FAQ_ITEMS.map((item) => (
                  <div key={item.q}>
                    <dt className="text-[1.05rem] font-semibold text-slate-900">{item.q}</dt>
                    <dd className="mt-3 text-[1.0625rem] leading-relaxed text-slate-800">{item.a}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          <aside
            className="mb-14 rounded-2xl border border-[#1d4ed8]/22 bg-gradient-to-br from-[#eff6ff] to-white p-6 shadow-sm shadow-[#1d4ed8]/06 sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-8"
            aria-label="Demander un audit MOE"
          >
            <div className="min-w-0 sm:flex-1">
              <p className="text-base font-semibold text-slate-900 md:text-[1.05rem]">
                Prêt à tenir le rythme côté production documentaire&nbsp;?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 md:text-[0.9375rem]">
                Envoyez un CCTP existant, un dossier OPC ou une RAO récente. Retour clair sous 48 h sur ce que BeWork peut prendre en charge.
              </p>
            </div>
            <div className="mt-5 shrink-0 sm:mt-0">
              <CalendlyBookingLink className="inline-flex min-h-[3rem] w-full min-w-[12.5rem] items-center justify-center rounded-xl bg-[#1d4ed8] px-6 text-sm font-semibold text-white shadow-md shadow-[#1d4ed8]/22 transition hover:bg-[#1e40af] sm:w-auto md:px-8 md:text-base">
                Demander un audit MOE
              </CalendlyBookingLink>
            </div>
          </aside>

          <div className="mt-12 flex justify-center pb-14">
            <BeWorkLogo className="opacity-95" aria-label="Logo BeWork" />
          </div>
        </main>
      </div>
    </>
  );
}
