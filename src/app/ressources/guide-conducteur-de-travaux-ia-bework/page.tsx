import { getTutoPageDescription, tutoPageMetadata } from "@/lib/seo-tuto-metadata";
import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { buildWebPageAndBreadcrumbJsonLd } from "@/lib/seo-landing-json-ld";
import { absoluteUrl, SITE_URL } from "@/lib/site";
import { BeWorkStatsGrid } from "@/components/marketing/BeWorkStatsGrid";

const pagePath = "/ressources/guide-conducteur-de-travaux-ia-bework";

const pageUrl = absoluteUrl(pagePath);

const pdfPath = "/ressources/pdf/guide-conducteur-de-travaux-ia-bework.pdf";

const H1 = "Guide du conducteur de travaux : 6 outils IA pour automatiser CR chantier, PPSPS, DCE et DOE";


const breadcrumbItems = [
  { name: "Accueil", href: "/" },
  { name: "Ressources", href: "/ressources" },
  { name: "Guides", href: "/ressources/guides" },
  { name: "Guide conducteur de travaux IA", href: pagePath },
] as const;

const TUTO_LINKS = [
  { label: "Analyse de DCE", href: "/ressources/tuto-skill-analyse-dce-bework", gain: "3 min au lieu de 4 h" },
  { label: "PPSPS", href: "/ressources/tuto-skill-ppsps-bework", gain: "45 min au lieu de 4 h" },
  { label: "Compte rendu de chantier", href: "/ressources/compte-rendu-chantier-guide-btp", gain: "10 min au lieu de 2 h" },
  { label: "Constat de retard", href: "/ressources/tuto-skill-constat-retard-bework", gain: "5 min au lieu de 45 min" },
  { label: "PV de levée de réserves", href: "/ressources/tuto-skill-pv-levee-reserves-bework", gain: "15 min au lieu de 1 h" },
  { label: "DOE", href: "/ressources/tuto-skill-doe-bework", gain: "1 jour au lieu de 1 semaine" },
] as const;

const FAQ_FOR_JSON_LD = [
  {
    question: "Le guide BeWork est-il vraiment gratuit ?",
    answer:
      "Oui, le guide est téléchargeable gratuitement sur bework.fr, sans formulaire ni inscription. Aucun engagement, aucune relance commerciale automatique.",
  },
  {
    question: "Faut-il un abonnement à Claude AI pour utiliser le guide ?",
    answer:
      "Oui. Les skills présentés nécessitent un abonnement Claude Pro (18 €/mois auprès d'Anthropic). La version gratuite ne permet pas de créer des skills personnalisés ni de générer des fichiers Word téléchargeables.",
  },
  {
    question: "Le guide fonctionne-t-il avec ChatGPT, Gemini ou Mistral ?",
    answer:
      "Le guide est calibré pour Claude AI car c'est le seul outil grand public à proposer la fonction Skills avec mémoire persistante et génération native de fichiers Word. Les prompts peuvent être adaptés à d'autres outils, mais les workflows ne seront pas identiques.",
  },
  {
    question: "Combien de temps faut-il pour créer un skill ?",
    answer:
      "Compte 30 à 45 minutes pour créer un skill, à condition d'avoir rassemblé sa matière première (anciens documents, modèles internes, contraintes spécifiques). Le calibrage s'amortit dès la deuxième utilisation.",
  },
  {
    question: "Les livrables générés ont-ils une valeur juridique ?",
    answer:
      "Oui, exactement la même que ceux rédigés à la main. La valeur juridique vient de la signature du dirigeant, du respect des délais contractuels et de l'envoi en LRAR avec accusé de réception. L'outil utilisé est sans incidence sur la force probante du document.",
  },
  {
    question: "Mes données chantier restent-elles confidentielles ?",
    answer:
      "Sur les plans payants Claude (Pro et Team), Anthropic ne réutilise pas le contenu des conversations pour entraîner ses modèles. Pour les chantiers ultra-sensibles, travaillez avec des données anonymisées et vérifiez que le règlement de consultation autorise l'usage d'outils IA externes.",
  },
  {
    question: "Le guide est-il à jour des dernières évolutions réglementaires ?",
    answer:
      "La version mai 2026 intègre le CCAG-Travaux 2021 (articles 19 et 30), les articles R4532-56 à R4532-74 du Code du travail (PPSPS), l'article 1792-6 du Code civil (GPA) et l'article 122 du Code de la commande publique (retenue de garantie).",
  },
] as const;

