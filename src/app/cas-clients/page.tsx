import Link from "next/link";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { landingPageMetadata } from "@/lib/seo-landing-metadata";
import { buildWebPageAndBreadcrumbJsonLd } from "@/lib/seo-landing-json-ld";

const PAGE_PATH = "/cas-clients";

const h1 = "Cas clients (BTP) : ce que vous gagnez vraiment";

export const metadata = landingPageMetadata({
  title: "Cas clients BTP : suivi, trésorerie, organisation | BeWork",
  description:
    "Exemples concrets : devis relancés, facturation sécurisée, situations de travaux cadrées, dossiers tenus. Pilotage administratif encadré pour entreprises du BTP.",
  path: PAGE_PATH,
  keywords: ["cas clients BTP", "preuve résultats administratif", "témoignage artisan bâtiment", "BeWork"],
});

const cases = [
  {
    title: "Relances devis : plus de réponses, moins d’oubli",
    before: "Devis envoyés mais peu relancés, décisions client floues.",
    after: "Rythme de relance + statuts + prochaines actions, réponses plus rapides.",
    kpis: ["Suivi J+2/J+7/J+14", "Traçabilité des réponses", "Décisions client clarifiées"],
  },
  {
    title: "Trésorerie : factures et impayés mieux pilotés",
    before: "Facturation en retard, relances irrégulières, stress sur l’encaissement.",
    after: "Calendrier de relance + preuves + reporting, trésorerie plus stable.",
    kpis: ["Relances cadrées", "Pièces classées par chantier", "Reporting impayés"],
  },
  {
    title: "Chantier : dossier propre (situations, avenants, DT/DICT)",
    before: "Pièces dispersées, délais qui glissent, relances faites au dernier moment.",
    after: "Process simple : préparation, suivi, classement, validations au bon moment.",
    kpis: ["Tableau de suivi", "Checklists pièces", "Validation des points sensibles"],
  },
] as const;

const breadcrumbItems = [
  { name: "Accueil", href: "/" },
  { name: "Cas clients BTP", href: PAGE_PATH },
] as const;

const casClientsJsonLd = buildWebPageAndBreadcrumbJsonLd({
  pagePath: PAGE_PATH,
  h1,
  description:
    "Exemples concrets : devis relancés, facturation sécurisée, situations de travaux cadrées, dossiers tenus. Pilotage administratif encadré pour entreprises du BTP.",
  breadcrumbItems: [...breadcrumbItems],
});

export default function CasClientsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fb] via-[#eef0f4] to-[#e0e4ea]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(casClientsJsonLd) }} />
      <MarketingSiteHeader plainBg />

      <main className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <header className="mx-auto max-w-3xl text-center">
          <nav className="mb-6 text-left text-sm text-black sm:text-center" aria-label="Fil d’Ariane">
            <ol className="inline-flex flex-wrap items-center justify-start gap-x-2 gap-y-1 sm:justify-center">
              {breadcrumbItems.map((item, i) => (
                <li key={item.href} className="flex items-center gap-2">
                  {i > 0 ? <span aria-hidden className="text-[#94a3b8]">/</span> : null}
                  {i < breadcrumbItems.length - 1 ? (
                    <Link href={item.href} className="font-medium text-black hover:text-[#1d4ed8]">
                      {item.name}
                    </Link>
                  ) : (
                    <span className="font-medium text-black">{item.name}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
          <h1 className="text-3xl font-bold tracking-tight text-black md:text-4xl">{h1}</h1>
          <p className="mt-5 text-lg leading-relaxed text-black">
            BeWork ne “fait pas de secrétariat”. On met en place un cadre de suivi : relances, dossiers, pièces, et
            validations — pour sécuriser vos opportunités et votre chiffre d’affaires.
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link
              href="/contact"
              className="inline-flex justify-center rounded-lg bg-[#1d4ed8] px-6 py-3 font-semibold text-white hover:bg-[#1e40af]"
            >
              Demander un rendez-vous découverte
            </Link>
            <Link
              href="/tarifs"
              className="inline-flex justify-center rounded-lg border-2 border-[#1d4ed8] px-6 py-3 font-semibold text-[#1d4ed8] hover:bg-white"
            >
              Voir les forfaits
            </Link>
          </div>
        </header>

        <section className="mx-auto mt-14 grid max-w-5xl gap-6 md:grid-cols-3" aria-label="Cas clients">
          {cases.map((c) => (
            <article key={c.title} className="rounded-2xl surface-metallic-light p-7">
              <h2 className="text-lg font-semibold text-black">{c.title}</h2>
              <div className="mt-4 space-y-3 text-sm text-black">
                <p>
                  <span className="font-semibold text-black">Avant :</span> {c.before}
                </p>
                <p>
                  <span className="font-semibold text-black">Après :</span> {c.after}
                </p>
              </div>
              <ul className="mt-5 space-y-2 text-sm text-black" role="list">
                {c.kpis.map((k) => (
                  <li key={k} className="flex items-start gap-2">
                    <span className="mt-0.5 text-[#1d4ed8]" aria-hidden>
                      ✓
                    </span>
                    <span>{k}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="mx-auto mt-10 max-w-5xl rounded-2xl border border-[#dce3ec] bg-white/60 p-7">
          <h2 className="text-lg font-semibold text-black">Tu veux que je mette tes vrais chiffres ?</h2>
          <p className="mt-2 text-sm leading-relaxed text-black">
            Donne-moi 2–3 cas réels (type de mission, volume, avant/après, résultat) et je remplace ces exemples par des
            cas clients précis + un format “preuve” plus convaincant.
          </p>
        </section>
      </main>
    </div>
  );
}

