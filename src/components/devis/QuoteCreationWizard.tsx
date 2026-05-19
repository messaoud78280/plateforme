"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createQuoteDocumentWizard } from "@/app/dashboard/devis/quote-actions";
import { QuoteCreationPreview } from "@/components/devis/QuoteCreationPreview";
import { QUOTE_DOCUMENT_TYPE_LABELS } from "@/lib/be-work-devis-quote-labels";
import type { QuoteDocumentType } from "@prisma/client";

type ProjectOption = { id: string; clientName: string; projectName: string };

type Props = {
  projects: ProjectOption[];
};

function formatLongDate(d: Date): string {
  const raw = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function QuoteCreationWizard({ projects }: Props) {
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10));

  const selectedProject = projects.find((p) => p.id === projectId);
  const clientLabel = selectedProject ? `${selectedProject.clientName} — ${selectedProject.projectName}` : "";

  const issueDateLabel = useMemo(() => {
    const d = issueDate ? new Date(issueDate) : new Date();
    return Number.isNaN(d.getTime()) ? formatLongDate(new Date()) : formatLongDate(d);
  }, [issueDate]);

  const docNumberPreview = useMemo(() => {
    const y = new Date().getFullYear();
    return `${y}-… (attribué à la création)`;
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-1">
      <header className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1e3a5f]/80">Assistant</p>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">Créer un devis</h1>
        <p className="text-sm leading-relaxed text-slate-600">
          Modèle commercial : titre et client en tête, tableau des lignes, totaux et conditions de paiement. Les
          coordonnées de votre société ne figurent pas sur le document (à personnaliser plus tard si besoin).
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,400px)]">
        <div className="space-y-6">
          <ol className="space-y-4 text-sm">
            <li className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wide text-[#1e3a5f]">Étape 1</span>
              <h2 className="mt-1 font-heading text-base font-bold text-slate-900">Projet client</h2>
              <p className="mt-1 text-slate-600">
                <Link href="/dashboard/devis/projets/nouveau" className="font-semibold text-[#1e3a5f] underline-offset-2 hover:underline">
                  Créer un projet
                </Link>{" "}
                ou sélectionnez ci-dessous.
              </p>
            </li>
            <li className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wide text-[#1e3a5f]">Étape 2</span>
              <h2 className="mt-1 font-heading text-base font-bold text-slate-900">Type & titre</h2>
              <p className="mt-1 text-slate-600">Titre affiché en haut à droite du PDF.</p>
            </li>
            <li className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wide text-[#1e3a5f]">Étape 3</span>
              <h2 className="mt-1 font-heading text-base font-bold text-slate-900">Création</h2>
              <p className="mt-1 text-slate-600">Brouillon avec mise en page type ERP, sans bloc société à gauche.</p>
            </li>
          </ol>

          <form action={createQuoteDocumentWizard} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <label htmlFor="projectId" className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                Projet
              </label>
              <select
                id="projectId"
                name="projectId"
                required
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              >
                <option value="" disabled>
                  — Choisir un projet —
                </option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.clientName} — {p.projectName}
                  </option>
                ))}
              </select>
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
          />
        </aside>
      </div>
    </div>
  );
}
