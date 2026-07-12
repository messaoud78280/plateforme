"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DocumentPreviewModal, type DocumentPreviewItem } from "@/components/documents/DocumentPreviewModal";
import { GedDropzone } from "@/components/pilotage/GedDropzone";
import {
  classifyChantierFile,
  softDeleteChantierFile,
  toggleChantierFileFavorite,
} from "@/app/dashboard/pilotage-travaux/ged-actions";
import { CHANTIER_FILE_STATUS_LABELS } from "@/lib/chantier-dossier/constants";
import { GED_CATEGORIES } from "@/lib/ged/formats";
import { PILOTAGE_LIST_PATH } from "@/lib/pilotage/constants";
import { StatusBadge } from "./PilotageBadges";

export type GedFileRow = {
  id: string;
  name: string;
  fileUrl: string | null;
  mimeType: string | null;
  fileSize: number | null;
  status: string;
  category: string | null;
  documentType: string | null;
  indice: string | null;
  versionLabel: string | null;
  isCurrentVersion: boolean;
  classificationStatus: string;
  previewStatus: string | null;
  visibility: string;
  createdAt: string;
  folder: { id: string; code: string; label: string };
  isFavorite?: boolean;
};

type ViewMode = "liste" | "cartes" | "a-classer" | "en-vigueur" | "corbeille";

