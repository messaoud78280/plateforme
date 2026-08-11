"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { HubDocumentItem, HubGroup, HubSort } from "@/lib/ged/document-hub-ui";
import { hubEmptyCopy } from "@/lib/ged/document-hub-ui";
import { cn } from "@/lib/cn";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function typeBadge(type: string) {
  const t = type.toUpperCase();
  if (t === "BL") return "BON DE LIVRAISON";
  if (t === "PHOTO" || t.includes("PHOTO")) return "PHOTO";
  if (t === "PLAN") return "PLAN";
  if (t === "DOE") return "DOE";
  return t;
}

function visibilityLabel(v: string) {
  const s = v.toLowerCase();
  if (s.includes("interne")) return { text: "Interne", lock: true };
  if (s.includes("client")) return { text: v, lock: false };
  if (s.includes("fournisseur") || s.includes("point")) return { text: v, lock: false };
  if (s.includes("partag")) return { text: v, lock: false };
  return { text: v || "Interne", lock: true };
}

const SORT_OPTIONS: { id: HubSort; label: string }[] = [
  { id: "recent", label: "Plus récents" },
  { id: "oldest", label: "Plus anciens" },
  { id: "name", label: "Nom" },
  { id: "type", label: "Type" },
];

export function DocumentsHubClient({
  items,
  total,
  page,
  pageSize,
  group,
  search,
  sort,
  groups,
  projects,
  canUploadChantier,
  personType,
  permissionProfile,
  hostCompany,
}: {
  items: HubDocumentItem[];
  total: number;
  page: number;
  pageSize: number;
  group: HubGroup;
  search: string;
  sort: HubSort;
  groups: { id: HubGroup; label: string }[];
  projects: { id: string; title: string }[];
  canUploadChantier: boolean;
  personType?: string | null;
  permissionProfile?: string | null;
  hostCompany?: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(search);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const isSupplier =
    personType === "SUPPLIER" || permissionProfile === "FOURNISSEUR";
  const isClient =
    personType === "CLIENT_EXT" || permissionProfile === "CLIENT";
  const external = isSupplier || isClient;

  const empty = hubEmptyCopy({
    group,
    personType,
    permissionProfile,
    hostCompany,
  });

  useEffect(() => {
    setQ(search);
  }, [search]);

  useEffect(() => {
    if (q === search) return;
    const t = window.setTimeout(() => {
      go({ q, page: "1" });
    }, 320);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce search only
  }, [q]);

  function go(updates: Record<string, string>) {
    const p = new URLSearchParams();
    const nextGroup = updates.group ?? group;
    const nextQ = updates.q !== undefined ? updates.q : search;
    const nextSort = updates.sort ?? sort;
    const nextPage = updates.page ?? "1";
    if (nextGroup && nextGroup !== "all") p.set("group", nextGroup);
    if (nextQ) p.set("q", nextQ);
    if (nextSort && nextSort !== "recent") p.set("sort", nextSort);
    if (nextPage !== "1") p.set("page", nextPage);
    const qs = p.toString();
    startTransition(() => {
      router.push(qs ? `/dashboard/documents?${qs}` : "/dashboard/documents");
    });
  }

  const title = isSupplier
    ? "Documents partagés"
    : isClient
      ? "Documents partagés"
      : "Documents";

  const subtitle = isSupplier
    ? `Documents échangés avec ${hostCompany?.trim() || "votre client"} dans le cadre de vos commandes et livraisons.`
    : isClient
      ? `Documents que ${hostCompany?.trim() || "votre entreprise"} partage avec vous.`
      : "Tous vos documents BTP, reliés à leurs chantiers et opérations.";

  const groupLabel = useMemo(
    () => groups.find((g) => g.id === group)?.label ?? "Tous",
    [groups, group],
  );

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 px-1 sm:px-2 xl:max-w-[1520px]">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1e3a5f]/70">
            {external ? "Espace collaboratif" : "GED BeWork"}
          </p>
          <div className="mt-0.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#1e3a5f] sm:text-[1.75rem]">
              {title}
            </h1>
            <span className="tabular-nums text-sm font-bold text-slate-500">
              {total}
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">{subtitle}</p>
        </div>
        {canUploadChantier && projects[0] ? (
          <Link
            href={`/dashboard/projets/${projects[0].id}#tab-documents`}
            className="inline-flex min-h-10 shrink-0 items-center rounded-lg bg-[#1e3a5f] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#16304f]"
          >
            + Ajouter un document
          </Link>
        ) : null}
      </header>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              go({ q, page: "1" });
            }
          }}
          placeholder="Rechercher un plan, BL, CCTP, fournisseur, chantier…"
          className="min-h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none ring-[#1d4ed8]/20 focus:border-[#1d4ed8] focus:ring-2"
          aria-label="Rechercher dans les documents"
        />
        <label className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600">
          <span className="text-slate-400">Trier</span>
          <select
            value={sort}
            onChange={(e) => go({ sort: e.target.value, page: "1" })}
            className="bg-transparent text-slate-800 outline-none"
            aria-label="Trier les documents"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200/80 pb-3">
        {groups.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => go({ group: g.id, page: "1" })}
            className={cn(
              "rounded-lg px-3 py-2 text-xs font-bold transition",
              group === g.id
                ? "bg-[#1e3a5f] text-white shadow-sm"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-900",
            )}
          >
            {g.label}
          </button>
        ))}
        <span className="ml-auto hidden text-xs font-semibold text-slate-400 sm:inline">
          {groupLabel}
          {pending ? " · …" : ""}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-5 py-8 text-center sm:py-10">
          <p className="text-sm font-semibold text-slate-800">{empty.title}</p>
          <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-slate-500">
            {empty.body}
          </p>
          {canUploadChantier && projects[0] ? (
            <Link
              href={`/dashboard/projets/${projects[0].id}#tab-documents`}
              className="mt-4 inline-flex rounded-lg bg-[#1e3a5f] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#16304f]"
            >
              + Ajouter un document
            </Link>
          ) : null}
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {items.map((it) => {
            const vis = visibilityLabel(it.visibility);
            const missing = Boolean(it.isExpectedMissing);
            return (
              <li key={it.id}>
                <Link
                  href={it.href}
                  className="flex items-start gap-3 px-3 py-3.5 transition hover:bg-slate-50/90 sm:px-5"
                >
                  <span
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-extrabold uppercase tracking-wide text-slate-600"
                    aria-hidden
                  >
                    {it.typeLabel.slice(0, 3)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-slate-950">
                      {it.title}
                    </span>
                    <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                      {missing ? "Document attendu" : typeBadge(it.typeLabel)}
                    </span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-slate-600">
                      {it.projectTitle ? (
                        <span className="font-semibold text-slate-800">{it.projectTitle}</span>
                      ) : null}
                      {it.projectTitle && it.contextLabel ? (
                        <span className="text-slate-300" aria-hidden>
                          ›
                        </span>
                      ) : null}
                      {it.contextLabel ? <span>{it.contextLabel}</span> : null}
                    </span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      {missing ? (
                        <span className="rounded-md bg-amber-50 px-1.5 py-0.5 font-semibold text-amber-800">
                          Manquante
                        </span>
                      ) : (
                        <span>{fmtDate(it.createdAt)}</span>
                      )}
                      {!missing ? (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-semibold",
                            vis.lock
                              ? "bg-slate-100 text-slate-700"
                              : "bg-emerald-50 text-emerald-800",
                          )}
                        >
                          {vis.lock ? <span aria-hidden>🔒</span> : null}
                          {vis.text}
                        </span>
                      ) : null}
                    </span>
                  </span>
                  <span className="shrink-0 self-center text-xs font-bold text-[#1d4ed8]">
                    {missing ? "Ajouter" : "Ouvrir"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2 pb-2">
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

      {!external ? (
        <p className="pb-2 text-[11px] text-slate-400">
          Les pièces jointes Messagerie restent dans la conversation tant qu’elles ne sont pas
          explicitement ajoutées aux documents.
        </p>
      ) : null}
    </div>
  );
}
