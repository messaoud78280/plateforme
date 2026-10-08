"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { MaterialRequirementRow } from "@/lib/materiaux/load-for-project";
import { formatQty } from "@/lib/materiaux/progress";
import { withReturnTo } from "@/lib/navigation/safe-return-to";
import {
  SUPPLY_CATEGORY_LABELS,
  SUPPLY_CATEGORY_OPTIONS,
  SUPPLY_NEED_STATUS_LABELS,
  SUPPLY_PROCUREMENT_LABELS,
  isPurchaseOrderCompatibleCategory,
} from "@/lib/supply/categories";
import { summarizeSupplyNeeds } from "@/lib/supply/summary";
import type { SupplyCategory } from "@/lib/supply/types";
import { SupplyOffersPanel } from "@/components/projects/SupplyOffersPanel";
import { BeworkPatchToolbar } from "@/components/bework-patch/BeworkPatchToolbar";
import { getSectionCapability } from "@/lib/bework-patch/capability";

function formatDay(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

function qtyLine(
  label: string,
  qty: number | null | undefined,
  unit: string | null | undefined,
) {
  if (qty == null || !Number.isFinite(qty)) return null;
  return `${label} ${formatQty(qty)}${unit ? ` ${unit}` : ""}`;
}

export function ProjectApprovisionnementsSection({
  projectId,
  projectTitle,
  initialRows,
  canWrite,
}: {
  projectId: string;
  projectTitle: string;
  initialRows: MaterialRequirementRow[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [addOpen, setAddOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [similar, setSimilar] = useState<Array<{ id: string; label: string }> | null>(
    null,
  );

  const [label, setLabel] = useState("");
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState("U");
  const [category, setCategory] = useState<SupplyCategory>("MATERIAL");
  const [procurementMode, setProcurementMode] = useState("ACHAT");
  const [description, setDescription] = useState("");
  const [neededAt, setNeededAt] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmQtyWhenOrdered, setConfirmQtyWhenOrdered] = useState(false);

  const activeRows = useMemo(
    () => rows.filter((r) => r.status !== "CANCELLED"),
    [rows],
  );
  const filtered = useMemo(
    () =>
      categoryFilter === "ALL"
        ? activeRows
        : activeRows.filter((r) => r.category === categoryFilter),
    [activeRows, categoryFilter],
  );
  const summary = useMemo(
    () =>
      summarizeSupplyNeeds(
        activeRows.map((r) => ({
          status: r.status,
          category: r.category,
          sourceDrift: r.sourceDrift,
          coverageState: r.progress.coverageState,
          remainingToOrder: r.progress.remainingToOrder,
          offerCount: r.offerCount ?? 0,
          hasPricedOffer: r.hasPricedOffer ?? false,
          hasSelectedOffer: Boolean(r.selectedOfferId),
        })),
      ),
    [activeRows],
  );
  const detail = rows.find((r) => r.id === detailId) ?? null;

  async function reload() {
    const res = await fetch(`/api/projets/${projectId}/materiaux`);
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data.rows)) setRows(data.rows);
    router.refresh();
  }

  function resetForm() {
    setLabel("");
    setQty("");
    setUnit("U");
    setCategory("MATERIAL");
    setProcurementMode("ACHAT");
    setDescription("");
    setNeededAt("");
    setNotes("");
    setSimilar(null);
    setConfirmQtyWhenOrdered(false);
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function prepareOrder() {
    const ids = [...selected].filter((id) => {
      const r = rows.find((x) => x.id === id);
      return (
        r &&
        r.progress.remainingToOrder > 0 &&
        r.status !== "CANCELLED" &&
        isPurchaseOrderCompatibleCategory(r.category)
      );
    });
    if (ids.length === 0) return;
    const returnTo = `/dashboard/projets/${projectId}#tab-approvisionnements`;
    const href = withReturnTo(
      `/dashboard/commandes/nouvelle?projectId=${encodeURIComponent(projectId)}&req=${ids.join(",")}`,
      returnTo,
    );
    router.push(href);
  }

  async function submitAdd(force = false) {
    setError(null);
    setBusy(true);
    setSimilar(null);
    try {
      const res = await fetch(`/api/projets/${projectId}/materiaux`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          validatedOrderQuantity: Number(qty),
          unit,
          category,
          procurementMode,
          description: description.trim() || null,
          neededAt: neededAt || null,
          notes: notes.trim() || null,
          force,
        }),
      });
      const data = await res.json();
      if (res.status === 409 && Array.isArray(data.similar)) {
        setSimilar(data.similar.map((s: { id: string; label: string }) => s));
        return;
      }
      if (!res.ok) throw new Error(data.error || "Erreur");
      setAddOpen(false);
      resetForm();
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function submitEdit() {
    if (!detail) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(
        `/api/projets/${projectId}/materiaux/${detail.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label,
            validatedOrderQuantity: Number(qty),
            unit,
            category,
            procurementMode,
            description: description.trim() || null,
            neededAt: neededAt || null,
            notes: notes.trim() || null,
            allowQuantityChangeWhenOrdered: confirmQtyWhenOrdered,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setEditMode(false);
      setDetailId(null);
      resetForm();
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function cancelRequirement(id: string) {
    if (!confirm("Annuler ce besoin d’approvisionnement ?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/projets/${projectId}/materiaux/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancel: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setDetailId(null);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  function openEdit(r: MaterialRequirementRow) {
    setLabel(r.label);
    setQty(String(r.validatedOrderQuantity || r.quantityRequired));
    setUnit(r.unit);
    setCategory((r.category as SupplyCategory) || "MATERIAL");
    setProcurementMode(r.procurementMode || "ACHAT");
    setDescription(r.description || "");
    setNeededAt(r.neededAt ? r.neededAt.slice(0, 10) : "");
    setNotes(r.notes || "");
    setConfirmQtyWhenOrdered(false);
    setEditMode(true);
  }

  const cards = [
    { label: "Total besoins", value: summary.total },
    { label: "À consulter", value: summary.toConsult },
    { label: "À commander", value: summary.toOrder },
    { label: "Sans fournisseur", value: summary.withoutSupplier },
    { label: "Sans prix", value: summary.withoutPrice },
    { label: "Offre retenue", value: summary.withSelectedOffer },
    { label: "Couverts BC", value: summary.coveredByPo },
    { label: "Alertes", value: summary.alerts, alert: summary.alerts > 0 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500">
            Approvisionnements
          </h2>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            Préparez les matériaux, locations, évacuations et autres besoins
            nécessaires au chantier.
          </p>
          <p className="mt-0.5 text-xs text-slate-400">{projectTitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canWrite ? (
            <BeworkPatchToolbar
              section="SUPPLY"
              projectId={projectId}
              entityId={projectId}
              version={0}
              capability={getSectionCapability("SUPPLY")}
              entityLabel={projectTitle}
              primaryActionLabel="Modifier avec ChatGPT"
              helpText="Proposez besoins et offres fournisseurs réels (prix sourcés). Preview obligatoire avant Commit."
              onApplied={() => void reload()}
            />
          ) : null}
          {canWrite ? (
            <button
              type="button"
              onClick={() => {
                resetForm();
                setAddOpen(true);
              }}
              className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white hover:bg-[#152a45]"
            >
              + Ajouter un besoin
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`rounded-xl border px-3 py-2.5 ${
              c.alert
                ? "border-amber-200 bg-amber-50/70"
                : "border-slate-200 bg-white"
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              {c.label}
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums text-[#1e3a5f]">
              {c.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setCategoryFilter("ALL")}
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            categoryFilter === "ALL"
              ? "bg-[#1e3a5f] text-white"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          Tous
        </button>
        {SUPPLY_CATEGORY_OPTIONS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategoryFilter(c.id)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              categoryFilter === c.id
                ? "bg-[#1e3a5f] text-white"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {c.label}
            {summary.byCategory[c.id] ? ` (${summary.byCategory[c.id]})` : ""}
          </button>
        ))}
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center">
          <p className="text-sm font-medium text-slate-700">
            Aucun besoin d’approvisionnement n’a encore été préparé.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Ajoutez manuellement les besoins chantier. La génération depuis le
            métré arrivera dans une phase suivante.
          </p>
          {canWrite ? (
            <button
              type="button"
              onClick={() => {
                resetForm();
                setAddOpen(true);
              }}
              className="mt-4 rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white"
            >
              + Ajouter un besoin
            </button>
          ) : null}
          <p className="mt-3 text-[11px] text-slate-400">
            Générer depuis le métré — bientôt disponible
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  {canWrite ? <th className="w-10 px-3 py-2" /> : null}
                  <th className="px-3 py-2">Besoin</th>
                  <th className="px-3 py-2">Quantités</th>
                  <th className="px-3 py-2">Provenance</th>
                  <th className="px-3 py-2">Besoin pour</th>
                  <th className="px-3 py-2">Statut</th>
                  <th className="px-3 py-2">Commande</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="align-top hover:bg-slate-50/80">
                    {canWrite ? (
                      <td className="px-3 py-2.5">
                        {r.progress.remainingToOrder > 0 &&
                        isPurchaseOrderCompatibleCategory(r.category) ? (
                          <input
                            type="checkbox"
                            checked={selected.has(r.id)}
                            onChange={() => toggle(r.id)}
                            aria-label={`Sélectionner ${r.label}`}
                          />
                        ) : null}
                      </td>
                    ) : null}
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditMode(false);
                          setDetailId(r.id);
                        }}
                        className="text-left font-semibold text-slate-900 hover:underline"
                      >
                        {r.label}
                      </button>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {SUPPLY_CATEGORY_LABELS[r.category as SupplyCategory] ??
                          r.category}
                        {r.offerCount > 0
                          ? ` · ${r.offerCount} offre${r.offerCount > 1 ? "s" : ""}`
                          : " · sans offre"}
                        {r.selectedOfferId ? " · retenue" : ""}
                      </p>
                      {r.sourceDrift !== "NONE" ? (
                        <p className="mt-1 text-[11px] font-semibold text-amber-800">
                          Métré modifié
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-700">
                      <div className="space-y-0.5">
                        {qtyLine("Métré :", r.sourceQuantity, r.sourceUnit) ? (
                          <p>{qtyLine("Métré :", r.sourceQuantity, r.sourceUnit)}</p>
                        ) : null}
                        {qtyLine("Calculé :", r.calculatedQuantity, r.unit) ? (
                          <p>
                            {qtyLine("Calculé :", r.calculatedQuantity, r.unit)}
                          </p>
                        ) : null}
                        <p className="font-semibold text-slate-900">
                          À commander : {formatQty(r.validatedOrderQuantity)}{" "}
                          {r.unit}
                        </p>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-600">
                      <p>{r.sourceLabel || r.sourceType}</p>
                      {r.takeoffCodes.length > 0 ? (
                        <p className="mt-0.5 font-mono text-[10px] text-slate-500">
                          {r.takeoffCodes.join(", ")}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-600">
                      {formatDay(r.neededAt)}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                        {SUPPLY_NEED_STATUS_LABELS[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                        {r.coverageLabel}
                      </span>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Cmd {formatQty(r.progress.ordered)} · Reçu{" "}
                        {formatQty(r.progress.received)}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-2 md:hidden">
            {filtered.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-slate-200 bg-white p-3"
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => {
                    setEditMode(false);
                    setDetailId(r.id);
                  }}
                >
                  <p className="font-semibold text-slate-900">{r.label}</p>
                  <p className="text-[11px] text-slate-500">
                    {SUPPLY_CATEGORY_LABELS[r.category as SupplyCategory] ??
                      r.category}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#1e3a5f]">
                    À commander : {formatQty(r.validatedOrderQuantity)} {r.unit}
                  </p>
                  <p className="text-xs text-slate-600">{r.coverageLabel}</p>
                </button>
              </li>
            ))}
          </ul>

          {canWrite && selected.size > 0 ? (
            <div className="sticky bottom-3 z-10 flex justify-end">
              <button
                type="button"
                onClick={prepareOrder}
                className="rounded-xl bg-[#1e3a5f] px-4 py-3 text-sm font-bold text-white shadow-lg hover:bg-[#152a45]"
              >
                Préparer une commande ({selected.size})
              </button>
            </div>
          ) : null}
        </>
      )}

      {/* Add modal */}
      {addOpen ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-3 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">
              Ajouter un besoin
            </h3>
            <p className="mt-1 text-[11px] text-slate-500">
              Provenance : saisie manuelle (pas de lien métré automatique).
            </p>
            <NeedFormFields
              label={label}
              setLabel={setLabel}
              qty={qty}
              setQty={setQty}
              unit={unit}
              setUnit={setUnit}
              category={category}
              setCategory={setCategory}
              procurementMode={procurementMode}
              setProcurementMode={setProcurementMode}
              description={description}
              setDescription={setDescription}
              neededAt={neededAt}
              setNeededAt={setNeededAt}
              notes={notes}
              setNotes={setNotes}
            />
            {similar ? (
              <p className="mt-2 text-xs text-amber-800">
                Besoin similaire : {similar.map((s) => s.label).join(", ")}.
                Confirmez pour forcer.
              </p>
            ) : null}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setAddOpen(false);
                  resetForm();
                }}
                className="text-xs font-semibold text-slate-600"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={busy || !label.trim() || !qty}
                onClick={() => void submitAdd(Boolean(similar))}
                className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
              >
                {similar ? "Créer quand même" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Detail / edit */}
      {detail && !editMode ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-3 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">
                  {SUPPLY_CATEGORY_LABELS[detail.category as SupplyCategory] ??
                    detail.category}
                </p>
                <h3 className="text-base font-bold text-slate-900">
                  {detail.label}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailId(null)}
                className="text-xs font-semibold text-slate-500"
              >
                Fermer
              </button>
            </div>

            {detail.sourceDrift !== "NONE" ? (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                {detail.sourceDrift === "METRE_CHANGED_AFTER_ORDER"
                  ? "Le métré source a changé après commande. La commande n’a pas été modifiée."
                  : "Métré modifié depuis la création de ce besoin."}
              </div>
            ) : null}

            <Section title="Identité">
              <Row
                k="Mode"
                v={
                  SUPPLY_PROCUREMENT_LABELS[detail.procurementMode] ??
                  detail.procurementMode
                }
              />
              {detail.description ? (
                <Row k="Description" v={detail.description} />
              ) : null}
            </Section>

            <Section title="Quantités">
              {detail.sourceQuantity != null ? (
                <Row
                  k="Métré (source)"
                  v={`${formatQty(detail.sourceQuantity)} ${detail.sourceUnit || ""}`}
                />
              ) : null}
              {detail.calculatedQuantity != null ? (
                <Row
                  k="Calculé"
                  v={`${formatQty(detail.calculatedQuantity)} ${detail.unit}`}
                />
              ) : null}
              {detail.lossFactor != null ? (
                <Row k="Perte" v={`${(detail.lossFactor * 100).toFixed(1)} %`} />
              ) : null}
              {detail.packaging ? (
                <Row
                  k="Conditionnement"
                  v={`${detail.packaging}${
                    detail.packagingSize
                      ? ` (${formatQty(detail.packagingSize)} ${detail.packagingUnit || ""})`
                      : ""
                  }`}
                />
              ) : null}
              <Row
                k="À commander"
                v={`${formatQty(detail.validatedOrderQuantity)} ${detail.unit}`}
              />
            </Section>

            <Section title="Provenance">
              <Row k="Type" v={detail.sourceLabel || detail.sourceType} />
              {detail.takeoffCodes.length > 0 ? (
                <Row k="Codes métré" v={detail.takeoffCodes.join(", ")} />
              ) : null}
            </Section>

            <Section title="Planification">
              <Row k="Date besoin" v={formatDay(detail.neededAt)} />
              <Row k="Date limite commande" v={formatDay(detail.orderDeadlineAt)} />
            </Section>

            <Section title="Achats">
              <Row k="Couverture" v={detail.coverageLabel} />
              <Row
                k="Commandé / reçu"
                v={`${formatQty(detail.progress.ordered)} / ${formatQty(detail.progress.received)}`}
              />
              {detail.selectedOfferId ? (
                <Row k="Offre retenue" v="Oui — voir ci-dessous" />
              ) : (
                <Row k="Offre retenue" v="Aucune" />
              )}
              {detail.linkedOrders.length > 0 ? (
                <ul className="mt-1 space-y-1 text-xs text-slate-600">
                  {detail.linkedOrders.map((o) => (
                    <li key={o.lineId}>
                      {o.orderNumber} — {o.supplierName} (
                      {formatQty(o.allocated)} alloués)
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">Aucune commande liée.</p>
              )}
            </Section>

            <SupplyOffersPanel
              projectId={projectId}
              requirementId={detail.id}
              canWrite={canWrite}
              onChanged={() => void reload()}
            />

            {canWrite ? (
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => void cancelRequirement(detail.id)}
                  className="text-xs font-semibold text-red-700"
                >
                  Annuler le besoin
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(detail)}
                  className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Modifier
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {detail && editMode ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-3 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">
              Modifier le besoin
            </h3>
            {detail.hasOrderLinks ? (
              <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                Ce besoin est déjà partiellement ou totalement commandé. La
                commande ne sera pas modifiée.
                <label className="mt-2 flex items-start gap-2">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={confirmQtyWhenOrdered}
                    onChange={(e) => setConfirmQtyWhenOrdered(e.target.checked)}
                  />
                  <span>
                    Confirmer un changement de quantité à commander (BC
                    inchangé)
                  </span>
                </label>
              </div>
            ) : null}
            <NeedFormFields
              label={label}
              setLabel={setLabel}
              qty={qty}
              setQty={setQty}
              unit={unit}
              setUnit={setUnit}
              category={category}
              setCategory={setCategory}
              procurementMode={procurementMode}
              setProcurementMode={setProcurementMode}
              description={description}
              setDescription={setDescription}
              neededAt={neededAt}
              setNeededAt={setNeededAt}
              notes={notes}
              setNotes={setNotes}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditMode(false);
                  resetForm();
                }}
                className="text-xs font-semibold text-slate-600"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={busy || !label.trim() || !qty}
                onClick={() => void submitEdit()}
                className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4 border-t border-slate-100 pt-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {title}
      </p>
      <div className="mt-1.5 space-y-1">{children}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <p className="text-xs text-slate-700">
      <span className="font-semibold text-slate-500">{k} : </span>
      {v}
    </p>
  );
}

function NeedFormFields(props: {
  label: string;
  setLabel: (v: string) => void;
  qty: string;
  setQty: (v: string) => void;
  unit: string;
  setUnit: (v: string) => void;
  category: SupplyCategory;
  setCategory: (v: SupplyCategory) => void;
  procurementMode: string;
  setProcurementMode: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  neededAt: string;
  setNeededAt: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
}) {
  return (
    <div className="mt-4 space-y-3">
      <label className="block space-y-1 text-sm">
        <span className="text-xs font-bold uppercase text-slate-500">
          Catégorie
        </span>
        <select
          value={props.category}
          onChange={(e) => props.setCategory(e.target.value as SupplyCategory)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          {SUPPLY_CATEGORY_OPTIONS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-xs font-bold uppercase text-slate-500">
          Désignation *
        </span>
        <input
          value={props.label}
          onChange={(e) => props.setLabel(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-xs font-bold uppercase text-slate-500">
          Description
        </span>
        <textarea
          value={props.description}
          onChange={(e) => props.setDescription(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-xs font-bold uppercase text-slate-500">
          Mode d’obtention
        </span>
        <select
          value={props.procurementMode}
          onChange={(e) => props.setProcurementMode(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          {Object.entries(SUPPLY_PROCUREMENT_LABELS).map(([id, lab]) => (
            <option key={id} value={id}>
              {lab}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1 text-sm">
          <span className="text-xs font-bold uppercase text-slate-500">
            Quantité à commander *
          </span>
          <input
            value={props.qty}
            onChange={(e) => props.setQty(e.target.value)}
            inputMode="decimal"
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-xs font-bold uppercase text-slate-500">
            Unité *
          </span>
          <input
            value={props.unit}
            onChange={(e) => props.setUnit(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
      </div>
      <label className="block space-y-1 text-sm">
        <span className="text-xs font-bold uppercase text-slate-500">
          Date de besoin
        </span>
        <input
          type="date"
          value={props.neededAt}
          onChange={(e) => props.setNeededAt(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-xs font-bold uppercase text-slate-500">Notes</span>
        <textarea
          value={props.notes}
          onChange={(e) => props.setNotes(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </label>
    </div>
  );
}
