import Link from "next/link";
import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import {
  HOME_BG_SOFT,
  HOME_BTN_SECONDARY,
  HOME_CONTENT,
  HOME_SECTION,
} from "@/components/home/homeSectionStyles";
import { DEMO_PROJECTS } from "@/lib/bework-formation";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";

/** Grille des projets démontrables — ce que l’on peut créer. */
export function HomeCreateShowcase() {
  return (
    <section
      id="creer"
      className={`${HOME_SECTION} ${HOME_BG_SOFT}`}
      aria-labelledby="create-showcase-heading"
    >
      <div className="container-site">
        <HomeSectionHeader
          id="create-showcase-heading"
          eyebrow="Imaginez"
          title="Ce que vous pourriez créer"
          lead="Pas des exercices. De véritables outils utilisables dans une activité professionnelle — pour vous donner envie d’imaginer le vôtre."
        />

        <div
          className={`${HOME_CONTENT} mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4`}
        >
          {DEMO_PROJECTS.map((project) => (
            <Link
              key={project.slug}
              href={`/demonstrations/${project.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] sm:p-6"
              {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, `home-demo-${project.slug}`)}
            >
              <span
                className="absolute left-0 top-0 h-full w-1 rounded-l-2xl transition-all duration-200 group-hover:w-1.5"
                style={{ background: project.accent }}
                aria-hidden
              />
              <span
                className="inline-flex h-2 w-2 rounded-full"
                style={{
                  backgroundColor: project.accent,
                  boxShadow: `0 0 0 3px ${project.accent}18`,
                }}
                aria-hidden
              />
              <h3 className="font-display mt-3 text-base font-bold tracking-tight text-[#0a0a0a]">
                {project.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{project.description}</p>
              <span
                className="mt-4 inline-flex items-center gap-1 text-xs font-semibold transition-colors"
                style={{ color: project.accent }}
              >
                Voir la démo
                <span
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden
                >
                  →
                </span>
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-10 flex justify-center sm:mt-12">
          <Link
            href="/demonstrations"
            className={HOME_BTN_SECONDARY}
            {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-demos-all")}
          >
            Toutes les démonstrations
          </Link>
        </div>
      </div>
    </section>
  );
}
