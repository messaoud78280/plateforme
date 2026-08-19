import { HOME_SECTION } from "@/components/home/homeSectionStyles";

const SOFTWARES = [
  { name: "Onaya / Orisha", cat: "Gestion BTP", color: "#2563eb" },
  { name: "Sage", cat: "Comptabilité", color: "#4f46e5" },
  { name: "Agicap", cat: "Trésorerie", color: "#7c3aed" },
  { name: "Microsoft 365", cat: "Messagerie", color: "#0d9488" },
  { name: "Google Workspace", cat: "Collaboration", color: "#059669" },
  { name: "Drive / SharePoint", cat: "Documents", color: "#ea580c" },
  { name: "Planning logiciel", cat: "Planning", color: "#d97706" },
  { name: "Logiciel comptable", cat: "Finance", color: "#9333ea" },
] as const;

const FLOW_STEPS = [
  { n: "01", text: "Votre logiciel transmet une information à BeWork.", color: "#2563eb" },
  { n: "02", text: "BeWork récupère et centralise la donnée utile.", color: "#7c3aed" },
  { n: "03", text: "La plateforme met à jour les dossiers concernés.", color: "#ea580c" },
  { n: "04", text: "L'équipe concernée est notifiée automatiquement.", color: "#059669" },
] as const;

export function HomeConnectSoftware() {
  return (
    <section id="connexions" className={`${HOME_SECTION} bg-[#f8fafc]`} aria-labelledby="connect-heading">
      <div className="container-site">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7c3aed]">
            Connexions
          </p>
          <h2
            id="connect-heading"
            className="font-display mt-3 text-balance text-[1.75rem] font-extrabold leading-[1.12] tracking-[-0.03em] text-[#0a0a0a] sm:text-[2.25rem] md:text-[2.75rem]"
          >
            Vous avez déjà vos logiciels.
          </h2>
          <p className="font-display mt-1 text-balance text-[1.75rem] font-extrabold leading-[1.12] tracking-[-0.03em] text-[#7c3aed] sm:text-[2.25rem] md:text-[2.75rem]">
            BeWork peut les faire travailler ensemble.
          </p>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Notre objectif n&apos;est pas de tout remplacer.{" "}
            <strong className="font-semibold text-[#0a0a0a]">Nous étudions comment connecter ce que vous utilisez déjà.</strong>
          </p>
        </div>

        {/* Diagramme hub/spoke */}
        <div className="mx-auto mt-12 max-w-5xl sm:mt-14">
          <div className="grid gap-6 md:grid-cols-[1fr_auto_1fr] md:gap-0 md:items-stretch">

            {/* Colonne gauche — logiciels */}
            <div className="bework-sheen rounded-2xl border border-[#ddd6fe] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.06)] sm:p-6">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[#7c3aed]">
                Vos logiciels existants
              </p>
              <ul className="space-y-2">
                {SOFTWARES.map((s) => (
                  <li
                    key={s.name}
                    className="bework-sheen flex items-center justify-between gap-2 rounded-xl border border-slate-100 px-3 py-2.5 transition-shadow hover:shadow-[0_1px_4px_rgba(15,23,42,0.08)]"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: s.color }}
                        aria-hidden
                      />
                      <span className="text-xs font-semibold text-slate-800">{s.name}</span>
                    </div>
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{ background: `${s.color}12`, color: s.color }}
                    >
                      {s.cat}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Connecteur central SVG */}
            <div className="flex items-center justify-center py-4 md:px-8 md:py-0">
              <svg
                viewBox="0 0 60 120"
                aria-hidden
                className="hidden h-full w-16 md:block"
                preserveAspectRatio="none"
              >
                {/* Flèches de gauche vers centre, puis centre vers droite */}
                <defs>
                  <marker id="arrow-r" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L6,3 z" fill="#c4b5fd" />
                  </marker>
                  <marker id="arrow-l" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                    <path d="M6,0 L6,6 L0,3 z" fill="#bfdbfe" />
                  </marker>
                </defs>
                {/* Lignes pointillées */}
                <line x1="0" y1="60" x2="55" y2="60" stroke="#c4b5fd" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arrow-r)" />
                <line x1="60" y1="60" x2="5" y2="60" stroke="#bfdbfe" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arrow-l)" />
              </svg>
              {/* Séparateur mobile */}
              <div className="flex items-center gap-3 md:hidden">
                <div className="h-px w-12 border-t border-dashed border-slate-300" />
                <span className="text-xs font-semibold text-[#7c3aed]">↔</span>
                <div className="h-px w-12 border-t border-dashed border-slate-300" />
              </div>
            </div>

            {/* Colonne droite — BeWork + flow */}
            <div className="space-y-4">
              {/* Hub BeWork */}
              <div className="bework-sheen relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#eff6ff] to-[#f5f3ff] border border-[#c7d2fe] p-5 shadow-[0_2px_8px_rgba(15,23,42,0.06)] sm:p-6">
                <div
                  className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full opacity-30"
                  style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)", transform: "translate(40%, -40%)" }}
                  aria-hidden
                />
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#2563eb]">
                  Votre plateforme centrale
                </p>
                <p className="font-display mt-2 text-2xl font-extrabold tracking-tight text-[#0f1e3a]">BeWork</p>
                <div className="mt-3 space-y-1.5">
                  {[
                    "Données centralisées",
                    "Équipes informées en temps réel",
                    "Double saisie éliminée",
                    "Processus automatisés",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <svg aria-hidden className="h-3.5 w-3.5 shrink-0 text-[#059669]" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
                      </svg>
                      <span className="text-xs font-medium text-slate-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Flow numéroté */}
              <div className="bework-sheen rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_4px_rgba(15,23,42,0.05)] sm:p-6">
                <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Comment ça fonctionne
                </p>
                <ol className="space-y-3">
                  {FLOW_STEPS.map((step) => (
                    <li key={step.n} className="bework-sheen flex items-start gap-3">
                      <span
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-extrabold text-white"
                        style={{ backgroundColor: step.color }}
                        aria-hidden
                      >
                        {step.n}
                      </span>
                      <p className="text-xs leading-relaxed text-slate-600">{step.text}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>

          {/* Note responsable */}
          <p className="mt-6 text-center text-xs text-slate-400">
            Nous étudions les possibilités de connexion avec vos logiciels existants.{" "}
            <em>Toutes les intégrations ne sont pas systématiquement disponibles.</em>
          </p>
        </div>
      </div>
    </section>
  );
}
