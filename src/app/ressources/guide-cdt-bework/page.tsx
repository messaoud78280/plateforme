import type { Metadata } from "next";
import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { buildWebPageAndBreadcrumbJsonLd } from "@/lib/seo-landing-json-ld";
import { absoluteUrl, SITE_URL } from "@/lib/site";

const pagePath = "/ressources/guide-cdt-bework";

const pageUrl = absoluteUrl(pagePath);

const pdfPath = "/ressources/pdf/guide-cdt-bework.pdf";

const H1 = "Le guide du conducteur de travaux — 6 outils Claude pour piloter ton chantier de A à Z";

const META_DESCRIPTION =
  "Guide PDF gratuit BeWork (52 pages) pour conducteurs de travaux : 6 skills Claude AI — DCE, PPSPS, CR, constat de retard, PV de levée, DOE — 30 à 50 h de bureau récupérées par chantier.";

const breadcrumbItems = [
  { name: "Accueil", href: "/" },
  { name: "Ressources", href: "/ressources" },
  { name: "Guides", href: "/ressources/guides" },
  { name: "Guide conducteur de travaux", href: pagePath },
] as const;

const TUTO_SECTIONS = [
  {
    phase: "Phase 1 — Préparation",
    num: 1,
    title: "Analyse de DCE",
    tagline: "3 minutes au lieu de 4 heures",
    href: "/ressources/tuto-skill-analyse-dce-bework",
    learn: [
      "La fiche d'analyse standardisée d'un DCE",
      "5 étapes pour créer ton skill en 30 minutes",
      "Le prompt exact à donner à Claude",
      "Comment décider Go / No Go en 3 minutes",
    ],
    why: "Un DCE de 220 pages, c'est 4 heures de lecture. Avec un skill bien construit, tu colles le DCE dans Claude, tu obtiens une fiche standardisée en 3 minutes et tu priorises les dossiers qui valent la peine d'être lus en détail.",
  },
  {
    phase: "Phase 1 — Préparation",
    num: 2,
    title: "PPSPS",
    tagline: "45 minutes au lieu de 4 heures",
    href: "/ressources/tuto-skill-ppsps-bework",
    learn: [
      "Activer la fonction skills dans Claude (5 minutes, 1 fois pour toutes)",
      "Calibrer ton skill avec modes opératoires, matrice risques et EPI",
      "Le prompt pour générer ton skill PPSPS",
      "Le prompt d'utilisation quotidienne pour un PPSPS conforme",
    ],
    why: "Le PPSPS est obligatoire (R4532-56 à R4532-74). Un skill couvre les 9 rubriques R4532-64, les risques importés/exportés et les EPI avec normes EN — calibré sur tes modes opératoires types.",
  },
  {
    phase: "Phase 2 — Exécution",
    num: 3,
    title: "Compte rendu de chantier",
    tagline: "10 minutes au lieu de 2 heures",
    href: "/ressources/compte-rendu-chantier-guide-btp",
    learn: [
      "Activer la fonction skills dans Claude (5 minutes, 1 fois pour toutes)",
      "Calibrer ton skill avec tes CR antérieurs et ton ton de chantier",
      "Le prompt pour générer ton skill en 1 conversation",
      "Le prompt quotidien pour transformer tes notes terrain en CR pro",
    ],
    why: "Sur 40 semaines de chantier, la rédaction du CR représente 60 à 80 heures par an. Le skill structure tes notes brutes selon les 8 rubriques standard : avancement, réserves, décisions actées, prochaines étapes.",
  },
  {
    phase: "Phase 2 — Exécution",
    num: 4,
    title: "Constat de retard",
    tagline: "5 minutes au lieu de 45 minutes",
    href: "/ressources/tuto-skill-constat-retard-bework",
    learn: [
      "Activer la fonction skills dans Claude (5 minutes, 1 fois pour toutes)",
      "Calibrer ton skill avec tes constats antérieurs et clauses contractuelles",
      "Le prompt pour générer ton skill en 1 conversation",
      "Le prompt quotidien pour transformer un fait terrain en LRAR opposable",
    ],
    why: "Sans constat formalisé en LRAR, c'est l'entreprise qui paie les pénalités. Le skill génère les 7 éléments opposables (CCAG art. 19, seuils CIBTP intempéries) en quelques minutes.",
  },
  {
    phase: "Phase 3 — Livraison & garantie",
    num: 5,
    title: "PV de levée de réserves",
    tagline: "15 minutes au lieu de 1 heure",
    href: "/ressources/tuto-skill-pv-levee-reserves-bework",
    learn: [
      "Activer la fonction skills dans Claude (5 minutes, 1 fois pour toutes)",
      "Calibrer ton skill avec tes PV antérieurs et formulations type",
      "Le prompt pour générer ton skill en 1 conversation",
      "Le prompt quotidien pour transformer tes preuves de reprise en PV signable",
    ],
    why: "Le PV de levée conditionne la libération de la retenue de garantie. Le skill couvre les 7 blocs obligatoires, les statuts levée/partielle/maintenue et la mention GPA (art. 1792-6).",
  },
  {
    phase: "Phase 3 — Livraison & garantie",
    num: 6,
    title: "DOE",
    tagline: "1 jour au lieu d'1 semaine",
    href: "/ressources/tuto-skill-doe-bework",
    learn: [
      "Activer la fonction skills dans Claude (5 minutes, 1 fois pour toutes)",
      "Calibrer ton skill avec ton sommaire type et tes exigences MOA",
      "Le prompt pour générer ton skill en 1 conversation",
      "Le prompt quotidien pour assembler ton DOE complet aux normes",
    ],
    why: "Remise obligatoire sous 60 jours (CCAG-Travaux art. 30). Le skill génère page de garde, sommaire indexé aux 9 rubriques, nomenclature MOA et checklist des pièces manquantes.",
  },
] as const;

