import { getTutoPageDescription, tutoPageMetadata } from "@/lib/seo-tuto-metadata";
import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { CopyPromptButton } from "@/components/ressources/CopyPromptButton";
import { buildWebPageAndBreadcrumbJsonLd } from "@/lib/seo-landing-json-ld";
import { absoluteUrl, SITE_URL } from "@/lib/site";
import { ResourcePdfDownload } from "@/components/ressources/ResourcePdfDownload";

const pagePath = "/ressources/tuto-skill-recouvrement-rg-bework";
const pageUrl = absoluteUrl(pagePath);
const pdfPath = "/ressources/pdf/tuto-skill-recouvrement-rg-bework.pdf";

const H1 = "Crée ton skill — Recouvrement & retenue de garantie";

const PROMPT_CALIBRATION_TEXT = `Je veux créer un skill Claude « Recouvrement & Retenue de Garantie » pour mon entreprise BTP.

Contexte :
- Activité : [gros œuvre / second œuvre / lots techniques]
- Types de clients : [MOA privé / promoteur / syndic / entreprise / acheteur public]
- Paiement : situations / factures / marchés publics et privés

Je te transmets :
- Mes CGV / contrat type / un marché (si possible)
- 2 exemples de relances déjà envoyées (mail ou courrier)
- 1 facture impayée réelle + date d'échéance + montant
- 1 dossier de retenue de garantie (RG) : date réception, PV, montant RG

Ta mission : analyser ces pièces et créer un skill qui :
1) identifie privé/public + sous-traitance éventuelle
2) calcule les échéances (J+1 pénalités, indemnité 40 €, délais légaux)
3) propose l'action du jour + la suivante + la date limite
4) rédige les courriers prêts à signer : relance, mise en demeure, demande libération RG
5) trace un tableau de suivi (créance / prochaine action / échéance)

Contraintes :
- N'invente jamais un texte : si tu n'es pas sûr, dis-le
- Signale quand il faut un conseil (avocat / commissaire de justice)
- Reste concis, orienté chantier (actions, dates, preuves).`;

const PROMPT_USAGE_QUOTIDIEN_TEXT = `Active le skill Recouvrement & Retenue de Garantie.

Nouveau dossier :
- Client / MOA : [nom]
- Marché : [privé/public] ; sous-traitance : [oui/non]
- Facture n° : [X] ; date facture : [JJ/MM/AAAA] ; échéance : [JJ/MM/AAAA]
- Montant dû : [€ TTC]
- Retenue de garantie : [oui/non] ; montant RG : [€] ; réception : [JJ/MM/AAAA]
- Historique relances : [aucune / dates + supports]

Donne-moi :
1) action à mener aujourd'hui + texte de référence (si certain)
2) date de la prochaine action
3) courrier prêt à signer (relance / MED / demande libération RG)
4) liste des pièces à joindre (facture, PV réception, etc.)`;

const breadcrumbItems = [
  { name: "Accueil", href: "/" },
  { name: "Ressources", href: "/ressources" },
  { name: "Tutoriels", href: "/ressources/tutos" },
  { name: H1, href: pagePath },
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

  const graphJson = {
    "@context": "https://schema.org",
    "@graph": [...((webPageBread as { "@graph": unknown[] })["@graph"] ?? []), articleLd],
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

          <header className="mb-10 w-full">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-600">
              Tuto PDF gratuit · Recouvrement · Retenue de garantie · BeWork
            </p>
            <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-[2.35rem] md:leading-tight">
              {H1}
            </h1>
            <p className="mt-4 max-w-none text-lg leading-relaxed text-slate-600 sm:text-[1.125rem] sm:leading-[1.7]">
              Transformer une facture impayée ou une retenue de garantie bloquée en dossier de relance argumenté (courriers, dates, pièces).
              PDF consultable et prompts prêts à coller.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <CalendlyBookingLink className="inline-flex min-h-[3rem] shrink-0 items-center justify-center rounded-xl bg-[#1d4ed8] px-7 text-[0.9375rem] font-semibold text-white shadow-md shadow-[#1d4ed8]/25 transition hover:bg-[#1e40af] md:text-base">
                Réservez un appel
              </CalendlyBookingLink>
              <ResourcePdfDownload
                href={pdfPath}
                resourceSlug="tuto-skill-recouvrement-rg-bework"
                className="inline-flex min-h-[3rem] shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-7 text-[0.9375rem] font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50 md:text-base"
              />
              <Link
                href="/ressources/tutos"
                className="inline-flex min-h-[3rem] shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-7 text-[0.9375rem] font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50 md:text-base"
              >
                Voir tous les tutos
              </Link>
            </div>
          </header>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">Prompts à copier</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Utilisez ces prompts pour initialiser votre skill, puis traiter vos dossiers au quotidien. À valider selon vos CGV et votre marché.
            </p>
            <PromptBlock label="Prompt — calibration du skill" promptText={PROMPT_CALIBRATION_TEXT} />
            <PromptBlock label="Prompt — usage quotidien" promptText={PROMPT_USAGE_QUOTIDIEN_TEXT} />
          </section>
        </main>
      </div>
    </>
  );
}

