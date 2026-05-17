import { SkillPpspsWorkspace } from "@/components/skills/SkillPpspsWorkspace";
import { getBeworkSkill } from "@/content/bework-skills";
import { requireBeWorkSkillsSession } from "@/lib/be-work-skills-access";
import { listPpspsSessionsForUser } from "@/lib/skills/ppsps-session-service";
import { notFound } from "next/navigation";

export default async function SkillPpspsPage() {
  const session = await requireBeWorkSkillsSession();
  const skill = getBeworkSkill("ppsps");
  if (!skill || skill.status !== "available") notFound();

  let initialSessions: Awaited<ReturnType<typeof listPpspsSessionsForUser>> = [];
  try {
    initialSessions = await listPpspsSessionsForUser(session.user.id);
  } catch {
    /* tables peut-être pas encore migrées */
  }

  return (
    <div className="space-y-6 px-1">
      <header className="max-w-3xl space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1e3a5f]/80">
          PPSPS — Analyse des risques · {skill.badge}
        </p>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{skill.title}</h1>
        <p className="text-base leading-relaxed text-slate-600">{skill.subtitle}</p>
        <p className="text-sm leading-relaxed text-slate-500">
          Sélectionnez les phases de travail concernées. Générez une analyse des risques ou un PPSPS complet, avec base
          OPPBTP consultable, lien vers un dossier projet client, export PDF/Word et historique — validation obligatoire
          avant utilisation sur chantier.
        </p>
      </header>

      <SkillPpspsWorkspace initialSessions={initialSessions} />
    </div>
  );
}