const GAINS_TABLE = [
  ["Analyse de DCE", "4 h", "3 min", "−98 %"],
  ["PPSPS", "4 h", "45 min", "−81 %"],
  ["CR hebdo", "2 h", "10 min", "−92 %"],
  ["Constat de retard", "45 min", "5 min", "−89 %"],
  ["PV de levée", "1 h", "15 min", "−75 %"],
  ["DOE", "1 semaine", "1 jour", "−80 %"],
] as const;

const FAQ_FOR_JSON_LD = [
  {
    question: "Le guide BeWork est-il vraiment gratuit ?",
    answer:
      "Oui. Le PDF de 52 pages est téléchargeable gratuitement sur bework.fr, sans formulaire ni inscription.",
  },
  {
    question: "Faut-il un abonnement Claude Pro ?",
    answer:
      "Oui. Les 6 skills du guide nécessitent Claude Pro (18 €/mois). La version gratuite ne permet pas de créer des skills personnalisés ni de générer des fichiers Word.",
  },
  {
    question: "Dois-je lire les 52 pages d'un coup ?",
    answer:
      "Non. Lis le guide linéairement une première fois pour la logique d'ensemble, puis consulte le tuto correspondant à chaque livrable à produire. Chaque chapitre est autonome.",
  },
  {
    question: "Les tutoriels en ligne reprennent-ils le contenu du PDF ?",
    answer:
      "Oui. Chaque tuto du guide a sa page dédiée sur bework.fr avec le texte intégral, les prompts copiables et un PDF unitaire. Le guide de 52 pages les compile en un seul document.",
  },
  {
    question: "Combien de temps pour créer un skill ?",
    answer:
      "Compte 30 à 45 minutes par skill la première fois (matière + calibrage + test). Le retour sur investissement est immédiat dès le deuxième usage.",
  },
  {
    question: "BeWork peut-il rédiger les livrables à ma place ?",
    answer:
      "Oui. Un Assistant Travaux BeWork peut rédiger CR, constats, PPSPS, PV de levée et DOE sous 24 à 48 h, 100 % piloté en France — vous validez, le bureau avance.",
  },
] as const;

