"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  FileText,
  History,
  ImageIcon,
  MoreHorizontal,
  NotebookPen,
  Pencil,
  Star,
  Layers,
} from "lucide-react";
import { WorkItemForm } from "@/components/commercial/WorkItemForm";
import { displayMarquePercent, roundMoney } from "@/lib/commercial/money";
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
    isPrimary: boolean;
    clientVisible: boolean;
    caption: string | null;
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

export function WorkItemDetailView({ item }: { item: WorkItemDetailData }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const backHref = searchParams.get("from") || "/dashboard/documents?universe=ouvrages";
  const [tab, setTab] = useState<TabId>("overview");
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const marque = displayMarquePercent({
    unitCostHt: item.unitCostHt,
    unitSellHt: item.unitSellHt,
    marginPercent: item.marginPercent,
    costKnown: item.costKnown,
    componentCount: item.componentCount,
  });

  const tabs = useMemo(
    () =>
      [
        { id: "overview" as const, label: "Vue d’ensemble" },
        { id: "technique" as const, label: "Fiche technique" },
        { id: "chiffrage" as const, label: "Chiffrage" },
        {
          id: "variantes" as const,
          label: "Variantes",
          count: item.variantCount,
        },
        {
          id: "documents" as const,
          label: "Photos & documents",
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

  return (
    <div className="mx-auto max-w-[1200px] space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 font-medium text-slate-500 transition hover:text-[#1e3a5f]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Bibliothèque
        </Link>
        {item.family ? (
          <>
            <span>/</span>
            <span>{item.family}</span>
          </>
        ) : null}
        {item.subFamily ? (
          <>
            <span>/</span>
            <span>{item.subFamily}</span>
          </>
        ) : null}
        <span>/</span>
        <span className="truncate font-medium text-[#1e3a5f]">{item.name}</span>
      </div>

      <header className="rounded-2xl border border-[#1e3a5f]/10 bg-gradient-to-br from-white via-white to-[#f4f7fb] p-5 shadow-[0_1px_2px_rgba(30,58,95,0.04)] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              {!item.isActive ? (
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                  Archivé
                </span>
              ) : null}
              {item.needsPriceRecalc ? (
                <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                  À vérifier
                </span>
              ) : null}
              <span className="rounded-md bg-[#1e3a5f]/8 px-2 py-0.5 text-[11px] font-medium text-[#1e3a5f]">
                {item.kind === "COMPOSITE" ? "Prix calculé" : "Prix direct"}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#1e3a5f] sm:text-[1.75rem]">
              {item.name}
            </h1>
            <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-500">
              <span className="font-mono">{item.reference || "Sans référence"}</span>
              {item.family ? <span>{item.family}</span> : null}
              {item.subFamily ? <span>· {item.subFamily}</span> : null}
              <span>· {item.saleUnit}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void toggleFavorite()}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#1e3a5f]/12 bg-white px-3 text-sm font-medium text-[#1e3a5f]"
            >
              <Star
                className={cn(
                  "h-4 w-4",
                  item.isFavorite && "fill-amber-400 text-amber-500",
                )}
              />
              Favoris
            </button>
            <button
              type="button"
              onClick={() => void duplicate()}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#1e3a5f]/12 bg-white px-3 text-sm font-medium text-[#1e3a5f]"
            >
              <Copy className="h-4 w-4" />
              Dupliquer
            </button>
            <Link
              href={`/dashboard/devis-facturation?addFromLibrary=${item.id}`}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#1e3a5f]/12 bg-white px-3 text-sm font-medium text-[#1e3a5f]"
            >
              Ajouter à un devis
            </Link>
            <button
              type="button"
              onClick={() => {
                setEditing(true);
                setTab("technique");
              }}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1e3a5f] px-3.5 text-sm font-semibold text-white"
            >
              <Pencil className="h-4 w-4" />
              Modifier
            </button>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#1e3a5f]/12 bg-white text-slate-500"
              aria-label="Plus d’actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex gap-1 overflow-x-auto border-b border-[#1e3a5f]/10">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              if (t.id !== "technique" && t.id !== "chiffrage") setEditing(false);
            }}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition",
              tab === t.id
                ? "border-[#1e3a5f] text-[#1e3a5f]"
                : "border-transparent text-slate-500 hover:text-[#1e3a5f]",
            )}
          >
            {t.label}
            {"count" in t && t.count > 0 ? (
              <span className="ml-1.5 tabular-nums text-slate-400">{t.count}</span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <section className="rounded-2xl border border-[#1e3a5f]/10 bg-white p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold text-[#1e3a5f]">Informations générales</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ["Désignation", item.name],
                ["Référence", item.reference || "—"],
                ["Famille", item.family || "—"],
                ["Sous-famille", item.subFamily || "—"],
                ["Unité", item.saleUnit],
                [
                  "Dernière modification",
                  new Date(item.updatedAt).toLocaleString("fr-FR"),
                ],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    {k}
                  </dt>
                  <dd className="mt-0.5 text-sm text-[#1e3a5f]">{v}</dd>
                </div>
              ))}
            </dl>
            {(item.shortDescription || item.description) && (
              <div className="mt-5 border-t border-[#1e3a5f]/8 pt-4">
                <h3 className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Aperçu technique
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {item.shortDescription || item.description}
                </p>
              </div>
            )}
          </section>

          <div className="space-y-4">
            <section className="rounded-2xl border border-[#1e3a5f]/10 bg-white p-5">
              <h2 className="text-sm font-semibold text-[#1e3a5f]">Chiffrage</h2>
              <p className="mt-3 text-2xl font-semibold tabular-nums text-[#1e3a5f]">
                {item.unitSellHt > 0 ? `${fmt(item.unitSellHt)} €` : "—"}
                <span className="ml-1 text-sm font-normal text-slate-400">
                  / {item.saleUnit}
                </span>
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {item.kind === "COMPOSITE" ? "Prix calculé" : "Prix direct"}
              </p>
              <div className="mt-4 space-y-2 border-t border-[#1e3a5f]/8 pt-3 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Coût de revient</span>
                  <span className="tabular-nums text-[#1e3a5f]">
                    {marque == null && item.unitCostHt === 0
                      ? "Non renseigné"
                      : `${fmt(item.unitCostHt)} €`}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Taux de marque</span>
                  <span className="tabular-nums text-[#1e3a5f]">
                    {marque == null ? "—" : `${fmt(marque)} %`}
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-[#1e3a5f]/10 bg-white p-5">
              <h2 className="text-sm font-semibold text-[#1e3a5f]">Documents associés</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-slate-400" />
                  {item.attachmentCount} fichier{item.attachmentCount > 1 ? "s" : ""}
                </li>
                <li className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-slate-400" />
                  {item.variantCount} variante{item.variantCount > 1 ? "s" : ""}
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-400" />
                  Utilisé dans {item.quoteLineCount} ligne
                  {item.quoteLineCount > 1 ? "s" : ""} de devis
                </li>
              </ul>
            </section>
          </div>
        </div>
      ) : null}

      {(tab === "technique" || tab === "chiffrage" || editing) &&
      (tab === "technique" || tab === "chiffrage") ? (
        <div className="rounded-2xl border border-[#1e3a5f]/10 bg-white p-4 sm:p-5">
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
      ) : null}

      {tab === "variantes" ? (
        <section className="rounded-2xl border border-[#1e3a5f]/10 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-[#1e3a5f]">Variantes</h2>
            <p className="text-xs text-slate-500">
              Parent / variante — les devis figent le prix au moment de l’ajout.
            </p>
          </div>
          {item.parent ? (
            <p className="mt-3 text-sm text-slate-600">
              Variante de{" "}
              <Link
                href={`/dashboard/devis-facturation/bibliotheque/${item.parent.id}`}
                className="font-medium text-[#1e3a5f] underline-offset-2 hover:underline"
              >
                {item.parent.name}
              </Link>
            </p>
          ) : null}
          {item.variants.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">
              Aucune variante pour le moment. La duplication crée une fiche indépendante ;
              liez-la ensuite en variante depuis l’édition (champ parent).
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-[#1e3a5f]/8">
              {item.variants.map((v) => (
                <li key={v.id}>
                  <Link
                    href={`/dashboard/devis-facturation/bibliotheque/${v.id}?from=${encodeURIComponent(backHref)}`}
                    className="flex items-center justify-between gap-3 py-3 hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#1e3a5f]">{v.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {v.reference || "Sans réf."}
                        {v.variantKind ? ` · ${v.variantKind}` : ""}
                      </p>
                    </div>
                    <span className="text-sm tabular-nums text-slate-600">
                      {v.unitSellHt > 0 ? `${fmt(v.unitSellHt)} € / ${v.saleUnit}` : "—"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "documents" ? (
        <section className="rounded-2xl border border-[#1e3a5f]/10 bg-white p-5">
          <h2 className="text-sm font-semibold text-[#1e3a5f]">Photos & documents</h2>
          {item.attachments.length === 0 ? (
            <div className="mt-8 rounded-xl border border-dashed border-[#1e3a5f]/15 px-4 py-12 text-center">
              <ImageIcon className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-[#1e3a5f]">Aucun document</p>
              <p className="mt-1 text-xs text-slate-500">
                L’upload (photos, PDF, fiches techniques) sera disponible ici — les fichiers
                resteront internes par défaut.
              </p>
            </div>
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {item.attachments.map((a) => (
                <li
                  key={a.id}
                  className="rounded-xl border border-[#1e3a5f]/10 p-3 text-sm"
                >
                  <p className="font-medium text-[#1e3a5f]">{a.name}</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {a.category}
                    {a.isPrimary ? " · Principale" : ""}
                    {a.clientVisible ? " · Client" : " · Interne"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "notes" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <NoteCard
            icon={<NotebookPen className="h-4 w-4" />}
            title="Notes internes"
            empty="Aucune note interne."
            body={item.internalNotes}
            hint="Réservées à l’entreprise — jamais dans les devis sans action explicite."
          />
          <NoteCard
            icon={<FileText className="h-4 w-4" />}
            title="Conseils de mise en œuvre"
            empty="Aucun conseil renseigné."
            body={item.implementationTips}
          />
          <NoteCard
            icon={<History className="h-4 w-4" />}
            title="Points de vigilance"
            empty="Aucun point de vigilance."
            body={item.vigilancePoints}
          />
          <section className="rounded-2xl border border-[#1e3a5f]/10 bg-white p-5">
            <h2 className="text-sm font-semibold text-[#1e3a5f]">Commentaires</h2>
            {item.notes.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">Aucun commentaire daté.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {item.notes.map((n) => (
                  <li key={n.id} className="rounded-xl bg-slate-50 px-3 py-2.5">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{n.body}</p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {n.createdBy?.name || "Utilisateur"} ·{" "}
                      {new Date(n.createdAt).toLocaleString("fr-FR")} · {n.kind}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}

      {tab === "historique" ? (
        <section className="rounded-2xl border border-[#1e3a5f]/10 bg-white p-5">
          <h2 className="text-sm font-semibold text-[#1e3a5f]">Historique</h2>
          <p className="mt-1 text-xs text-slate-500">
            Événements depuis la mise en place du journal — pas d’historique inventé.
          </p>
          {item.history.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">
              Aucun événement enregistré pour cette fiche.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-[#1e3a5f]/8">
              {item.history.map((h) => (
                <li key={h.id} className="py-3">
                  <p className="text-sm font-medium text-[#1e3a5f]">{h.label}</p>
                  {h.detail ? (
                    <p className="mt-0.5 text-xs text-slate-500 whitespace-pre-wrap">{h.detail}</p>
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

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-[#1e3a5f] px-4 py-2.5 text-sm font-medium text-white shadow-lg">
          {toast}
          {pending ? "…" : ""}
        </div>
      ) : null}
    </div>
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
    <section className="rounded-2xl border border-[#1e3a5f]/10 bg-white p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-[#1e3a5f]">
        {icon}
        {title}
      </h2>
      {hint ? <p className="mt-1 text-[11px] text-slate-400">{hint}</p> : null}
      {body?.trim() ? (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{body}</p>
      ) : (
        <p className="mt-3 text-sm text-slate-500">{empty}</p>
      )}
    </section>
  );
}
