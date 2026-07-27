const KEEPS = [
  "Décisions de chantier",
  "Pilotage des équipes",
  "Choix techniques",
  "Réunions importantes",
  "Contrôles",
  "Relation client",
  "Validation finale",
] as const;

const DELEGATES = [
  "Préparation des comptes rendus",
  "Mise à jour des actions",
  "Relance des fiches techniques",
  "Classement des documents",
  "Suivi des pièces manquantes",
  "Préparation des situations",
  "Suivi du DOE",
] as const;

/** Section « cas concret » — exemple chiffré neutre (pas de statistique commerciale). */
export function HomeConcreteCaseSection() {
  return (
    <section id="cas-concret" className="relative bg-transparent px-6 py-14 md:py-20 lg:py-24" style={{ scrollMarginTop: "6rem" }}>
      <div className="container-site">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-balance text-[1.75rem] font-extrabold leading-[1.12] tracking-[-0.02em] text-[#0f172a] md:text-[2.25rem]">
            Concrètement, que peut déléguer un conducteur de travaux&nbsp;?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-700 md:text-lg">
            Une PME suit quatre chantiers. Le conducteur partage ses journées entre réunions, équipes, fournisseurs et
            imprévus. Les comptes rendus, fiches techniques et situations commencent à prendre du retard.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6">
            <h3 className="text-base font-bold tracking-tight text-[#0f172a]">Le conducteur conserve</h3>
            <ul className="mt-4 space-y-2">
              {KEEPS.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm leading-snug text-slate-800">
                  <span className="mt-0.5 font-bold text-slate-500" aria-hidden>
                    ·
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-[#1d4ed8]/25 bg-white p-6 shadow-sm ring-1 ring-[#1d4ed8]/10">
            <h3 className="text-base font-bold tracking-tight text-[#1d4ed8]">BeWork fait avancer</h3>
            <ul className="mt-4 space-y-2">
              {DELEGATES.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm leading-snug text-slate-800">
                  <span className="mt-0.5 font-bold text-[#1d4ed8]" aria-hidden>
                    ·
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-base font-medium leading-relaxed text-slate-800">
          Les dossiers continuent d&apos;avancer sans retirer le conducteur du terrain et sans créer immédiatement un
          nouveau poste.
        </p>
      </div>
    </section>
  );
}
