/**
 * Clarification immédiate — BeWork = renfort, pas remplacement.
 */
export function HomeRenfortClarificationSection() {
  return (
    <section
      id="renfort-equipes"
      className="relative bg-transparent px-6 pb-8 md:pb-10"
      aria-labelledby="renfort-equipes-heading"
      style={{ scrollMarginTop: "6rem" }}
    >
      <div className="container-site">
        <div className="mx-auto max-w-4xl rounded-2xl border border-[#1d4ed8]/18 bg-gradient-to-br from-[#eff6ff]/80 via-white to-white p-6 shadow-[0_10px_40px_-20px_rgba(29,78,216,0.22)] ring-1 ring-slate-100/90 md:p-8">
          <p className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-[#1d4ed8] md:text-sm">
            Positionnement
          </p>
          <h2
            id="renfort-equipes-heading"
            className="font-heading mt-2 text-balance text-xl font-bold tracking-tight text-[#0f172a] md:text-2xl"
          >
            BeWork agit comme un renfort de vos équipes
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-800 md:text-[1.05rem] md:leading-relaxed">
            Nous ne remplaçons pas votre dirigeant, votre chargé d&apos;affaires, votre conducteur de travaux, votre
            métreur ou votre bureau d&apos;études. Nous préparons, organisons et suivons les éléments nécessaires à vos
            candidatures et à vos marchés, sous la validation de votre entreprise.
          </p>
          <p className="mt-4 text-sm font-medium leading-relaxed text-slate-700 md:text-base">
            BeWork n&apos;est ni un bureau d&apos;études, ni un cabinet juridique, ni un économiste de la construction,
            ni un mandataire qui engage l&apos;entreprise.{" "}
            <span className="font-semibold text-[#0f172a]">On tient le dossier, vous gardez la décision.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
