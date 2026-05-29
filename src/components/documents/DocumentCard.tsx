"use client";

import { useState } from "react";
import type { Document } from "@prisma/client";
import { documentDownloadHref } from "@/lib/documents/download-url";

const STATUS_LABELS: Record<string, string> = {
  EN_ATTENTE: "En attente",
  EN_TRAITEMENT: "En traitement",
  TRAITE: "Traité",
  ARCHIVE: "Archivé",
};

const CATEGORY_LABELS: Record<string, string> = {
  FACTURE: "Facture",
  CONTRAT: "Contrat",
  RH: "RH",
  FISCAL: "Fiscal",
  AUTRE: "Autre",
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function iconForDoc(doc: Document) {
  if (doc.mimeType?.includes("pdf")) return "📄";
  if (doc.mimeType?.includes("image")) return "🖼";
  if (doc.mimeType?.includes("word") || doc.name?.toLowerCase().endsWith(".docx")) return "📝";
  if (doc.mimeType?.includes("sheet") || doc.name?.toLowerCase().endsWith(".xlsx")) return "📊";
  return "📎";
}

interface DocumentCardProps {
  doc: Document;
  onDelete?: () => void;
  list?: boolean;
}

export function DocumentCard({ doc, onDelete, list }: DocumentCardProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Supprimer ce document ?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
      if (res.ok) onDelete?.();
    } finally {
      setDeleting(false);
    }
  };

  if (list) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-xl surface-metallic-light p-4">
        <div className="flex min-w-0 items-center gap-4">
          <span className="text-2xl">{iconForDoc(doc)}</span>
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-800">{doc.name}</p>
            <p className="text-sm text-slate-500">
              {CATEGORY_LABELS[doc.category] ?? doc.category} •{" "}
              {STATUS_LABELS[doc.status] ?? doc.status} • {formatSize(doc.fileSize)} •{" "}
              {new Date(doc.createdAt).toLocaleDateString("fr-FR")}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <a
            href={documentDownloadHref(doc.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            Voir
          </a>
          <a
            href={documentDownloadHref(doc.id)}
            download={doc.name}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            Télécharger
          </a>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? "…" : "Supprimer"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl surface-metallic-light p-4">
      <div className="flex items-start justify-between">
        <span className="text-3xl">{iconForDoc(doc)}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            doc.status === "TRAITE"
              ? "bg-green-100 text-green-800"
              : doc.status === "EN_TRAITEMENT"
                ? "bg-blue-100 text-blue-800"
                : "bg-slate-100 text-slate-800"
          }`}
        >
          {STATUS_LABELS[doc.status] ?? doc.status}
        </span>
      </div>
      <p className="mt-2 truncate font-medium text-slate-800" title={doc.name}>
        {doc.name}
      </p>
      <p className="mt-1 text-sm text-slate-500">
        {CATEGORY_LABELS[doc.category] ?? doc.category} • {formatSize(doc.fileSize)}
      </p>
      <p className="mt-1 text-xs text-slate-400">
        {new Date(doc.createdAt).toLocaleDateString("fr-FR")}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={documentDownloadHref(doc.id)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          Voir
        </a>
        <a
          href={documentDownloadHref(doc.id)}
          download={doc.name}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          Télécharger
        </a>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {deleting ? "…" : "Supprimer"}
        </button>
      </div>
    </div>
  );
}