export const metadata: Metadata = {
  title: "Guide conducteur de travaux BTP — 6 outils Claude (PDF 52 pages) | BeWork",
  description: META_DESCRIPTION,
  alternates: {
    canonical: pageUrl,
    languages: { fr: pageUrl, "x-default": pageUrl },
  },
  openGraph: {
    type: "article",
    locale: "fr_FR",
    url: pageUrl,
    siteName: "BeWork",
    title: "Guide conducteur de travaux BTP — 6 outils Claude | BeWork",
    description: META_DESCRIPTION,
    images: [{ url: absoluteUrl("/opengraph-image"), width: 1200, height: 630, alt: H1 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Guide conducteur de travaux BTP — 6 outils Claude | BeWork",
    description: META_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export default function GuideCdtBeworkPage() {
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
    url: pageUrl,
    datePublished: "2026-05-12",
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
    numberOfPages: 52,
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
              Guide PDF gratuit · Conducteur de travaux · Claude &amp; skills · BeWork
            </p>
            <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-[2.35rem] md:leading-tight">
              {H1}
            </h1>
            <p className="mt-4 max-w-none text-lg leading-relaxed text-slate-600 sm:text-[1.125rem] sm:leading-[1.7]">
              Compilation des 6 tutoriels skills pour conducteurs de travaux BTP — préparation, exécution, livraison. PDF · 52 pages · prompts
              inclus · téléchargement libre.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <CalendlyBookingLink className="inline-flex min-h-[3rem] shrink-0 items-center justify-center rounded-xl bg-[#1d4ed8] px-7 text-[0.9375rem] font-semibold text-white shadow-md shadow-[#1d4ed8]/25 transition hover:bg-[#1e40af] md:text-base">
                Réservez un appel
              </CalendlyBookingLink>
              <span className="text-sm leading-snug text-slate-600 sm:max-w-sm">
                20&nbsp;minutes pour cadrer votre besoin — sans engagement.
              </span>
            </div>
          </header>

          <section
            id="pdf-original"
            className="mb-14 scroll-mt-[calc(4.55rem+1rem)] rounded-3xl border border-slate-200 bg-slate-100/80 p-6 shadow-sm sm:p-10"
            aria-labelledby="pdf-heading"
          >
            <h2 id="pdf-heading" className="text-xl font-semibold tracking-tight text-slate-900">
              Voir le PDF original (52 pages)
            </h2>
            <p className="mt-3 w-full leading-relaxed text-slate-600">
              Le guide complet avec les 6 tutos, tous les prompts et les FAQ par livrable. Consultez-le en ligne ou téléchargez-le.
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
                Ouvrir en plein écran
              </a>
            </div>
            <div className="mx-auto mt-8 w-full max-w-none">
              <iframe
                src={`${pdfPath}#toolbar=1&navpanes=0&scrollbar=1`}
                className="h-[650px] w-full rounded-2xl border border-slate-200 bg-white shadow-sm md:h-[900px]"
                title="Le guide du conducteur de travaux — PDF BeWork"
              />
            </div>
          </section>

          <section className="mb-14" aria-labelledby="guide-heading">
            <h2 id="guide-heading" className="mb-6 text-xl font-semibold tracking-tight text-slate-900">
              Sommaire et texte du guide
            </h2>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
              <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-900">GUIDE OFFERT PAR BEWORK</p>
              <h3 className="mt-8 text-center text-2xl font-bold text-slate-900 md:text-[1.65rem]">Le guide du conducteur de travaux</h3>
              <p className="mt-3 text-center text-lg font-semibold text-slate-800">
                6 outils Claude pour piloter ton chantier de A à Z — préparation, exécution, livraison
              </p>

              <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50/80 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-800">Dans ce guide</p>
                <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                  <li>▸ 6 tutos complets, chacun ciblé sur un livrable BTP critique</li>
                  <li>▸ La méthode pas à pas pour créer chaque skill dans Claude</li>
                  <li>▸ Les prompts exacts à copier-coller</li>
                  <li>▸ Plus de 30 heures de bureau récupérées par chantier</li>
                </ul>
              </div>

              <p className="mt-8 text-[1.0625rem] leading-relaxed text-slate-700">
                Le guide fait <strong className="font-semibold text-slate-900">52 pages</strong>. Les prompts, étapes détaillées et FAQ de chaque
                livrable figurent dans le PDF ci-dessus. Chaque chapitre est aussi disponible en ligne sur sa page tutoriel (liens ci-dessous).
              </p>

              <h3 className="mt-14 text-xl font-semibold tracking-tight text-slate-900">Sommaire</h3>
              <p className="mt-4 text-[1.0625rem] leading-relaxed text-slate-900">
                Organisation selon la chronologie du chantier. Chaque tuto est autonome — allez directement à celui qui vous concerne.
              </p>
              <ul className="mt-6 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                {TUTO_SECTIONS.map((t) => (
                  <li key={t.href}>
                    <span className="font-medium text-slate-700">{t.phase} — </span>
                    <Link href={t.href} className="font-semibold text-[#1d4ed8] underline-offset-4 hover:underline">
                      {t.num}. {t.title}
                    </Link>
                    <span className="text-slate-700"> — {t.tagline}</span>
                  </li>
                ))}
              </ul>

              <h3 className="mt-14 text-xl font-semibold tracking-tight text-slate-900">
                Pourquoi un guide pour les conducteurs de travaux ?
              </h3>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-slate-900">
                Un conducteur de travaux produit en moyenne <strong>47 documents administratifs critiques</strong> par chantier. Chaque livrable mal
                fait, en retard ou incomplet, c&apos;est de la marge qui s&apos;évapore&nbsp;: pénalités, retenue de garantie bloquée, solde impayé,
                contestations MOA.
              </p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                L&apos;enjeu n&apos;est pas de remplacer votre expertise terrain. L&apos;enjeu est de vous rendre vos heures de bureau, en automatisant ce
                qui peut l&apos;être avec Claude. Un skill bien construit, c&apos;est un mode d&apos;emploi permanent que Claude utilise pour produire un
                livrable type — vous lui apprenez votre entreprise une fois pour toutes.
              </p>
              <ul className="mt-6 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ 3 minutes pour décider Go / No Go sur un nouveau DCE</li>
                <li>▸ 45 minutes pour un PPSPS conforme R4532-64</li>
                <li>▸ 10 minutes pour un CR chantier hebdo</li>
                <li>▸ 5 minutes pour un constat de retard en LRAR</li>
                <li>▸ 15 minutes pour un PV de levée de réserves</li>
                <li>▸ 1 jour pour compiler votre DOE de livraison</li>
              </ul>
              <p className="mt-6 text-[1.0625rem] font-medium text-slate-900">
                → Sur un chantier moyen, c&apos;est 30 à 50 heures de bureau récupérées.
              </p>
              <p className="mt-8 text-[1.0625rem] leading-relaxed text-slate-900">
                <strong className="font-semibold">Prérequis commun</strong> — Abonnement Claude Pro à 18&nbsp;€/mois. Activez «&nbsp;Code execution&nbsp;»,
                «&nbsp;Skills&nbsp;» et «&nbsp;File creation&nbsp;» dans Settings → Capabilities (rappelé dans chaque tuto).
              </p>

              <h3 className="mt-14 text-xl font-semibold tracking-tight text-slate-900">Tableau des gains de temps</h3>
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[320px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left">
                      <th className="py-2 pr-3 font-semibold text-slate-900">Livrable</th>
                      <th className="py-2 pr-3 font-semibold text-slate-900">Sans IA</th>
                      <th className="py-2 pr-3 font-semibold text-slate-900">Avec skill</th>
                      <th className="py-2 font-semibold text-slate-900">Gain</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-800">
                    {GAINS_TABLE.map((row) => (
                      <tr key={row[0]} className="border-b border-slate-100">
                        {row.map((cell) => (
                          <td key={cell} className="py-2 pr-3">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className="mt-14 text-xl font-semibold tracking-tight text-slate-900">Les 6 tutoriels du guide</h3>
              {TUTO_SECTIONS.map((t) => (
                <div key={t.href} className="mt-10 border-t border-slate-100 pt-10 first:mt-8 first:border-t-0 first:pt-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#1d4ed8]">{t.phase}</p>
                  <h4 className="mt-2 text-lg font-bold text-slate-900">
                    Tuto {t.num} — {t.title}{" "}
                    <span className="font-semibold text-slate-600">({t.tagline})</span>
                  </h4>
                  <p className="mt-4 text-[1.0625rem] leading-relaxed text-slate-900">{t.why}</p>
                  <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-slate-700">Ce que tu vas apprendre</p>
                  <ul className="mt-2 list-none space-y-1.5 text-[1.0625rem] leading-relaxed text-slate-900">
                    {t.learn.map((item) => (
                      <li key={item}>▸ {item}</li>
                    ))}
                  </ul>
                  <p className="mt-5">
                    <Link
                      href={t.href}
                      className="inline-flex min-h-[2.5rem] items-center justify-center rounded-lg bg-[#1d4ed8] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1e40af]"
                    >
                      Lire le tuto en ligne (texte + prompts)
                    </Link>
                  </p>
                </div>
              ))}

              <p className="mt-12 text-[1.0625rem] leading-relaxed text-slate-900">
                Vous préférez une version article courte&nbsp;? Consultez aussi le{" "}
                <Link
                  href="/ressources/guide-conducteur-de-travaux-ia-bework"
                  className="font-semibold text-[#1d4ed8] underline-offset-4 hover:underline"
                >
                  guide article conducteur de travaux &amp; IA
                </Link>{" "}
                (8 pages, vue d&apos;ensemble SEO).
              </p>

              <h3 className="mt-14 text-xl font-semibold tracking-tight text-slate-900">Comment utiliser ce guide</h3>
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>Lisez le guide linéairement la première fois pour comprendre la logique (environ 1 heure).</li>
                <li>Gardez-le sous la main&nbsp;: à chaque livrable, retournez au tuto correspondant.</li>
                <li>Créez vos skills un par un, en commençant par celui dont vous avez besoin aujourd&apos;hui.</li>
                <li>Calibrez chaque skill avec vos vrais documents (modèles internes, CR validés, etc.).</li>
                <li>Testez sur un cas réel avant la production.</li>
              </ol>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Au bout de 3 ou 4 utilisations, vous n&apos;aurez plus besoin du guide — les bons réflexes seront acquis.
              </p>

              <h3 className="mt-14 text-xl font-semibold tracking-tight text-slate-900">Questions fréquentes</h3>
              {FAQ_FOR_JSON_LD.map((item, i) => (
                <div key={item.question} className={i === 0 ? "mt-8" : "mt-10"}>
                  <h4 className="text-[1.05rem] font-semibold text-slate-900">{item.question}</h4>
                  <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">{item.answer}</p>
                </div>
              ))}

              <p className="mt-14 text-xl font-semibold uppercase tracking-wide text-slate-900">
                Pas le temps de le faire vous-même ?
              </p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                BeWork propose un Assistant Travaux qui rédige vos livrables (CR, constats, PPSPS, PV de levée, DOE), suit les transmissions
                MOA/MOE et les relances — opérationnel en 3 à 5 jours, 100&nbsp;% piloté en France.
              </p>
              <p className="mt-8 text-2xl font-bold uppercase tracking-tight text-slate-900">ON TIENT LE BUREAU, VOUS TENEZ LE CHANTIER</p>
              <ul className="mt-6 list-none space-y-3 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Vous nous transmettez vos notes terrain, métrés, plans, PV — au fil du chantier</li>
                <li>▸ On rédige tous vos livrables aux normes&nbsp;: CR, constats, PPSPS, PV de levée, DOE</li>
                <li>▸ On suit les transmissions MOA/MOE et les relances jusqu&apos;à validation</li>
                <li>▸ Vous restez sur le chantier de A à Z, votre marge est protégée à chaque étape</li>
              </ul>

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

          <aside
            className="mb-14 rounded-2xl border border-[#1d4ed8]/22 bg-gradient-to-br from-[#eff6ff] to-white p-6 shadow-sm sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-8"
            aria-label="Réserver un appel découverte"
          >
            <div className="min-w-0 sm:flex-1">
              <p className="text-base font-semibold text-slate-900 md:text-[1.05rem]">Besoin d&apos;un relais sur vos livrables chantier&nbsp;?</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 md:text-[0.9375rem]">
                DCE, PPSPS, CR, DOE — parlez-en avec BeWork en 20&nbsp;minutes.
              </p>
            </div>
            <div className="mt-5 shrink-0 sm:mt-0">
              <CalendlyBookingLink className="inline-flex min-h-[3rem] w-full min-w-[12.5rem] items-center justify-center rounded-xl bg-[#1d4ed8] px-6 text-sm font-semibold text-white shadow-md shadow-[#1d4ed8]/22 transition hover:bg-[#1e40af] sm:w-auto md:px-8 md:text-base">
                Réservez un appel
              </CalendlyBookingLink>
            </div>
          </aside>

          <div className="mt-28 flex justify-center pb-14">
            <BeWorkLogo className="opacity-95" aria-label="Logo BeWork" />
          </div>
        </main>
      </div>
    </>
  );
}
