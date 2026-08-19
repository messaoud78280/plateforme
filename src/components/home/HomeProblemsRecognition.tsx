import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import { HOME_CONTENT, HOME_SECTION } from "@/components/home/homeSectionStyles";

const PROBLEMS = [
  "Nous ressaisissons les mêmes informations plusieurs fois.",
  "Nos documents sont dispersés partout.",
  "Nos logiciels ne communiquent pas entre eux.",
  "Je veux savoir où en sont mes chantiers sans appeler tout le monde.",
  "Notre Excel est devenu indispensable à l'entreprise.",
  "Notre logiciel ne correspond pas vraiment à notre façon de travailler.",
] as const;

/** Section reconnaissance — problèmes concrets que BeWork résout. */
export function HomeProblemsRecognition() {
  return (
    <section
      id="problemes"
      className={`${HOME_SECTION} bg-[#fafafa]`}
      aria-labelledby="problems-heading"
    >
      <div className="container-site">
        <div className="mx-auto max-w-4xl">
          {/* Grille de problèmes */}
          <div className={`${HOME_CONTENT} grid gap-3 sm:grid-cols-2 lg:grid-cols-3`}>
            {PROBLEMS.map((problem) => (
              <div
                key={problem}
                className="rounded-2xl border border-slate-200/80 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)]"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-3" aria-hidden>
                  «
                </p>
                <p className="text-sm font-semibold leading-relaxed text-slate-800">
                  {problem}
                </p>
              </div>
            ))}
          </div>

          {/* Réponse BeWork */}
          <div className="mt-10 rounded-2xl border border-[#2563eb]/20 bg-gradient-to-br from-[#eff6ff] to-[#f5f3ff] px-7 py-8 text-center sm:mt-12 sm:px-10 sm:py-10">
            <HomeSectionHeader
              id="problems-heading"
              title="C'est exactement ce que BeWork cherche à résoudre."
              lead="Nous construisons la plateforme autour de votre façon de travailler — pas l'inverse."
            />
          </div>
        </div>
      </div>
    </section>
  );
}
