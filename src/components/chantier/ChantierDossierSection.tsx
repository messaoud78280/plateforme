"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CHANTIER_FILE_STATUS_LABELS,
} from "@/lib/chantier-dossier/constants";
import { DocumentPreviewModal, type DocumentPreviewItem } from "@/components/documents/DocumentPreviewModal";
import { ChantierFileShareDialog } from "@/components/chantier/ChantierFileShareDialog";
import { GedDocumentRow } from "@/components/ged/GedDocumentRow";
import {
  GedBackLink,
  GedBreadcrumb,
  GedCategoryGrid,
  GedEmptyState,
  GedPrimaryButton,
  GedSecondaryButton,
  GedViewTabs,
} from "@/components/ged/GedUi";
import { displayGedTypeLabel } from "@/lib/ged/classify-document";
import { folderDisplayLabel } from "@/lib/ged/origin";
import type { HubDocumentItem, HubView, HubCategoryId } from "@/lib/ged/document-hub-ui";
import {
  HUB_DOC_TYPES,
  HUB_ORIGIN_FILTERS,
  hubCategoryLabel,
  hubEmptyCopy,
  hubItemMatchesQuery,
  visibleHubViews,
} from "@/lib/ged/document-hub-ui";
import {
  buildCategoryStats,
} from "@/lib/ged/hub-categories";
import { Search } from "lucide-react";

export type ChantierFolderWithFiles = {
  id: string;
  code: string;
  label: string;
  files: {
    id: string;
    name: string;
    fileUrl: string | null;
    mimeType?: string | null;
    documentType: string | null;
    status: keyof typeof CHANTIER_FILE_STATUS_LABELS;
    comment: string | null;
    createdAt: string;
    addedBy: { name: string } | null;
    visibility?: string | null;
  }[];
};

const VISIBILITY_OPTIONS = [
  { value: "Interne entreprise cliente", label: "Interne" },
  { value: "Intervenants autorisés", label: "Partagé" },
] as const;

const CHANTIER_VIEWS: { id: HubView; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "recent", label: "Récents" },
  { id: "favorites", label: "Favoris" },
  { id: "missing", label: "À récupérer" },
  { id: "categories", label: "Catégories" },
  { id: "classify", label: "À classer" },
];

