"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import type { PrepStudyListItem } from "@/lib/preparation/service";
import { DOSSIER_STATUS_LABELS } from "@/lib/preparation/types";
import { Chip } from "./prep-ui";
import { PrepImportModal, type PrepProjectOption } from "./PrepImportModal";
import { PrepNewProjectModal, type PrepCreatedProject } from "./PrepNewProjectModal";

export function PrepStudiesHub({
  studies,
  projects: initialProjects,
  projectId,
}: {
  studies: PrepStudyListItem[];
  projects: PrepProjectOption[];
  projectId: string | null;
}) {
  const router = useRouter();
  const [importOpen, setImportOpen] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [projects, setProjects] = useState(initialProjects);

  const byProject = new Map<string, { title: string; items: PrepStudyListItem[] }>();
  for (const s of studies) {
    const g = byProject.get(s.project.id) ?? { title: s.project.title, items: [] };
    g.items.push(s);
    byProject.set(s.project.id, g);
  }

  function onProjectCreated(created: PrepCreatedProject) {
    setProjects((list) => [created, ...list.filter((p) => p.id !== created.id)]);
    setNewProjectOpen(false);
    router.push(`/dashboard/visites-metres/etudes?projectId=${encodeURIComponent(created.id)}`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow={
          <Link href="/dashboard/visites-metres" className="hover:underline">
            Visites & métrés
          </Link>
        }
        title="Études de métré"
        description="Quantités paramétrées, hypothèses traçables, recalcul automatique — par projet."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setNewProjectOpen(true)}
              className="rounded-full border border-[#1e3a5f]/20 bg-white px-4 py-2 text-[13px] font-medium text-[#1e3a5f] hover:bg-slate-50"
            >
              + Nouveau projet
            </button>
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="rounded-full bg-[#1e3a5f] px-4 py-2 text-[13px] font-medium text-white"
            >
              + Importer un JSON
            </button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#1e3a5f]/10 bg-white px-4 py-3">
        <label className="text-[13px] text-slate-600" htmlFor="prep-project-filter">
          Projet
        </label>
        <select
          id="prep-project-filter"
          value={projectId ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            router.push(
              v
                ? `/dashboard/visites-metres/etudes?projectId=${encodeURIComponent(v)}`
                : "/dashboard/visites-metres/etudes",
            );
          }}
          className="min-w-[16rem] rounded-xl border border-slate-200 px-3 py-1.5 text-[13px]"
        >
          <option value="">Tous les projets</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setNewProjectOpen(true)}
          className="rounded-full border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-[#1e3a5f] hover:bg-slate-50"
        >
          + Nouveau projet
        </button>
        <span className="text-[12px] text-slate-500">{studies.length} étude(s)</span>
      </div>

      {studies.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
          <p className="text-[15px] font-semibold text-[#1e3a5f]">
            Aucune étude de métré {projectId ? "pour ce projet" : ""}
          </p>
          <p className="mx-auto mt-1 max-w-lg text-[13px] text-slate-500">
            Créez un projet si besoin, puis importez le JSON préparé avec ChatGPT. BeWork vérifie les formules,
            identifie les hypothèses et recalcule toutes les quantités quand une dimension change.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setNewProjectOpen(true)}
              className="rounded-full border border-[#1e3a5f]/20 bg-white px-4 py-2 text-[13px] font-medium text-[#1e3a5f]"
            >
              + Nouveau projet
            </button>
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="rounded-full bg-[#1e3a5f] px-4 py-2 text-[13px] font-medium text-white"
            >
              Importer un premier JSON
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {[...byProject.entries()].map(([pid, g]) => (
            <section key={pid} className="rounded-2xl border border-[#1e3a5f]/10 bg-white">
              <header className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
                <p className="text-[14px] font-semibold text-[#1e3a5f]">{g.title}</p>
                <Link href={`/dashboard/projets/${pid}`} className="text-[12px] text-slate-500 hover:underline">
                  Ouvrir le projet
                </Link>
              </header>
              <ul className="divide-y divide-slate-100">
                {g.items.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/dashboard/visites-metres/etudes/${s.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-medium text-slate-900">{s.title}</p>
                        <p className="text-[12px] text-slate-500">
                          {s.trade ? `${s.trade} · ` : ""}
                          {s.lineCount} ligne(s) · {s.parameterCount} paramètre(s) · modifiée le{" "}
                          {new Date(s.updatedAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <Chip
                        className={
                          s.mode === "DEMONSTRATION"
                            ? "bg-amber-50 text-amber-800 ring-amber-200"
                            : s.dossierStatus === "PRO_VALIDE"
                              ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                              : "bg-slate-50 text-slate-700 ring-slate-200"
                        }
                      >
                        {DOSSIER_STATUS_LABELS[s.dossierStatus]}
                      </Chip>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {importOpen ? (
        <PrepImportModal
          projects={projects}
          defaultProjectId={projectId}
          onClose={() => setImportOpen(false)}
          onImported={(id) => router.push(`/dashboard/visites-metres/etudes/${id}`)}
        />
      ) : null}

      {newProjectOpen ? (
        <PrepNewProjectModal onClose={() => setNewProjectOpen(false)} onCreated={onProjectCreated} />
      ) : null}
    </div>
  );
}
