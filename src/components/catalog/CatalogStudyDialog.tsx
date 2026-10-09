"use client";

/**
 * Fiche Catalogue — disposition 3 colonnes alignée sur SupplyStudyDialog.
 * Pas de quantités chantier. Matériau valide sans produit/prix.
 */
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Link2,
  Package,
  Pencil,
  Plus,
  X,
} from "lucide-react";
import { formatStudyDay, formatStudyMoney } from "@/components/projects/supply-study/supply-study-format";

type StudyOffer = {
  id: string;
  supplierName: string;
  agencyDisplay: string;
  supplierExternalOrgId: string;
  priceUnit: string;
  packagingLabel: string | null;
  unitsPerPack: number | null;
  leadTimeDays: number | null;
  availabilityNote: string | null;
  deliveryFee: number | null;
  craneFee: number | null;
  otherFees: number | null;
  sourceUrl: string | null;
  priceSourceType: string | null;
  imageUrl: string | null;
  latestPrice: {
    unitPrice: number | null;
    priceUnit: string;
    priceTaxMode: string;
    observedAt: string | null;
    recordedAt: string;
    priceSourceType: string;
    sourceUrl: string | null;
  } | null;
  priceHistory: Array<{
    id: string;
    unitPrice: number | null;
    priceUnit: string;
    priceTaxMode: string;
    observedAt: string | null;
    recordedAt: string;
    priceSourceType: string;
  }>;
};

type StudyProduct = {
  id: string;
  label: string;
  manufacturer: string | null;
  manufacturerRef: string | null;
  gtin: string | null;
  dimensions: string | null;
  performances: string | null;
  imageUrl: string | null;
  sourceUrl: string | null;
  offers: StudyOffer[];
};

type Study = {
  id: string;
  family: string;
  designation: string;
  unit: string;
  description: string | null;
  status: string;
  notes: string | null;
  products: StudyProduct[];
};

type SupplierOpt = { id: string; name: string; tradeName: string | null; city: string | null };