export function ChantierDossierSection({
  projectId,
  projectTitle,
  folders,
  canEdit,
  hubItems = [],
  classifyCount = 0,
}: {
  projectId: string;
  projectTitle?: string;
  folders: ChantierFolderWithFiles[];
  canEdit: boolean;
  hubItems?: HubDocumentItem[];
  classifyCount?: number;
}) {
  const router = useRouter();
  const [expandedFolder, setExpandedFolder] = useState<string | null>(
    folders.find((f) => f.files.length > 0)?.id ?? null,
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<DocumentPreviewItem | null>(null);
  const [shareFile, setShareFile] = useState<{ id: string; name: string } | null>(null);
  const [showAllFolders, setShowAllFolders] = useState(false);
  const [showAllDocs, setShowAllDocs] = useState(false);
  const [q, setQ] = useState("");
  const [view, setView] = useState<HubView>("all");
  const [categoryFilter, setCategoryFilter] = useState<HubCategoryId | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [docType, setDocType] = useState("");
  const [origin, setOrigin] = useState("");
  const [favBusy, setFavBusy] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const fileCount = hubItems.filter((it) => !it.isExpectedMissing).length || folders.reduce((n, f) => n + f.files.filter((file) => file.status !== "MANQUANT" && file.status !== "A_RELANCER").length, 0);
  const missingCount =
    hubItems.filter((it) => it.isExpectedMissing).length ||
    folders.reduce((n, f) => n + f.files.filter((file) => file.status === "MANQUANT" || file.status === "A_RELANCER").length, 0);

  const shownViews = visibleHubViews(CHANTIER_VIEWS, classifyCount, missingCount);

  const categoryStats = useMemo(
    () =>
      buildCategoryStats(
        hubItems.map((it) => ({
          group: it.group === "all" ? "autres" : it.group,
          title: it.title,
          isExpectedMissing: it.isExpectedMissing,
        })),
      ),
    [hubItems],
  );

  const filteredItems = useMemo(() => {
    let list = hubItems;
    if (q.trim()) list = list.filter((it) => hubItemMatchesQuery(it, q));
    if (view === "favorites") list = list.filter((it) => it.isFavorite);
    if (view === "missing") list = list.filter((it) => it.isExpectedMissing);
    if (view === "classify") {
      list = list.filter((it) => it.group === "autres" && it.typeLabel === "À classer");
    }
    if (view === "recent") {
      const since = Date.now() - 30 * 86400000;
      list = list.filter((it) => new Date(it.createdAt).getTime() >= since);
    }
    if (view === "categories" && categoryFilter) {
      list = list.filter((it) => it.group === categoryFilter);
    }
    if (docType) {
      const label = HUB_DOC_TYPES.find((t) => t.id === docType)?.label;
      list = list.filter((it) => it.typeLabel === label);
    }
    if (origin) list = list.filter((it) => it.origin === origin);
    return list;
  }, [hubItems, q, view, docType, origin, categoryFilter]);

  const showCategoryCards =
    view === "categories" && !categoryFilter && q.trim().length < 2;

  const recents = useMemo(() => {
    return [...hubItems]
      .filter((it) => !it.isExpectedMissing)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 4);
  }, [hubItems]);

  const foldersWithContent = folders.filter((f) => f.files.length > 0);
  const hasEmptyFolders = folders.some((f) => f.files.length === 0);
  const visibleFolders = showAllFolders ? folders : foldersWithContent;

  const searching = q.trim().length >= 2;
  const showLanding = view === "all" && !searching && !showAllDocs && !docType && !origin;

  async function uploadToFolder(folderId: string, file: File) {
    const share = window.confirm(
      "Rendre ce document visible aux partenaires externes du chantier ?\n\nOK = Partagé · Annuler = Interne uniquement",
    );
    setBusy(folderId);
    setError("");
    const fd = new FormData();
    fd.set("projectId", projectId);
    fd.set("folderId", folderId);
    fd.set("file", file);
    fd.set(
      "visibility",
      share ? "Intervenants autorisés" : "Interne entreprise cliente",
    );
    try {
      const res = await fetch("/api/chantier/files/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Erreur upload");
      else router.refresh();
    } catch {
      setError("Erreur réseau");
    } finally {
      setBusy(null);
    }
  }

  async function updateVisibility(fileId: string, visibility: string) {
    setBusy(fileId);
    try {
      await fetch(`/api/chantier/files/${fileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function addPlaceholder(folderId: string) {
    const name = window.prompt(
      "Intitulé de la pièce à récupérer (ex. Assurance décennale ST, BL livraison menuiseries…) :",
    );
    if (!name?.trim()) return;
    setBusy(folderId);
    setError("");
    try {
      const res = await fetch("/api/chantier/files/placeholder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, folderId, name: name.trim(), status: "MANQUANT" }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Erreur");
      else router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function updateStatus(fileId: string, status: string) {
    setBusy(fileId);
    try {
      await fetch(`/api/chantier/files/${fileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function renameFile(fileId: string, currentName: string) {
    const next = window.prompt("Nouveau nom du document :", currentName);
    if (!next?.trim() || next.trim() === currentName) return;

    setBusy(fileId);
    setError("");
    try {
      const res = await fetch(`/api/chantier/files/${fileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: next.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Impossible de renommer le document.");
        return;
      }
      if (preview?.chantierFileId === fileId) {
        setPreview((p) => (p ? { ...p, name: next.trim() } : p));
      }
      router.refresh();
    } catch {
      setError("Erreur réseau lors du renommage.");
    } finally {
      setBusy(null);
    }
  }

  async function deleteFile(fileId: string, fileName: string) {
    const ok = window.confirm(
      `Supprimer « ${fileName} » du classeur chantier ?\n\nCette action est définitive (fichier et aperçu PDF éventuel).`,
    );
    if (!ok) return;

    setBusy(fileId);
    setError("");
    if (preview?.chantierFileId === fileId) setPreview(null);

    try {
      const res = await fetch(`/api/chantier/files/${fileId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Impossible de supprimer ce document.");
        return;
      }
      router.refresh();
    } catch {
      setError("Erreur réseau lors de la suppression.");
    } finally {
      setBusy(null);
    }
  }

  async function toggleFavorite(it: HubDocumentItem) {
    if (!it.chantierFileId || it.isExpectedMissing) return;
    setFavBusy(it.id);
    try {
      const res = await fetch(`/api/chantier/files/${it.chantierFileId}/favorite`, {
        method: "POST",
      });
      if (res.ok) router.refresh();
    } finally {
      setFavBusy(null);
    }
  }

  function openHubFile(it: HubDocumentItem) {
    if (it.isExpectedMissing) {
      const folder = folders.find((f) => f.files.some((file) => file.id === it.chantierFileId));
      if (folder) {
        setView("all");
        setShowAllDocs(false);
        setExpandedFolder(folder.id);
        return;
      }
    }
    if (it.chantierFileId) {
      setPreview({
        name: it.title,
        url: it.href.startsWith("/api/") ? it.href : it.href,
        chantierFileId: it.chantierFileId,
        mimeType: it.mimeHint,
      });
      return;
    }
    window.open(it.href, "_blank", "noopener,noreferrer");
  }

  const firstFolder = folders[0]?.id;

  return (
    <section id="dossier-chantier" className="scroll-mt-24 space-y-6 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
      <DocumentPreviewModal
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        item={preview}
      />
      <ChantierFileShareDialog
        open={Boolean(shareFile)}
        onClose={() => setShareFile(null)}
        projectId={projectId}
        fileId={shareFile?.id ?? ""}
        fileName={shareFile?.name ?? ""}
      />

      <div className="space-y-3">
        {projectTitle ? (
          <GedBackLink href={`/dashboard/projets/${projectId}`} label={projectTitle} />
        ) : null}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[1.5rem] font-semibold tracking-tight text-[#1e3a5f] sm:text-[1.75rem]">
              Documents
            </h2>
            <p className="mt-1 text-[15px] text-slate-500">
              {projectTitle
                ? `Tous les documents de ${projectTitle}`
                : "Tous les documents liés à ce chantier."}
            </p>
            {fileCount > 0 || missingCount > 0 ? (
              <p className="mt-1.5 text-[12px] text-slate-400">
                {fileCount} document{fileCount !== 1 ? "s" : ""}
                {missingCount > 0
                  ? ` · ${missingCount} pièce${missingCount > 1 ? "s" : ""} à récupérer`
                  : ""}
              </p>
            ) : null}
            <Link
              href={`/dashboard/documents?projectId=${encodeURIComponent(projectId)}`}
              className="mt-2 inline-flex text-[13px] font-medium text-bework-navy hover:underline"
            >
              Documents du chantier
            </Link>
            {missingCount > 0 ? (
              <Link
                href={`/dashboard/documents?projectId=${encodeURIComponent(projectId)}&view=missing`}
                className="ml-3 mt-2 inline-flex text-[13px] font-medium text-[#b45309] hover:underline"
              >
                {missingCount} à récupérer
              </Link>
            ) : null}
          </div>
          {canEdit ? (
            <div className="relative">
              <GedPrimaryButton onClick={() => setAddOpen((o) => !o)} aria-expanded={addOpen}>
                Ajouter
              </GedPrimaryButton>
              {addOpen && firstFolder ? (
                <div className="absolute right-0 z-20 mt-1.5 w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                  <label className="block cursor-pointer px-3 py-2 text-[13px] text-slate-700 hover:bg-slate-50">
                    Ajouter un document
                    <input
                      type="file"
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        setAddOpen(false);
                        if (f) void uploadToFolder(firstFolder, f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-[13px] text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      setAddOpen(false);
                      void addPlaceholder(firstFolder);
                    }}
                  >
                    Ajouter une pièce à récupérer
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un document, chantier, fournisseur, référence…"
          className="h-14 w-full rounded-2xl border border-slate-200/90 bg-white pl-12 pr-12 text-[15px] text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#1e3a5f]/25 focus:ring-4 focus:ring-[#1e3a5f]/10"
          aria-label="Rechercher dans ce chantier"
          autoComplete="off"
        />
        {q ? (
          <button
            type="button"
            onClick={() => setQ("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
            aria-label="Effacer la recherche"
          >
            ×
          </button>
        ) : null}
      </div>

      <GedViewTabs
        views={shownViews}
        active={view}
        classifyCount={classifyCount}
        onChange={(id) => {
          setView(id);
          setCategoryFilter(null);
          setShowAllDocs(id !== "all");
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <GedSecondaryButton
          onClick={() => setFiltersOpen((o) => !o)}
          aria-expanded={filtersOpen}
        >
          Filtres
        </GedSecondaryButton>
      </div>
      {filtersOpen ? (
        <div className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-2">
          <label className="block text-[12px] font-medium text-slate-500">
            Type
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              {HUB_DOC_TYPES.map((t) => (
                <option key={t.id || "all"} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[12px] font-medium text-slate-500">
            Source
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Toutes</option>
              {HUB_ORIGIN_FILTERS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      {showLanding ? (
        <div>
          {recents.length > 0 ? (
            <section className="mb-8">
              <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Récemment
              </h3>
              <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/90 bg-white px-1 sm:px-2">
                {recents.map((it) => (
                  <GedDocumentRow
                    key={it.id}
                    it={it}
                    hideProject
                    onOpenDetails={() => openHubFile(it)}
                    onOpenFile={() => openHubFile(it)}
                    onFavorite={() => void toggleFavorite(it)}
                    favBusy={favBusy === it.id}
                  />
                ))}
              </ul>
              {hubItems.length > recents.length ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowAllDocs(true);
                    setView("all");
                  }}
                  className="mt-3 text-[13px] font-medium text-[#1e3a5f] hover:underline"
                >
                  Voir tous les documents
                </button>
              ) : null}
            </section>
          ) : null}

          <section>
            <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Par catégorie
            </h3>
            <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/90">
              {visibleFolders.map((folder) => (
                <FolderBlock
                  key={folder.id}
                  folder={folder}
                  open={expandedFolder === folder.id}
                  onToggle={() => setExpandedFolder(expandedFolder === folder.id ? null : folder.id)}
                  canEdit={canEdit}
                  busy={busy}
                  onUpload={uploadToFolder}
                  onPlaceholder={addPlaceholder}
                  onPreview={setPreview}
                  onShare={setShareFile}
                  onRename={renameFile}
                  onDelete={deleteFile}
                  onStatus={updateStatus}
                  onVisibility={updateVisibility}
                />
              ))}
            </div>
            {!showAllFolders && hasEmptyFolders ? (
              <button
                type="button"
                onClick={() => setShowAllFolders(true)}
                className="mt-4 text-sm font-medium text-[#1e3a5f] hover:underline"
              >
                Voir toutes les catégories
              </button>
            ) : null}
          </section>
        </div>
      ) : showCategoryCards ? (
        <GedCategoryGrid
          stats={categoryStats}
          onOpen={(id) => setCategoryFilter(id)}
          empty={
            <GedEmptyState
              title="Aucune catégorie"
              body="Aucune catégorie pour ce chantier."
            />
          }
        />
      ) : (
        <div>
          {view === "categories" && categoryFilter ? (
            <div className="mb-4 space-y-2">
              <GedBackLink
                label="Toutes les catégories"
                onClick={() => setCategoryFilter(null)}
              />
              <GedBreadcrumb
                items={[
                  { label: projectTitle || "Chantier" },
                  {
                    label: "Documents",
                    onClick: () => {
                      setView("all");
                      setCategoryFilter(null);
                      setShowAllDocs(false);
                    },
                  },
                  { label: hubCategoryLabel(categoryFilter) },
                ]}
              />
              <h3 className="text-[1.125rem] font-semibold text-slate-900">
                {hubCategoryLabel(categoryFilter)}
              </h3>
            </div>
          ) : null}
          {searching && filteredItems.length === 0 ? (
            <GedEmptyState
              title="Aucun résultat"
              body="Aucun document ne correspond à votre recherche."
              action={
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="text-[13px] font-medium text-[#1e3a5f] hover:underline"
                >
                  Effacer la recherche
                </button>
              }
            />
          ) : !searching && (docType || origin) && filteredItems.length === 0 ? (
            <GedEmptyState
              title="Aucun résultat"
              body="Aucun document ne correspond à ces filtres."
              action={
                <button
                  type="button"
                  onClick={() => {
                    setDocType("");
                    setOrigin("");
                  }}
                  className="text-[13px] font-medium text-[#1e3a5f] hover:underline"
                >
                  Effacer les filtres
                </button>
              }
            />
          ) : filteredItems.length === 0 ? (
            <GedEmptyState
              {...hubEmptyCopy({
                group: "all",
                view,
                search: q,
                hasFilters: Boolean(docType || origin),
              })}
            />
          ) : (
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/90 bg-white px-1 sm:px-2">
              {filteredItems.map((it) => (
                <GedDocumentRow
                  key={it.id}
                  it={it}
                  hideProject
                  onOpenDetails={() => openHubFile(it)}
                  onOpenFile={() => openHubFile(it)}
                  onFavorite={it.isExpectedMissing ? undefined : () => void toggleFavorite(it)}
                  favBusy={favBusy === it.id}
                />
              ))}
            </ul>
          )}
          {showAllDocs && view === "all" && !searching ? (
            <button
              type="button"
              onClick={() => setShowAllDocs(false)}
              className="mt-4 text-[13px] font-medium text-slate-500 hover:underline"
            >
              Retour aux catégories
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}

function FolderBlock({
  folder,
  open,
  onToggle,
  canEdit,
  busy,
  onUpload,
  onPlaceholder,
  onPreview,
  onShare,
  onRename,
  onDelete,
  onStatus,
  onVisibility,
}: {
  folder: ChantierFolderWithFiles;
  open: boolean;
  onToggle: () => void;
  canEdit: boolean;
  busy: string | null;
  onUpload: (folderId: string, file: File) => void;
  onPlaceholder: (folderId: string) => void;
  onPreview: (item: DocumentPreviewItem) => void;
  onShare: (file: { id: string; name: string }) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string, name: string) => void;
  onStatus: (id: string, status: string) => void;
  onVisibility: (id: string, visibility: string) => void;
}) {
  const missingCount = folder.files.filter((f) => f.status === "MANQUANT" || f.status === "A_RELANCER").length;
  const label = folderDisplayLabel(folder.label, folder.code);

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left hover:bg-slate-50/80"
      >
        <span className="min-w-0">
          <span className="font-medium text-slate-900">{label}</span>
          {folder.files.length > 0 ? (
            <span className="ml-2 text-sm text-slate-500">
              {folder.files.length}
            </span>
          ) : null}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {missingCount > 0 ? (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800/90 ring-1 ring-amber-100/80">
              {missingCount} à récupérer
            </span>
          ) : null}
          <span className="text-slate-400">{open ? "▾" : "▸"}</span>
        </span>
      </button>

      {open ? (
        <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-4">
          {canEdit ? (
            <div className="mb-4 flex flex-wrap gap-2">
              <label className="cursor-pointer rounded-lg border border-dashed border-[#1d4ed8]/50 bg-white px-4 py-2 text-sm font-medium text-[#1d4ed8] hover:bg-[#eff6ff]">
                {busy === folder.id ? "Envoi…" : "+ Déposer un fichier"}
                <input
                  type="file"
                  className="sr-only"
                  disabled={busy === folder.id}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void onUpload(folder.id, f);
                    e.target.value = "";
                  }}
                />
              </label>
              <button
                type="button"
                disabled={busy === folder.id}
                onClick={() => void onPlaceholder(folder.id)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                + Pièce à récupérer
              </button>
            </div>
          ) : null}

          {folder.files.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aucun document pour l’instant. Déposez une pièce ou marquez une pièce à récupérer.
            </p>
          ) : (
            <ul className="space-y-2">
              {folder.files.map((file) => {
                const missing = file.status === "MANQUANT" || file.status === "A_RELANCER" || !file.fileUrl;
                const typeLabel = missing ? "À récupérer" : displayGedTypeLabel(file.documentType);
                return (
                  <li
                    key={file.id}
                    className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900">{file.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {typeLabel}
                        {file.addedBy ? ` · ${file.addedBy.name}` : ""}
                      </p>
                      {file.comment ? (
                        <p className="mt-1 text-xs text-slate-600">{file.comment}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {canEdit ? (
                        <select
                          value={
                            file.visibility === "Intervenants autorisés" ||
                            file.visibility === "BeWork et entreprise cliente" ||
                            file.visibility === "Partage temporaire"
                              ? "Intervenants autorisés"
                              : "Interne entreprise cliente"
                          }
                          disabled={busy === file.id}
                          onChange={(e) => void onVisibility(file.id, e.target.value)}
                          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700"
                          title="Visibilité INTERNE / PARTAGÉ"
                        >
                          {VISIBILITY_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          {file.visibility === "Intervenants autorisés" ||
                          file.visibility === "BeWork et entreprise cliente" ||
                          file.visibility === "Partage temporaire"
                            ? "Partagé"
                            : "Interne"}
                        </span>
                      )}
                      {missing ? (
                        <label className="cursor-pointer rounded-md bg-[#1e3a5f] px-2.5 py-1 text-xs font-semibold text-white">
                          Ajouter le document
                          <input
                            type="file"
                            className="sr-only"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) void onUpload(folder.id, f);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            onPreview({
                              name: file.name,
                              url: file.fileUrl,
                              chantierFileId: file.id,
                              mimeType: file.mimeType ?? null,
                              createdAtLabel: new Date(file.createdAt).toLocaleString("fr-FR"),
                              statusLabel: CHANTIER_FILE_STATUS_LABELS[file.status],
                            })
                          }
                          className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Ouvrir
                        </button>
                      )}
                      {file.fileUrl && !missing ? (
                        <a
                          href={`/api/chantier/files/${file.id}/preview?download=original`}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={file.name}
                          className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700"
                        >
                          Télécharger
                        </a>
                      ) : null}
                      {canEdit && !missing ? (
                        <button
                          type="button"
                          disabled={busy === file.id}
                          onClick={() => void onRename(file.id, file.name)}
                          className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          Renommer
                        </button>
                      ) : null}
                      {file.fileUrl && !missing ? (
                        <button
                          type="button"
                          disabled={busy === file.id}
                          onClick={() => onShare({ id: file.id, name: file.name })}
                          className="rounded-md border border-[#1d4ed8]/40 bg-[#eff6ff] px-2.5 py-1 text-xs font-semibold text-[#1d4ed8] hover:bg-[#dbeafe] disabled:opacity-50"
                        >
                          Partager
                        </button>
                      ) : null}
                      {canEdit ? (
                        <>
                          <select
                            value={file.status}
                            disabled={busy === file.id}
                            onChange={(e) => void onStatus(file.id, e.target.value)}
                            className="rounded border border-slate-300 px-2 py-1 text-xs"
                            aria-label="Statut du document"
                          >
                            {Object.entries(CHANTIER_FILE_STATUS_LABELS).map(([k, label]) => (
                              <option key={k} value={k}>
                                {label}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            disabled={busy === file.id}
                            onClick={() => void onDelete(file.id, file.name)}
                            className="rounded-md border border-red-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                            aria-label={`Supprimer ${file.name}`}
                          >
                            {busy === file.id ? "…" : "Supprimer"}
                          </button>
                        </>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
