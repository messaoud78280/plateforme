"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DocumentUploadZone } from "@/components/documents/DocumentUploadZone";
import { DocumentCard } from "@/components/documents/DocumentCard";
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
}: DocumentsPageClientProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [uploading, setUploading] = useState(false);

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Mes documents</h1>

      <DocumentUploadZone
        onUploadStart={() => setUploading(true)}
        onUploadEnd={onUploadDone}
        category={currentCategory || "AUTRE"}
      />

      {/* Filtres */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <form
          method="get"
          action="/dashboard/documents"
          className="flex flex-wrap items-center gap-4"
        >
          <input type="hidden" name="page" value="1" />
          <input type="hidden" name="sort" value={currentSort} />
          <input type="hidden" name="order" value={currentOrder} />
          <input
            type="text"
            name="search"
            defaultValue={currentSearch}
            placeholder="Rechercher par nom..."
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            name="category"
            defaultValue={currentCategory}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Toutes catégories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c] ?? c}
              </option>
            ))}
          </select>
          <select
            name="statut"
            defaultValue={currentStatut}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Tous statuts</option>
            {statuts.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s] ?? s}
              </option>
            ))}
          </select>
          <select
            name="sort"
            defaultValue={currentSort}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="createdAt">Date</option>
            <option value="name">Nom</option>
            <option value="status">Statut</option>
            <option value="category">Catégorie</option>
          </select>
          <select
            name="order"
            defaultValue={currentOrder}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="desc">Récent d’abord</option>
            <option value="asc">Ancien d’abord</option>
          </select>
          <button
            type="submit"
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Filtrer
          </button>
        </form>
      </div>

      {/* Vue liste / grille */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          {total} document{total !== 1 ? "s" : ""}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`rounded-lg px-3 py-1.5 text-sm ${viewMode === "list" ? "bg-slate-200 font-medium" : "bg-slate-100 text-slate-600"}`}
          >
            Liste
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`rounded-lg px-3 py-1.5 text-sm ${viewMode === "grid" ? "bg-slate-200 font-medium" : "bg-slate-100 text-slate-600"}`}
          >
            Grille
          </button>
        </div>
      </div>

      {uploading && (
        <p className="text-sm text-slate-500">Envoi en cours…</p>
      )}

      {initialDocuments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
          Aucun document. Déposez des fichiers ci-dessus (PDF, JPG, PNG, DOCX, XLSX, max 10 Mo).
        </div>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={buildUrl({ page: page - 1 })}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
            >
              Précédent
            </Link>
          )}
          <span className="text-sm text-slate-600">
            Page {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={buildUrl({ page: page + 1 })}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
            >
              Suivant
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
