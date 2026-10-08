"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type {
  SupplyOfferComparison,
} from "@/lib/supply/offer-compare";
import type {
  SupplyOfferPriceSourceType,
  SupplyOfferView,
} from "@/lib/supply/offer-types";
import { SUPPLY_PRICE_UNITS } from "@/lib/supply/offer-types";

const EQUIV_LABELS: Record<string, string> = {
  TO_VERIFY: "À vérifier",
  PROBABLE: "Probable",
  CONFIRMED: "Confirmée",
};

const FRESH_LABELS: Record<string, string> = {
  FRESH: "À jour",
  TO_REFRESH: "À rafraîchir",
  EXPIRED: "Expirée",
};

const SOURCE_LABELS: Record<string, string> = {
  WEB_VERIFIED: "Web vérifié",
  SUPPLIER_QUOTE: "Devis fournisseur",
  USER_ENTERED: "Saisie manuelle",
  IMPORT: "Import",
};

function formatDay(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR");
}

function formatMoney(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "Prix non disponible";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 4,
  }).format(v);
}

type SupplierOpt = {
  id: string;
  name: string;
  tradeName: string | null;
  parentExternalOrgId: string | null;
  city: string | null;
};

export function SupplyOffersPanel({
  projectId,
  requirementId,
  canWrite,
  onChanged,
}: {
  projectId: string;
  requirementId: string;
  canWrite: boolean;
  onChanged?: () => void;
}) {
  const [offers, setOffers] = useState<SupplyOfferView[]>([]);
  const [comparison, setComparison] = useState<SupplyOfferComparison | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [suppliers, setSuppliers] = useState<SupplierOpt[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/projets/${projectId}/materiaux/${requirementId}/offers`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur chargement offres");
      setOffers(data.offers ?? []);
      setComparison(data.comparison ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [projectId, requirementId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!addOpen) return;
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
  }, [addOpen]);

  async function selectOffer(offerId: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/projets/${projectId}/materiaux/${requirementId}/offers/${offerId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ select: true }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      if (data.purchaseOrdersCreated > 0) {
        throw new Error("Anomalie : un BC a été créé — opération annulée côté UI");
      }
      await load();
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function archiveOffer(offerId: string) {
    if (!confirm("Archiver cette offre ? Elle reste consultable en historique.")) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(
        `/api/projets/${projectId}/materiaux/${requirementId}/offers/${offerId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ archive: true }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      await load();
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 border-t border-slate-100 pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
          Offres fournisseurs
        </p>
        {canWrite ? (
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="rounded-lg bg-[#1e3a5f] px-2.5 py-1 text-[11px] font-bold text-white"
          >
            + Ajouter une offre
          </button>
        ) : null}
      </div>

      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
      {loading ? (
        <p className="mt-2 text-xs text-slate-500">Chargement des offres…</p>
      ) : offers.length === 0 ? (
        <p className="mt-2 text-xs text-slate-500">
          Aucune offre fournisseur pour ce besoin. Le prix reste à renseigner —
          aucune valeur inventée.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {comparison?.notes?.length ? (
            <p className="text-[11px] text-slate-500">
              {comparison.notes.join(" · ")}
            </p>
          ) : null}
          {offers.map((o) => (
            <OfferCard
              key={o.id}
              offer={o}
              highlightUnit={
                comparison?.comparableUnitPrice &&
                comparison.lowestUnitPriceOfferId === o.id
              }
              highlightRendered={
                comparison?.comparableRenderedComplete &&
                comparison.lowestRenderedCostOfferId === o.id
              }
              canWrite={canWrite}
              busy={busy}
              onSelect={() => void selectOffer(o.id)}
              onArchive={() => void archiveOffer(o.id)}
            />
          ))}
        </div>
      )}

      {addOpen ? (
        <AddOfferModal
          suppliers={suppliers}
          busy={busy}
          onClose={() => setAddOpen(false)}
          onSubmit={async (input) => {
            setBusy(true);
            setError(null);
            try {
              const res = await fetch(
                `/api/projets/${projectId}/materiaux/${requirementId}/offers`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(input),
                },
              );
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || "Erreur");
              setAddOpen(false);
              await load();
              onChanged?.();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Erreur");
            } finally {
              setBusy(false);
            }
          }}
        />
      ) : null}
    </div>
  );
}