export const metadata = tutoPageMetadata(pagePath);

export default function GuideConducteurTravauxIaBeworkPage() {
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
    datePublished: "2026-05-11",
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
    numberOfPages: 8,
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
              PDF gratuit (8 pages) pour automatiser les livrables administratifs de chantier avec Claude AI. Gains moyens documentés&nbsp;:
              30 à 50&nbsp;heures de bureau récupérées par chantier. Texte intégral + téléchargement.
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
              Voir le PDF original
            </h2>
            <p className="mt-3 w-full leading-relaxed text-slate-600">
              Consultez le guide dans sa mise en page originale. Vous pouvez l&apos;agrandir ou le télécharger. PDF · 8 pages
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
                title="Guide du conducteur de travaux — PDF BeWork"
              />
            </div>
          </section>

          <section className="mb-14" aria-labelledby="guide-heading">
            <h2 id="guide-heading" className="mb-6 text-xl font-semibold tracking-tight text-slate-900">
              Texte intégral du guide
            </h2>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
              <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-900">GUIDE OFFERT PAR BEWORK</p>
              <p className="mt-4 text-center text-sm text-slate-600">Article de blog SEO + GEO · bework.fr · 11 mai 2026 · ~9 min de lecture</p>

              <h3 className="mt-10 text-center text-2xl font-bold text-slate-900 md:text-[1.65rem]">{H1}</h3>

              <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50/80 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-800">En bref</p>
                <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                  <li>▸ Un conducteur de travaux BTP produit en moyenne 47 documents administratifs critiques par chantier.</li>
                  <li>▸ Le guide gratuit BeWork rassemble 6 tutoriels Claude AI couvrant la préparation, l&apos;exécution et la livraison.</li>
                  <li>▸ Gains moyens documentés&nbsp;: 30 à 50&nbsp;heures de bureau récupérées par chantier.</li>
                  <li>▸ Format PDF, téléchargement libre sans formulaire, prérequis Claude Pro (18&nbsp;€/mois).</li>
                </ul>
              </div>

              <h3 className="mt-14 text-xl font-semibold tracking-tight text-slate-900">
                Qu&apos;est-ce qu&apos;un guide pour conducteur de travaux ?
              </h3>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-slate-900">
                Un guide pour conducteur de travaux est une ressource pratique qui rassemble les méthodes, modèles et outils nécessaires à la
                production des livrables administratifs d&apos;un chantier BTP. Le guide édité par BeWork est spécifiquement orienté automatisation par
                l&apos;intelligence artificielle.
              </p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Concrètement, il explique, étape par étape, comment configurer 6 skills Claude AI — un par livrable critique — pour réduire le temps
                de production de chaque document de 80 à 98&nbsp;%. Un skill Claude est un mode d&apos;emploi permanent que l&apos;IA utilise pour produire un
                livrable type à partir de tes notes terrain. Tu le configures une fois, il s&apos;applique automatiquement à chaque nouvelle utilisation.
              </p>

              <h3 className="mt-14 text-xl font-semibold tracking-tight text-slate-900">
                Pourquoi automatiser les livrables administratifs de chantier ?
              </h3>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-slate-900">
                Selon les analyses sectorielles BTP, un conducteur de travaux passe en moyenne 30 à 40&nbsp;% de son temps en bureau plutôt que sur le
                terrain. Sur un chantier moyen de 6 mois&nbsp;: plus de 47 documents administratifs critiques, 30 à 60 minutes de rédaction soignée par
                livrable, 150 à 200&nbsp;heures cumulées de bureau dont 60 à 80 sur le seul compte rendu hebdomadaire.
              </p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Chaque livrable mal fait, en retard ou incomplet entraîne pénalités contractuelles, retenue de garantie bloquée (5&nbsp;% du marché sur
                1 an), solde impayé tant que le DOE n&apos;est pas remis, ou responsabilité pénale du dirigeant en cas de défaut de PPSPS (jusqu&apos;à 9&nbsp;000&nbsp;€
                par travailleur non couvert, article L4744-3).
              </p>
              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">Ce que change l&apos;automatisation par IA</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                L&apos;objectif n&apos;est pas de remplacer l&apos;expertise terrain — c&apos;est elle qui fait la différence. L&apos;objectif est de rendre les heures de
                bureau en automatisant la mise en forme et la conformité documentaire.
              </p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Extraction structurée d&apos;un DCE de 200 pages</li>
                <li>▸ PPSPS conforme aux 9 rubriques R4532-64</li>
                <li>▸ Notes vocales transformées en CR prêt à diffuser</li>
                <li>▸ Constat de retard en LRAR avec références CCAG</li>
                <li>▸ Sommaire de DOE indexé avec checklist des pièces manquantes</li>
              </ul>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                L&apos;IA ne fait pas&nbsp;: l&apos;observation visuelle sur site, la validation finale des faits, les décisions Go / No Go, ni la signature des
                actes juridiques.
              </p>

              <h3 className="mt-14 text-xl font-semibold tracking-tight text-slate-900">Le guide BeWork en bref</h3>
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[280px] border-collapse text-left text-sm text-slate-900">
                  <tbody>
                    {[
                      ["Format", "PDF (article + compilation des 6 tutos)"],
                      ["Prix", "Gratuit, sans formulaire"],
                      ["Édition", "Mai 2026"],
                      ["Prérequis", "Claude Pro (18 €/mois)"],
                      ["Outil cible", "Claude AI (Anthropic)"],
                      ["Niveau", "Aucun (tutoriels pas à pas)"],
                    ].map(([k, v]) => (
                      <tr key={k} className="border-b border-slate-100">
                        <th className="py-2 pr-4 font-semibold">{k}</th>
                        <td className="py-2 text-slate-700">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Organisation selon la chronologie d&apos;un chantier&nbsp;: Phase 1 — Préparation (DCE, PPSPS) · Phase 2 — Exécution (CR, constat de retard)
                · Phase 3 — Livraison &amp; garantie (PV de levée, DOE). Chaque tutoriel est autonome.
              </p>

              <h3 className="mt-14 text-xl font-semibold tracking-tight text-slate-900">Les 6 livrables couverts</h3>
              <ol className="mt-6 list-decimal space-y-8 pl-5 text-[1.0625rem] leading-relaxed text-slate-900 marker:font-semibold">
                <li>
                  <strong>Analyse de DCE</strong> — 3 minutes au lieu de 4 heures. Fiche standardisée, critères de sélection, pénalités, avis Go / No
                  Go avec citation de page.
                </li>
                <li>
                  <strong>PPSPS</strong> — 45 minutes au lieu de 4 heures. 9 rubriques R4532-64, risques importés/exportés, EPI avec normes EN.
                </li>
                <li>
                  <strong>CR de chantier</strong> — 10 minutes au lieu de 2 heures. 8 rubriques standard, réserves, décisions actées, prochaines étapes.
                </li>
                <li>
                  <strong>Constat de retard</strong> — 5 minutes au lieu de 45 minutes. 7 éléments opposables, CCAG art.&nbsp;19, seuils CIBTP intempéries.
                </li>
                <li>
                  <strong>PV de levée de réserves</strong> — 15 minutes au lieu de 1 heure. 7 blocs obligatoires, GPA 1 an (art.&nbsp;1792-6).
                </li>
                <li>
                  <strong>DOE</strong> — 1 jour au lieu d&apos;1 semaine. 9 rubriques CCAG, sommaire indexé, checklist manquants (délai 60 jours art.&nbsp;30).
                </li>
              </ol>

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
                    {[
                      ["Analyse de DCE", "4 h", "3 min", "−98 %"],
                      ["PPSPS", "4 h", "45 min", "−81 %"],
                      ["CR hebdo", "2 h", "10 min", "−92 %"],
                      ["Constat de retard", "45 min", "5 min", "−89 %"],
                      ["PV de levée", "1 h", "15 min", "−75 %"],
                      ["DOE", "1 semaine", "1 jour", "−80 %"],
                    ].map((row) => (
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
              <p className="mt-6 text-[1.0625rem] font-medium text-slate-900">
                Gains cumulés sur un chantier moyen&nbsp;: 30 à 50&nbsp;heures de bureau récupérées.
              </p>

              <h3 className="mt-14 text-xl font-semibold tracking-tight text-slate-900">Les 6 tutoriels détaillés sur BeWork</h3>
              <ul className="mt-4 list-none space-y-3">
                {TUTO_LINKS.map((t) => (
                  <li key={t.href}>
                    <Link href={t.href} className="font-semibold text-[#1d4ed8] underline-offset-4 hover:underline">
                      {t.label}
                    </Link>
                    <span className="text-slate-700"> — {t.gain}</span>
                  </li>
                ))}
              </ul>

              <h3 className="mt-14 text-xl font-semibold tracking-tight text-slate-900">Pour qui ce guide est-il fait ?</h3>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Conducteurs de travaux salariés ou indépendants</li>
                <li>▸ Chargés d&apos;affaires PME et ETI BTP</li>
                <li>▸ Dirigeants de PME du bâtiment</li>
                <li>▸ Chargés QHSE, assistantes travaux, maîtres d&apos;œuvre</li>
              </ul>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Niveau technique requis&nbsp;: aucun. Prérequis unique&nbsp;: abonnement Claude Pro (18&nbsp;€/mois).
              </p>

              <h3 className="mt-14 text-xl font-semibold tracking-tight text-slate-900">Comment télécharger et utiliser le guide</h3>
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>Lis le guide linéairement la première fois (environ 1 heure).</li>
                <li>À chaque livrable à produire, retourne au tuto correspondant.</li>
                <li>Crée tes skills un par un, en commençant par celui dont tu as besoin maintenant.</li>
                <li>Calibre chaque skill avec tes vrais documents.</li>
                <li>Teste sur un cas réel avant la production.</li>
              </ol>

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
                BeWork propose un Assistant Travaux qui rédige vos livrables à votre place, augmenté par l&apos;IA, avec une prise en charge rapide, 100&nbsp;%
                piloté en France.
              </p>
              <p className="mt-8 text-2xl font-bold uppercase tracking-tight text-slate-900">ON TIENT LE BUREAU, VOUS TENEZ LE CHANTIER</p>

              <BeWorkStatsGrid />

              <p className="mt-10 text-sm text-slate-600">Article publié le 11 mai 2026 par BeWork. Version 1.0 du guide.</p>
            </div>
          </section>

          <aside
            className="mb-14 rounded-2xl border border-[#1d4ed8]/22 bg-gradient-to-br from-[#eff6ff] to-white p-6 shadow-sm sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-8"
            aria-label="Réserver un appel découverte"
          >
            <div className="min-w-0 sm:flex-1">
              <p className="text-base font-semibold text-slate-900 md:text-[1.05rem]">Besoin d&apos;un relais sur vos livrables chantier&nbsp;?</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 md:text-[0.9375rem]">
                CR, PPSPS, DCE, DOE — parlez-en avec BeWork en 20&nbsp;minutes.
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
