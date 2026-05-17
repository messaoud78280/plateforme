"use client";

import { FolderKanban, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { PpspsProjectOption } from "@/lib/skills/ppsps-projects";

type Props = {
  projectId: string | null;
  onChange: (projectId: string | null) => void;
  onPrefill?: (project: PpspsProjectOption) => void;
};

export function SkillPpspsProjectPicker({ projectId, onChange, onPrefill }: Props) {
  const [projects, setProjects] = useState<PpspsProjectOption[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/skills/ppsps/projects");
      if (!res.ok) return;
      const data = (await res.json()) as { projects: PpspsProjectOption[] };
      setProjects(data.projects ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = projects.find((p) => p.id === projectId);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="flex items-center gap-2 font-heading text-base font-bold text-slate-900">
        <FolderKanban className="size-4 text-[#2563eb]" aria-hidden />
        Dossier chantier (projet)
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Liez l&apos;analyse à un projet client pour l&apos;enregistrer dans son dossier documents.
      </p>
      {loading ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="size-4 animate-spin" /> Chargement des projets…
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          <select
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-[#2563eb]/50 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/15"
            value={projectId ?? ""}
            onChange={(e) => {
              const id = e.target.value || null;
              onChange(id);
              const p = projects.find((x) => x.id === id);
              if (p && onPrefill) onPrefill(p);
            }}
          >
            <option value="">— Aucun projet lié —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
                {p.clientName ? ` (${p.clientName})` : ""}
              </option>
            ))}
          </select>
          {selected?.siteHint ? (
            <p className="text-xs text-slate-500">{selected.siteHint}</p>
          ) : null}
        </div>
      )}
    </section>
  );
}
