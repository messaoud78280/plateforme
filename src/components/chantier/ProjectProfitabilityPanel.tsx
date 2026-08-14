"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Drawer } from "@/components/ui/Drawer";
import { roundMoney } from "@/lib/commercial/money";
import type { ProjectProfitabilityDto } from "@/lib/chantier/project-profitability";
import { SupplierInvoiceForm } from "@/components/chantier/SupplierInvoiceForm";
import { cn } from "@/lib/cn";

function fmt(n: number) {
  return roundMoney(n, 2).toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function fmtPct(n: number) {
  return roundMoney(n, 1).toLocaleString("fr-FR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function ProjectProfitabilityPanel({
  initial,
}: {
  initial: ProjectProfitabilityDto;
}) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quoteId, setQuoteId] = useState(
    initial.acceptedQuotes[0]?.id ?? "",
  );
  const [drawer, setDrawer] = useState<"commitments" | "billing" | "actuals" | null>(null);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);

  async function initBudget() {
    if (!quoteId) {
      setError("Sélectionnez un devis accepté");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/commercial/projects/${data.projectId}/profitability`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quoteId }),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur");
      if (json.profitability) setData(json.profitability);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  const healthTone =
    data.health === "CRITICAL"
      ? "text-red-700 bg-red-50 border-red-200"
      : data.health === "WATCH"
        ? "text-amber-800 bg-amber-50 border-amber-200"
        : "text-emerald-800 bg-emerald-50 border-emerald-200";

  const kpis = useMemo(
    () => [
      {
        label: "Marché HT",
        value: `${fmt(data.commercial.marketSellHt)} €`,
      },
      {
        label: "Coût prévu",
        value: data.budget
          ? `${fmt(data.budget.totalCostHt)} €`
          : "—",
      },
      {
        label: "Engagé",
        value: `${fmt(data.committedTotalHt)} €`,
        action: () => setDrawer("commitments"),
      },
      {
        label: "Réel constaté",
        value:
          data.actualTotalHt != null
            ? `${fmt(data.actualTotalHt)} €`
            : "Non disponible",
        action: () => setDrawer("actuals"),
      },
      {
        label: "Facturé HT",
        value: `${fmt(data.commercial.invoicedHt)} €`,
      },
      {
        label: "Encaissé",
        value: `${fmt(data.commercial.collectedTtc)} €`,
      },
    ],
    [data],
  );

  if (!data.budget) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-slate-900">
          Aucun budget initial
        </h2>
        <p className="mt-2 max-w-xl text-sm text-slate-500">
          Initialisez le budget depuis un devis accepté pour comparer prévu,
          engagé, facturé et encaissé. Le budget sera figé à cette date.
        </p>
        {data.acceptedQuotes.length === 0 ? (
          <p className="mt-4 text-sm text-amber-800">
            Aucun devis accepté rattaché à ce chantier.
          </p>
        ) : (
          <div className="mt-5 flex flex-wrap items-end gap-3">
            <label className="text-xs font-semibold text-slate-500">
              Devis source
              <select
                value={quoteId}
                onChange={(e) => setQuoteId(e.target.value)}
                className="mt-1 block rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                {data.acceptedQuotes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.number} · {fmt(q.totalSellHt)} € HT
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={busy}
              onClick={() => void initBudget()}
              className="rounded-xl bg-[#1e3a5f] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {busy ? "…" : "Initialiser le budget"}
            </button>
          </div>
        )}
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500">
            Marché {data.budget.sourceQuoteNumber ?? "—"} · Budget figé le{" "}
            {new Date(data.budget.snappedAt).toLocaleDateString("fr-FR")}
          </p>
          <div className="mt-3 flex flex-wrap gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Marge prévue
              </p>
              <p className="text-xl font-semibold tabular-nums text-slate-900">
                {fmt(data.budget.plannedMarginHt)} €
              </p>
              <p className="text-sm text-slate-500">
                {fmtPct(data.budget.plannedMarginPercent)} %
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Marge actuelle estimée
              </p>
              <p className="text-xl font-semibold tabular-nums text-[#1e3a5f]">
                {fmt(data.estimatedMarginHt)} €
              </p>
              <p className="text-sm text-slate-500">
                {fmtPct(data.estimatedMarginPercent)} %
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Écart
              </p>
              <p
                className={cn(
                  "text-xl font-semibold tabular-nums",
                  data.driftPoints < 0 ? "text-amber-800" : "text-emerald-700",
                )}
              >
                {data.estimatedMarginHt - data.budget.plannedMarginHt > 0
                  ? "+"
                  : ""}
                {fmt(data.estimatedMarginHt - data.budget.plannedMarginHt)} €
              </p>
              <p className="text-sm text-slate-500">
                {data.driftPoints > 0 ? "+" : ""}
                {fmtPct(data.driftPoints)} pts
              </p>
            </div>
          </div>
        </div>
        <span
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-bold",
            healthTone,
          )}
        >
          {data.healthLabel}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((k) => (
          <button
            key={k.label}
            type="button"
            disabled={!k.action}
            onClick={k.action}
            className={cn(
              "rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm",
              k.action && "hover:border-[#1e3a5f]/30",
            )}
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              {k.label}
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900">
              {k.value}
            </p>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Coût final estimé
            </p>
            <p className="text-xl font-semibold tabular-nums">
              {fmt(data.forecastTotalHt)} €
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Marge finale estimée
            </p>
            <p className="text-xl font-semibold tabular-nums text-[#1e3a5f]">
              {fmt(data.estimatedMarginHt)} € ·{" "}
              {fmtPct(data.estimatedMarginPercent)} %
            </p>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-slate-400">
          Estimation basée sur le budget initial et les engagements/dépenses
          actuellement connus. Le réel priorise les factures fournisseurs ; la
          réception n’est utilisée que s’il n’existe pas encore de facture sur
          le même BC.
        </p>
      </div>

      {data.commercial.billingLagWarning ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          ⚠ Les travaux avancent plus vite que la facturation — avancement{" "}
          {fmtPct(data.commercial.progressPercent ?? 0)} % · facturation{" "}
          {fmtPct(data.commercial.invoicedPercentOfMarket ?? 0)} %
        </p>
      ) : null}

      {/* Budget table desktop */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white md:block">
        <div className="border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-bold text-[#1e3a5f]">Budget</h3>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Poste</th>
              <th className="px-4 py-2 text-right">Prévu</th>
              <th className="px-4 py-2 text-right">Engagé</th>
              <th className="px-4 py-2 text-right">Réel</th>
              <th className="px-4 py-2 text-right">Écart engagé</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.categories.map((c) => (
              <tr key={c.key}>
                <td className="px-4 py-2.5">
                  <p className="font-medium text-slate-900">{c.label}</p>
                  {c.plannedHt > 0 && c.committedHt > 0 ? (
                    <div className="mt-1 h-1.5 max-w-[10rem] overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          c.overrunHt > 0 ? "bg-amber-500" : "bg-[#1e3a5f]/70",
                        )}
                        style={{
                          width: `${Math.min(100, c.consumptionPercent ?? 0)}%`,
                        }}
                      />
                    </div>
                  ) : null}
                  {c.overrunHt > 0 ? (
                    <p className="mt-0.5 text-[11px] text-amber-800">
                      ⚠ Dépassement : {fmt(c.overrunHt)} €
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {fmt(c.plannedHt)} €
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {fmt(c.committedHt)} €
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">
                  {c.key === "LABOR" || !c.actualAvailable
                    ? "N/D"
                    : c.actualHt != null
                      ? `${fmt(c.actualHt)} €`
                      : "N/D"}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {fmt(c.committedHt - c.plannedHt)} €
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden">
        {data.categories.map((c) => (
          <li
            key={c.key}
            className="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <p className="font-semibold text-slate-900">{c.label}</p>
            <p className="mt-1 text-xs text-slate-500">
              {fmt(c.committedHt)} € engagés / {fmt(c.plannedHt)} € prévus
              {c.consumptionPercent != null
                ? ` · ${fmtPct(c.consumptionPercent)} %`
                : ""}
            </p>
            {c.overrunHt > 0 ? (
              <p className="mt-1 text-xs font-semibold text-amber-800">
                ⚠ Dépassement : {fmt(c.overrunHt)} €
              </p>
            ) : null}
            <p className="mt-2 text-xs text-slate-500">
              Réel :{" "}
              {c.key === "LABOR"
                ? "Non disponible — pointage réel non encore suivi"
                : c.actualHt != null
                  ? `${fmt(c.actualHt)} €`
                  : "Non disponible"}
            </p>
          </li>
        ))}
      </ul>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-[#1e3a5f]">
            Facturation & encaissements
          </h3>
          <button
            type="button"
            className="text-xs font-semibold text-[#1d4ed8]"
            onClick={() => setDrawer("billing")}
          >
            Détails
          </button>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3 text-sm">
          <div>
            <p className="text-slate-500">Marché</p>
            <p className="font-semibold tabular-nums">
              {fmt(data.commercial.marketSellHt)} € HT
            </p>
          </div>
          <div>
            <p className="text-slate-500">Facturé</p>
            <p className="font-semibold tabular-nums">
              {fmt(data.commercial.invoicedHt)} € HT
            </p>
          </div>
          <div>
            <p className="text-slate-500">Reste à facturer</p>
            <p className="font-semibold tabular-nums">
              {fmt(data.commercial.remainingToInvoiceHt)} € HT
            </p>
          </div>
          <div>
            <p className="text-slate-500">Encaissé</p>
            <p className="font-semibold tabular-nums">
              {fmt(data.commercial.collectedTtc)} €
            </p>
          </div>
          <div>
            <p className="text-slate-500">À encaisser</p>
            <p className="font-semibold tabular-nums">
              {fmt(data.commercial.remainingToCollectTtc)} €
            </p>
          </div>
          <div>
            <p className="text-slate-500">En retard</p>
            <Link
              href="/dashboard/devis-facturation/encaissements?filter=overdue"
              className="font-semibold tabular-nums text-red-700 hover:underline"
            >
              {fmt(data.commercial.overdueTtc)} €
            </Link>
          </div>
          {data.commercial.retention ? (
            <div className="sm:col-span-3 border-t border-slate-100 pt-2 text-xs text-slate-500">
              Retenue de garantie — retenue{" "}
              <strong className="text-slate-800">
                {fmt(data.commercial.retention.heldHt)} €
              </strong>
              {data.commercial.retention.releasedHt > 0
                ? ` · libérée ${fmt(data.commercial.retention.releasedHt)} €`
                : ""}
              {data.commercial.retention.settledHt > 0
                ? ` · soldée ${fmt(data.commercial.retention.settledHt)} €`
                : ""}
            </div>
          ) : null}
        </div>
        {data.cashSimple.gapHt != null ? (
          <p className="mt-3 text-xs text-slate-500">
            Écart encaissements / dépenses :{" "}
            <strong
              className={
                data.cashSimple.gapHt >= 0 ? "text-emerald-700" : "text-amber-800"
              }
            >
              {data.cashSimple.gapHt > 0 ? "+" : ""}
              {fmt(data.cashSimple.gapHt)} €
            </strong>
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-[#1e3a5f]">
            Dépenses réelles
          </h3>
          <button
            type="button"
            className="text-xs font-semibold text-[#1d4ed8]"
            onClick={() => setShowInvoiceForm((v) => !v)}
          >
            {showInvoiceForm ? "Fermer" : "Enregistrer une facture"}
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Facture fournisseur = réel. Réception = réel provisoire tant qu’aucune
          facture n’est saisie sur le BC.
        </p>
        {showInvoiceForm ? (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <SupplierInvoiceForm
              projectId={data.projectId}
              onCreated={() => {
                setShowInvoiceForm(false);
                router.refresh();
              }}
            />
          </div>
        ) : null}
      </div>

      <Drawer
        open={drawer === "actuals"}
        onClose={() => setDrawer(null)}
        title="Dépenses réelles"
        description={
          data.actualTotalHt != null
            ? `${fmt(data.actualTotalHt)} € HT`
            : "Aucune dépense constatée"
        }
        widthClass="max-w-md"
      >
        {(data.actuals ?? []).length === 0 ? (
          <p className="text-sm text-slate-500">
            Aucune facture fournisseur ni réception valorisée.
          </p>
        ) : (
          <ul className="space-y-2">
            {(data.actuals ?? []).map((a) => (
              <li
                key={a.id}
                className="rounded-xl border border-slate-100 px-3 py-2"
              >
                <p className="text-sm font-semibold">{a.label}</p>
                <p className="text-xs text-slate-500">
                  {a.source === "invoice" ? "Facture" : "Réception (provisoire)"}
                  {a.supplierName ? ` · ${a.supplierName}` : ""}
                  {a.purchaseOrderNumber ? ` · ${a.purchaseOrderNumber}` : ""}
                </p>
                <p className="tabular-nums text-sm font-medium">
                  {fmt(a.amountHt)} €
                </p>
              </li>
            ))}
          </ul>
        )}
      </Drawer>

      <Drawer
        open={drawer === "commitments"}
        onClose={() => setDrawer(null)}
        title="Engagements"
        description={`${fmt(data.committedTotalHt)} € HT`}
        widthClass="max-w-md"
      >
        {data.commitments.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun engagement.</p>
        ) : (
          <ul className="space-y-2">
            {data.commitments.map((c) => (
              <li
                key={c.id}
                className="rounded-xl border border-slate-100 px-3 py-2"
              >
                <p className="text-sm font-semibold">{c.number}</p>
                <p className="text-xs text-slate-500">
                  {c.supplierName ?? "Fournisseur"} · {c.status}
                </p>
                <p className="tabular-nums text-sm font-medium">
                  {fmt(c.amountHt)} €
                </p>
              </li>
            ))}
          </ul>
        )}
      </Drawer>

      <Drawer
        open={drawer === "billing"}
        onClose={() => setDrawer(null)}
        title="Facturation"
        widthClass="max-w-md"
      >
        <div className="space-y-3 text-sm">
          <p>
            Facturé HT : <strong>{fmt(data.commercial.invoicedHt)} €</strong>
          </p>
          <p>
            Encaissé : <strong>{fmt(data.commercial.collectedTtc)} €</strong>
          </p>
          <p>
            En retard :{" "}
            <strong className="text-red-700">
              {fmt(data.commercial.overdueTtc)} €
            </strong>
          </p>
          <Link
            href="/dashboard/devis-facturation/encaissements"
            className="inline-block text-xs font-semibold text-[#1d4ed8]"
          >
            Ouvrir Encaissements →
          </Link>
        </div>
      </Drawer>
    </div>
  );
}
