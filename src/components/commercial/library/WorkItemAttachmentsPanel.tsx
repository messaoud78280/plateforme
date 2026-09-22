"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  Eye,
  FileText,
  ImageIcon,
  Loader2,
  Plus,
  Star,
  Trash2,
  Upload,
  CheckCircle2,
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
  createdAt?: string | Date;
};

function isImage(a: Attachment) {
  return (a.mimeType || "").startsWith("image/") || a.category === "photo";
}

function isPdf(a: Attachment) {
  return (
    a.category === "pdf" ||
    (a.mimeType || "") === "application/pdf" ||
    a.name.toLowerCase().endsWith(".pdf")
  );
}

function formatBytes(n?: number | null) {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} Ko`;
  return `${(n / (1024 * 1024)).toFixed(1)} Mo`;
}

function formatDate(d?: string | Date) {
  if (!d) return "";
  const t = new Date(d);
  if (Number.isNaN(t.getTime())) return "";
  return t.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

async function fetchSignedUrl(workItemId: string, attachmentId: string) {
  const res = await fetch(
    `/api/commercial/library/work-items/${workItemId}/attachments/${attachmentId}`,
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Lien indisponible");
  return data.url as string;
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
  const [success, setSuccess] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    setItems(initialAttachments);
  }, [initialAttachments]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(null), 3200);
    return () => clearTimeout(t);
  }, [success]);

  const photos = useMemo(
    () =>
      [...items]
        .filter(isImage)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [items],
  );
  const documents = useMemo(
    () =>
      [...items]
        .filter((a) => !isImage(a))
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [items],
  );

  // Miniatures signées pour la galerie
  useEffect(() => {
    let cancelled = false;
    async function loadThumbs() {
      const missing = photos.filter((p) => !thumbUrls[p.id]);
      for (const p of missing.slice(0, 24)) {
        try {
          const url = await fetchSignedUrl(workItemId, p.id);
          if (cancelled) return;
          setThumbUrls((m) => (m[p.id] ? m : { ...m, [p.id]: url }));
        } catch {
          /* ignore single thumb failure */
        }
      }
    }
    void loadThumbs();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when photo ids change
  }, [workItemId, photos.map((p) => p.id).join(",")]);

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  async function uploadFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0) return;
    setBusy(true);
    setError(null);
    setSuccess(null);

    const accepted: File[] = [];
    for (const f of files) {
      const okExt = /\.(jpe?g|png|webp|gif|pdf|docx?|xlsx?|txt)$/i.test(f.name);
      if (!okExt && !f.type.startsWith("image/") && f.type !== "application/pdf") {
        setError(`Type non accepté : ${f.name}`);
        continue;
      }
      if (f.size > 25 * 1024 * 1024) {
        setError(`Fichier trop volumineux (max 25 Mo) : ${f.name}`);
        continue;
      }
      accepted.push(f);
    }
    if (accepted.length === 0) {
      setBusy(false);
      if (!error) setError("Aucun fichier compatible à importer.");
      return;
    }

    try {
      const uploaded: Attachment[] = [];
      for (let i = 0; i < accepted.length; i++) {
        const f = accepted[i]!;
        setProgress(`Envoi ${i + 1}/${accepted.length} — ${f.name}`);
        const form = new FormData();
        form.append("files", f);
        const res = await fetch(
          `/api/commercial/library/work-items/${workItemId}/attachments`,
          { method: "POST", body: form },
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Échec : ${f.name}`);
        const batch = (data.attachments as Attachment[]) ?? [];
        uploaded.push(...batch);
      }
      setItems((prev) => [...uploaded, ...prev]);
      setSuccess(
        accepted.length === 1
          ? "Fichier ajouté"
          : `${accepted.length} fichiers ajoutés`,
      );
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur d’upload");
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
      setThumbUrls((m) => {
        const next = { ...m };
        delete next[id];
        return next;
      });
      setSuccess("Document supprimé");
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function openFile(a: Attachment, mode: "preview" | "download" = "preview") {
    try {
      const url = thumbUrls[a.id] || (await fetchSignedUrl(workItemId, a.id));
      setThumbUrls((m) => ({ ...m, [a.id]: url }));
      if (mode === "download") {
        const aEl = document.createElement("a");
        aEl.href = url;
        aEl.download = a.name;
        aEl.target = "_blank";
        aEl.rel = "noopener noreferrer";
        aEl.click();
        return;
      }
      if (isImage(a)) {
        setPreviewUrl(url);
        setPreviewName(a.name);
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    }
  }

  async function movePhoto(id: string, dir: -1 | 1) {
    const ordered = [...photos];
    const idx = ordered.findIndex((a) => a.id === id);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= ordered.length) return;
    const nextPhotos = [...ordered];
    [nextPhotos[idx], nextPhotos[j]] = [nextPhotos[j]!, nextPhotos[idx]!];
    const reordered = [
      ...nextPhotos.map((a, i) => ({ ...a, sortOrder: i })),
      ...documents.map((a, i) => ({ ...a, sortOrder: nextPhotos.length + i })),
    ];
    setItems(reordered);
    setBusy(true);
    try {
      const res = await fetch(
        `/api/commercial/library/work-items/${workItemId}/attachments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "reorder",
            orderedIds: reordered.map((a) => a.id),
          }),
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
    <section className="space-y-6">
      {/* Zone d’import */}
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
          "relative overflow-hidden rounded-2xl border-2 border-dashed px-5 py-12 text-center transition",
          dragOver
            ? "border-[#1e3a5f] bg-gradient-to-b from-[#1e3a5f]/8 to-[#1e3a5f]/3"
            : "border-[#1e3a5f]/15 bg-gradient-to-b from-white to-[#f5f8fc]",
        )}
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1e3a5f]/8">
          <Upload className="h-7 w-7 text-[#1e3a5f]" />
        </div>
        <p className="mt-4 text-base font-semibold text-[#1e3a5f]">
          Glisser-déposer vos photos et documents
        </p>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-500">
          JPG, PNG, WEBP, PDF, DOCX — plusieurs fichiers à la fois · max 25 Mo chacun
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-[#1e3a5f] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#274866] disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Ajouter des fichiers
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,.pdf,.doc,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void uploadFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {progress ? (
        <div className="flex items-center gap-2 rounded-xl border border-[#1e3a5f]/10 bg-white px-4 py-3 text-sm text-[#1e3a5f]">
          <Loader2 className="h-4 w-4 animate-spin" />
          {progress}
        </div>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          <CheckCircle2 className="h-4 w-4" />
          {success}
        </p>
      ) : null}

      {/* Galerie photos */}
      <div>
        <div className="mb-3 flex items-end justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-[#1e3a5f]">Photographies</h3>
            <p className="text-xs text-slate-500">
              {photos.length === 0
                ? "Aucune photo pour le moment"
                : `${photos.length} photo${photos.length > 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#1e3a5f]/12 bg-white px-4 py-10">
            <ImageIcon className="h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">
              Importez des photos pour illustrer cet ouvrage
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((a, index) => (
              <li
                key={a.id}
                className="group overflow-hidden rounded-2xl border border-[#1e3a5f]/10 bg-white shadow-[0_1px_2px_rgba(30,58,95,0.05)]"
              >
                <button
                  type="button"
                  onClick={() => void openFile(a)}
                  className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100"
                >
                  {thumbUrls[a.id] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumbUrls[a.id]}
                      alt={a.caption || a.name}
                      className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-slate-300">
                      <ImageIcon className="h-8 w-8" />
                    </span>
                  )}
                  {a.isPrimary ? (
                    <span className="absolute left-2 top-2 rounded-md bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow">
                      Principale
                    </span>
                  ) : null}
                </button>
                <div className="space-y-2 p-3">
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
                    placeholder="Ajouter une légende…"
                    className="w-full rounded-lg border border-transparent bg-transparent px-0 py-0.5 text-xs text-slate-500 outline-none focus:border-slate-200 focus:bg-white focus:px-2"
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v !== (a.caption ?? "")) {
                        void patch(a.id, { caption: v || null });
                      }
                    }}
                  />
                  <div className="flex flex-wrap gap-1.5">
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
                    <VisibilityToggle
                      clientVisible={a.clientVisible}
                      onChange={(v) => void patch(a.id, { clientVisible: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => void movePhoto(a.id, -1)}
                        className="rounded-lg px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-50 disabled:opacity-30"
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        disabled={index === photos.length - 1}
                        onClick={() => void movePhoto(a.id, 1)}
                        className="rounded-lg px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-50 disabled:opacity-30"
                      >
                        →
                      </button>
                      <button
                        type="button"
                        onClick={() => void openFile(a)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50"
                        aria-label="Aperçu"
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
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Documents PDF / autres */}
      <div>
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-[#1e3a5f]">Documents</h3>
          <p className="text-xs text-slate-500">
            {documents.length === 0
              ? "PDF, fiches techniques, notices…"
              : `${documents.length} document${documents.length > 1 ? "s" : ""}`}
          </p>
        </div>
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#1e3a5f]/12 bg-white px-4 py-10">
            <FileText className="h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">Aucun PDF ou document technique</p>
          </div>
        ) : (
          <ul className="divide-y divide-[#1e3a5f]/8 overflow-hidden rounded-2xl border border-[#1e3a5f]/10 bg-white">
            {documents.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap"
              >
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                    isPdf(a) ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500",
                  )}
                >
                  <FileText className="h-5 w-5" />
                </div>
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
                    >
                      {a.name}
                    </button>
                  )}
                  <p className="text-[11px] text-slate-400">
                    {formatBytes(a.sizeBytes)}
                    {a.createdAt ? ` · ${formatDate(a.createdAt)}` : ""}
                    {isPdf(a) ? " · PDF" : ""}
                  </p>
                  <input
                    defaultValue={a.caption ?? ""}
                    placeholder="Description du document…"
                    className="mt-1 w-full rounded-lg border border-transparent bg-transparent px-0 py-0.5 text-xs text-slate-500 outline-none focus:border-slate-200 focus:px-2"
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v !== (a.caption ?? "")) {
                        void patch(a.id, { caption: v || null });
                      }
                    }}
                  />
                  <div className="mt-1.5">
                    <VisibilityToggle
                      clientVisible={a.clientVisible}
                      onChange={(v) => void patch(a.id, { clientVisible: v })}
                    />
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => void openFile(a)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#1e3a5f]/12 px-3 text-xs font-semibold text-[#1e3a5f] hover:bg-[#f5f8fc]"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Consulter
                  </button>
                  <button
                    type="button"
                    onClick={() => void openFile(a, "download")}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#1e3a5f]/12 px-3 text-xs font-semibold text-[#1e3a5f] hover:bg-[#f5f8fc]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Télécharger
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(a.id, a.name)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-red-100 px-3 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Supprimer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {previewUrl ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/75 p-4">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Fermer"
            onClick={() => setPreviewUrl(null)}
          />
          <div className="relative z-10 max-h-[92vh] w-full max-w-5xl overflow-auto rounded-2xl bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="truncate text-sm font-semibold text-[#1e3a5f]">{previewName}</p>
              <button
                type="button"
                onClick={() => setPreviewUrl(null)}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50"
              >
                Fermer
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={previewName}
              className="mx-auto max-h-[80vh] rounded-lg object-contain"
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}

function VisibilityToggle({
  clientVisible,
  onChange,
}: {
  clientVisible: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[10px] font-medium">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          "rounded-md px-2 py-0.5 transition",
          !clientVisible ? "bg-white text-[#1e3a5f] shadow-sm" : "text-slate-500",
        )}
      >
        Interne
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          "rounded-md px-2 py-0.5 transition",
          clientVisible ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500",
        )}
      >
        Devis client
      </button>
    </div>
  );
}
