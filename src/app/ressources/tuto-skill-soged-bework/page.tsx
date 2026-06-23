import { getTutoPageDescription, tutoPageMetadata } from "@/lib/seo-tuto-metadata";
import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { CopyPromptButton } from "@/components/ressources/CopyPromptButton";
import { BeWorkStatsGrid } from "@/components/marketing/BeWorkStatsGrid";
import { buildWebPageAndBreadcrumbJsonLd } from "@/lib/seo-landing-json-ld";
import { absoluteUrl, SITE_URL } from "@/lib/site";

const pagePath = "/ressources/tuto-skill-soged-bework";
const pageUrl = absoluteUrl(pagePath);
const pdfPath = "/ressources/pdf/tuto-skill-soged-bework.pdf";

const PROMPT_CALIBRATION_TEXT = `Je veux créer un skill Claude dédié à la rédaction de SOGED (Schéma d'Organisation et de Gestion des Déchets) pour mes chantiers BTP.

Contexte : je suis [conducteur de travaux / dirigeant PME BTP] chez [nom de ton entreprise], spécialisé en [corps d'état].
Mes chantiers types : [tertiaire / logement / réhab / TP / MH…].

Je te joins :
- 2 SOGED finalisés et acceptés (marché public + marché privé)
- Ma nomenclature déchets et mes ratios moyens
- Mes filières et éco-organismes habituels
- Les templates imposés par mes MOA récurrents

Cadre réglementaire à respecter en sortie :
- Loi AGEC du 10/02/2020 + décret REP Bâtiment 2021-822
- Arrêté traçabilité du 19/12/2022 (Trackdéchets)
- Article 36 du CCAG Travaux 2021
- BSDA si amiante

Construis-moi un skill qui prend en entrée : adresse, MOA, type d'ouvrage, surface, durée, corps d'état présents — et produit un SOGED complet, structuré, conforme, prêt à envoyer au MOA. Pose-moi toutes les questions nécessaires avant de commencer.`;

const PROMPT_USAGE_QUOTIDIEN_TEXT = `Génère un SOGED pour le chantier suivant :
- Adresse : [adresse complète + commune]
- MOA : [nom MOA + type public/privé]
- MOE : [nom MOE]
- Coordinateur SPS : [nom]
- Type d'ouvrage : [neuf / réhab / démolition / extension]
- Surface plancher : [m²]
- Durée prévue : [mois]
- Corps d'état présents : [liste]
- Particularités : [amiante / plomb / patrimoine / co-activité]
- Template MOA imposé : [oui / non — si oui, joindre]

Sors-moi le SOGED complet en Word.`;

const PROMPT_EXEMPLE_AJUSTEMENT_TEXT = `Ajuste ce point dans le skill :
Sur la section « Estimations quantitatives », ne pars pas de ratios génériques. Demande-moi systématiquement le type d'ouvrage (neuf / réhab / démolition), la surface plancher et le corps d'état dominant. Puis applique mes propres ratios moyens (que je t'ai donnés en pièce jointe).
Et ajoute une vérification automatique : si le taux de valorisation matière prévu descend sous 70 %, signale-le en alerte dans le SOGED.`;

const H1 = "Crée ton skill — SOGED (déchets chantier)";

const breadcrumbItems = [
  { name: "Accueil", href: "/" },
  { name: "Ressources", href: "/ressources" },
  { name: H1, href: pagePath },
] as const;

