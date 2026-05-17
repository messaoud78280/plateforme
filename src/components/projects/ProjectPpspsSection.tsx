import Link from "next/link";
import { Download, FileText, Shield } from "lucide-react";
import { getPpspsModeLabel } from "@/lib/skills/ppsps-generation-modes";
import { listPpspsSessionsForProject } from "@/lib/skills/ppsps-session-service";
import { requireBeWorkSkillsSession } from "@/lib/be-work-skills-access";

type Props = {
  projectId: string;
  projectTitle: string;
};

export async function ProjectPpspsSection({ projectId, projectTitle }: Props) {
  const session = await requireBeWorkSkillsSession();

  let ppspsSessions: Awaited<ReturnType<typeof listPpspsSessionsForProject>> = [];
  try {
    ppspsSessions = await listPpspsSessionsForProject(projectId, session.user.id);
  } catch {
    /* migration peut manquer en dev */
  }

  const ppspsHref = `/dashboard/skills/ppsps?projectId=${encodeURIComponent(projectId)}`;

  return (
    <section className="rounded-xl border border-[#93c5fd]/40 bg-gradient-to-b from-[#eff6ff]/80 to-white p-6 shadow-sm ring-1 ring-[#2563eb]/10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Shield className="size-5 text-[#2563eb]" aria-hidden />
            PPSPS — Sécurité chantier
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Analyses des risques et modes opératoires liées à ce dossier projet.
          </p>
        </div>
        <Link
          href={ppspsHref}
          className="inline-flex items-center gap-2 rounded-xl bg-[#1e3a5f] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#152a45]"
        >
          <FileText className="size-4" aria-hidden />
          {ppspsSessions.length ? "Nouvelle analyse PPSPS" : "Créer une analyse PPSPS"}
        </Link>
      </div>

      {ppspsSessions.length > 0 ? (
        <ul className="mt-5 space-y-2">
          {ppspsSessions.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">
                  {s.siteName || projectTitle}
                  {s.generationMode !== "analyse_risques"
                    ? ` · ${getPpspsModeLabel(s.generationMode)}`
                    : ""}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(s.createdAt).toLocaleString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {s.taskCount ? ` · ${s.taskCount} tâche(s)` : ""}
                  {s.linkedDocumentId ? " · Enregistré au dossier" : ""}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-3">
                {s.hasResult ? (
                  <>
                    <a
                      href={`/api/skills/ppsps/export?sessionId=${encodeURIComponent(s.id)}&format=pdf`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-[#2563eb]"
                    >
                      <Download className="size-3.5" aria-hidden />
                      PDF
                    </a>
                    <a
                      href={`/api/skills/ppsps/export?sessionId=${encodeURIComponent(s.id)}&format=doc`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-[#2563eb]"
                    >
                      <Download className="size-3.5" aria-hidden />
                      Word
                    </a>
                  </>
                ) : null}
                <Link
                  href={`/dashboard/skills/ppsps?sessionId=${encodeURIComponent(s.id)}`}
                  className="text-sm font-semibold text-[#2563eb] hover:underline"
                >
                  Rouvrir
                </Link>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          Aucune analyse PPSPS liée à ce projet. Utilisez le bouton ci-dessus pour démarrer avec le nom du chantier
          prérempli.
        </p>
      )}
    </section>
  );
}
