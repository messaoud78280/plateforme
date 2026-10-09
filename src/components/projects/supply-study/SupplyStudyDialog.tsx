"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  Calculator,
  Calendar,
  Check,
  Eye,
  FileText,
  Link2,
  Package,
  Pencil,
  Ruler,
  ShoppingCart,
  X,
} from "lucide-react";
import type { MaterialRequirementRow } from "@/lib/materiaux/load-for-project";
import { formatQty } from "@/lib/materiaux/progress";
import type {
  SupplyOfferComparison,
} from "@/lib/supply/offer-compare";
import type { SupplyOfferView } from "@/lib/supply/offer-types";
import { BeworkPatchToolbar } from "@/components/bework-patch/BeworkPatchToolbar";
import { getSectionCapability } from "@/lib/bework-patch/capability";
import { SupplyAddOfferModal } from "@/components/projects/SupplyOffersPanel";
import {
  formatStudyDay,
  formatStudyMoney,
  isJustifiedPricedOffer,
  needStatusLabel,
  normalizeOfferUrl,
  percentVsBest,
  validateProductUrl,
} from "@/components/projects/supply-study/supply-study-format";
import {
  buildNeedWarnings,
  buildOfferWarnings,
} from "@/components/projects/supply-study/supply-study-warnings";

type SortKey = "price_asc" | "price_desc" | "supplier" | "date" | "source";

type SupplierOpt = {
  id: string;
  name: string;
  tradeName: string | null;
  parentExternalOrgId: string | null;
  city: string | null;
};

const SOURCE_BADGE: Record<string, string> = {
  WEB_VERIFIED: "WEB_VERIFIED",
  SUPPLIER_QUOTE: "SUPPLIER_QUOTE",
  USER_ENTERED: "SAISIE",
  IMPORT: "IMPORT",
};

