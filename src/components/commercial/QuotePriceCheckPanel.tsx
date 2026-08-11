"use client";

import { useEffect, useRef, useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { roundMoney } from "@/lib/commercial/money";
import type { QuotePriceCheckResult } from "@/lib/commercial/price-check-types";

function fmtMoney(n: number) {
  return roundMoney(n, 2).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtPct(n: number) {
  return `${roundMoney(n, 1).toLocaleString("fr-FR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} %`;
}

function deltaClass(delta: number | null) {
  if (delta == null || delta === 0) return "text-slate-600";
  if (delta > 0) return "text-amber-800";
  return "text-emerald-800";
}

export function QuotePriceCheckPanel({
  open,
  onClose,
  quoteId,
  canEdit,
  quoteStatus,
  onApplied,
  onRequestNewVersion,
  onSessionBadge,
}: {
  open: boolean;
  onClose: () => void;
  quoteId: string;
  canEdit: boolean;
  quoteStatus: string;
  onApplied: () => void;
  onRequestNewVersion?: () => void;
  onSessionBadge?: (badge: string | null) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuotePriceCheckResult | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedLineIds, setSelectedLineIds] = useState<Set<string>>(new Set());
  const [confirmLineId, setConfirmLineId] = useState<string | null>(null);

  async function runCheck() {
    setLoading(true);
    setError(null);
    setResult(null);
    setDetailOpen(false);
    try {
      const res = await fetch(`/api/commercial/quotes/${quoteId}/price-check`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de vérification");
      const r = data.result as QuotePriceCheckResult;
      setResult(r);
      // Sécurité : aucune ligne pré-cochée
      setSelectedLineIds(new Set());
      if (r.status === "CHANGES_FOUND" || r.status === "MANUAL_REVIEW_REQUIRED") {
        setDetailOpen(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  // Lance le check à l’ouverture
  const openedRef = useRef(false);
  useEffect(() => {
    if (!open) {
      openedRef.current = false;
      setResult(null);
      setError(null);
      setDetailOpen(false);
      return;
    }
    if (openedRef.current) return;
    openedRef.current = true;
    void runCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function toggleLine(id: string) {
    setSelectedLineIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function sellModeExplain(sellMode: "MARGIN" | "FIXED_SELL") {
    if (sellMode === "FIXED_SELL") {
      return "Le prix de vente de la ligne restera inchangé (mode PV fixe).";
    }
    return "Le prix de vente sera recalculé selon le taux de marque figé dans le snapshot.";
  }

  async function applyLines(lineIds: string[]) {
    if (!result || lineIds.length === 0) return;
    setApplying(true);
    setError(null);
    try {
      const res = await fetch(`/api/commercial/quotes/${quoteId}/price-check/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          versionId: result.versionId,
          lineIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur d’application");
      setConfirmLineId(null);
      setSelectedLineIds(new Set());
      onApplied();
      await runCheck();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setApplying(false);
    }
  }

  useEffect(() => {
    if (!result || !onSessionBadge) return;
    if (result.status === "UP_TO_DATE") onSessionBadge("Prix à jour");
    else if (result.status === "NOTHING_TO_COMPARE") onSessionBadge(null);
    else if (result.changedResourceCount > 0) {
      onSessionBadge(
        `${result.changedResourceCount} changement${result.changedResourceCount > 1 ? "s" : ""}`,
      );
    } else if (result.missingResourceCount > 0) {
      onSessionBadge("À vérifier");
    }
  }, [result, onSessionBadge]);

  const summaryBadge =
    result?.status === "UP_TO_DATE"
      ? "Prix à jour"
      : result?.status === "NOTHING_TO_COMPARE"
        ? "Rien à comparer"
        : result
          ? `${result.changedResourceCount} changement${result.changedResourceCount > 1 ? "s" : ""}`
          : null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Vérification des prix"
      description="Comparaison des prix figés du devis avec la bibliothèque actuelle. Aucune modification automatique."
      widthClass="max-w-lg"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
          >
            Conserver le devis
          </button>
          {result &&
          (result.status === "CHANGES_FOUND" ||
            result.status === "MANUAL_REVIEW_REQUIRED") &&
          !detailOpen ? (
            <button
              type="button"
              onClick={() => setDetailOpen(true)}
              className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white"
            >
              Examiner les changements
            </button>
          ) : null}
        </div>
      }
    >
      <div className="space-y-4">
        {loading ? (
          <p className="text-sm text-slate-600">Analyse des prix en cours…</p>
        ) : null}
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        {result && summaryBadge ? (
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Session · {summaryBadge}
          </p>
        ) : null}

        {result?.oldestSnapshotAt ? (
          <p className="text-xs text-slate-500">
            Prix du devis au :{" "}
            {new Date(result.oldestSnapshotAt).toLocaleString("fr-FR")}
            <br />
            Prix bibliothèque actuel :{" "}
            {new Date(result.checkedAt).toLocaleString("fr-FR")}
          </p>
        ) : null}

        {result?.status === "UP_TO_DATE" ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-bold text-emerald-900">✓ Prix vérifiés</p>
            <p className="mt-1 text-sm text-emerald-800">
              Aucun prix de ressource n’a changé depuis la préparation de ce devis.
            </p>
          </div>
        ) : null}

        {result?.status === "NOTHING_TO_COMPARE" ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-800">
              Aucun prix de bibliothèque à comparer pour ce devis.
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Les composantes sont en saisie manuelle, ou aucune ressource identifiable
              n’est liée au snapshot.
            </p>
          </div>
        ) : null}

        {result &&
        (result.status === "CHANGES_FOUND" ||
          result.status === "MANUAL_REVIEW_REQUIRED") ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-bold text-slate-900">
                {result.changedResourceCount} ressource
                {result.changedResourceCount > 1 ? "s" : ""} ont changé
                {result.missingResourceCount > 0
                  ? ` · ${result.missingResourceCount} à vérifier manuellement`
                  : ""}
              </p>
              <p className="mt-2 text-sm text-slate-700">
                Impact estimé sur le coût :{" "}
                <span className={`font-semibold ${deltaClass(result.costDeltaHt)}`}>
                  {result.costDeltaHt > 0 ? "+" : ""}
                  {fmtMoney(result.costDeltaHt)} € HT
                </span>
              </p>
              <p className="mt-1 text-sm text-slate-700">
                Taux de marque : {fmtPct(result.oldMarquePercent)} →{" "}
                {fmtPct(result.currentIndicativeMarquePercent)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Si vous conservez votre prix de vente actuel (
                {fmtMoney(result.sellHtUnchanged)} € HT)…
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {result.affectedLineCount} ligne
                {result.affectedLineCount > 1 ? "s" : ""} du devis concernée
                {result.affectedLineCount > 1 ? "s" : ""}.
              </p>
              {result.belowMinMarginAlert && result.belowMinMarginMessage ? (
                <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-950">
                  {result.belowMinMarginMessage}
                </p>
              ) : null}
            </div>

            {!detailOpen ? (
              <button
                type="button"
                onClick={() => setDetailOpen(true)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-[#1e3a5f]"
              >
                Examiner les changements
              </button>
            ) : (
              <div className="space-y-4">
                {result.missingResources.length > 0 ? (
                  <section>
                    <h3 className="text-[10px] font-bold uppercase tracking-wide text-amber-800">
                      À vérifier manuellement
                    </h3>
                    <ul className="mt-2 space-y-2">
                      {result.missingResources.map((r) => (
                        <li
                          key={r.key}
                          className="rounded-xl border border-amber-200 bg-amber-50 p-3"
                        >
                          <p className="text-sm font-semibold text-amber-950">
                            {r.designationSnapshot}
                          </p>
                          <p className="text-xs text-amber-900">
                            Ressource introuvable dans la bibliothèque actuelle
                          </p>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {result.changedResources.length > 0 ? (
                  <section>
                    <h3 className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Ressources
                    </h3>
                    <ul className="mt-2 space-y-2">
                      {result.changedResources.map((r) => (
                        <li
                          key={r.key}
                          className="rounded-xl border border-slate-200 bg-white p-3"
                        >
                          <p className="text-sm font-semibold text-slate-900">
                            {r.designationSnapshot}
                            {r.designationCurrent &&
                            r.designationCurrent !== r.designationSnapshot
                              ? ` (auj. : ${r.designationCurrent})`
                              : ""}
                          </p>
                          <p className={`mt-1 text-sm ${deltaClass(r.deltaUnitHt)}`}>
                            {fmtMoney(r.snapshotUnitCostHt)} €/{r.unit} →{" "}
                            {r.currentUnitCostHt != null
                              ? `${fmtMoney(r.currentUnitCostHt)} €/${r.unit}`
                              : "—"}
                            {r.deltaPercent != null ? (
                              <span className="ml-2 font-semibold">
                                {r.deltaPercent > 0 ? "+" : ""}
                                {fmtPct(r.deltaPercent)}
                              </span>
                            ) : null}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Utilisée dans {r.affectedLineIds.length} ligne
                            {r.affectedLineIds.length > 1 ? "s" : ""}
                            {r.affectedLineDesignations[0]
                              ? ` · ${r.affectedLineDesignations[0]}${
                                  r.affectedLineDesignations.length > 1 ? "…" : ""
                                }`
                              : ""}
                          </p>
                          <p className={`text-xs font-medium ${deltaClass(r.totalCostImpactHt)}`}>
                            Impact total : {r.totalCostImpactHt > 0 ? "+" : ""}
                            {fmtMoney(r.totalCostImpactHt)} €
                          </p>
                          <p className="mt-1 text-[10px] text-slate-400">
                            Prix bibliothèque actuel (pas un prix fournisseur documenté)
                          </p>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {result.affectedLines.length > 0 ? (
                  <section>
                    <h3 className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Lignes
                    </h3>
                    <ul className="mt-2 space-y-2">
                      {result.affectedLines.map((l) => {
                        const confirm = confirmLineId === l.lineId;
                        return (
                          <li
                            key={l.lineId}
                            className="rounded-xl border border-slate-200 bg-white p-3"
                          >
                            <div className="flex items-start gap-2">
                              {result.canApply && canEdit ? (
                                <input
                                  type="checkbox"
                                  className="mt-1"
                                  checked={selectedLineIds.has(l.lineId)}
                                  onChange={() => toggleLine(l.lineId)}
                                  aria-label={`Sélectionner ${l.designation}`}
                                />
                              ) : null}
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-900">
                                  {l.designation}
                                </p>
                                <p className="mt-1 text-xs text-slate-600">
                                  Coût devis : {fmtMoney(l.snapshotLineCostHt)} € → actuel
                                  estimé : {fmtMoney(l.currentLineCostHt)} € (
                                  <span className={deltaClass(l.costDeltaHt)}>
                                    {l.costDeltaHt > 0 ? "+" : ""}
                                    {fmtMoney(l.costDeltaHt)} €
                                  </span>
                                  )
                                </p>
                                <p className="text-xs text-slate-600">
                                  PV devis : {fmtMoney(l.snapshotLineSellHt)} € · Marque :{" "}
                                  {fmtPct(l.oldMarquePercent)} →{" "}
                                  {fmtPct(l.currentIndicativeMarquePercent)}
                                </p>
                                {l.compositionMayHaveChanged ? (
                                  <p className="mt-1 text-xs text-slate-500">
                                    La composition de l’ouvrage a également évolué depuis ce
                                    devis.
                                  </p>
                                ) : null}
                                {result.canApply && canEdit ? (
                                  <div className="mt-2">
                                    {!confirm ? (
                                      <button
                                        type="button"
                                        disabled={applying}
                                        onClick={() => setConfirmLineId(l.lineId)}
                                        className="text-xs font-semibold text-[#1e3a5f] underline"
                                      >
                                        Mettre à jour cette ligne
                                      </button>
                                    ) : (
                                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700">
                                        <p className="font-semibold">Confirmation</p>
                                        <p className="mt-1">
                                          Cette ligne sera recalculée avec les prix actuels de
                                          la bibliothèque.
                                        </p>
                                        <p className="mt-1">
                                          Ancien coût : {fmtMoney(l.snapshotLineCostHt)} € ·
                                          Nouveau coût : {fmtMoney(l.currentLineCostHt)} €
                                        </p>
                                        <p className="mt-1">{sellModeExplain(l.sellMode)}</p>
                                        <div className="mt-2 flex gap-2">
                                          <button
                                            type="button"
                                            disabled={applying}
                                            onClick={() => void applyLines([l.lineId])}
                                            className="rounded-md bg-[#1e3a5f] px-2 py-1 font-bold text-white"
                                          >
                                            Confirmer
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setConfirmLineId(null)}
                                            className="rounded-md border border-slate-200 px-2 py-1"
                                          >
                                            Annuler
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ) : null}

                {result.canApply && canEdit && selectedLineIds.size > 0 ? (
                  <button
                    type="button"
                    disabled={applying}
                    onClick={() => {
                      if (
                        confirm(
                          `Mettre à jour ${selectedLineIds.size} ligne(s) sélectionnée(s) avec les prix bibliothèque actuels ?`,
                        )
                      ) {
                        void applyLines([...selectedLineIds]);
                      }
                    }}
                    className="w-full rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
                  >
                    Mettre à jour les lignes sélectionnées ({selectedLineIds.size})
                  </button>
                ) : null}

                {!result.canApply && result.applyBlockedReason ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                    <p>{result.applyBlockedReason}</p>
                    {["SENT", "VIEWED"].includes(quoteStatus) && onRequestNewVersion ? (
                      <button
                        type="button"
                        onClick={onRequestNewVersion}
                        className="mt-2 font-semibold text-[#1e3a5f] underline"
                      >
                        Créer une nouvelle version
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ) : null}

        <button
          type="button"
          disabled={loading}
          onClick={() => void runCheck()}
          className="text-xs font-semibold text-slate-500 underline"
        >
          Relancer la vérification
        </button>
      </div>
    </Drawer>
  );
}
