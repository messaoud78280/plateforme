"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DocumentUploadZone } from "@/components/documents/DocumentUploadZone";
import { BackLink } from "@/components/ui/BackLink";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { FilterBar } from "@/components/ui/FilterBar";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Document } from "@prisma/client";

const CATEGORY_LABELS: Record<string, string> = {
  FACTURE: "Facture",
  CONTRAT: "Contrat",
  RH: "RH",
  FISCAL: "Fiscal",
  AUTRE: "Autre",
};

const STATUS_LABELS: Record<string, string> = {
  EN_ATTENTE: "En attente",
  EN_TRAITEMENT: "En traitement",
  TRAITE: "Traité",
  ARCHIVE: "Archivé",
};

interface DocumentsPageClientProps {
  initialDocuments: Document[];
  total: number;
  page: number;
  totalPages: number;
  categories: readonly string[];
  statuts: readonly string[];
  currentSearch: string;
  currentCategory: string;
  currentStatut: string;
  currentSort: string;
  currentOrder: string;
  userRole?: string;
  assignedTasks?: { id: string; title: string }[];
}

export function DocumentsPageClient({
  initialDocuments,
  total,
  page,
  totalPages,
  categories,
  statuts,
  currentSearch,
  currentCategory,
  currentStatut,
  currentSort,
  currentOrder,
  userRole = "CLIENT",
  assignedTasks = [],
}: DocumentsPageClientProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [uploading, setUploading] = useState(false);
  const isAgent = userRole === "AGENT";

  const buildUrl = (updates: Record<string, string | number>) => {
    const p = new URLSearchParams();
    if (currentSearch) p.set("search", currentSearch);
    if (currentCategory) p.set("category", currentCategory);
    if (currentStatut) p.set("statut", currentStatut);
    if (currentSort !== "createdAt") p.set("sort", currentSort);
    if (currentOrder !== "desc") p.set("order", currentOrder);
    Object.entries(updates).forEach(([k, v]) => {
      if (v !== undefined && v !== "") p.set(k, String(v));
    });
    return `/dashboard/documents?${p.toString()}`;
  };

  const onUploadDone = () => {
    setUploading(false);
    router.refresh();
  };

  const fieldClass =
    "rounded-[var(--cc-radius)] border border-[color:var(--cc-chrome-border)] bg-white px-3 py-2 text-sm text-bework-ink focus:border-bework-navy focus:outline-none focus:ring-2 focus:ring-bework-navy/20";

  return (
    <div className="space-y-6">
      <BackLink href="/dashboard">Tableau de bord</BackLink>
      <PageHeader
        eyebrow="GED"
        title="Mes documents"
        description={`${total} document${total !== 1 ? "s" : ""} — dépôt et suivi des pièces.`}
      />

      <DocumentUploadZone
        onUploadStart={() => setUploading(true)}
        onUploadEnd={onUploadDone}
        category={currentCategory || "AUTRE"}
        isAgent={isAgent}
        assignedTasks={assignedTasks}
      />

      <FilterBar action="/dashboard/documents">
        <input type="hidden" name="page" value="1" />
        <input
          type="text"
          name="search"
          defaultValue={currentSearch}
          placeholder="Rechercher par nom…"
          className={`${fieldClass} min-w-[180px] flex-1`}
        />
        <select name="category" defaultValue={currentCategory} className={fieldClass}>
          <option value="">Toutes catégories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c] ?? c}
            </option>
          ))}
        </select>
        <select name="statut" defaultValue={currentStatut} className={fieldClass}>
          <option value="">Tous statuts</option>
          {statuts.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s] ?? s}
            </option>
          ))}
        </select>
        <select name="sort" defaultValue={currentSort} className={fieldClass}>
          <option value="createdAt">Date</option>
          <option value="name">Nom</option>
          <option value="status">Statut</option>
          <option value="category">Catégorie</option>
        </select>
        <select name="order" defaultValue={currentOrder} className={fieldClass}>
          <option value="desc">Récent d’abord</option>
          <option value="asc">Ancien d’abord</option>
        </select>
        <button type="submit" className="btn-cc-primary">
          Filtrer
        </button>
      </FilterBar>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-bework-muted">
          {total} document{total !== 1 ? "s" : ""}
        </p>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={viewMode === "list" ? "btn-cc-primary !px-3 !py-1.5 text-xs" : "btn-cc-secondary !px-3 !py-1.5 text-xs"}
          >
            Liste
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={viewMode === "grid" ? "btn-cc-primary !px-3 !py-1.5 text-xs" : "btn-cc-secondary !px-3 !py-1.5 text-xs"}
          >
            Grille
          </button>
        </div>
      </div>

      {uploading ? <p className="text-sm text-bework-muted">Envoi en cours…</p> : null}

      {initialDocuments.length === 0 ? (
        <EmptyState
          title="Aucun document"
          description="Déposez des fichiers ci-dessus (PDF, JPG, PNG, DOCX, XLSX, max 10 Mo)."
        />
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {initialDocuments.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} onDelete={() => router.refresh()} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {initialDocuments.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} onDelete={() => router.refresh()} list />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2">
          {page > 1 ? (
            <Link href={buildUrl({ page: page - 1 })} className="btn-cc-secondary">
              Précédent
            </Link>
          ) : null}
          <span className="text-sm text-bework-muted">
            Page {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={buildUrl({ page: page + 1 })} className="btn-cc-secondary">
              Suivant
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