export function SupplyStudyDialog({
  open,
  projectId,
  projectTitle,
  need,
  canWrite,
  onClose,
  onChanged,
}: {
  open: boolean;
  projectId: string;
  projectTitle: string;
  need: MaterialRequirementRow;
  canWrite: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);

  const [offers, setOffers] = useState<SupplyOfferView[]>([]);
  const [comparison, setComparison] = useState<SupplyOfferComparison | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [inspectedId, setInspectedId] = useState<string | null>(null);
  const [productUrl, setProductUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [urlReady, setUrlReady] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("price_asc");
  const [showArchived, setShowArchived] = useState(false);
  const [addMode, setAddMode] = useState<"manual" | "quote" | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierOpt[]>([]);
  const [editDesc, setEditDesc] = useState(false);
  const [draftLabel, setDraftLabel] = useState(need.label);
  const [draftDescription, setDraftDescription] = useState(
    need.description ?? "",
  );
  const [draftNotes, setDraftNotes] = useState(need.notes ?? "");
  const [draftQty, setDraftQty] = useState(
    String(need.validatedOrderQuantity ?? need.quantityRequired),
  );
  const [draftNeededAt, setDraftNeededAt] = useState(
    need.neededAt ? need.neededAt.slice(0, 10) : "",
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const dirty = useMemo(() => {
    const qtyNum = Number(String(draftQty).replace(",", "."));
    const qtyChanged =
      Number.isFinite(qtyNum) &&
      qtyNum !== (need.validatedOrderQuantity ?? need.quantityRequired);
    return (
      draftLabel.trim() !== need.label ||
      (draftDescription.trim() || "") !== (need.description ?? "") ||
      (draftNotes.trim() || "") !== (need.notes ?? "") ||
      qtyChanged ||
      draftNeededAt !== (need.neededAt ? need.neededAt.slice(0, 10) : "")
    );
  }, [draftLabel, draftDescription, draftNotes, draftQty, draftNeededAt, need]);

  const loadOffers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/projets/${projectId}/materiaux/${need.id}/offers`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur chargement offres");
      const list = (data.offers ?? []) as SupplyOfferView[];
      setOffers(list);
      setComparison(data.comparison ?? null);
      setInspectedId((prev) => {
        if (prev && list.some((o) => o.id === prev)) return prev;
        const selected = list.find((o) => o.isSelected && !o.archivedAt);
        return selected?.id ?? list.find((o) => !o.archivedAt)?.id ?? null;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [projectId, need.id]);

  useEffect(() => {
    if (!open) return;
    setDraftLabel(need.label);
    setDraftDescription(need.description ?? "");
    setDraftNotes(need.notes ?? "");
    setDraftQty(String(need.validatedOrderQuantity ?? need.quantityRequired));
    setDraftNeededAt(need.neededAt ? need.neededAt.slice(0, 10) : "");
    setProductUrl("");
    setUrlError(null);
    setUrlReady(false);
    void loadOffers();
  }, [open, need, loadOffers]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        requestClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dirty]);

  useEffect(() => {
    if (!addMode) return;
    void (async () => {
      const res = await fetch("/api/suppliers?types=SUPPLIER,SUBCONTRACTOR");
      if (!res.ok) return;
      const data = await res.json();
      const rows = Array.isArray(data.suppliers)
        ? data.suppliers
        : Array.isArray(data.rows)
          ? data.rows
          : [];
      setSuppliers(
        rows.map(
          (s: {
            id: string;
            name: string;
            tradeName?: string | null;
            parentExternalOrgId?: string | null;
            city?: string | null;
          }) => ({
            id: s.id,
            name: s.name,
            tradeName: s.tradeName ?? null,
            parentExternalOrgId: s.parentExternalOrgId ?? null,
            city: s.city ?? null,
          }),
        ),
      );
    })();
  }, [addMode]);

  function requestClose() {
    if (dirty) {
      if (
        !confirm(
          "Des modifications non enregistrées seront perdues. Fermer quand même ?",
        )
      ) {
        return;
      }
    }
    onClose();
  }

  const activeOffers = useMemo(
    () =>
      showArchived ? offers : offers.filter((o) => !o.archivedAt),
    [offers, showArchived],
  );

  const sortedOffers = useMemo(() => {
    const list = [...activeOffers];
    list.sort((a, b) => {
      switch (sortKey) {
        case "price_asc": {
          if (a.unitPrice == null && b.unitPrice == null) return 0;
          if (a.unitPrice == null) return 1;
          if (b.unitPrice == null) return -1;
          return a.unitPrice - b.unitPrice;
        }
        case "price_desc": {
          if (a.unitPrice == null && b.unitPrice == null) return 0;
          if (a.unitPrice == null) return 1;
          if (b.unitPrice == null) return -1;
          return b.unitPrice - a.unitPrice;
        }
        case "supplier":
          return (a.agencyDisplay || a.supplierName).localeCompare(
            b.agencyDisplay || b.supplierName,
            "fr",
          );
        case "date":
          return (b.observedAt || b.recordedAt).localeCompare(
            a.observedAt || a.recordedAt,
          );
        case "source":
          return a.priceSourceType.localeCompare(b.priceSourceType);
        default:
          return 0;
      }
    });
    return list;
  }, [activeOffers, sortKey]);

  const inspected = sortedOffers.find((o) => o.id === inspectedId) ?? null;
  const justifiedCount = offers.filter(
    (o) => !o.archivedAt && isJustifiedPricedOffer(o),
  ).length;
  const retainedCount = need.selectedOfferId ? 1 : 0;
  const needWarnings = buildNeedWarnings(need);
  const offerWarnings = inspected ? buildOfferWarnings(inspected, need) : [];

  const metreCodes = need.takeoffCodes ?? [];
  const subtitle = [
    projectTitle,
    metreCodes[0] || null,
    need.label,
  ]
    .filter(Boolean)
    .join(" · ");

  async function saveDraft() {
    if (!canWrite) return;
    setBusy(true);
    setError(null);
    try {
      const qtyNum = Number(String(draftQty).replace(",", "."));
      if (!(qtyNum > 0)) throw new Error("Quantité d’achat invalide");
      const res = await fetch(
        `/api/projets/${projectId}/materiaux/${need.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: draftLabel.trim(),
            description: draftDescription.trim() || null,
            notes: draftNotes.trim() || null,
            validatedOrderQuantity: qtyNum,
            neededAt: draftNeededAt || null,
            allowQuantityChangeWhenOrdered: need.hasOrderLinks,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Enregistrement impossible");
      setToast("Brouillon enregistré");
      window.setTimeout(() => setToast(null), 3000);
      onChanged();
      setEditDesc(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function retainOffer() {
    if (!canWrite || !inspected || inspected.archivedAt) return;
    const warns = buildOfferWarnings(inspected, need);
    const critical = warns.filter((w) => w.tone === "critical");
    const msg =
      critical.length > 0
        ? `Points critiques :\n- ${critical.map((w) => w.message).join("\n- ")}\n\nRetenir quand même cette offre ? (aucun BC ne sera créé)`
        : `Retenir l’offre « ${inspected.productLabel} » chez ${inspected.agencyDisplay || inspected.supplierName} ?\nAucun bon de commande ne sera créé.`;
    if (!confirm(msg)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/projets/${projectId}/materiaux/${need.id}/offers/${inspected.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ select: true }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sélection impossible");
      if (data.purchaseOrdersCreated > 0) {
        throw new Error("Anomalie : un BC a été créé — opération refusée côté UI");
      }
      setToast("Offre retenue");
      window.setTimeout(() => setToast(null), 3000);
      await loadOffers();
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  function prepareUrlAnalysis() {
    const v = validateProductUrl(productUrl);
    if (!v.ok) {
      setUrlError(v.error);
      setUrlReady(false);
      return;
    }
    setUrlError(null);
    const norm = normalizeOfferUrl(v.url);
    const dup = offers.find(
      (o) => !o.archivedAt && normalizeOfferUrl(o.sourceUrl) === norm,
    );
    if (dup) {
      setUrlError(
        `Cette URL est déjà liée à l’offre « ${dup.productLabel} ». Vous pouvez quand même préparer le contexte.`,
      );
    }
    setProductUrl(v.url);
    setUrlReady(true);
  }

  async function copyUrlContext() {
    const v = validateProductUrl(productUrl);
    if (!v.ok) {
      setUrlError(v.error);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/bework-patch/context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "SUPPLY",
          projectId,
          entityId: projectId,
          purpose: "analyze_product_url",
          focusRequirementId: need.id,
          productUrl: v.url,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Contexte indisponible");
      await navigator.clipboard.writeText(data.text);
      setToast("Contexte d’analyse URL copié — collez-le dans ChatGPT");
      window.setTimeout(() => setToast(null), 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Copie impossible");
    } finally {
      setBusy(false);
    }
  }

  async function submitOffer(input: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/projets/${projectId}/materiaux/${need.id}/offers`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setAddMode(null);
      await loadOffers();
      onChanged();
      setToast("Offre enregistrée");
      window.setTimeout(() => setToast(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  const qtyProposedLabel =
    need.sourceType === "HYPOTHESIS" || need.status === "PROPOSED"
      ? "Proposé (hypothèse)"
      : need.status === "VALIDATED"
        ? "Validé métier"
        : "Proposé";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-2 sm:p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex h-[min(95vh,920px)] w-[min(95vw,1400px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        {/* Header */}
        <header className="shrink-0 border-b border-slate-100 px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id={titleId}
                  className="text-base font-bold text-slate-900 sm:text-lg"
                >
                  Étude d’approvisionnement
                </h2>
                <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-800">
                  {needStatusLabel(need.status)}
                </span>
              </div>
              <p className="mt-1 max-w-2xl truncate text-xs text-slate-500 sm:text-sm">
                {subtitle}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SummaryChip value={offers.filter((o) => !o.archivedAt).length} label="offres" />
              <SummaryChip
                value={justifiedCount}
                label="prix justifiés"
                hint="Prix renseigné + preuve selon la provenance"
              />
              <SummaryChip value={retainedCount} label="offre retenue" />
              <div className="rounded-xl border border-sky-200 bg-sky-50/80 px-3 py-1.5 text-right">
                <p className="text-[10px] font-bold uppercase tracking-wide text-sky-700">
                  À commander
                </p>
                <p className="text-sm font-bold tabular-nums text-[#1e3a5f]">
                  {formatQty(need.progress.remainingToOrder)} {need.unit}
                </p>
              </div>
              <button
                type="button"
                aria-label="Fermer"
                onClick={requestClose}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          {toast ? (
            <p className="mt-2 text-xs font-medium text-emerald-800">{toast}</p>
          ) : null}
          {error ? (
            <p className="mt-2 text-xs font-medium text-red-700" role="alert">
              {error}
            </p>
          ) : null}
        </header>

        {/* Body 3 columns */}
        <div className="grid min-h-0 flex-1 grid-cols-1 divide-y divide-slate-100 overflow-hidden lg:grid-cols-12 lg:divide-x lg:divide-y-0">
          {/* Left — Need */}
          <section className="flex min-h-0 flex-col overflow-y-auto p-4 lg:col-span-3">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
              Besoin chantier
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <QtyCard
                icon={<Ruler className="h-3.5 w-3.5" />}
                label="Métré source"
                value={
                  need.sourceQuantity != null
                    ? `${formatQty(need.sourceQuantity)} ${need.sourceUnit || ""}`
                    : "—"
                }
                hint={metreCodes.length ? metreCodes.join(", ") : "Code non lié"}
              />
              <QtyCard
                icon={<Calculator className="h-3.5 w-3.5" />}
                label="Calcul théorique"
                value={
                  need.calculatedQuantity != null
                    ? `${formatQty(need.calculatedQuantity)} ${need.unit}`
                    : "—"
                }
                hint="Conversion enregistrée"
              />
              <QtyCard
                icon={<ShoppingCart className="h-3.5 w-3.5" />}
                label="Achat proposé"
                value={`${formatQty(Number(draftQty) || need.validatedOrderQuantity)} ${need.unit}`}
                hint={qtyProposedLabel}
              />
              <QtyCard
                icon={<Calendar className="h-3.5 w-3.5" />}
                label="Besoin pour"
                value={formatStudyDay(need.neededAt)}
                hint={
                  need.orderDeadlineAt
                    ? `Limite cmd ${formatStudyDay(need.orderDeadlineAt)}`
                    : "Sans délai inventé"
                }
              />
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Contexte technique
                </p>
                {canWrite ? (
                  <button
                    type="button"
                    onClick={() => setEditDesc((v) => !v)}
                    className="rounded p-1 text-slate-500 hover:bg-white"
                    aria-label="Modifier le contexte"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
              {editDesc ? (
                <div className="mt-2 space-y-2">
                  <input
                    value={draftLabel}
                    onChange={(e) => setDraftLabel(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
                  />
                  <textarea
                    value={draftDescription}
                    onChange={(e) => setDraftDescription(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
                    placeholder="Description technique"
                  />
                  <input
                    value={draftQty}
                    onChange={(e) => setDraftQty(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
                    aria-label="Quantité d'achat proposée"
                  />
                  <input
                    type="date"
                    value={draftNeededAt}
                    onChange={(e) => setDraftNeededAt(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
                  />
                  <textarea
                    value={draftNotes}
                    onChange={(e) => setDraftNotes(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
                    placeholder="Notes / hypothèses"
                  />
                </div>
              ) : (
                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  {need.description || need.label}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {metreCodes.length ? (
                  <Tag>Métré</Tag>
                ) : null}
                {need.scheduleTaskIds?.length ? <Tag>Planning</Tag> : null}
                {need.sourceType === "HYPOTHESIS" ? <Tag tone="amber">Hypothèse</Tag> : null}
                {needWarnings.some((w) => w.id === "need-hypothesis") ? (
                  <Tag tone="amber">À valider</Tag>
                ) : null}
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Détail du calcul
              </p>
              <ul className="mt-2 space-y-1 text-xs text-slate-700">
                <li>
                  Métré :{" "}
                  {need.sourceQuantity != null
                    ? `${formatQty(need.sourceQuantity)} ${need.sourceUnit || ""}`
                    : "non renseigné"}
                </li>
                <li>Ratio : non renseigné en base (pas inventé)</li>
                <li>
                  Quantité théorique :{" "}
                  {need.calculatedQuantity != null
                    ? `${formatQty(need.calculatedQuantity)} ${need.unit}`
                    : "—"}
                </li>
                <li>
                  Perte :{" "}
                  {need.lossFactor != null
                    ? `${(need.lossFactor * 100).toFixed(1)} %`
                    : "—"}
                </li>
                <li className="font-semibold text-slate-900">
                  Quantité proposée :{" "}
                  {formatQty(need.validatedOrderQuantity)} {need.unit}
                </li>
                <li>
                  Commandé / reçu : {formatQty(need.progress.ordered)} /{" "}
                  {formatQty(need.progress.received)} {need.unit}
                </li>
                <li>
                  Restant à commander :{" "}
                  {formatQty(need.progress.remainingToOrder)} {need.unit}
                </li>
              </ul>
            </div>

            {need.scheduleTaskIds?.length ? (
              <p className="mt-3 text-[11px] text-slate-500">
                Tâches planning : {need.scheduleTaskIds.join(", ")}
              </p>
            ) : null}
          </section>

          {/* Center — Sources */}
          <section className="flex min-h-0 flex-col overflow-hidden p-4 lg:col-span-5">
            <h3 className="shrink-0 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
              Sources &amp; comparaison
            </h3>

            <div className="mt-3 flex shrink-0 gap-2">
              <div className="relative flex-1">
                <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={productUrl}
                  onChange={(e) => {
                    setProductUrl(e.target.value);
                    setUrlReady(false);
                    setUrlError(null);
                  }}
                  placeholder="Coller l’URL d’un produit fournisseur…"
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={prepareUrlAnalysis}
                className="shrink-0 rounded-xl bg-[#2563eb] px-3 py-2 text-xs font-bold text-white hover:bg-[#1d4ed8]"
              >
                Analyser le lien
              </button>
            </div>
            {urlError ? (
              <p className="mt-1.5 text-[11px] text-amber-800">{urlError}</p>
            ) : null}
            {urlReady ? (
              <div className="mt-2 rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 py-2">
                <p className="text-[11px] text-indigo-950">
                  Aucune extraction automatique côté serveur. Préparez le contexte
                  puis analysez l’URL dans ChatGPT (recherche réelle).
                </p>
                <button
                  type="button"
                  disabled={busy || !canWrite}
                  onClick={() => void copyUrlContext()}
                  className="mt-2 rounded-lg border border-indigo-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-indigo-900"
                >
                  Copier pour analyse avec ChatGPT
                </button>
              </div>
            ) : null}

            <div className="mt-3 flex shrink-0 flex-wrap gap-2">
              {canWrite ? (
                <BeworkPatchToolbar
                  section="SUPPLY"
                  projectId={projectId}
                  entityId={projectId}
                  version={0}
                  capability={getSectionCapability("SUPPLY")}
                  entityLabel={need.label}
                  primaryActionLabel="Préparer avec ChatGPT"
                  compact
                  focusRequirementId={need.id}
                  productUrl={productUrl.trim() || null}
                  onApplied={() => {
                    void loadOffers();
                    onChanged();
                  }}
                />
              ) : null}
              {canWrite ? (
                <>
                  <button
                    type="button"
                    onClick={() => setAddMode("manual")}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700"
                  >
                    + Ajouter manuellement
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddMode("quote")}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Importer un devis
                  </button>
                </>
              ) : null}
            </div>

            <div className="mt-3 flex shrink-0 flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-600">
                {loading
                  ? "Chargement…"
                  : `${sortedOffers.length} offre${sortedOffers.length > 1 ? "s" : ""}`}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1 text-[11px] text-slate-600">
                  <input
                    type="checkbox"
                    checked={showArchived}
                    onChange={(e) => setShowArchived(e.target.checked)}
                  />
                  Archivées
                </label>
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-[11px]"
                  aria-label="Trier les offres"
                >
                  <option value="price_asc">Prix croissant</option>
                  <option value="price_desc">Prix décroissant</option>
                  <option value="supplier">Fournisseur</option>
                  <option value="date">Date de relevé</option>
                  <option value="source">Provenance</option>
                </select>
              </div>
            </div>

            <div className="mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5">
              {!loading && sortedOffers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                  Aucune offre pour ce besoin. Ajoutez-en une ou préparez une
                  recherche ChatGPT.
                </div>
              ) : null}
              {sortedOffers.map((o) => {
                const selected = inspectedId === o.id;
                const vs = comparison?.comparableUnitPrice
                  ? percentVsBest(
                      o,
                      comparison.lowestUnitPriceOfferId,
                      sortedOffers,
                    )
                  : null;
                const justified =
                  o.priceSourceType === "WEB_VERIFIED" &&
                  isJustifiedPricedOffer(o);
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setInspectedId(o.id)}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                      selected
                        ? "border-[#2563eb] bg-sky-50/40 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    } ${o.archivedAt ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-1 h-4 w-4 shrink-0 rounded-full border-2 ${
                          selected
                            ? "border-[#2563eb] bg-[#2563eb]"
                            : "border-slate-300"
                        }`}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-bold text-slate-900">
                            {o.agencyDisplay || o.supplierName}
                          </p>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              justified
                                ? "bg-emerald-100 text-emerald-800"
                                : o.priceSourceType === "SUPPLIER_QUOTE"
                                  ? "bg-slate-200 text-slate-700"
                                  : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {SOURCE_BADGE[o.priceSourceType] ?? o.priceSourceType}
                          </span>
                          {o.isSelected ? (
                            <span className="rounded bg-[#1e3a5f] px-1.5 py-0.5 text-[10px] font-bold text-white">
                              Retenue
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-slate-600">
                          {o.productLabel}
                          {o.productRef ? ` · ${o.productRef}` : ""}
                        </p>
                        <div className="mt-1 flex flex-wrap items-baseline gap-2">
                          <p className="text-sm font-bold tabular-nums text-slate-900">
                            {o.unitPrice == null
                              ? "Prix non reçu"
                              : `${formatStudyMoney(o.unitPrice)}/${o.priceUnit} ${o.priceTaxMode}`}
                          </p>
                          {vs ? (
                            <span className="text-[11px] font-semibold text-red-600">
                              {vs}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {o.packagingLabel || "Conditionnement —"}
                          {" · "}
                          {formatStudyDay(o.observedAt || o.recordedAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {comparison?.notes?.length ? (
              <p className="mt-2 shrink-0 text-[11px] text-slate-500">
                {comparison.notes[0]}
              </p>
            ) : null}
          </section>

          {/* Right — Offer detail */}
          <section className="flex min-h-0 flex-col overflow-y-auto p-4 lg:col-span-4">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
              {inspected?.isSelected ? "Offre retenue" : "Détail de l’offre"}
            </h3>
            {!inspected ? (
              <p className="mt-6 text-sm text-slate-500">
                Sélectionnez une offre dans le comparateur pour l’inspecter.
                Consulter ≠ retenir.
              </p>
            ) : (
              <>
                <div className="mt-3 flex items-start gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                    <Package className="h-6 w-6 text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">
                      {inspected.agencyDisplay || inspected.supplierName}
                    </p>
                    <p className="text-sm text-slate-700">
                      {inspected.productLabel}
                    </p>
                    {inspected.productRef ? (
                      <p className="text-xs text-slate-500">
                        Réf. {inspected.productRef}
                      </p>
                    ) : null}
                  </div>
                </div>

                <dl className="mt-4 space-y-2 rounded-xl border border-slate-200 p-3 text-sm">
                  <DetailRow k="Fournisseur" v={inspected.supplierName} />
                  <DetailRow
                    k="Prix"
                    v={
                      inspected.unitPrice == null
                        ? "Non renseigné"
                        : `${formatStudyMoney(inspected.unitPrice)} / ${inspected.priceUnit} ${inspected.priceTaxMode}`
                    }
                  />
                  <DetailRow
                    k="Fiscalité"
                    v={
                      inspected.vatRate != null
                        ? `TVA ${inspected.vatRate} %`
                        : "À confirmer"
                    }
                  />
                  <DetailRow
                    k="Conditionnement"
                    v={inspected.packagingLabel || "—"}
                  />
                  <DetailRow
                    k="Disponibilité"
                    v={inspected.availabilityNote || "À confirmer"}
                  />
                  <DetailRow
                    k="Délai"
                    v={
                      inspected.leadTimeDays != null
                        ? `${inspected.leadTimeDays} j`
                        : "Inconnu"
                    }
                  />
                  <DetailRow
                    k="Livraison"
                    v={
                      inspected.deliveryFee == null
                        ? "Non renseignée"
                        : formatStudyMoney(inspected.deliveryFee, 2)
                    }
                  />
                </dl>

                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                  <p className="text-[11px] font-bold uppercase text-slate-500">
                    Coût calculable
                  </p>
                  <p className="mt-1 text-lg font-bold tabular-nums text-[#1e3a5f]">
                    {inspected.renderedCost.displayLabel}
                  </p>
                  {inspected.renderedCost.completeness !== "COMPLETE" ? (
                    <p className="mt-1 text-[11px] text-amber-800">
                      Total partiel
                      {inspected.renderedCost.missingLabels.length
                        ? ` — ${inspected.renderedCost.missingLabels.join(", ")}`
                        : ""}
                    </p>
                  ) : null}
                  {inspected.productCost.status === "UNKNOWN" &&
                  inspected.productCost.reason ? (
                    <p className="mt-1 text-[11px] text-slate-500">
                      {inspected.productCost.reason}
                    </p>
                  ) : null}
                </div>

                <div className="mt-3 rounded-xl border border-slate-200 p-3">
                  <p className="text-[11px] font-bold uppercase text-slate-500">
                    Source
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    {SOURCE_BADGE[inspected.priceSourceType]} · relevé{" "}
                    {formatStudyDay(inspected.observedAt || inspected.recordedAt)}
                  </p>
                  {inspected.sourceUrl ? (
                    <a
                      href={inspected.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block truncate text-xs font-semibold text-[#2563eb] hover:underline"
                    >
                      Ouvrir la fiche fournisseur
                    </a>
                  ) : (
                    <p className="mt-1 text-xs text-slate-400">Pas d’URL</p>
                  )}
                  {inspected.quoteNumber ? (
                    <p className="mt-1 text-xs text-slate-600">
                      Devis n° {inspected.quoteNumber}
                    </p>
                  ) : null}
                </div>

                {(offerWarnings.length > 0 || needWarnings.length > 0) && (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-amber-900">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Points de vigilance
                    </div>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-amber-950">
                      {[...offerWarnings, ...needWarnings].map((w) => (
                        <li key={w.id}>{w.message}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </section>
        </div>

        {/* Footer */}
        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-white px-4 py-3 sm:px-5">
          <button
            type="button"
            disabled={!canWrite || busy || !dirty}
            onClick={() => void saveDraft()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-45"
          >
            <FileText className="h-3.5 w-3.5" />
            Enregistrer le brouillon
          </button>
          <button
            type="button"
            disabled={!dirty && !inspected}
            onClick={() => setPreviewOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-45"
          >
            <Eye className="h-3.5 w-3.5" />
            Prévisualiser les modifications
          </button>
          <button
            type="button"
            disabled={!canWrite || busy || !inspected || Boolean(inspected?.archivedAt)}
            onClick={() => void retainOffer()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563eb] px-4 py-2 text-xs font-bold text-white hover:bg-[#1d4ed8] disabled:opacity-45"
          >
            <Check className="h-3.5 w-3.5" />
            Retenir l’offre
          </button>
        </footer>
      </div>

      {addMode ? (
        <SupplyAddOfferModal
          suppliers={suppliers}
          busy={busy}
          defaultSourceType={
            addMode === "quote" ? "SUPPLIER_QUOTE" : "USER_ENTERED"
          }
          title={
            addMode === "quote"
              ? "Importer un devis fournisseur"
              : "Ajouter une offre manuellement"
          }
          onClose={() => setAddMode(null)}
          onSubmit={submitOffer}
        />
      ) : null}

      {previewOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">
              Prévisualisation
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Aucun enregistrement tant que vous ne confirmez pas.
            </p>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {dirty ? (
                <>
                  <li>
                    Libellé : {need.label} → {draftLabel}
                  </li>
                  <li>
                    Qty achat : {formatQty(need.validatedOrderQuantity)} →{" "}
                    {draftQty} {need.unit}
                  </li>
                  <li>
                    Date besoin : {formatStudyDay(need.neededAt)} →{" "}
                    {draftNeededAt || "—"}
                  </li>
                </>
              ) : (
                <li>Aucune modification de besoin en attente.</li>
              )}
              {inspected ? (
                <li>
                  Offre inspectée : {inspected.productLabel}
                  {inspected.isSelected ? " (déjà retenue)" : " (pas encore retenue)"}
                </li>
              ) : null}
            </ul>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="text-xs font-semibold text-slate-600"
              >
                Fermer
              </button>
              {dirty && canWrite ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setPreviewOpen(false);
                    void saveDraft();
                  }}
                  className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Enregistrer le brouillon
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SummaryChip({
  value,
  label,
  hint,
}: {
  value: number;
  label: string;
  hint?: string;
}) {
  return (
    <div
      className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-center"
      title={hint}
    >
      <p className="text-sm font-bold tabular-nums text-slate-900">{value}</p>
      <p className="text-[10px] font-medium text-slate-500">{label}</p>
    </div>
  );
}

function QtyCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-sky-100 bg-sky-50/50 px-2.5 py-2">
      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-sky-800/80">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-sm font-bold tabular-nums text-[#1e3a5f]">
        {value}
      </p>
      <p className="mt-0.5 text-[10px] text-slate-500">{hint}</p>
    </div>
  );
}

function Tag({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "slate" | "amber";
}) {
  return (
    <span
      className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
        tone === "amber"
          ? "bg-amber-100 text-amber-900"
          : "bg-slate-100 text-slate-700"
      }`}
    >
      {children}
    </span>
  );
}

function DetailRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-slate-50 pb-1.5 last:border-0">
      <dt className="text-xs text-slate-500">{k}</dt>
      <dd className="text-right text-xs font-semibold text-slate-800">{v}</dd>
    </div>
  );
}