const FAQ_FOR_JSON_LD = [
  {
    question: "Un SOGED généré par IA est-il juridiquement valable ?",
    answer:
      "Oui, s'il est relu, validé et signé par le responsable de l'entreprise. L'IA rédige ; l'entreprise engage sa responsabilité réglementaire, comme avec un document validé en interne.",
  },
  {
    question: "Quelle différence entre SOGED, SOSED, PAE et notice environnementale ?",
    answer:
      "SOGED est le terme courant. SOSED est celui du CCAG Travaux 2021 en marché public. La PAE est plus large (bruit, eau, poussière). La notice environnementale résume souvent le SOGED en candidature.",
  },
  {
    question: "Faut-il un SOGED pour un petit chantier ?",
    answer:
      "En marché public, le SOGED ou équivalent est en pratique exigé. En privé, la traçabilité AGEC reste obligatoire. Mieux vaut un SOGED court et adapté que rien.",
  },
  {
    question: "Le skill peut-il déposer sur Trackdéchets ?",
    answer:
      "Non : Trackdéchets reste une saisie manuelle. Le skill peut intégrer codes déchets, filières agréées et mentions obligatoires pour déchets dangereux et amiante.",
  },
  {
    question: "Et si le MOA impose son template SOGED ?",
    answer:
      "Joignez le template au skill et demandez à Claude de le remplir plutôt que le format standard — fréquent chez collectivités, RATP, SNCF, OPPIC…",
  },
  {
    question: "Et si je découvre une erreur après envoi ?",
    answer:
      "Le SOGED se révise en cours de chantier. Produisez une version révisée et intégrez la correction dans le skill pour les prochains dossiers.",
  },
  {
    question: "Pas le temps de le faire vous-même ?",
    answer:
      "BeWork rédige le SOGED conforme AGEC et REP, intègre vos filières et suit les BSDA. Vous restez sur le terrain.",
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

export default function TutoSkillSogedBeworkPage() {
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
      { "@type": "HowToStep", name: "Rassembler ta matière SOGED" },
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
              Tuto PDF gratuit · SOGED déchets chantier · Claude &amp; skills · BeWork
            </p>
            <h1 className="font-heading mt-3 text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-[2.35rem] md:leading-tight">
              {H1}
            </h1>
            <p className="mt-4 max-w-none text-lg leading-relaxed text-slate-600 sm:text-[1.125rem] sm:leading-[1.7]">
              Tutoriel PDF — Schéma d&apos;Organisation et de Gestion des Déchets (AGEC, REP Bâtiment,
              Trackdéchets)&nbsp;: un SOGED conforme en 12 minutes au lieu de 3 heures. PDF en ligne, texte
              intégral et prompts prêts à coller.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <CalendlyBookingLink className="inline-flex min-h-[3rem] shrink-0 items-center justify-center rounded-xl bg-[#1d4ed8] px-7 text-[0.9375rem] font-semibold text-white shadow-md shadow-[#1d4ed8]/25 transition hover:bg-[#1e40af] md:text-base">
                Réservez un appel
              </CalendlyBookingLink>
              <span className="text-sm leading-snug text-slate-600 sm:max-w-sm">
                20&nbsp;minutes pour cadrer vos SOGED et votre assistance travaux chantier — sans engagement.
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
              Consultez le guide dans sa mise en page originale. Vous pouvez l&apos;agrandir ou le télécharger. PDF · 9
              pages
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
                title="Crée ton skill — SOGED déchets chantier — PDF BeWork"
              />
            </div>
          </section>

          <aside
            className="mb-14 rounded-2xl border border-[#1d4ed8]/22 bg-gradient-to-br from-[#eff6ff] to-white p-6 shadow-sm shadow-[#1d4ed8]/06 sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-8"
            aria-label="Réserver un appel découverte"
          >
            <div className="min-w-0 sm:flex-1">
              <p className="text-base font-semibold text-slate-900 md:text-[1.05rem]">
                Besoin d&apos;une assistance sur vos SOGED et déchets chantier&nbsp;?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 md:text-[0.9375rem]">
                Parlez-en avec BeWork : SOGED conforme AGEC et REP, filières à jour, suivi BSDA.
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
              <p className="mt-3 text-center text-xl font-semibold text-slate-900">SOGED — Gestion des déchets chantier</p>
              <p className="mt-2 text-center text-base text-slate-700 md:text-[1.05rem]">
                Le tutoriel pas à pas pour générer ton Schéma d&apos;Organisation et de Gestion des Déchets — 12 minutes
                au lieu de 3 heures.
              </p>

              <h4 className="mt-14 text-xs font-semibold uppercase tracking-[0.2em] text-slate-800">Ce que tu vas apprendre</h4>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Activer la fonction Skills dans Claude (procédure 2026)</li>
                <li>▸ Préparer ta matière chantier pour entraîner ton skill SOGED</li>
                <li>▸ Générer un SOGED conforme AGEC, REP Bâtiment et Trackdéchets</li>
                <li>▸ Réutiliser le skill sur tous tes chantiers en 12 minutes</li>
              </ul>

              <h3 className="mt-14 text-xl font-semibold tracking-tight text-slate-900">Pourquoi un skill SOGED ?</h3>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-slate-900">
                Le SOGED est exigé sur la plupart des marchés publics et de nombreux marchés privés. Sans document à jour
                (filières, BSDA, Trackdéchets, REP), vous risquez un rejet en analyse ou une non-conformité en exécution.
                Un skill bien calibré intègre le cadre réglementaire une fois pour toutes et accélère chaque nouveau
                chantier.
              </p>

              <p className="mt-10 rounded-xl border border-amber-200/80 bg-amber-50/60 px-4 py-3 text-[1.0625rem] leading-relaxed text-slate-900">
                <strong className="font-semibold text-slate-900">Cadre réglementaire —</strong> Code de l&apos;environnement,
                loi AGEC (10/02/2020), décret REP Bâtiment 2021-822, arrêté traçabilité 19/12/2022, article 36 CCAG
                Travaux 2021. Amiante : décret 2012-639 et BSDA obligatoire.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">1 </span>
                Active la fonction Skills dans Claude
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Avatar → Personnaliser → Compétences → «&nbsp;+ Créer une compétence&nbsp;». Active aussi
                «&nbsp;Exécution de code&nbsp;» pour obtenir un livrable Word ou PDF.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">2 </span>
                Rassemble ta matière SOGED
              </h3>
              <ul className="mt-6 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ 2-3 SOGED acceptés (public + privé)</li>
                <li>▸ Nomenclature déchets et ratios métier</li>
                <li>▸ Filières, éco-organismes (Valobat, Ecominéro, Ecomaison, Valdelia…)</li>
                <li>▸ Templates MOA imposés le cas échéant</li>
                <li>▸ Plans types (zones bennes, panneaux tri, suivi mensuel)</li>
              </ul>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">3 </span>
                Lance la conversation avec Claude
              </h3>
              <PromptBlock label="PROMPT À COLLER DANS CLAUDE" promptText={PROMPT_CALIBRATION_TEXT} />

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">4 </span>
                Affine et active ton skill
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Vérifie déclencheurs, structure (identification → estimations → tri → filières → suivi → REP), références
                à jour, éco-organismes multiples, livrable Word. Alerte si valorisation matière &lt; 70&nbsp;%.
              </p>
              <PromptBlock label="EXEMPLE D&apos;AJUSTEMENT" promptText={PROMPT_EXEMPLE_AJUSTEMENT_TEXT} />

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">5 </span>
                Teste sur un vrai chantier
              </h3>
              <PromptBlock label="PROMPT — UTILISATION QUOTIDIENNE" promptText={PROMPT_USAGE_QUOTIDIEN_TEXT} />
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">La règle d&apos;or</p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Chaque correction sur un SOGED produit doit être reversée dans le skill. Au bout de quelques chantiers, le
                document sort quasi prêt à envoyer.
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
                <li>▸ Vous transmettez surface, MOA, planning et particularités</li>
                <li>▸ On rédige le SOGED conforme, on intègre vos filières, on suit les BSDA</li>
                <li>▸ Vous restez sur le terrain</li>
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