function OfferCard({
  offer,
  highlightUnit,
  highlightRendered,
  canWrite,
  busy,
  onSelect,
  onArchive,
}: {
  offer: SupplyOfferView;
  highlightUnit?: boolean;
  highlightRendered?: boolean;
  canWrite: boolean;
  busy: boolean;
  onSelect: () => void;
  onArchive: () => void;
}) {
  return (
    <div
      className={`rounded-xl border px-3 py-3 ${
        offer.isSelected
          ? "border-emerald-300 bg-emerald-50/50"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {offer.agencyDisplay}
          </p>
          <p className="text-xs text-slate-700">{offer.productLabel}</p>
          {offer.productRef ? (
            <p className="text-[11px] font-mono text-slate-500">
              Réf. {offer.productRef}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-1">
          {offer.isSelected ? (
            <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-900">
              Offre retenue
            </span>
          ) : null}
          {highlightUnit ? (
            <span className="rounded-md bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-900">
              Prix produit le plus bas
            </span>
          ) : null}
          {highlightRendered ? (
            <span className="rounded-md bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-900">
              Coût rendu le plus bas
            </span>
          ) : null}
        </div>
      </div>

      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-700 sm:grid-cols-3">
        <div>
          <dt className="text-slate-400">Équivalence</dt>
          <dd className="font-medium">
            {EQUIV_LABELS[offer.equivalenceStatus] ?? offer.equivalenceStatus}
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">Prix</dt>
          <dd className="font-medium">
            {offer.unitPrice == null
              ? "Prix à renseigner"
              : `${formatMoney(offer.unitPrice)} / ${offer.priceUnit} ${offer.priceTaxMode}`}
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">Fraîcheur</dt>
          <dd className="font-medium">
            {FRESH_LABELS[offer.freshness] ?? offer.freshness}
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">Conditionnement</dt>
          <dd className="font-medium">
            {offer.packagingLabel ||
              (offer.unitsPerPack != null
                ? `${offer.unitsPerPack} / colis`
                : "—")}
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">Délai</dt>
          <dd className="font-medium">
            {offer.leadTimeDays != null ? `${offer.leadTimeDays} j` : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">Disponibilité</dt>
          <dd className="font-medium">{offer.availabilityNote || "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Livraison</dt>
          <dd className="font-medium">
            {offer.deliveryFee == null
              ? "Inconnue"
              : offer.deliveryFee === 0
                ? "Comprise / gratuite"
                : formatMoney(offer.deliveryFee)}
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">Grutage</dt>
          <dd className="font-medium">
            {offer.craneFee == null
              ? "Inconnu"
              : offer.craneFee === 0
                ? "Compris / gratuit"
                : formatMoney(offer.craneFee)}
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">Autres frais</dt>
          <dd className="font-medium">
            {offer.otherFees == null
              ? "Inconnus"
              : offer.otherFees === 0
                ? "Aucun"
                : formatMoney(offer.otherFees)}
          </dd>
        </div>
      </dl>

      <div className="mt-2 space-y-1 text-[11px]">
        <p className="text-slate-700">
          <span className="font-semibold text-slate-500">Coût produit : </span>
          {offer.productCost.status === "KNOWN"
            ? formatMoney(offer.productCost.amount)
            : offer.productCost.reason || "À confirmer"}
        </p>
        <p className="text-slate-700">
          <span className="font-semibold text-slate-500">Rendu chantier : </span>
          {offer.renderedCost.displayLabel}
          <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
            {offer.renderedCost.completeness}
          </span>
        </p>
        {offer.packagingProposal?.message ? (
          <p className="text-amber-900">{offer.packagingProposal.message}</p>
        ) : null}
        <SourceBlock offer={offer} />
      </div>

      {canWrite ? (
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onArchive}
            className="text-[11px] font-semibold text-slate-500"
          >
            Archiver
          </button>
          {!offer.isSelected ? (
            <button
              type="button"
              disabled={busy}
              onClick={onSelect}
              className="rounded-lg bg-[#1e3a5f] px-2.5 py-1 text-[11px] font-bold text-white disabled:opacity-60"
            >
              Retenir cette offre
            </button>
          ) : (
            <span className="text-[11px] font-semibold text-emerald-800">
              Retenue — changer = retenir une autre
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
}

function SourceBlock({ offer }: { offer: SupplyOfferView }) {
  return (
    <div className="rounded-lg bg-slate-50 px-2 py-1.5 text-slate-600">
      <p>
        Source : {SOURCE_LABELS[offer.priceSourceType] ?? offer.priceSourceType}
      </p>
      {offer.priceSourceType === "WEB_VERIFIED" ? (
        <>
          {offer.sourceUrl ? (
            <a
              href={offer.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#1e3a5f] underline"
            >
              Voir la source
            </a>
          ) : null}
          <p>Prix relevé le : {formatDay(offer.observedAt)}</p>
        </>
      ) : null}
      {offer.priceSourceType === "SUPPLIER_QUOTE" ? (
        <>
          <p>
            Devis fournisseur :{" "}
            {offer.quoteNumber
              ? `n° ${offer.quoteNumber}`
              : offer.quoteDocumentRef || "—"}
          </p>
          <p>Date : {formatDay(offer.observedAt || offer.recordedAt)}</p>
          <p>Validité : {formatDay(offer.validUntil)}</p>
        </>
      ) : null}
      {offer.priceSourceType === "USER_ENTERED" ? (
        <>
          <p>Saisi le : {formatDay(offer.recordedAt)}</p>
          <p>Par : {offer.recordedByName || "—"}</p>
        </>
      ) : null}
    </div>
  );
}

function AddOfferModal({
  suppliers,
  busy,
  onClose,
  onSubmit,
}: {
  suppliers: SupplierOpt[];
  busy: boolean;
  onClose: () => void;
  onSubmit: (input: Record<string, unknown>) => Promise<void>;
}) {
  const [supplierExternalOrgId, setSupplierExternalOrgId] = useState("");
  const [productLabel, setProductLabel] = useState("");
  const [productRef, setProductRef] = useState("");
  const [equivalenceStatus, setEquivalenceStatus] = useState("TO_VERIFY");
  const [unitPrice, setUnitPrice] = useState("");
  const [priceUnit, setPriceUnit] = useState("U");
  const [priceTaxMode, setPriceTaxMode] = useState<"HT" | "TTC">("HT");
  const [priceSourceType, setPriceSourceType] =
    useState<SupplyOfferPriceSourceType>("USER_ENTERED");
  const [sourceUrl, setSourceUrl] = useState("");
  const [quoteNumber, setQuoteNumber] = useState("");
  const [quoteDocumentRef, setQuoteDocumentRef] = useState("");
  const [observedAt, setObservedAt] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [packagingLabel, setPackagingLabel] = useState("");
  const [unitsPerPack, setUnitsPerPack] = useState("");
  const [leadTimeDays, setLeadTimeDays] = useState("");
  const [availabilityNote, setAvailabilityNote] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("");
  const [craneFee, setCraneFee] = useState("");
  const [otherFees, setOtherFees] = useState("");
  const [deliveryUnknown, setDeliveryUnknown] = useState(true);
  const [craneUnknown, setCraneUnknown] = useState(true);
  const [otherUnknown, setOtherUnknown] = useState(true);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="text-base font-bold text-slate-900">
          Ajouter une offre fournisseur
        </h3>
        <p className="mt-1 text-[11px] text-slate-500">
          Le prix est facultatif. Ne jamais inventer un montant.
        </p>

        <div className="mt-4 space-y-3">
          <label className="block space-y-1 text-sm">
            <span className="text-xs font-bold uppercase text-slate-500">
              Fournisseur / agence *
            </span>
            <select
              value={supplierExternalOrgId}
              onChange={(e) => setSupplierExternalOrgId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Sélectionner…</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {(s.tradeName || s.name) +
                    (s.city ? ` — ${s.city}` : "")}
                </option>
              ))}
            </select>
            <Link
              href="/dashboard/fournisseurs"
              target="_blank"
              className="text-[11px] font-semibold text-[#1e3a5f] underline"
            >
              Créer un fournisseur / une agence
            </Link>
          </label>

          <label className="block space-y-1 text-sm">
            <span className="text-xs font-bold uppercase text-slate-500">
              Produit *
            </span>
            <input
              value={productLabel}
              onChange={(e) => setProductLabel(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span className="text-xs font-bold uppercase text-slate-500">
              Référence
            </span>
            <input
              value={productRef}
              onChange={(e) => setProductRef(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span className="text-xs font-bold uppercase text-slate-500">
              Équivalence
            </span>
            <select
              value={equivalenceStatus}
              onChange={(e) => setEquivalenceStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {Object.entries(EQUIV_LABELS).map(([id, lab]) => (
                <option key={id} value={id}>
                  {lab}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-3 gap-2">
            <label className="space-y-1 text-sm">
              <span className="text-xs font-bold uppercase text-slate-500">
                Prix
              </span>
              <input
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="facultatif"
                inputMode="decimal"
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-xs font-bold uppercase text-slate-500">
                Unité
              </span>
              <select
                value={priceUnit}
                onChange={(e) => setPriceUnit(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {SUPPLY_PRICE_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-xs font-bold uppercase text-slate-500">
                HT / TTC
              </span>
              <select
                value={priceTaxMode}
                onChange={(e) =>
                  setPriceTaxMode(e.target.value as "HT" | "TTC")
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="HT">HT</option>
                <option value="TTC">TTC</option>
              </select>
            </label>
          </div>

          <label className="block space-y-1 text-sm">
            <span className="text-xs font-bold uppercase text-slate-500">
              Provenance
            </span>
            <select
              value={priceSourceType}
              onChange={(e) =>
                setPriceSourceType(e.target.value as SupplyOfferPriceSourceType)
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {Object.entries(SOURCE_LABELS).map(([id, lab]) => (
                <option key={id} value={id}>
                  {lab}
                </option>
              ))}
            </select>
          </label>

          {priceSourceType === "WEB_VERIFIED" ? (
            <label className="block space-y-1 text-sm">
              <span className="text-xs font-bold uppercase text-slate-500">
                URL source
              </span>
              <input
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://…"
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
          ) : null}

          {priceSourceType === "SUPPLIER_QUOTE" ? (
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1 text-sm">
                <span className="text-xs font-bold uppercase text-slate-500">
                  N° devis
                </span>
                <input
                  value={quoteNumber}
                  onChange={(e) => setQuoteNumber(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-xs font-bold uppercase text-slate-500">
                  Réf. document
                </span>
                <input
                  value={quoteDocumentRef}
                  onChange={(e) => setQuoteDocumentRef(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>
            </div>
          ) : null}

          <label className="block space-y-1 text-sm">
            <span className="text-xs font-bold uppercase text-slate-500">
              Date
            </span>
            <input
              type="date"
              value={observedAt}
              onChange={(e) => setObservedAt(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1 text-sm">
              <span className="text-xs font-bold uppercase text-slate-500">
                Conditionnement
              </span>
              <input
                value={packagingLabel}
                onChange={(e) => setPackagingLabel(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-xs font-bold uppercase text-slate-500">
                Unités / colis
              </span>
              <input
                value={unitsPerPack}
                onChange={(e) => setUnitsPerPack(e.target.value)}
                inputMode="decimal"
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1 text-sm">
              <span className="text-xs font-bold uppercase text-slate-500">
                Délai (j)
              </span>
              <input
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(e.target.value)}
                inputMode="decimal"
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-xs font-bold uppercase text-slate-500">
                Disponibilité
              </span>
              <input
                value={availabilityNote}
                onChange={(e) => setAvailabilityNote(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
          </div>

          <FeeField
            label="Livraison"
            unknown={deliveryUnknown}
            setUnknown={setDeliveryUnknown}
            value={deliveryFee}
            setValue={setDeliveryFee}
          />
          <FeeField
            label="Grutage"
            unknown={craneUnknown}
            setUnknown={setCraneUnknown}
            value={craneFee}
            setValue={setCraneFee}
          />
          <FeeField
            label="Autres frais"
            unknown={otherUnknown}
            setUnknown={setOtherUnknown}
            value={otherFees}
            setValue={setOtherFees}
          />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-600"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={
              busy || !supplierExternalOrgId || !productLabel.trim()
            }
            onClick={() =>
              void onSubmit({
                supplierExternalOrgId,
                productLabel,
                productRef: productRef || null,
                equivalenceStatus,
                unitPrice: unitPrice === "" ? null : Number(unitPrice),
                priceUnit,
                priceTaxMode,
                priceSourceType,
                sourceUrl: sourceUrl || null,
                quoteNumber: quoteNumber || null,
                quoteDocumentRef: quoteDocumentRef || null,
                observedAt: observedAt || null,
                recordedAt: new Date().toISOString(),
                packagingLabel: packagingLabel || null,
                unitsPerPack:
                  unitsPerPack === "" ? null : Number(unitsPerPack),
                leadTimeDays:
                  leadTimeDays === "" ? null : Number(leadTimeDays),
                availabilityNote: availabilityNote || null,
                deliveryFee: deliveryUnknown
                  ? null
                  : deliveryFee === ""
                    ? null
                    : Number(deliveryFee),
                craneFee: craneUnknown
                  ? null
                  : craneFee === ""
                    ? null
                    : Number(craneFee),
                otherFees: otherUnknown
                  ? null
                  : otherFees === ""
                    ? null
                    : Number(otherFees),
              })
            }
            className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

function FeeField({
  label,
  unknown,
  setUnknown,
  value,
  setValue,
}: {
  label: string;
  unknown: boolean;
  setUnknown: (v: boolean) => void;
  value: string;
  setValue: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase text-slate-500">
          {label}
        </span>
        <label className="flex items-center gap-1 text-[11px] text-slate-600">
          <input
            type="checkbox"
            checked={unknown}
            onChange={(e) => setUnknown(e.target.checked)}
          />
          Inconnu (null ≠ 0)
        </label>
      </div>
      {!unknown ? (
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="0 = réellement gratuit"
          inputMode="decimal"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      ) : (
        <p className="text-[11px] text-slate-400">Non renseigné</p>
      )}
    </div>
  );
}
