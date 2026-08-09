"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { HubDocumentItem, HubGroup } from "@/lib/ged/document-hub";
import { cn } from "@/lib/cn";

const GROUP_LABELS: Record<HubGroup, string> = {
  all: "Tous",
  chantiers: "Chantiers",
  administratif: "Administratif",
  commandes: "Commandes",
  fournisseurs: "Fournisseurs",
  doe: "DOE",
  photos: "Photos",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function typeIcon(type: string) {
  const t = type.toUpperCase();
  if (t === "BL") return "📦";
  if (t === "PHOTO" || t.includes("PHOTO")) return "🖼";
  if (t === "PLAN") return "🗺";
  if (t === "DOE") return "📁";
  if (t.includes("PDF")) return "📄";
  return "📎";
}

export function DocumentsHubClient({
  items,
  total,
  page,
  pageSize,
  group,
  search,
  projects,
  canUploadChantier,
}: {
  items: HubDocumentItem[];
  total: number;
  page: number;
  pageSize: number;
  group: HubGroup;
  search: string;
  projects: { id: string; title: string }[];
  canUploadChantier: boolean;
}) {
  const router = useRouter();
  const [filtersOpen, setFiltersOpen] = useState(Boolean(search || group !== "all"));
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const chips = useMemo(() => {
    const c: { key: string; label: string; clear: string }[] = [];
    if (group !== "all") {
      c.push({ key: "group", label: GROUP_LABELS[group], clear: "group=" });
    }
    if (search) {
      c.push({ key: "q", label: `« ${search} »`, clear: "q=" });
    }
    return c;
  }, [group, search]);

  function go(updates: Record<string, string>) {
    const p = new URLSearchParams();
    const nextGroup = updates.group ?? group;
    const nextQ = updates.q !== undefined ? updates.q : search;
    const nextPage = updates.page ?? "1";
    if (nextGroup && nextGroup !== "all") p.set("group", nextGroup);
    if (nextQ) p.set("q", nextQ);
    if (nextPage !== "1") p.set("page", nextPage);
    router.push(`/dashboard/documents?${p.toString()}`);
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
            GED BeWork
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#1e3a5f]">Documents</h1>
          <p className="mt-1 text-sm text-slate-600">
            Un fichier, plusieurs contextes — chantier, commande, réception.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canUploadChantier && projects[0] ? (
            <Link
              href={`/dashboard/projets/${projects[0].id}#tab-documents`}
              className="inline-flex min-h-10 items-center rounded-lg bg-[#1e3a5f] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#16304f]"
            >
              + Ajouter un document
            </Link>
          ) : (
            <Link
              href="/dashboard/projets"
              className="inline-flex min-h-10 items-center rounded-lg bg-[#1e3a5f] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#16304f]"
            >
              + Ajouter via un chantier
            </Link>
          )}
        </div>
      </header>

      <form
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          go({ q: String(fd.get("q") ?? ""), page: "1" });
        }}
      >
        <input
          name="q"
          defaultValue={search}
          placeholder="Rechercher un document…"
          className="min-h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none focus:border-[#1d4ed8]"
        />
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          className="min-h-10 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          Filtres
        </button>
        <button
          type="submit"
          className="min-h-10 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-800"
        >
          Chercher
        </button>
      </form>

      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(GROUP_LABELS) as HubGroup[]).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => go({ group: g, page: "1" })}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition",
              group === g
                ? "bg-[#1e3a5f] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            )}
          >
            {GROUP_LABELS[g]}
          </button>
        ))}
      </div>

      {filtersOpen ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Chantier rapide
          </p>
          <div className="flex flex-wrap gap-1.5">
            {projects.slice(0, 8).map((p) => (
              <Link
                key={p.id}
                href={`/dashboard/projets/${p.id}#tab-documents`}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-[#1e3a5f]/30"
              >
                {p.title}
              </Link>
            ))}
            {projects.length === 0 ? (
              <p className="text-xs text-slate-500">Aucun chantier accessible.</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {chips.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => {
                if (c.key === "group") go({ group: "all", page: "1" });
                if (c.key === "q") go({ q: "", page: "1" });
              }}
              className="rounded-full bg-[#1e3a5f]/10 px-2.5 py-1 text-[11px] font-semibold text-[#1e3a5f]"
            >
              {c.label} ×
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          {total} document{total !== 1 ? "s" : ""}
        </span>
        <span className="text-xs">Plus récents d’abord</span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center">
          <p className="text-sm font-medium text-slate-600">Aucun document dans cette vue.</p>
          <p className="mt-1 text-xs text-slate-400">
            Ajoutez un fichier depuis un chantier ou une réception commande.
          </p>
          {canUploadChantier && projects[0] ? (
            <Link
              href={`/dashboard/projets/${projects[0].id}#tab-documents`}
              className="mt-4 inline-flex text-sm font-semibold text-[#1d4ed8] hover:underline"
            >
              Ajouter un document
            </Link>
          ) : null}
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {items.map((it) => (
            <li key={it.id}>
              <Link
                href={it.href}
                className="flex items-start gap-3 px-3 py-3 hover:bg-slate-50 sm:px-4"
              >
                <span className="mt-0.5 w-7 shrink-0 text-center text-base" aria-hidden>
                  {typeIcon(it.typeLabel)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-slate-900">
                    {it.title}
                  </span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                    <span className="font-semibold uppercase tracking-wide text-slate-600">
                      {it.typeLabel}
                    </span>
                    {it.projectTitle ? <span>{it.projectTitle}</span> : null}
                    {it.contextLabel ? <span>{it.contextLabel}</span> : null}
                  </span>
                  <span className="mt-1 block text-[11px] text-slate-400">
                    {fmtDate(it.createdAt)}
                    {it.authorName ? ` · ${it.authorName}` : ""}
                    {" · "}
                    {it.visibility}
                    {it.source === "purchase_order" ? " · Commande" : null}
                    {it.source === "legacy" ? " · Mission" : null}
                    {!it.isCurrentVersion ? " · Obsolète" : null}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => go({ page: String(page - 1) })}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
          >
            Précédent
          </button>
          <span className="text-xs text-slate-500">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => go({ page: String(page + 1) })}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      ) : null}

      <p className="text-[11px] text-slate-400">
        Les pièces jointes Messagerie restent dans la conversation tant qu’elles ne sont pas
        explicitement ajoutées aux documents.
      </p>
    </div>
  );
}
