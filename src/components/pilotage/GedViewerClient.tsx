"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { DocumentPreviewModal } from "@/components/documents/DocumentPreviewModal";
import {
  addChantierFileComment,
  linkChantierFileToEntity,
} from "@/app/dashboard/pilotage-travaux/ged-actions";
import { PILOTAGE_LIST_PATH } from "@/lib/pilotage/constants";

export function GedViewerClient({
  pilotageId,
  canEdit,
  file,
  comments,
  links,
  versions,
}: {
  pilotageId: string;
  canEdit: boolean;
  file: {
    id: string;
    name: string;
    fileUrl: string | null;
    mimeType: string | null;
    previewStatus: string | null;
  };
  comments: {
    id: string;
    content: string;
    authorName: string | null;
    pageNumber: number | null;
    status: string;
    createdAt: string;
  }[];
  links: { id: string; entityType: string; entityLabel: string | null }[];
  versions: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [comment, setComment] = useState("");
  const [pageNumber, setPageNumber] = useState("");
  const [linkType, setLinkType] = useState("action");
  const [linkLabel, setLinkLabel] = useState("");
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-semibold text-white"
          >
            Aperçu plein écran
          </button>
          {file.fileUrl ? (
            <a
              href={`/api/chantier/files/${file.id}/preview?download=original`}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
            >
              Télécharger l’original
            </a>
          ) : null}
          <Link
            href={`${PILOTAGE_LIST_PATH}/${pilotageId}?onglet=actions`}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
          >
            Créer une action
          </Link>
          <Link
            href={`${PILOTAGE_LIST_PATH}/${pilotageId}?onglet=doe`}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
          >
            Ajouter au DOE
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[#0f172a]/95 min-h-[420px]">
          <iframe
            title={file.name}
            src={`/api/chantier/files/${file.id}/preview`}
            className="h-[70vh] w-full bg-white"
          />
        </div>
        {file.previewStatus ? (
          <p className="text-[11px] italic text-slate-500">{file.previewStatus}</p>
        ) : null}
      </div>

      <aside className="space-y-4">
        <section className="pilotage-card p-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Versions</h2>
          {versions.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Une seule version enregistrée.</p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {versions.map((v) => (
                <li key={v.id}>
                  <Link
                    href={`${PILOTAGE_LIST_PATH}/${pilotageId}/documents/${v.id}`}
                    className="font-medium text-[#1e3a5f] hover:underline"
                  >
                    {v.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-[11px] text-slate-500">
            Pour une nouvelle version : déposez le fichier en indiquant l’indice et en remplaçant ce document
            depuis la GED (l’ancienne version est conservée).
          </p>
        </section>

        <section className="pilotage-card p-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Éléments liés</h2>
          {links.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Aucun lien métier.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {links.map((l) => (
                <li key={l.id} className="text-slate-700">
                  {l.entityType}
                  {l.entityLabel ? ` · ${l.entityLabel}` : ""}
                </li>
              ))}
            </ul>
          )}
          {canEdit ? (
            <form
              className="mt-3 space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData();
                fd.set("fileId", file.id);
                fd.set("entityType", linkType);
                fd.set("entityLabel", linkLabel);
                fd.set("pilotageId", pilotageId);
                startTransition(async () => {
                  const res = await linkChantierFileToEntity(fd);
                  setMsg(res.ok ? "Lien enregistré." : res.error);
                  if (res.ok) {
                    setLinkLabel("");
                    router.refresh();
                  }
                });
              }}
            >
              <select
                value={linkType}
                onChange={(e) => setLinkType(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
              >
                {[
                  "obligation",
                  "action",
                  "plan",
                  "visa",
                  "situation",
                  "facture",
                  "sous-traitant",
                  "doe",
                  "blocage",
                  "reunion",
                ].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <input
                value={linkLabel}
                onChange={(e) => setLinkLabel(e.target.value)}
                placeholder="Libellé (ex. CCAP art. 7.3)"
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
              />
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
              >
                Lier
              </button>
            </form>
          ) : null}
        </section>

        <section className="pilotage-card p-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Commentaires</h2>
          <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto text-sm">
            {comments.length === 0 ? (
              <li className="text-slate-500">Aucun commentaire.</li>
            ) : (
              comments.map((c) => (
                <li key={c.id} className="rounded-lg bg-slate-50 px-2 py-1.5">
                  <p className="text-[11px] text-slate-500">
                    {c.authorName ?? "—"}
                    {c.pageNumber != null ? ` · p.${c.pageNumber}` : ""} · {c.status}
                  </p>
                  <p className="text-slate-800">{c.content}</p>
                </li>
              ))
            )}
          </ul>
          {canEdit ? (
            <form
              className="mt-3 space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData();
                fd.set("fileId", file.id);
                fd.set("content", comment);
                if (pageNumber) fd.set("pageNumber", pageNumber);
                startTransition(async () => {
                  const res = await addChantierFileComment(fd);
                  setMsg(res.ok ? "Commentaire ajouté." : res.error);
                  if (res.ok) {
                    setComment("");
                    router.refresh();
                  }
                });
              }}
            >
              <input
                value={pageNumber}
                onChange={(e) => setPageNumber(e.target.value)}
                placeholder="Page (optionnel)"
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
              />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
                rows={3}
                placeholder="Annotation stockée séparément — n’altère pas le PDF."
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
              />
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
              >
                Commenter
              </button>
            </form>
          ) : null}
          {msg ? <p className="mt-2 text-[11px] text-slate-600">{msg}</p> : null}
        </section>
      </aside>

      <DocumentPreviewModal
        open={open}
        onClose={() => setOpen(false)}
        item={{
          name: file.name,
          url: file.fileUrl,
          mimeType: file.mimeType,
          chantierFileId: file.id,
          statusLabel: file.previewStatus ?? undefined,
        }}
      />
    </div>
  );
}
