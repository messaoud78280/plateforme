/**
 * Aperçu produit premium — fenêtre navigateur, données BTP fictives réalistes.
 * Illustratif, aligné sur les modules réellement présents dans la plateforme.
 */
export function HomeProductPreview({ large = false }: { large?: boolean }) {
  return (
    <div
      className={`w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_32px_64px_-36px_rgba(10,10,10,0.45)] ring-1 ring-black/[0.04] ${
        large ? "sm:rounded-[1.25rem]" : ""
      }`}
    >
      {/* Chrome navigateur */}
      <div className="flex items-center gap-2 border-b border-slate-100 bg-[#f5f5f5] px-3 py-2.5 sm:px-4">
        <div className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-[#d4d4d4]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#d4d4d4]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#d4d4d4]" />
        </div>
        <div className="ml-2 min-w-0 flex-1 truncate rounded-md bg-white px-3 py-1 text-center text-[11px] font-medium text-slate-500 ring-1 ring-slate-200/80">
          app.bework.fr · Résidence Horizon
        </div>
      </div>

      <div className="grid sm:grid-cols-[11rem_1fr]">
        {/* Sidebar */}
        <aside className="hidden border-r border-slate-100 bg-[#fafafa] p-3 sm:block">
          <p className="px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">BeWork</p>
          <ul className="mt-3 space-y-0.5 text-[12px] font-medium text-slate-600">
            {["Accueil", "Chantiers", "Messages", "Documents", "Planning", "À traiter"].map((item, i) => (
              <li
                key={item}
                className={`rounded-lg px-2.5 py-1.5 ${
                  i === 1 ? "bg-[#0a0a0a] font-semibold text-white" : "hover:bg-white"
                }`}
              >
                {item}
              </li>
            ))}
          </ul>
        </aside>

        {/* Main */}
        <div className="p-3.5 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Chantier</p>
              <h3 className="mt-1 font-display text-base font-extrabold tracking-tight text-[#0a0a0a] sm:text-lg">
                Résidence Horizon
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">Réhabilitation · Lot étanchéité</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-800">
              En cours
            </span>
          </div>

          <dl className="mt-4 grid grid-cols-3 gap-2">
            {[
              { label: "À faire", value: "7" },
              { label: "À surveiller", value: "2" },
              { label: "À décider", value: "1" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-slate-100 bg-[#fafafa] px-2.5 py-2.5 text-center">
                <dt className="text-[10px] font-medium text-slate-500">{s.label}</dt>
                <dd className="mt-0.5 font-display text-lg font-extrabold text-[#0a0a0a]">{s.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-100 p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Documents</p>
              <ul className="mt-2 space-y-2">
                {[
                  { name: "CCTP lot 02 — v3.pdf", tag: "Analysé" },
                  { name: "Plan EXE toiture", tag: "À transmettre" },
                  { name: "DOE — notices", tag: "Manquant" },
                ].map((d) => (
                  <li key={d.name} className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate font-medium text-slate-800">{d.name}</span>
                    <span className="shrink-0 text-[10px] font-semibold text-slate-500">{d.tag}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-slate-100 bg-[#fafafa] p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Assistant intégré</p>
              <p className="mt-2 text-xs font-semibold text-[#0a0a0a]">Analyse CCTP</p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                Délai pénalités relevé · 2 pièces DOE manquantes · action proposée à Karim Benali.
              </p>
              <p className="mt-2 text-[10px] font-medium text-slate-500">À valider par vos équipes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