function formatBytes(n: number | null) {
  if (!n) return "—";
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} Ko`;
  return `${(n / (1024 * 1024)).toFixed(1)} Mo`;
}

export function PilotageGedPanel({
  pilotageId,
  projectId,
  canEdit,
  folders,
  files,
  trashFiles = [],
}: {
  pilotageId: string;
  projectId: string;
  canEdit: boolean;
  folders: { id: string; code: string; label: string }[];
  files: GedFileRow[];
  trashFiles?: GedFileRow[];
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [view, setView] = useState<ViewMode>("liste");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [preview, setPreview] = useState<DocumentPreviewItem | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const source = view === "corbeille" ? trashFiles : files;
    return source.filter((f) => {
      if (view === "a-classer" && f.classificationStatus !== "A_CLASSER") return false;
      if (view === "en-vigueur" && !f.isCurrentVersion) return false;
      if (categoryFilter && f.category !== categoryFilter) return false;
      if (!q.trim()) return true;
      const hay = `${f.name} ${f.category ?? ""} ${f.documentType ?? ""} ${f.indice ?? ""} ${f.folder.label}`.toLowerCase();
      return hay.includes(q.trim().toLowerCase());
    });
  }, [files, trashFiles, view, categoryFilter, q]);

  const toClassify = files.filter((f) => f.classificationStatus === "A_CLASSER").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-[#1e3a5f]">GED chantier</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Déposer · consulter · versionner · lier au pilotage. Original jamais modifié.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["liste", "Liste"],
              ["cartes", "Cartes"],
              ["a-classer", `À classer${toClassify ? ` (${toClassify})` : ""}`],
              ["en-vigueur", "En vigueur"],
              ["corbeille", "Corbeille"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                view === id ? "bg-[#1e3a5f] text-white" : "border border-slate-200 text-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {view !== "corbeille" ? (
        <GedDropzone
          projectId={projectId}
          pilotageId={pilotageId}
          canEdit={canEdit}
          folders={folders}
        />
      ) : null}

      <div className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un document, un indice, une catégorie…"
          className="min-w-[220px] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">Toutes catégories</option>
          {GED_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
          Aucun document dans cette vue. Déposez une pièce pour démarrer.
        </p>
      ) : view === "cartes" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((f) => (
            <article key={f.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="truncate text-sm font-bold text-slate-900">{f.name}</p>
              <p className="mt-1 text-[11px] text-slate-500">
                {f.folder.label} · {f.category ?? "Sans catégorie"} · v{f.versionLabel ?? "1"}
                {f.indice ? ` · Indice ${f.indice}` : ""}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                <StatusBadge status={CHANTIER_FILE_STATUS_LABELS[f.status as keyof typeof CHANTIER_FILE_STATUS_LABELS] ?? f.status} />
                {!f.isCurrentVersion ? <StatusBadge status="Obsolète" /> : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="text-xs font-semibold text-[#1e3a5f] hover:underline"
                  onClick={() =>
                    setPreview({
                      name: f.name,
                      url: f.fileUrl,
                      mimeType: f.mimeType,
                      chantierFileId: f.id,
                      statusLabel: f.previewStatus ?? undefined,
                    })
                  }
                >
                  Ouvrir
                </button>
                <Link
                  href={`${PILOTAGE_LIST_PATH}/${pilotageId}/documents/${f.id}`}
                  className="text-xs font-semibold text-slate-600 hover:underline"
                >
                  Fiche
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-3 py-2">Document</th>
                <th className="px-3 py-2">Catégorie</th>
                <th className="px-3 py-2">Indice</th>
                <th className="px-3 py-2">Statut</th>
                <th className="px-3 py-2">Taille</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr key={f.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">
                    <p className="font-semibold text-slate-900">{f.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {f.folder.label}
                      {!f.isCurrentVersion ? " · Version obsolète" : ""}
                      {f.previewStatus ? ` · ${f.previewStatus}` : ""}
                    </p>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600">{f.category ?? "—"}</td>
                  <td className="px-3 py-2 text-xs">{f.indice ?? "—"}</td>
                  <td className="px-3 py-2">
                    <StatusBadge
                      status={
                        CHANTIER_FILE_STATUS_LABELS[f.status as keyof typeof CHANTIER_FILE_STATUS_LABELS] ??
                        f.status
                      }
                    />
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500">{formatBytes(f.fileSize)}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="text-xs font-semibold text-[#1e3a5f] hover:underline"
                        onClick={() =>
                          setPreview({
                            name: f.name,
                            url: f.fileUrl,
                            mimeType: f.mimeType,
                            chantierFileId: f.id,
                          })
                        }
                      >
                        Aperçu
                      </button>
                      <Link
                        href={`${PILOTAGE_LIST_PATH}/${pilotageId}/documents/${f.id}`}
                        className="text-xs font-semibold text-slate-600 hover:underline"
                      >
                        Ouvrir
                      </Link>
                      {canEdit && view === "a-classer" ? (
                        <button
                          type="button"
                          disabled={pending}
                          className="text-xs font-semibold text-emerald-700 hover:underline disabled:opacity-50"
                          onClick={() => {
                            const fd = new FormData();
                            fd.set("fileId", f.id);
                            fd.set("category", f.category && f.category !== "À classer" ? f.category : "Marché");
                            startTransition(async () => {
                              await classifyChantierFile(fd);
                              router.refresh();
                            });
                          }}
                        >
                          Classer
                        </button>
                      ) : null}
                      {canEdit && view !== "corbeille" ? (
                        <button
                          type="button"
                          disabled={pending}
                          className="text-xs text-red-600 hover:underline disabled:opacity-50"
                          onClick={() => {
                            const fd = new FormData();
                            fd.set("fileId", f.id);
                            startTransition(async () => {
                              await softDeleteChantierFile(fd);
                              router.refresh();
                            });
                          }}
                        >
                          Corbeille
                        </button>
                      ) : null}
                      <button
                        type="button"
                        disabled={pending}
                        className="text-xs text-amber-700 hover:underline disabled:opacity-50"
                        onClick={() => {
                          const fd = new FormData();
                          fd.set("fileId", f.id);
                          startTransition(async () => {
                            await toggleChantierFileFavorite(fd);
                            router.refresh();
                          });
                        }}
                      >
                        {f.isFavorite ? "★" : "☆"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DocumentPreviewModal open={!!preview} onClose={() => setPreview(null)} item={preview} />
    </div>
  );
}

/** Composant réutilisable — documents liés à un élément métier */
export function DocumentsAssocies({
  title = "Documents associés",
  files,
  emptyHint = "Aucun document lié.",
  onPreview,
}: {
  title?: string;
  files: { id: string; name: string; href?: string }[];
  emptyHint?: string;
  onPreview?: (id: string) => void;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</h3>
      {files.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">{emptyHint}</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {files.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate font-medium text-slate-800">{f.name}</span>
              <div className="flex gap-2 shrink-0">
                {onPreview ? (
                  <button type="button" className="text-xs font-semibold text-[#1e3a5f]" onClick={() => onPreview(f.id)}>
                    Aperçu
                  </button>
                ) : null}
                {f.href ? (
                  <Link href={f.href} className="text-xs font-semibold text-slate-600 hover:underline">
                    Ouvrir
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
