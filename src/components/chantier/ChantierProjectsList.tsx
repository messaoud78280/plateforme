"use client";

import Link from "next/link";
import { DeleteChantierButton } from "@/components/chantier/DeleteChantierButton";
import { CHANTIER_STATUS_COLORS, CHANTIER_STATUS_LABELS } from "@/lib/chantier-dossier/constants";
import type { ChantierStatus } from "@prisma/client";

export type ChantierProjectListItem = {
  id: string;
  title: string;
  siteAddress: string | null;
  siteCity: string | null;
  internalManager: string | null;
  chantierStatus: ChantierStatus;
  updatedAt: string;
  chantierFilesCount: number;
  clientName?: string;
  canDelete: boolean;
};

export function ChantierProjectsList({ projects }: { projects: ChantierProjectListItem[] }) {
  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <article
          key={project.id}
          className="rounded-xl surface-metallic-light p-6 transition-shadow hover:shadow-md"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <Link href={`/dashboard/projets/${project.id}`} className="min-w-0 flex-1">
              <h2 className="font-semibold text-slate-800 hover:text-[#1d4ed8]">{project.title}</h2>
              {(project.siteAddress || project.siteCity) && (
                <p className="mt-1 text-sm text-slate-600">
                  {[project.siteAddress, project.siteCity].filter(Boolean).join(" · ")}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span>Modifié le {new Date(project.updatedAt).toLocaleDateString("fr-FR")}</span>
                <span>{project.chantierFilesCount} doc. dossier</span>
                {project.clientName ? <span>Client : {project.clientName}</span> : null}
                {project.internalManager ? <span>Resp. {project.internalManager}</span> : null}
              </div>
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${CHANTIER_STATUS_COLORS[project.chantierStatus]}`}
              >
                {CHANTIER_STATUS_LABELS[project.chantierStatus]}
              </span>
              {project.canDelete ? (
                <DeleteChantierButton projectId={project.id} projectTitle={project.title} />
              ) : null}
              <Link
                href={`/dashboard/projets/${project.id}`}
                className="rounded-md bg-[#1d4ed8] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#1e40af]"
              >
                Ouvrir →
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
