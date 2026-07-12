"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GED_CATEGORIES, GED_VISIBILITY } from "@/lib/ged/formats";

type UploadItem = {
  id: string;
  name: string;
  progress: "pending" | "uploading" | "done" | "error";
  error?: string;
  duplicateHint?: string;
};

export function GedDropzone({
  projectId,
  pilotageId,
  canEdit,
  folders,
}: {
  projectId: string;
  pilotageId: string;
  canEdit: boolean;
  folders: { id: string; code: string; label: string }[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [category, setCategory] = useState("À classer");
  const [folderId, setFolderId] = useState("");
  const [indice, setIndice] = useState("");
  const [visibility, setVisibility] = useState<string>(GED_VISIBILITY[1]);
  const [classifyLater, setClassifyLater] = useState(true);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      if (list.length === 0) return;

      for (const file of list) {
        const localId = `${file.name}-${file.size}-${Date.now()}`;
        setItems((prev) => [...prev, { id: localId, name: file.name, progress: "uploading" }]);

        const fd = new FormData();
        fd.set("file", file);
        fd.set("projectId", projectId);
        fd.set("pilotageId", pilotageId);
        fd.set("name", file.name);
        fd.set("category", classifyLater ? "À classer" : category);
        fd.set("visibility", visibility);
        fd.set("classifyLater", classifyLater ? "true" : "false");
        if (indice.trim()) fd.set("indice", indice.trim());
        if (!classifyLater && folderId) fd.set("folderId", folderId);

        try {
          const res = await fetch("/api/chantier/files/upload", { method: "POST", body: fd });
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
            duplicateOf?: { name: string };
          };
          if (!res.ok) {
            setItems((prev) =>
              prev.map((i) =>
                i.id === localId ? { ...i, progress: "error", error: data.error ?? "Échec" } : i,
              ),
            );
            continue;
          }
          setItems((prev) =>
            prev.map((i) =>
              i.id === localId
                ? {
                    ...i,
                    progress: "done",
                    duplicateHint: data.duplicateOf
                      ? `Doublon potentiel de « ${data.duplicateOf.name} »`
                      : undefined,
                  }
                : i,
            ),
          );
        } catch {
          setItems((prev) =>
            prev.map((i) => (i.id === localId ? { ...i, progress: "error", error: "Réseau" } : i)),
          );
        }
      }
      router.refresh();
    },
    [projectId, pilotageId, category, folderId, indice, visibility, classifyLater, router],
  );

  if (!canEdit) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
        Vous pouvez consulter et télécharger les documents autorisés.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs">
          <span className="font-semibold text-slate-600">Catégorie</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={classifyLater}
            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          >
            {GED_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          <span className="font-semibold text-slate-600">Rubrique</span>
          <select
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            disabled={classifyLater}
            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          >
            <option value="">Auto</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.code} · {f.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          <span className="font-semibold text-slate-600">Indice</span>
          <input
            value={indice}
            onChange={(e) => setIndice(e.target.value)}
            placeholder="A, B…"
            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs">
          <span className="font-semibold text-slate-600">Confidentialité</span>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          >
            {GED_VISIBILITY.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex items-center gap-2 text-xs text-slate-600">
        <input
          type="checkbox"
          checked={classifyLater}
          onChange={(e) => setClassifyLater(e.target.checked)}
        />
        Classer plus tard (boîte « Documents à classer »)
      </label>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) void uploadFiles(e.dataTransfer.files);
        }}
        className={`rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
          dragOver
            ? "border-[#1e3a5f] bg-[#1e3a5f]/5"
            : "border-slate-200 bg-gradient-to-b from-slate-50 to-white"
        }`}
      >
        <p className="text-sm font-bold text-[#1e3a5f]">Déposer les pièces du marché</p>
        <p className="mt-1 text-xs text-slate-500">
          PDF, Office, images, plans… sélection multiple. Original conservé sans altération.
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-4 rounded-lg bg-[#1e3a5f] px-4 py-2 text-xs font-semibold text-white"
        >
          Choisir des fichiers
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) void uploadFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {items.length > 0 ? (
        <ul className="space-y-1.5">
          {items.slice(-8).map((i) => (
            <li
              key={i.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs"
            >
              <span className="font-medium text-slate-800">{i.name}</span>
              <span
                className={
                  i.progress === "done"
                    ? "text-emerald-700"
                    : i.progress === "error"
                      ? "text-red-700"
                      : "text-slate-500"
                }
              >
                {i.progress === "uploading"
                  ? "Téléversement…"
                  : i.progress === "done"
                    ? i.duplicateHint ?? "OK"
                    : i.error ?? "Erreur"}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
