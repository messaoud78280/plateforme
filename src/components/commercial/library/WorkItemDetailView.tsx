"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Archive,
  Copy,
  FileText,
  History,
  ImageIcon,
  Layers,
  MoreHorizontal,
  NotebookPen,
  Pencil,
  Star,
} from "lucide-react";
import { HeaderDropdown } from "@/components/ui/HeaderDropdown";
import { WorkItemForm } from "@/components/commercial/WorkItemForm";
import { WorkItemAttachmentsPanel } from "@/components/commercial/library/WorkItemAttachmentsPanel";
import { WorkItemNotesPanel } from "@/components/commercial/library/WorkItemNotesPanel";
import { WorkItemVariantsPanel } from "@/components/commercial/library/WorkItemVariantsPanel";
import {
  displayMarquePercent,
  roundMoney,
  sellCoefficientFromCostSell,
} from "@/lib/commercial/money";
import { cn } from "@/lib/cn";

type TabId =
  | "overview"
  | "technique"
  | "chiffrage"
  | "variantes"
  | "documents"
  | "notes"
  | "historique";

export type WorkItemDetailData = {
  id: string;
  name: string;
  reference: string | null;
  family: string | null;
  subFamily: string | null;
  saleUnit: string;
  kind: string;
  sellMode: string;
  unitCostHt: number;
  unitSellHt: number;
  marginPercent: number;
  costKnown?: boolean;
  isFavorite: boolean;
  isActive: boolean;
  needsPriceRecalc: boolean;
  description: string | null;
  shortDescription?: string | null;
  internalNotes?: string | null;
  implementationTips?: string | null;
  vigilancePoints?: string | null;
  updatedAt: string | Date;
  createdAt: string | Date;
  quoteLineCount: number;
  componentCount: number;
  attachmentCount: number;
  variantCount: number;
  parent?: { id: string; name: string; reference: string | null } | null;
  parentWorkItemId?: string | null;
  variants: Array<{
    id: string;
    name: string;
    reference: string | null;
    saleUnit: string;
    unitSellHt: number;
    variantKind: string | null;
  }>;
  attachments: Array<{
    id: string;
    name: string;
    category: string;
    mimeType: string | null;
    sizeBytes?: number | null;
    isPrimary: boolean;
    clientVisible: boolean;
    caption: string | null;
    sortOrder?: number;
    createdAt?: string | Date;
  }>;
  notes: Array<{
    id: string;
    kind: string;
    body: string;
    createdAt: string | Date;
    createdBy: { id: string; name: string } | null;
  }>;
  history: Array<{
    id: string;
    label: string;
    detail: string | null;
    createdAt: string | Date;
    actor: { id: string; name: string } | null;
  }>;
  createdBy: { id: string; name: string } | null;
};