export function CatalogStudyPanel({
  materialId,
  canWrite,
}: {
  materialId: string;
  canWrite: boolean;
}) {
  const [study, setStudy] = useState<Study | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [productId, setProductId] = useState<string | null>(null);
  const [offerId, setOfferId] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierOpt[]>([]);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [addOfferOpen, setAddOfferOpen] = useState(false);
  const [addPriceOpen, setAddPriceOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [pLabel, setPLabel] = useState("");
  const [pMfr, setPMfr] = useState("");
  const [pRef, setPRef] = useState("");
  const [pGtin, setPGtin] = useState("");
  const [pUrl, setPUrl] = useState("");

  const [oSupplier, setOSupplier] = useState("");
  const [oPack, setOPack] = useState("");
  const [oUrl, setOUrl] = useState("");

  const [priceVal, setPriceVal] = useState("");
  const [priceUnit, setPriceUnit] = useState("U");
  const [priceTax, setPriceTax] = useState<"HT" | "TTC">("HT");
  const [priceSource, setPriceSource] = useState("USER_ENTERED");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/catalogue-materiaux/${materialId}/study`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      const s = data.study as Study;
      setStudy(s);
      setProductId((prev) => {
        if (prev && s.products.some((p) => p.id === prev)) return prev;
        return s.products[0]?.id ?? null;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [materialId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!addOfferOpen) return;
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
            city?: string | null;
          }) => ({
            id: s.id,
            name: s.name,
            tradeName: s.tradeName ?? null,
            city: s.city ?? null,
          }),
        ),
      );
    })();
  }, [addOfferOpen]);

  const product = study?.products.find((p) => p.id === productId) ?? null;
  const offers = product?.offers ?? [];
  const offer = offers.find((o) => o.id === offerId) ?? offers[0] ?? null;

  useEffect(() => {
    if (offer && offerId !== offer.id) setOfferId(offer.id);
    if (!offer) setOfferId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, offers.length]);

  async function createProduct(forceCreate = false) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/catalogue-materiaux/${materialId}/products`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: pLabel.trim(),
            manufacturer: pMfr.trim() || null,
            manufacturerRef: pRef.trim() || null,
            gtin: pGtin.trim() || null,
            sourceUrl: pUrl.trim() || null,
            forceCreate,
          }),
        },
      );
      const data = await res.json();
      if (res.status === 409) {
        setError(
          `${data.error} — rouvrez le produit existant ou forcez une création distincte.`,
        );
        return;
      }
      if (!res.ok) throw new Error(data.error || "Erreur");
      setAddProductOpen(false);
      setPLabel("");
      setPMfr("");
      setPRef("");
      setPGtin("");
      setPUrl("");
      setProductId(data.product?.id ?? null);
      await load();
      setToast("Produit ajouté");
      window.setTimeout(() => setToast(null), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function createOffer() {
    if (!product) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/catalogue-materiaux/products/${product.id}/offers`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            supplierExternalOrgId: oSupplier,
            packagingLabel: oPack.trim() || null,
            sourceUrl: oUrl.trim() || null,
            priceSourceType: "USER_ENTERED",
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setAddOfferOpen(false);
      setOSupplier("");
      setOPack("");
      setOUrl("");
      setOfferId(data.offer?.id ?? null);
      await load();
      setToast("Offre fournisseur ajoutée");
      window.setTimeout(() => setToast(null), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function createPrice() {
    if (!offer) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/catalogue-materiaux/offers/${offer.id}/prices`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            unitPrice: priceVal === "" ? null : Number(priceVal),
            priceUnit,
            priceTaxMode: priceTax,
            priceSourceType: priceSource,
            observedAt: new Date().toISOString(),
            sourceUrl: offer.sourceUrl,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setAddPriceOpen(false);
      setPriceVal("");
      await load();
      setToast("Observation de prix enregistrée");
      window.setTimeout(() => setToast(null), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <p className="px-4 py-10 text-sm text-slate-500">Chargement de la fiche…</p>
    );
  }
  if (!study) {
    return (
      <p className="px-4 py-10 text-sm text-red-700">
        {error || "Fiche introuvable"}
      </p>
    );
  }

  return (
    <div className="flex h-[min(88vh,900px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex shrink-0 flex-wrap items-start justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Catalogue · {study.family}
          </p>
          <h2 className="truncate text-lg font-bold text-[#1e3a5f]">
            {study.designation}
          </h2>
          <p className="text-xs text-slate-500">
            Unité {study.unit} · {study.products.length} produit(s) · hors
            chantier
          </p>
        </div>
        {toast ? (
          <p className="text-xs font-medium text-emerald-800">{toast}</p>
        ) : null}
      </header>
      {error ? (
        <p className="border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-800">
          {error}
        </p>
      ) : null}

      <div className="grid min-h-0 flex-1 grid-cols-1 divide-y divide-slate-100 overflow-hidden lg:grid-cols-12 lg:divide-x lg:divide-y-0">
        {/* Left */}
        <section className="flex min-h-0 flex-col overflow-y-auto p-4 lg:col-span-3">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
            Identité matériau
          </h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-[11px] text-slate-400">Famille</dt>
              <dd className="font-medium text-slate-800">{study.family}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-slate-400">Désignation</dt>
              <dd className="font-medium text-slate-800">{study.designation}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-slate-400">Unité</dt>
              <dd className="font-medium text-slate-800">{study.unit}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-slate-400">Statut</dt>
              <dd className="font-medium text-slate-800">{study.status}</dd>
            </div>
          </dl>
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <p className="text-[11px] font-bold uppercase text-slate-500">
              Contexte technique
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              {study.description || "Aucune description — à compléter."}
            </p>
            {study.notes ? (
              <p className="mt-2 text-xs text-slate-500">{study.notes}</p>
            ) : null}
          </div>
          <p className="mt-4 text-[11px] text-slate-400">
            Pas de métré ni quantité chantier sur cette fiche.
          </p>
        </section>

        {/* Center */}
        <section className="flex min-h-0 flex-col overflow-hidden p-4 lg:col-span-5">
          <div className="flex shrink-0 items-center justify-between gap-2">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
              Produits &amp; fournisseurs
            </h3>
            {canWrite ? (
              <button
                type="button"
                onClick={() => setAddProductOpen(true)}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700"
              >
                <Plus className="h-3 w-3" />
                Produit
              </button>
            ) : null}
          </div>

          <div className="mt-3 shrink-0 rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 py-2">
            <p className="text-[11px] font-semibold text-indigo-950">
              Recherche ChatGPT (manuel)
            </p>
            <p className="mt-1 text-[11px] text-indigo-900/80">
              Aucune API IA payante ni extraction serveur. Préparez votre
              recherche hors BeWork ; les retours seront branchés via une
              capability CATALOG dédiée (phase ultérieure), après Preview /
              Commit.
            </p>
          </div>

          <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto">
            {study.products.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                Aucun produit commercial. La fiche matériau reste valide sans
                fournisseur ni prix.
              </div>
            ) : (
              study.products.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProductId(p.id)}
                  className={`w-full rounded-xl border px-3 py-3 text-left ${
                    productId === p.id
                      ? "border-[#2563eb] bg-sky-50/40"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <p className="text-sm font-bold text-slate-900">{p.label}</p>
                  <p className="text-xs text-slate-500">
                    {[p.manufacturer, p.manufacturerRef, p.gtin]
                      .filter(Boolean)
                      .join(" · ") || "Sans référence fabricant"}
                    {" · "}
                    {p.offers.length} offre(s)
                  </p>
                </button>
              ))
            )}

            {product ? (
              <div className="pt-2">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase text-slate-500">
                    Offres — {product.label}
                  </p>
                  {canWrite ? (
                    <button
                      type="button"
                      onClick={() => setAddOfferOpen(true)}
                      className="text-[11px] font-semibold text-[#1e3a5f]"
                    >
                      + Offre fournisseur
                    </button>
                  ) : null}
                </div>
                {product.offers.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    Aucune offre fournisseur pour ce produit.
                  </p>
                ) : (
                  product.offers.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setOfferId(o.id)}
                      className={`mb-2 w-full rounded-xl border px-3 py-2.5 text-left ${
                        offer?.id === o.id
                          ? "border-[#1e3a5f] bg-slate-50"
                          : "border-slate-200"
                      }`}
                    >
                      <p className="text-sm font-semibold text-slate-900">
                        {o.agencyDisplay}
                      </p>
                      <p className="text-xs text-slate-600">
                        {o.latestPrice?.unitPrice == null
                          ? "Prix non renseigné"
                          : `${formatStudyMoney(o.latestPrice.unitPrice)} / ${o.latestPrice.priceUnit} ${o.latestPrice.priceTaxMode}`}
                      </p>
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>
        </section>

        {/* Right */}
        <section className="flex min-h-0 flex-col overflow-hidden p-4 lg:col-span-4">
          <h3 className="shrink-0 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
            Détail offre / prix
          </h3>
          {!offer ? (
            <div className="mt-6 flex flex-col items-center gap-2 text-slate-400">
              <Package className="h-8 w-8" />
              <p className="text-sm text-slate-500">
                {product
                  ? "Aucune offre à inspecter."
                  : "Sélectionnez ou créez un produit."}
              </p>
            </div>
          ) : (
            <>
              <div className="mt-3 shrink-0 overflow-hidden rounded-xl border border-slate-200">
                {offer.imageUrl || product?.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={offer.imageUrl || product?.imageUrl || ""}
                    alt=""
                    className="h-36 w-full object-contain bg-white"
                  />
                ) : (
                  <div className="flex h-32 flex-col items-center justify-center bg-slate-50 text-slate-400">
                    <Package className="h-7 w-7" />
                    <span className="text-xs font-medium">
                      Aucune photo de présentation
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {offer.agencyDisplay}
                  </p>
                  <p className="text-sm text-slate-700">{product?.label}</p>
                </div>
                <dl className="space-y-2 rounded-xl border border-slate-200 p-3 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Prix</dt>
                    <dd className="font-semibold tabular-nums">
                      {offer.latestPrice?.unitPrice == null
                        ? "Non renseigné"
                        : `${formatStudyMoney(offer.latestPrice.unitPrice)} / ${offer.latestPrice.priceUnit} ${offer.latestPrice.priceTaxMode}`}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Livraison</dt>
                    <dd>
                      {offer.deliveryFee == null
                        ? "Non renseignée"
                        : formatStudyMoney(offer.deliveryFee, 2)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Conditionnement</dt>
                    <dd>{offer.packagingLabel || "—"}</dd>
                  </div>
                </dl>
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-[11px] font-bold uppercase text-slate-500">
                    Source
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    {offer.latestPrice?.priceSourceType ||
                      offer.priceSourceType ||
                      "—"}
                    {offer.latestPrice
                      ? ` · relevé ${formatStudyDay(offer.latestPrice.observedAt || offer.latestPrice.recordedAt)}`
                      : ""}
                  </p>
                  {(offer.sourceUrl || offer.latestPrice?.sourceUrl) && (
                    <a
                      href={
                        offer.sourceUrl ||
                        offer.latestPrice?.sourceUrl ||
                        "#"
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#2563eb]"
                    >
                      <Link2 className="h-3 w-3" />
                      Ouvrir la fiche
                    </a>
                  )}
                </div>
                {offer.priceHistory.length > 0 ? (
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-[11px] font-bold uppercase text-slate-500">
                      Historique des prix
                    </p>
                    <ul className="mt-2 space-y-1 text-[11px] text-slate-600">
                      {offer.priceHistory.slice(0, 5).map((h) => (
                        <li key={h.id}>
                          {h.unitPrice == null
                            ? "Prix non renseigné"
                            : `${formatStudyMoney(h.unitPrice)} / ${h.priceUnit} ${h.priceTaxMode}`}
                          {" · "}
                          {formatStudyDay(h.observedAt || h.recordedAt)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {canWrite ? (
                  <button
                    type="button"
                    onClick={() => setAddPriceOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Ajouter une observation de prix
                  </button>
                ) : null}
                <div className="flex items-start gap-1.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-950">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Les prix catalogue sont datés. Ils ne modifient jamais devis,
                  BC ou offres chantier automatiquement.
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {addProductOpen ? (
        <Modal title="Ajouter un produit commercial" onClose={() => setAddProductOpen(false)}>
          <Field label="Libellé *" value={pLabel} onChange={setPLabel} />
          <Field label="Fabricant" value={pMfr} onChange={setPMfr} />
          <Field label="Référence fabricant" value={pRef} onChange={setPRef} />
          <Field label="EAN/GTIN" value={pGtin} onChange={setPGtin} />
          <Field label="URL fiche" value={pUrl} onChange={setPUrl} />
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" className="text-xs font-semibold text-slate-600" onClick={() => setAddProductOpen(false)}>
              Annuler
            </button>
            <button
              type="button"
              disabled={busy || !pLabel.trim()}
              onClick={() => void createProduct(false)}
              className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              Enregistrer
            </button>
          </div>
        </Modal>
      ) : null}

      {addOfferOpen ? (
        <Modal title="Ajouter une offre fournisseur" onClose={() => setAddOfferOpen(false)}>
          <label className="block space-y-1 text-sm">
            <span className="text-xs font-bold uppercase text-slate-500">
              Fournisseur *
            </span>
            <select
              value={oSupplier}
              onChange={(e) => setOSupplier(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Sélectionner…</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {(s.tradeName || s.name) + (s.city ? ` — ${s.city}` : "")}
                </option>
              ))}
            </select>
          </label>
          <Field label="Conditionnement" value={oPack} onChange={setOPack} />
          <Field label="URL" value={oUrl} onChange={setOUrl} />
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" className="text-xs font-semibold text-slate-600" onClick={() => setAddOfferOpen(false)}>
              Annuler
            </button>
            <button
              type="button"
              disabled={busy || !oSupplier}
              onClick={() => void createOffer()}
              className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              Enregistrer
            </button>
          </div>
        </Modal>
      ) : null}

      {addPriceOpen ? (
        <Modal title="Observation de prix" onClose={() => setAddPriceOpen(false)}>
          <p className="text-[11px] text-slate-500">
            Append-only — l’ancien prix reste dans l’historique.
          </p>
          <Field label="Prix (facultatif)" value={priceVal} onChange={setPriceVal} />
          <Field label="Unité" value={priceUnit} onChange={setPriceUnit} />
          <label className="block space-y-1 text-sm">
            <span className="text-xs font-bold uppercase text-slate-500">HT / TTC</span>
            <select
              value={priceTax}
              onChange={(e) => setPriceTax(e.target.value as "HT" | "TTC")}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="HT">HT</option>
              <option value="TTC">TTC</option>
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-xs font-bold uppercase text-slate-500">Provenance</span>
            <select
              value={priceSource}
              onChange={(e) => setPriceSource(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="USER_ENTERED">Saisie manuelle</option>
              <option value="WEB_VERIFIED">Prix web relevé</option>
              <option value="SUPPLIER_QUOTE">Offre sur devis</option>
              <option value="IMPORT">Import</option>
            </select>
          </label>
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" className="text-xs font-semibold text-slate-600" onClick={() => setAddPriceOpen(false)}>
              Annuler
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void createPrice()}
              className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              Enregistrer
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Fermer">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>
        <div className="mt-3 space-y-3">{children}</div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="text-xs font-bold uppercase text-slate-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2"
      />
    </label>
  );
}
