import {
  BlueprintCotationMissionsFrame,
  BlueprintCotationWhatWeHandleAmbient,
} from "@/components/home/BlueprintCotationDecor";

const MISSIONS_GRID = [
  "Analyse DCE & contrôle conformité",
  "Mémoire technique & aide au chiffrage",
  "Suivi documentaire chantier",
  "Comptes rendus & planning administratif",
  "Documents d'exécution & fiches techniques",
  "Marchés publics & accords-cadres",
  "Chorus Pro & situations mensuelles",
  "DOE & suivi réserves",
  "Relances MOA / MOE / fournisseurs",
  "Ordres de service & calendrier contractuel",
  "Coordination bureau-chantier",
  "Pénalités & preuves de suivi",
] as const;

/**
 * Section « Ce qu'on prend en charge » — relais administratif marchés travaux.
 */
export function HomeWhatWeHandleSection() {
  return (
    <section
      id="ce-quon-gere"
      className="relative bg-transparent pt-10 pb-12 md:pt-12 md:pb-14"
      style={{ scrollMarginTop: "6rem" }}
      aria-labelledby="what-we-handle-heading"
    >
      <BlueprintCotationWhatWeHandleAmbient />
      <div className="container-site relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-heading text-sm font-semibold uppercase tracking-[0.18em] text-[#1d4ed8] md:text-base">
            Ce qu&apos;on prend en charge
          </p>
          <h2
            id="what-we-handle-heading"
            className="mt-4 text-balance text-3xl font-bold leading-[1.12] tracking-tight text-[#0f172a] md:text-4xl"
          >
            Assistance technique et administrative,
            <br />
            <span className="text-[#1d4ed8]">de l&apos;appel d&apos;offres à la clôture.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-relaxed text-slate-800 md:text-xl">
            Analyse DCE, mémoire technique, suivi de chantier, marchés publics, Chorus Pro, DOE, réserves et coordination
            documentaire — pour les entreprises BTP qui veulent sécuriser délais, preuves et rentabilité.
          </p>
          <p className="mx-auto mt-4 max-w-xl text-center text-sm font-semibold text-slate-700 md:text-base">
            Assistants travaux augmentés par l&apos;IA · expertise BTP terrain · supervision depuis la France
          </p>
        </div>

        <div className="relative mt-14 md:mt-16">
          <BlueprintCotationMissionsFrame />
          <ul className="relative z-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
            {MISSIONS_GRID.map((mission) => (
              <li
                key={mission}
                className="flex items-start gap-3 rounded-xl border border-slate-200/85 bg-white px-4 py-3.5 shadow-sm shadow-slate-900/[0.04] ring-1 ring-slate-100/80 transition-[border-color,box-shadow] duration-200 motion-safe:hover:border-slate-300/90 motion-safe:hover:shadow-md"
              >
                <span className="mt-0.5 shrink-0 text-[15px] font-bold text-[#1d4ed8]" aria-hidden>
                  ✓
                </span>
                <span className="text-base font-semibold leading-snug text-slate-900 md:text-[1.05rem]">{mission}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 md:mt-12">
          <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_10px_40px_-16px_rgba(15,23,42,0.1)] ring-1 ring-slate-100/85 md:p-8">
            <p className="font-heading text-xs font-bold uppercase tracking-[0.22em] text-[#1d4ed8] md:text-sm">
              Volume de marchés
            </p>
            <h3 className="mt-2.5 text-balance font-sans text-xl font-bold tracking-tight text-[#0f172a] md:text-2xl">
              Quand le volume augmente, BeWork tient le fil documentaire.
            </h3>
            <p className="mt-3 text-base leading-relaxed text-slate-800 md:text-[1.05rem]">
              Multi-chantiers, relances MOE / MOA, validations en attente, pièces manquantes, pénalités à anticiper&nbsp;: votre
              Beworker structure le suivi, relance les bons interlocuteurs et vous fait valider avant tout engagement.
            </p>
            <ul className="mt-5 grid gap-2 text-sm font-semibold text-slate-800 sm:grid-cols-2 lg:grid-cols-3 md:text-base">
              {[
                "Analyse DCE & mémoire technique",
                "Situations & Chorus Pro",
                "DOE & réserves",
                "Ordres de service",
                "Documents d'exécution",
                "Pénalités & preuves",
              ].map((i) => (
                <li key={i} className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2">
                  <span className="mt-[2px] text-[#1d4ed8]" aria-hidden>
                    ✓
                  </span>
                  <span>{i}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 md:mt-12">
          <div className="mx-auto max-w-5xl">
            <h3 className="text-balance text-xl font-bold tracking-tight text-[#0f172a] md:text-2xl">
              Un relais pour conducteurs de travaux, chargés d&apos;affaires et bureau marchés.
            </h3>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm ring-1 ring-slate-100/85 md:p-7">
                <p className="font-heading text-xs font-bold uppercase tracking-[0.22em] text-[#1d4ed8] md:text-sm">
                  Conducteurs & chefs de chantier
                </p>
                <p className="mt-3 text-base leading-relaxed text-slate-800 md:text-[1.05rem]">
                  Comptes rendus, photos, réserves, relances MOE / OPC / SPS, suivi fournisseurs et points bloquants — sans
                  saturer l&apos;équipe terrain ni prendre la direction technique du chantier.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm ring-1 ring-slate-100/85 md:p-7">
                <p className="font-heading text-xs font-bold uppercase tracking-[0.22em] text-[#1d4ed8] md:text-sm">
                  Bureau marchés & chargés d&apos;affaires
                </p>
                <p className="mt-3 text-base leading-relaxed text-slate-800 md:text-[1.05rem]">
                  DCE, mémoires techniques, situations, DOE, classement des pièces marché, Chorus Pro, validations BPU / DPGF
                  et relances donneurs d&apos;ordre.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 md:mt-12">
          <div className="mx-auto max-w-5xl">
            <p className="font-heading text-xs font-bold uppercase tracking-[0.22em] text-[#1d4ed8] md:text-sm">
              Missions avancées BTP
            </p>
            <h3 className="mt-2.5 text-balance text-xl font-bold tracking-tight text-[#0f172a] md:text-2xl">
              Pièces marché, conformité et clôture.
            </h3>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  t: "Sécurité & conformité",
                  b: "PPSPS, autocontrôles, plans de prévention, pièces réglementaires.",
                },
                {
                  t: "Dossiers & autorisations",
                  b: "DT / DICT selon besoin, arrêtés, permissions, dossiers d'intervention.",
                },
                { t: "Contractuel marché", b: "BPU / DPGF, attachements, situations, validations MOA." },
                { t: "Réception & DOE", b: "Levée de réserves, DOE / DIUO, archivage documentaire marché." },
              ].map((c) => (
                <div
                  key={c.t}
                  className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-100/85"
                >
                  <p className="text-sm font-bold leading-snug text-slate-900 md:text-base">{c.t}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700 md:text-[0.9375rem]">{c.b}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