function fmt(n: number) {
  return roundMoney(n, 2).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function isPhoto(a: WorkItemDetailData["attachments"][number]) {
  return (a.mimeType || "").startsWith("image/") || a.category === "photo";
}

export function WorkItemDetailView({ item }: { item: WorkItemDetailData }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const backHref = searchParams.get("from") || "/dashboard/documents?universe=ouvrages";
  const [tab, setTab] = useState<TabId>("overview");
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [primaryThumb, setPrimaryThumb] = useState<string | null>(null);

  const marque = displayMarquePercent({
    unitCostHt: item.unitCostHt,
    unitSellHt: item.unitSellHt,
    marginPercent: item.marginPercent,
    costKnown: item.costKnown,
    componentCount: item.componentCount,
  });
  const coeff =
    marque != null && item.unitCostHt > 0
      ? sellCoefficientFromCostSell(item.unitCostHt, item.unitSellHt)
      : null;

  const photos = useMemo(() => item.attachments.filter(isPhoto), [item.attachments]);
  const docsCount = item.attachmentCount - photos.length;
  const primaryPhoto =
    photos.find((p) => p.isPrimary) || photos[0] || null;

  useEffect(() => {
    if (!primaryPhoto) {
      setPrimaryThumb(null);
      return;
    }
    let cancelled = false;
    void fetch(
      `/api/commercial/library/work-items/${item.id}/attachments/${primaryPhoto.id}`,
    )
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.url) setPrimaryThumb(d.url as string);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [item.id, primaryPhoto?.id]);

  const tabs = useMemo(
    () =>
      [
        { id: "overview" as const, label: "Vue d’ensemble" },
        { id: "technique" as const, label: "Technique" },
        { id: "chiffrage" as const, label: "Chiffrage" },
        { id: "variantes" as const, label: "Variantes", count: item.variantCount },
        {
          id: "documents" as const,
          label: "Photos & docs",
          count: item.attachmentCount,
        },
        { id: "notes" as const, label: "Notes" },
        { id: "historique" as const, label: "Historique" },
      ] as const,
    [item.variantCount, item.attachmentCount],
  );

  async function toggleFavorite() {
    try {
      const res = await fetch(`/api/commercial/library/work-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "favorite", isFavorite: !item.isFavorite }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setToast(item.isFavorite ? "Retiré des favoris" : "Ajouté aux favoris");
      startTransition(() => router.refresh());
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Erreur");
    }
  }

  async function duplicate() {
    try {
      const res = await fetch("/api/commercial/library/work-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "duplicate", sourceId: item.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      if (data.workItem?.id) {
        router.push(
          `/dashboard/devis-facturation/bibliotheque/${data.workItem.id}?from=${encodeURIComponent(backHref)}`,
        );
      }
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Erreur");
    }
  }

  async function archive() {
    if (!confirm(`Archiver « ${item.name} » ?`)) return;
    try {
      const res = await fetch(`/api/commercial/library/work-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "archive" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setToast("Archivé");
      startTransition(() => router.refresh());
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Erreur");
    }
  }

  function goTab(id: TabId) {
    setTab(id);
    if (id !== "technique" && id !== "chiffrage") setEditing(false);
  }

  const shortLine =
    item.shortDescription?.trim() ||
    item.description?.trim()?.split("\n")[0]?.slice(0, 140) ||
    null;

  return (
    <div className="mx-auto max-w-[1280px]">
      {/* Fil d’Ariane compact */}
      <nav className="mb-3 flex flex-wrap items-center gap-1.5 text-[12px] text-slate-500">
        <Link href={backHref} className="font-medium hover:text-[#1e3a5f]">
          Bibliothèque
        </Link>
        {item.family ? (
          <>
            <span className="text-slate-300">/</span>
            <span className="truncate">{item.family}</span>
          </>
        ) : null}
        {item.subFamily ? (
          <>
            <span className="text-slate-300">/</span>
            <span className="truncate">{item.subFamily}</span>
          </>
        ) : null}
      </nav>

      {/* Header compact */}
      <header className="mb-4 rounded-2xl border border-[#1e3a5f]/10 bg-gradient-to-br from-white to-[#f6f9fc] px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
              {!item.isActive ? (
                <Badge tone="muted">Archivé</Badge>
              ) : null}
              {item.needsPriceRecalc ? (
                <Badge tone="warn">À vérifier</Badge>
              ) : null}
              <Badge tone="navy">
                {item.kind === "COMPOSITE" ? "Prix calculé" : "Prix direct"}
              </Badge>
            </div>
            <h1 className="text-[1.35rem] font-semibold leading-snug tracking-tight text-[#1e3a5f] sm:text-[1.5rem]">
              {item.name}
            </h1>
            {shortLine ? (
              <p className="mt-1 line-clamp-2 max-w-2xl text-sm text-slate-500">
                {shortLine}
              </p>
            ) : null}
            <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-slate-500">
              <span className="font-mono text-[#1e3a5f]/80">
                {item.reference || "Sans réf."}
              </span>
              <span>·</span>
              <span>{item.saleUnit}</span>
              {item.family ? (
                <>
                  <span>·</span>
                  <span>
                    {item.family}
                    {item.subFamily ? ` / ${item.subFamily}` : ""}
                  </span>
                </>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-stretch gap-3 sm:items-end">
            <div className="rounded-xl border border-[#1e3a5f]/10 bg-white px-4 py-3 text-right shadow-[0_1px_2px_rgba(30,58,95,0.04)]">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Prix de vente HT
              </p>
              <p className="mt-0.5 text-2xl font-semibold tabular-nums tracking-tight text-[#1e3a5f]">
                {item.unitSellHt > 0 ? `${fmt(item.unitSellHt)} €` : "—"}
                <span className="ml-1 text-sm font-normal text-slate-400">
                  / {item.saleUnit}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditing(true);
                  setTab("technique");
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#1e3a5f] px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#274866]"
              >
                <Pencil className="h-3.5 w-3.5" />
                Modifier
              </button>
              <Link
                href={`/dashboard/devis-facturation?addFromLibrary=${item.id}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#1e3a5f]/15 bg-white px-3.5 text-sm font-semibold text-[#1e3a5f] transition hover:bg-[#f5f8fc]"
              >
                Ajouter à un devis
              </Link>
              <HeaderDropdown
                align="right"
                width={200}
                zIndex={60}
                panelClassName="rounded-xl border border-[#1e3a5f]/10 bg-white py-1 shadow-lg"
                trigger={({ onClick, expanded, triggerRef }) => (
                  <button
                    ref={triggerRef}
                    type="button"
                    onClick={onClick}
                    aria-expanded={expanded}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#1e3a5f]/12 bg-white text-slate-500 hover:bg-slate-50"
                    aria-label="Plus d’actions"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                )}
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => void toggleFavorite()}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#1e3a5f] hover:bg-[#f5f8fc]"
                >
                  <Star
                    className={cn(
                      "h-3.5 w-3.5",
                      item.isFavorite && "fill-amber-400 text-amber-500",
                    )}
                  />
                  {item.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => void duplicate()}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#1e3a5f] hover:bg-[#f5f8fc]"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Dupliquer
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => void archive()}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-amber-800 hover:bg-amber-50"
                >
                  <Archive className="h-3.5 w-3.5" />
                  Archiver
                </button>
              </HeaderDropdown>
            </div>
          </div>
        </div>
      </header>

      {/* Nav sections sticky */}
      <div className="sticky top-0 z-20 -mx-1 mb-4 border-b border-[#1e3a5f]/10 bg-[#f8fafc]/95 px-1 backdrop-blur supports-[backdrop-filter]:bg-[#f8fafc]/80">
        <div className="flex gap-0.5 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => goTab(t.id)}
              className={cn(
                "shrink-0 border-b-2 px-3 py-2.5 text-[13px] font-medium transition",
                tab === t.id
                  ? "border-[#1e3a5f] text-[#1e3a5f]"
                  : "border-transparent text-slate-500 hover:text-[#1e3a5f]",
              )}
            >
              {t.label}
              {"count" in t && typeof t.count === "number" && t.count > 0 ? (
                <span className="ml-1 tabular-nums text-slate-400">{t.count}</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* Corps 2 colonnes */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-4">
          {tab === "overview" ? (
            <div className="space-y-4">
              <section className="rounded-2xl border border-[#1e3a5f]/10 bg-white p-4 sm:p-5">
                <h2 className="text-[13px] font-semibold text-[#1e3a5f]">
                  Description
                </h2>
                {item.description?.trim() || item.shortDescription?.trim() ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                    {item.description?.trim() || item.shortDescription}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-slate-400">
                    Aucune description renseignée.
                  </p>
                )}
              </section>

              {primaryThumb ? (
                <section className="overflow-hidden rounded-2xl border border-[#1e3a5f]/10 bg-white">
                  <button
                    type="button"
                    onClick={() => goTab("documents")}
                    className="group relative block w-full"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={primaryThumb}
                      alt={primaryPhoto?.caption || primaryPhoto?.name || "Photo principale"}
                      className="aspect-[21/9] w-full object-cover transition group-hover:scale-[1.01]"
                    />
                    <span className="absolute bottom-3 left-3 rounded-md bg-black/55 px-2 py-1 text-[11px] font-medium text-white">
                      Photo principale · voir la galerie
                    </span>
                  </button>
                </section>
              ) : null}

              {item.variantCount > 0 ? (
                <section className="rounded-2xl border border-[#1e3a5f]/10 bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-[13px] font-semibold text-[#1e3a5f]">
                      Variantes ({item.variantCount})
                    </h2>
                    <button
                      type="button"
                      onClick={() => goTab("variantes")}
                      className="text-xs font-semibold text-[#1e3a5f] hover:underline"
                    >
                      Tout voir
                    </button>
                  </div>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {item.variants.slice(0, 4).map((v) => (
                      <li key={v.id}>
                        <Link
                          href={`/dashboard/devis-facturation/bibliotheque/${v.id}?from=${encodeURIComponent(backHref)}`}
                          className="block rounded-xl border border-[#1e3a5f]/8 px-3 py-2.5 transition hover:border-[#1e3a5f]/20 hover:bg-[#f7f9fc]"
                        >
                          <p className="truncate text-sm font-medium text-[#1e3a5f]">
                            {v.name}
                          </p>
                          <p className="mt-0.5 text-[11px] tabular-nums text-slate-500">
                            {v.unitSellHt > 0
                              ? `${fmt(v.unitSellHt)} € / ${v.saleUnit}`
                              : "—"}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section className="grid gap-3 sm:grid-cols-3">
                <QuickStat
                  icon={<ImageIcon className="h-4 w-4" />}
                  label="Photos"
                  value={String(photos.length)}
                  onClick={() => goTab("documents")}
                />
                <QuickStat
                  icon={<FileText className="h-4 w-4" />}
                  label="Documents"
                  value={String(Math.max(0, docsCount))}
                  onClick={() => goTab("documents")}
                />
                <QuickStat
                  icon={<Layers className="h-4 w-4" />}
                  label="Dans devis"
                  value={String(item.quoteLineCount)}
                />
              </section>
            </div>
          ) : null}

          {(tab === "technique" || tab === "chiffrage") && (
            <div className="rounded-2xl border border-[#1e3a5f]/10 bg-white p-4 sm:p-5">
              {tab === "chiffrage" && !editing ? (
                <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <MetricCard
                    label="Prix de vente HT"
                    value={
                      item.unitSellHt > 0
                        ? `${fmt(item.unitSellHt)} €`
                        : "—"
                    }
                    hint={`/ ${item.saleUnit}`}
                  />
                  <MetricCard
                    label="Coût de revient"
                    value={
                      marque == null && item.unitCostHt === 0
                        ? "Non renseigné"
                        : `${fmt(item.unitCostHt)} €`
                    }
                  />
                  <MetricCard
                    label="Taux de marque"
                    value={marque == null ? "—" : `${fmt(marque)} %`}
                  />
                  <MetricCard
                    label="Coefficient"
                    value={coeff == null ? "—" : fmt(coeff)}
                  />
                </div>
              ) : null}
              <WorkItemForm
                mode="edit"
                workItemId={item.id}
                layout="page"
                onSaved={() => {
                  setEditing(false);
                  setToast("Enregistré");
                  startTransition(() => router.refresh());
                }}
              />
            </div>
          )}

          {tab === "variantes" ? (
            <WorkItemVariantsPanel
              workItemId={item.id}
              isVariant={Boolean(item.parent || item.parentWorkItemId)}
              parent={item.parent ?? null}
              initialVariants={item.variants}
              backHref={backHref}
            />
          ) : null}

          {tab === "documents" ? (
            <WorkItemAttachmentsPanel
              workItemId={item.id}
              initialAttachments={item.attachments}
            />
          ) : null}

          {tab === "notes" ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <NoteCard
                  icon={<NotebookPen className="h-3.5 w-3.5" />}
                  title="Notes internes (fiche)"
                  empty="—"
                  body={item.internalNotes}
                  hint="Confidentiel"
                />
                <NoteCard
                  icon={<FileText className="h-3.5 w-3.5" />}
                  title="Mise en œuvre"
                  empty="—"
                  body={item.implementationTips}
                />
                <NoteCard
                  icon={<History className="h-3.5 w-3.5" />}
                  title="Vigilance"
                  empty="—"
                  body={item.vigilancePoints}
                />
              </div>
              <WorkItemNotesPanel workItemId={item.id} initialNotes={item.notes} />
            </div>
          ) : null}

          {tab === "historique" ? (
            <section className="rounded-2xl border border-[#1e3a5f]/10 bg-white p-4 sm:p-5">
              <h2 className="text-[13px] font-semibold text-[#1e3a5f]">Historique</h2>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Événements depuis la mise en place du journal.
              </p>
              {item.history.length === 0 ? (
                <p className="mt-5 text-sm text-slate-500">Aucun événement.</p>
              ) : (
                <ul className="mt-3 divide-y divide-[#1e3a5f]/8">
                  {item.history.map((h) => (
                    <li key={h.id} className="py-2.5">
                      <p className="text-sm font-medium text-[#1e3a5f]">{h.label}</p>
                      {h.detail ? (
                        <p className="mt-0.5 whitespace-pre-wrap text-xs text-slate-500">
                          {h.detail}
                        </p>
                      ) : null}
                      <p className="mt-1 text-[11px] text-slate-400">
                        {h.actor?.name || "Système"} ·{" "}
                        {new Date(h.createdAt).toLocaleString("fr-FR")}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}
        </div>

        {/* Colonne secondaire sticky */}
        <aside className="hidden lg:block">
          <div className="sticky top-14 space-y-3">
            <div className="rounded-2xl border border-[#1e3a5f]/10 bg-white p-4 shadow-[0_1px_2px_rgba(30,58,95,0.04)]">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Synthèse
              </p>
              <dl className="mt-3 space-y-2.5 text-[13px]">
                <SideRow label="Référence" value={item.reference || "—"} mono />
                <SideRow label="Unité" value={item.saleUnit} />
                <SideRow label="Famille" value={item.family || "—"} />
                <SideRow label="Sous-famille" value={item.subFamily || "—"} />
                <SideRow
                  label="Prix HT"
                  value={
                    item.unitSellHt > 0
                      ? `${fmt(item.unitSellHt)} €`
                      : "—"
                  }
                />
                <SideRow
                  label="Coût"
                  value={
                    marque == null && item.unitCostHt === 0
                      ? "Non renseigné"
                      : `${fmt(item.unitCostHt)} €`
                  }
                />
                <SideRow
                  label="Marque"
                  value={marque == null ? "—" : `${fmt(marque)} %`}
                />
                <SideRow
                  label="Modifié"
                  value={new Date(item.updatedAt).toLocaleDateString("fr-FR")}
                />
                <SideRow
                  label="Statut"
                  value={
                    !item.isActive
                      ? "Archivé"
                      : item.needsPriceRecalc
                        ? "À vérifier"
                        : "Actif"
                  }
                />
              </dl>
            </div>

            <div className="rounded-2xl border border-[#1e3a5f]/10 bg-white p-3">
              <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Accès rapide
              </p>
              <div className="flex flex-col gap-1">
                {(
                  [
                    ["documents", "Photos & documents", item.attachmentCount],
                    ["variantes", "Variantes", item.variantCount],
                    ["chiffrage", "Chiffrage", null],
                    ["notes", "Notes", item.notes.length],
                  ] as const
                ).map(([id, label, count]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => goTab(id)}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-[13px] transition",
                      tab === id
                        ? "bg-[#1e3a5f]/8 font-semibold text-[#1e3a5f]"
                        : "text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    {label}
                    {count != null && count > 0 ? (
                      <span className="tabular-nums text-[11px] text-slate-400">
                        {count}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-[#1e3a5f] px-4 py-2.5 text-sm font-medium text-white shadow-lg">
          {toast}
          {pending ? "…" : ""}
        </div>
      ) : null}
    </div>
  );
}

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "navy" | "warn" | "muted";
}) {
  return (
    <span
      className={cn(
        "rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
        tone === "navy" && "bg-[#1e3a5f]/8 text-[#1e3a5f]",
        tone === "warn" && "bg-amber-50 text-amber-800",
        tone === "muted" && "bg-slate-100 text-slate-500",
      )}
    >
      {children}
    </span>
  );
}

function SideRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-slate-400">{label}</dt>
      <dd
        className={cn(
          "min-w-0 truncate text-right font-medium text-[#1e3a5f]",
          mono && "font-mono text-[12px]",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-[#1e3a5f]/8 bg-[#f7f9fc] px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-[#1e3a5f]">
        {value}
        {hint ? (
          <span className="ml-1 text-xs font-normal text-slate-400">{hint}</span>
        ) : null}
      </p>
    </div>
  );
}

function QuickStat({
  icon,
  label,
  value,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onClick?: () => void;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl border border-[#1e3a5f]/10 bg-white px-3 py-3 text-left",
        onClick && "transition hover:border-[#1e3a5f]/20 hover:bg-[#f7f9fc]",
      )}
    >
      <span className="text-slate-400">{icon}</span>
      <span>
        <span className="block text-lg font-semibold tabular-nums text-[#1e3a5f]">
          {value}
        </span>
        <span className="text-[11px] text-slate-500">{label}</span>
      </span>
    </Comp>
  );
}

function NoteCard({
  icon,
  title,
  body,
  empty,
  hint,
}: {
  icon: React.ReactNode;
  title: string;
  body?: string | null;
  empty: string;
  hint?: string;
}) {
  return (
    <section className="rounded-xl border border-[#1e3a5f]/10 bg-white p-3.5">
      <h2 className="flex items-center gap-1.5 text-[12px] font-semibold text-[#1e3a5f]">
        {icon}
        {title}
      </h2>
      {hint ? <p className="mt-0.5 text-[10px] text-slate-400">{hint}</p> : null}
      {body?.trim() ? (
        <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-[13px] leading-relaxed text-slate-700">
          {body}
        </p>
      ) : (
        <p className="mt-2 text-[13px] text-slate-400">{empty}</p>
      )}
    </section>
  );
}
