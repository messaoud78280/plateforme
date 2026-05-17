import { SkillPpspsWorkspace } from "@/components/skills/SkillPpspsWorkspace";
import { getBeworkSkill } from "@/content/bework-skills";
import { requireBeWorkSkillsSession } from "@/lib/be-work-skills-access";
import { buildPpspsFormFromProject } from "@/lib/skills/ppsps-project-prefill";
import { getPpspsProjectForPrefill } from "@/lib/skills/ppsps-projects";
import { listPpspsSessionsForUser } from "@/lib/skills/ppsps-session-service";
import type { PpspsFormInput } from "@/lib/skills/ppsps-types";
import { notFound } from "next/navigation";

type PageProps = {
  searchParams: Promise<{ projectId?: string; sessionId?: string }>;
};

export default async function SkillPpspsPage({ searchParams }: PageProps) {
  const session = await requireBeWorkSkillsSession();
  const skill = getBeworkSkill("ppsps");
  if (!skill || skill.status !== "available") notFound();

  const params = await searchParams;
  const initialSessionId = params.sessionId?.trim() || undefined;
  const projectIdParam = params.projectId?.trim() || undefined;

  let initialSessions: Awaited<ReturnType<typeof listPpspsSessionsForUser>> = [];
  try {
    initialSessions = await listPpspsSessionsForUser(session.user.id);
  } catch {
    /* tables peut-être pas encore migrées */
  }

  let initialProjectPrefill: Partial<PpspsFormInput> | undefined;
  let initialFilterProjectTitle: string | undefined;
  if (projectIdParam) {
    const project = await getPpspsProjectForPrefill(session.user.id, session.user.role, projectIdParam);
    if (project) {
      initialProjectPrefill = buildPpspsFormFromProject(project);
      initialFilterProjectTitle = project.title;
    }
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
          Cinq modes (analyse, PPSPS complet, audit, enrichissement, coordination), profil chantier, références
          prévention, base OPPBTP, lien dossier projet, duplication de session et export PDF/Word — validation obligatoire
          avant utilisation sur chantier.
        </p>
      </header>

      <SkillPpspsWorkspace
        initialSessions={initialSessions}
        initialSessionId={initialSessionId}
        initialProjectPrefill={initialProjectPrefill}
        initialFilterProjectId={projectIdParam}
        initialFilterProjectTitle={initialFilterProjectTitle}
      />
    </div>
  );
}
