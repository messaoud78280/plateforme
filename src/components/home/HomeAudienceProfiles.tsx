import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import {
  HOME_BG_SOFT,
  HOME_CARD,
  HOME_CONTENT,
  HOME_SECTION,
} from "@/components/home/homeSectionStyles";
import { AUDIENCE_PROFILES } from "@/lib/bework-formation";

/** Profils pour lesquels la formation est pertinente. */
export function HomeAudienceProfiles() {
  return (
    <section
      id="pour-qui"
      className={`${HOME_SECTION} ${HOME_BG_SOFT}`}
      aria-labelledby="audience-heading"
    >
      <div className="container-site">
        <HomeSectionHeader
          id="audience-heading"
          eyebrow="Pour qui"
          title="Vous avez probablement déjà une idée à construire."
          lead="Entrepreneurs, artisans, indépendants, équipes de TPE/PME ou simples curieux : si vous voulez construire plutôt que seulement discuter avec une IA, cette journée vous concerne."
        />

        <div
          className={`${HOME_CONTENT} mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3`}
        >
          {AUDIENCE_PROFILES.map((profile) => (
            <article key={profile.title} className={`${HOME_CARD} p-6 sm:p-7`}>
              <h3 className="font-display text-lg font-bold tracking-tight text-[#0a0a0a]">
                {profile.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{profile.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
