"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createQuoteDocumentWizard, type QuoteProjectSelectOption } from "@/app/dashboard/devis/quote-actions";
import { QuoteClientCoordinatesModal } from "@/components/devis/QuoteClientCoordinatesModal";
import { QuoteCreationPreview } from "@/components/devis/QuoteCreationPreview";
import { QUOTE_DOCUMENT_TYPE_LABELS } from "@/lib/be-work-devis-quote-labels";
import type { QuoteDocumentType } from "@prisma/client";

type Props = {
  projects: QuoteProjectSelectOption[];
};

function formatLongDate(d: Date): string {
  const raw = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function QuoteCreationWizard({ projects: initialProjects }: Props) {
  const [projects, setProjects] = useState(initialProjects);
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [editProjectId, setEditProjectId] = useState<string | null>(null);

  const selectedProject = projects.find((p) => p.id === projectId);
  const clientLabel = selectedProject ? `${selectedProject.clientName} — ${selectedProject.projectName}` : "";

  const issueDateLabel = useMemo(() => {
    const d = issueDate ? new Date(issueDate) : new Date();
    return Number.isNaN(d.getTime()) ? formatLongDate(new Date()) : formatLongDate(d);
  }, [issueDate]);

  const docNumberPreview = useMemo(() => {
    const y = new Date().getFullYear();
    return `${y}-…`;
  }, []);

  const handleClientApplied = (project: QuoteProjectSelectOption) => {
    setProjects((prev) => {
      const i = prev.findIndex((p) => p.id === project.id);
      if (i >= 0) {
        const next = [...prev];
        next[i] = project;
        return next;
      }
      return [project, ...prev];
    });
    setProjectId(project.id);
  };

  return (
    <>
      <QuoteClientCoordinatesModal
        open={clientModalOpen}
        onClose={() => {
          setClientModalOpen(false);
          setEditProjectId(null);
        }}
        project={null}
        editProjectId={editProjectId}
        onApplied={handleClientApplied}
      />

      <div className="mx-auto max-w-6xl space-y-6 px-1">
        <header className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1e3a5f]/80">Assistant</p>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">Créer un devis</h1>
          <p className="text-sm leading-relaxed text-slate-600">
            Cliquez sur la zone client dans l&apos;aperçu ou le bouton ci-dessous pour saisir les coordonnées (pro /
            particulier), puis créez le brouillon.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,400px)]">
          <div className="space-y-6">
            <form action={createQuoteDocumentWizard} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="projectId" className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Projet client
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setEditProjectId(null);
                      setClientModalOpen(true);
                    }}
                    className="text-xs font-semibold text-[#2563eb] hover:underline"
                  >
                    + Nouveau client
                  </button>
                </div>
                <select
                  id="projectId"
                  name="projectId"
                  required
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                >
                  <option value="" disabled>
                    — Choisir ou créer un client —
                  </option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.clientName} — {p.projectName}
                    </option>
                  ))}
                </select>
                {selectedProject ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditProjectId(projectId);
                      setClientModalOpen(true);
                    }}
                    className="mt-2 text-xs text-[#1e3a5f] hover:underline"
                  >
                    Modifier les coordonnées client
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditProjectId(null);
                      setClientModalOpen(true);
                    }}
                    className="mt-3 w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:border-[#1e3a5f]/40 hover:bg-amber-50/40"
                  >
                    Cliquez ici pour ajouter un client
                  </button>
                )}
              </div>
              <div>
                <label htmlFor="documentType" className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Type de document
                </label>
                <select id="documentType" name="documentType" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" defaultValue="devis_estimatif">
                  {(Object.keys(QUOTE_DOCUMENT_TYPE_LABELS) as QuoteDocumentType[]).map((k) => (
                    <option key={k} value={k}>
                      {QUOTE_DOCUMENT_TYPE_LABELS[k]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="title" className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Titre du document
                </label>
                <input
                  id="title"
                  name="title"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex. Rénovation complète — Lot menuiseries"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="issueDate" className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Date d&apos;émission
                  </label>
                  <input
                    id="issueDate"
                    name="issueDate"
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="validityDate" className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Date de validité (optionnel)
                  </label>
                  <input id="validityDate" name="validityDate" type="date" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
                </div>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <button type="submit" className="rounded-xl bg-[#1e3a5f] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#152a45]">
                  Créer le document
                </button>
                <Link href="/dashboard/devis/projets" className="inline-flex items-center rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Gérer les projets
                </Link>
              </div>
            </form>
          </div>

          <aside className="hidden lg:block">
            <QuoteCreationPreview
              title={title}
              clientLabel={clientLabel}
              documentNumberPreview={docNumberPreview}
              issueDateLabel={issueDateLabel}
              onAddClient={() => {
                setEditProjectId(projectId || null);
                setClientModalOpen(true);
              }}
            />
          </aside>
        </div>
      </div>
    </>
  );
}
