import {
  BW_EYEBROW,
  BW_SECTION,
} from "@/components/home/homeSectionStyles";
import { BwAtmosphere } from "@/components/home/BwAtmosphere";

const SKILLS = [
  "Transformer une idée en projet structuré",
  "Formuler correctement un besoin",
  "Lancer une première création",
  "Demander des modifications",
  "Tester et corriger",
  "Améliorer progressivement",
  "Comprendre les grandes logiques d’un outil numérique",
  "Continuer son projet après la journée",
] as const;

/** Acquis réalistes — pas de promesse « devenir développeur ». */
export function HomeSkillsAfter() {
  return (
    <section
      id="acquis"
      className={BW_SECTION}
      aria-labelledby="acquis-heading"
    >
      <BwAtmosphere variant="formation" />
      <div className="container-site relative z-[1]">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:items-end">
          <div>
            <p className={BW_EYEBROW}>Ce que vous saurez faire</p>
            <h2
              id="acquis-heading"
              className="mt-4 font-display text-[1.9rem] font-extrabold leading-[1.05] tracking-[-0.04em] text-[#0a0a0a] sm:text-[2.6rem] md:text-[3.1rem]"
            >
              Vous ne repartirez pas
              <br />
              <span className="text-slate-400">développeur.</span>
              <br />
              <span className="mt-2 block text-[#2563eb]">
                Vous repartirez capable de commencer.
              </span>
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-slate-500 sm:text-base">
              Une journée ne transforme personne en expert technique. Elle peut
              vous donner une méthode claire pour avancer.
            </p>
          </div>

          <ul className="grid gap-2.5 sm:grid-cols-2">
            {SKILLS.map((s) => (
              <li
                key={s}
                className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3.5 text-sm font-semibold text-slate-800 shadow-[0_4px_14px_rgba(15,23,42,0.03)]"
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#059669]"
                  aria-hidden
                />
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
