"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FileText,
  ImageIcon,
  Loader2,
  Star,
  Trash2,
  Upload,
  Eye,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useRouter } from "next/navigation";

type Attachment = {
  id: string;
  name: string;
  category: string;
  mimeType: string | null;
  sizeBytes?: number | null;
  caption: string | null;
  isPrimary: boolean;
  clientVisible: boolean;
  sortOrder?: number;
};

function isImage(a: Attachment) {
  return (a.mimeType || "").startsWith("image/") || a.category === "photo";
}

export function WorkItemAttachmentsPanel({
  workItemId,
  initialAttachments,
}: {
  workItemId: string;
  initialAttachments: Attachment[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState(initialAttachments);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    setItems(initialAttachments);
  }, [initialAttachments]);

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  async function uploadFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0) return;
    setBusy(true);
    setError(null);
    setProgress(`Envoi de ${files.length} fichier${files.length > 1 ? "s" : ""}…`);
    try {
      const form = new FormData();
      for (const f of files) form.append("files", f);
      const res = await fetch(
        `/api/commercial/library/work-items/${workItemId}/attachments`,
        { method: "POST", body: form },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec upload");
      setItems((prev) => [...(data.attachments as Attachment[]), ...prev]);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/commercial/library/work-items/${workItemId}/attachments/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      const updated = data.attachment as Attachment;
      setItems((prev) =>
        prev.map((a) => {
          if (body.isPrimary && a.id !== id) return { ...a, isPrimary: false };
          return a.id === id ? { ...a, ...updated } : a;
        }),
      );
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Supprimer « ${name} » ?`)) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/commercial/library/work-items/${workItemId}/attachments/${id}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setItems((prev) => prev.filter((a) => a.id !== id));
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function openFile(a: Attachment) {
    try {
      const res = await fetch(
        `/api/commercial/library/work-items/${workItemId}/attachments/${a.id}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      if (isImage(a)) {
        setPreviewUrl(data.url);
        setPreviewName(a.name);
      } else {
        window.open(data.url, "_blank", "noopener,noreferrer");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    }
  }

  async function move(id: string, dir: -1 | 1) {
    const ordered = [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const idx = ordered.findIndex((a) => a.id === id);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= ordered.length) return;
    const next = [...ordered];
    [next[idx], next[j]] = [next[j], next[idx]];
    setItems(next.map((a, i) => ({ ...a, sortOrder: i })));
    setBusy(true);
    try {
      const res = await fetch(
        `/api/commercial/library/work-items/${workItemId}/attachments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reorder", orderedIds: next.map((a) => a.id) }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      if (data.attachments) setItems(data.attachments);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void uploadFiles(e.dataTransfer.files);
        }}
        className={cn(
          "rounded-2xl border-2 border-dashed px-4 py-10 text-center transition",
          dragOver
            ? "border-[#1e3a5f] bg-[#1e3a5f]/5"
            : "border-[#1e3a5f]/15 bg-white",
        )}
      >
        <Upload className="mx-auto h-8 w-8 text-slate-300" />
        <p className="mt-3 text-sm font-medium text-[#1e3a5f]">
          Glisser-déposer photos et PDF
        </p>
        <p className="mt-1 text-xs text-slate-500">
          JPEG, PNG, WebP, PDF… max 25 Mo · multi-fichiers
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[#1e3a5f] px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Importer
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void uploadFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {progress ? <p className="text-sm text-slate-500">{progress}</p> : null}
      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {items.length === 0 ? (
        <p className="text-sm text-slate-500">Aucun document pour cet ouvrage.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {[...items]
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .map((a) => (
              <li
                key={a.id}
                className="rounded-2xl border border-[#1e3a5f]/10 bg-white p-3 shadow-sm"
              >
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => void openFile(a)}
                    className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100"
                  >
                    {isImage(a) ? (
                      <ImageIcon className="h-7 w-7 text-slate-400" />
                    ) : (
                      <FileText className="h-7 w-7 text-slate-400" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    {editingId === a.id ? (
                      <input
                        autoFocus
                        defaultValue={a.name}
                        className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                        onBlur={(e) => {
                          setEditingId(null);
                          if (e.target.value.trim() && e.target.value !== a.name) {
                            void patch(a.id, { name: e.target.value.trim() });
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                        }}
                      />
                    ) : (
                      <button
                        type="button"
                        className="truncate text-left text-sm font-semibold text-[#1e3a5f] hover:underline"
                        onClick={() => setEditingId(a.id)}
                        title="Renommer"
                      >
                        {a.name}
                      </button>
                    )}
                    <input
                      defaultValue={a.caption ?? ""}
                      placeholder="Légende / description"
                      className="mt-1 w-full rounded-lg border border-transparent bg-transparent px-0 py-0.5 text-xs text-slate-500 outline-none focus:border-slate-200 focus:px-2"
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v !== (a.caption ?? "")) {
                          void patch(a.id, { caption: v || null });
                        }
                      }}
                    />
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => void patch(a.id, { isPrimary: true })}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                          a.isPrimary
                            ? "bg-amber-50 text-amber-700"
                            : "bg-slate-50 text-slate-500 hover:bg-amber-50",
                        )}
                      >
                        <Star className={cn("h-3 w-3", a.isPrimary && "fill-amber-400")} />
                        Principale
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void patch(a.id, { clientVisible: !a.clientVisible })
                        }
                        className={cn(
                          "rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                          a.clientVisible
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-50 text-slate-500",
                        )}
                      >
                        {a.clientVisible ? "Utilisable devis" : "Interne"}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => void move(a.id, -1)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50"
                      aria-label="Monter"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void move(a.id, 1)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50"
                      aria-label="Descendre"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void openFile(a)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50"
                      aria-label="Ouvrir"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => void remove(a.id, a.name)}
                    className="rounded-lg p-1.5 text-red-400 hover:bg-red-50"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
        </ul>
      )}

      {previewUrl ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/70 p-4">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Fermer"
            onClick={() => setPreviewUrl(null)}
          />
          <div className="relative z-10 max-h-[90vh] max-w-4xl overflow-auto rounded-2xl bg-white p-3 shadow-xl">
            <p className="mb-2 text-sm font-medium text-[#1e3a5f]">{previewName}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt={previewName} className="max-h-[80vh] rounded-lg object-contain" />
          </div>
        </div>
      ) : null}
    </section>
  );
}
