import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import { HOME_BG_SOFT, HOME_CONTENT, HOME_SECTION } from "@/components/home/homeSectionStyles";

const FLOW = [
  { phase: "Information", detail: "CCTP.pdf" },
  { phase: "Analyse", detail: "Délai & pièces" },
  { phase: "Compréhension", detail: "Obligation" },
  { phase: "Action", detail: "Attribution" },
] as const;

const FINDINGS = [
  { label: "Délai détecté", value: "Pénalités de retard — article 12" },
  { label: "Obligation particulière", value: "Interface lots étanchéité / couverture" },
  { label: "Document manquant", value: "2 notices DOE à demander" },
  { label: "Action proposée", value: "Créer une tâche · attribuer à Karim Benali" },
] as const;

/** IA intégrée au workflow — pas un chatbot. */
export function HomeAiSpecialized() {
  return (
    <section id="outils-ia" className={`${HOME_SECTION} ${HOME_BG_SOFT}`} aria-labelledby="ai-heading">
      <div className="container-site">
        <HomeSectionHeader
          id="ai-heading"
          title={
            <>
              Votre plateforme ne stocke plus seulement l&apos;information.
              <span className="mt-2 block text-slate-500">Elle la comprend.</span>
            </>
          }
          lead="L'IA lit, analyse et propose — intégrée à vos processus. Vos équipes valident."
        />

        <div className={`${HOME_CONTENT} mx-auto max-w-4xl`}>
          {/* Chaîne Information → Action */}
          <ol className="flex flex-wrap items-stretch justify-center gap-2 sm:gap-0" aria-label="Chaîne IA métier">
            {FLOW.map((step, i) => (
              <li key={step.phase} className="flex items-center gap-2 sm:gap-0">
                <div className="min-w-[7.5rem] rounded-xl border border-slate-200 bg-white px-3 py-3 text-center sm:min-w-[8.5rem] sm:px-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{step.phase}</p>
                  <p className="mt-1 text-sm font-semibold text-[#0a0a0a]">{step.detail}</p>
                </div>
                {i < FLOW.length - 1 ? (
                  <span className="hidden px-1.5 text-slate-300 sm:inline" aria-hidden>
                    →
                  </span>
                ) : null}
              </li>
            ))}
          </ol>

          {/* Démonstration workflow produit */}
          <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_48px_-32px_rgba(10,10,10,0.35)] sm:mt-12">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-[#fafafa] px-4 py-3 sm:px-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Dans le chantier</p>
                <p className="text-sm font-semibold text-[#0a0a0a]">Analyse documentaire · CCTP lot 02</p>
              </div>
              <p className="shrink-0 text-[11px] font-medium text-slate-500">À valider</p>
            </div>

            <ul className="divide-y divide-slate-100">
              {FINDINGS.map((f) => (
                <li key={f.label} className="flex flex-col gap-1 px-4 py-3.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6 sm:px-5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">{f.label}</span>
                  <span className="text-sm font-medium text-slate-800 sm:text-right">{f.value}</span>
                </li>
              ))}
            </ul>

            <div className="border-t border-slate-100 bg-[#fafafa] px-4 py-3.5 sm:flex sm:items-center sm:justify-between sm:px-5">
              <p className="text-xs leading-relaxed text-slate-500">
                Capacités disponibles ou configurables. Les analyses restent sous responsabilité humaine.
              </p>
              <p className="mt-2 text-xs font-semibold text-[#0a0a0a] sm:mt-0">Attribuer · Relancer · Archiver</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
