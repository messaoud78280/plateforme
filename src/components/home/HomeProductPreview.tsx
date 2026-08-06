/**
 * Aperçu produit réaliste pour le hero — structure fidèle aux usages plateforme
 * (chantier, documents, synthèse IA, tâches). Illustratif, sans inventer de modules.
 */
export function HomeProductPreview() {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_24px_48px_-28px_rgba(15,23,42,0.35)] ring-1 ring-slate-100">
      {/* Barre app */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-[#f8fafc] px-3.5 py-2.5 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#1d4ed8] text-[10px] font-bold text-white">
            BW
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-[#0f172a] sm:text-sm">Résidence Les Tilleuls</p>
            <p className="truncate text-[10px] text-slate-500 sm:text-xs">Chantier · Lot gros œuvre</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="hidden rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-600 sm:inline">
            Documents
          </span>
          <span className="rounded-md bg-[#1d4ed8] px-2 py-1 text-[10px] font-semibold text-white">Synthèse</span>
        </div>
      </div>

      <div className="grid gap-0 sm:grid-cols-[1.1fr_0.9fr]">
        {/* Colonne principale */}
        <div className="border-b border-slate-100 p-3.5 sm:border-b-0 sm:border-r sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">Vue chantier</p>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              En cours
            </span>
          </div>

          <dl className="mt-3 grid grid-cols-3 gap-2">
            {[
              { label: "Docs", value: "24" },
              { label: "À valider", value: "3" },
              { label: "Tâches", value: "7" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-slate-100 bg-[#f8fafc] px-2 py-2 text-center">
                <dt className="text-[10px] font-medium text-slate-500">{s.label}</dt>
                <dd className="mt-0.5 text-sm font-bold text-[#0f172a]">{s.value}</dd>
              </div>
            ))}
          </dl>

          <ul className="mt-3 space-y-2">
            {[
              { name: "CCTP lot 02 — v3.pdf", tag: "Analysé", tone: "blue" },
              { name: "CR réunion 12/07.docx", tag: "À valider", tone: "amber" },
              { name: "DOE — notices manquantes", tag: "Bloquant", tone: "rose" },
            ].map((doc) => (
              <li
                key={doc.name}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-white px-2.5 py-2"
              >
                <span className="min-w-0 truncate text-xs font-medium text-slate-800">{doc.name}</span>
                <span
                  className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                    doc.tone === "blue"
                      ? "bg-[#eff6ff] text-[#1d4ed8]"
                      : doc.tone === "amber"
                        ? "bg-amber-50 text-amber-800"
                        : "bg-rose-50 text-rose-700"
                  }`}
                >
                  {doc.tag}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Colonne IA / tâches */}
        <div className="bg-[#f8fafc]/80 p-3.5 sm:p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">Assistant IA</p>
          <div className="mt-3 rounded-xl border border-[#1d4ed8]/20 bg-white p-3 shadow-sm">
            <p className="text-[11px] font-semibold text-[#1d4ed8]">Synthèse CCTP</p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
              4 points à vérifier avant chiffrage : interfaces lots, accès chantier, délais pénalités, pièces DOE.
            </p>
            <p className="mt-2 text-[10px] font-medium text-slate-500">À valider par vos équipes</p>
          </div>

          <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">Tâches</p>
          <ul className="mt-2 space-y-1.5">
            {[
              { label: "Relancer notices CVC", who: "Conducteur" },
              { label: "Valider CR client", who: "Direction" },
              { label: "Classer plans réseaux", who: "Admin" },
            ].map((t) => (
              <li key={t.label} className="flex items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-2 ring-1 ring-slate-100">
                <span className="text-xs font-medium text-slate-800">{t.label}</span>
                <span className="shrink-0 text-[10px] text-slate-500">{t.who}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 bg-white px-3.5 py-2 sm:px-4">
        <p className="text-[10px] text-slate-500">Espace entreprise · modules selon configuration</p>
        <p className="text-[10px] font-medium text-[#1d4ed8]">Accès par rôles</p>
      </div>
    </div>
  );
}
