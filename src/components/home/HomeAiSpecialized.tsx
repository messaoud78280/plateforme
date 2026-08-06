import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import { HOME_BG_MUTED, HOME_CONTENT, HOME_SECTION } from "@/components/home/homeSectionStyles";

const AI_ACTIONS = [
  "Analyser un CCTP",
  "Examiner un CCAP",
  "Résumer un dossier de consultation",
  "Comparer CCTP et DPGF",
  "Préparer un compte rendu",
  "Extraire les actions à réaliser",
  "Rechercher une information dans les documents",
  "Contrôler les pièces d’un DOE",
  "Identifier les échéances",
  "Produire une synthèse pour le dirigeant",
] as const;

/** Outils IA présentés comme actions métier. */
export function HomeAiSpecialized() {
  return (
    <section id="outils-ia" className={`${HOME_SECTION} ${HOME_BG_MUTED}`} aria-labelledby="ai-heading">
      <div className="container-site">
        <HomeSectionHeader
          id="ai-heading"
          eyebrow="Intelligence artificielle"
          title="Une intelligence artificielle conçue pour des usages métier"
          lead="L'IA analyse, structure, résume, contrôle et assiste les équipes. Les décisions et validations restent sous le contrôle des professionnels de l'entreprise."
        />

        <ul className={`${HOME_CONTENT} mx-auto grid max-w-4xl gap-3 sm:grid-cols-2`}>
          {AI_ACTIONS.map((label) => (
            <li
              key={label}
              className="flex items-center gap-3 rounded-xl border border-slate-200/90 bg-white px-4 py-3.5 text-sm font-semibold text-[#0f172a] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-[#1d4ed8]/25"
            >
              <span
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eff6ff] text-xs font-bold text-[#1d4ed8]"
                aria-hidden
              >
                IA
              </span>
              {label}
            </li>
          ))}
        </ul>

        <p className="mx-auto mt-10 max-w-2xl rounded-xl border border-amber-200/80 bg-amber-50/70 px-4 py-3 text-center text-sm leading-relaxed text-slate-800">
          Les résultats sont vérifiés et validés par vos équipes. BeWork n&apos;affirme pas la conformité d&apos;un
          dossier ni ne remplace l&apos;expertise d&apos;un professionnel.
        </p>
      </div>
    </section>
  );
}
