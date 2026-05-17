import Link from "next/link";
import { BEWORK_SKILLS } from "@/content/bework-skills";
import { requireBeWorkSkillsSession } from "@/lib/be-work-skills-access";

export default async function SkillsHubPage() {
  await requireBeWorkSkillsSession();

  return (
    <div className="space-y-8 px-1">
      <header className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1e3a5f]/80">Assistants métier BeWork</p>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Skills BeWork</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          Assistants métier pour le bureau-chantier : CCTP, PPSPS, et prochains outils de rédaction et de suivi.
        </p>
      </header>

      <section aria-labelledby="skills-cards-heading" className="space-y-4">
        <h2 id="skills-cards-heading" className="text-lg font-bold tracking-tight text-slate-900">
          Skills disponibles
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {BEWORK_SKILLS.map((skill) => (
            <article
              key={skill.slug}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-[#1e3a5f]/25 hover:shadow-md"
            >
              <div>
                <span className="inline-flex rounded-full bg-[#1e3a5f]/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#1e3a5f]">
                  {skill.badge}
                </span>
                <h3 className="mt-3 font-heading text-lg font-bold text-slate-900">{skill.title}</h3>
                <p className="mt-1 text-sm font-medium text-[#2563eb]">{skill.subtitle}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{skill.description}</p>
              </div>
              {skill.status === "available" ? (
                <Link
                  href={skill.href}
                  className="mt-6 inline-flex w-fit items-center rounded-xl bg-[#1e3a5f] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#152a45]"
                >
                  Ouvrir le skill
                </Link>
              ) : (
                <span className="mt-6 inline-flex w-fit rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-500">
                  Bientôt disponible
                </span>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
