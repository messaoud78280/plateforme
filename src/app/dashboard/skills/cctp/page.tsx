import { SkillCctpWorkspace } from "@/components/skills/SkillCctpWorkspace";
import { getBeworkSkill } from "@/content/bework-skills";
import { requireBeWorkSkillsSession } from "@/lib/be-work-skills-access";
import { listCctpSessionsForUser } from "@/lib/skills/cctp-session-service";
import { notFound } from "next/navigation";

export default async function SkillCctpPage() {
  const session = await requireBeWorkSkillsSession();
  const skill = getBeworkSkill("cctp");
  if (!skill || skill.status !== "available") notFound();

  let initialSessions: Awaited<ReturnType<typeof listCctpSessionsForUser>> = [];
  try {
    initialSessions = await listCctpSessionsForUser(session.user.id);
  } catch {
    /* tables peut-être pas encore migrées */
  }

  return (
    <div className="space-y-6 px-1">
      <header className="max-w-3xl space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1e3a5f]/80">Skill · {skill.badge}</p>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{skill.title}</h1>
        <p className="text-base leading-relaxed text-slate-600">{skill.subtitle}</p>
        <p className="text-sm text-slate-500">
          Importez un CCTP existant, sélectionnez des familles DTU, générez puis exportez en PDF ou Word. Historique
          conservé sur votre compte.
        </p>
      </header>

      <SkillCctpWorkspace initialSessions={initialSessions} />
    </div>
  );
}
