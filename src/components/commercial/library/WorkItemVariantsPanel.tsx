"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Unlink } from "lucide-react";
import { roundMoney } from "@/lib/commercial/money";

type Variant = {
  id: string;
  name: string;
  reference: string | null;
  saleUnit: string;
  unitSellHt: number;
  variantKind: string | null;
  description?: string | null;
};

function fmt(n: number) {
  return roundMoney(n, 2).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function WorkItemVariantsPanel({
  workItemId,
  isVariant,
  parent,
  initialVariants,
  backHref,
}: {
  workItemId: string;
  isVariant: boolean;
  parent: { id: string; name: string; reference: string | null } | null;
  initialVariants: Variant[];
  backHref: string;
}) {
  const router = useRouter();
  const [variants, setVariants] = useState(initialVariants);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [reference, setReference] = useState("");
  const [unitSellHt, setUnitSellHt] = useState("");
  const [variantKind, setVariantKind] = useState<"TECHNICAL" | "COMMERCIAL" | "CUSTOM">(
    "TECHNICAL",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setVariants(initialVariants);
  }, [initialVariants]);

  async function create() {
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/commercial/library/work-items/${workItemId}/variants`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            reference: reference || null,
            unitSellHt: unitSellHt ? Number(unitSellHt.replace(",", ".")) : undefined,
            variantKind,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      if (data.workItem?.id) {
        router.push(
          `/dashboard/devis-facturation/bibliotheque/${data.workItem.id}?from=${encodeURIComponent(backHref)}`,
        );
        return;
      }
      setOpen(false);
      setName("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function unlink() {
    if (!confirm("Détacher cet ouvrage de son parent ?")) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/commercial/library/work-items/${workItemId}/variants`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "unlink" }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  if (isVariant && parent) {
    return (
      <section className="rounded-2xl border border-[#1e3a5f]/10 bg-white p-5">
        <h2 className="text-sm font-semibold text-[#1e3a5f]">Variante</h2>
        <p className="mt-2 text-sm text-slate-600">
          Cet ouvrage est une variante de{" "}
          <Link
            href={`/dashboard/devis-facturation/bibliotheque/${parent.id}?from=${encodeURIComponent(backHref)}`}
            className="font-medium text-[#1e3a5f] underline-offset-2 hover:underline"
          >
            {parent.name}
          </Link>
          .
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => void unlink()}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600"
        >
          <Unlink className="h-4 w-4" />
          Détacher
        </button>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[#1e3a5f]">Variantes</h2>
          <p className="text-xs text-slate-500">
            Chaque variante a son prix et ses documents. Les devis figent le choix à l’ajout.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1e3a5f] px-3.5 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          Créer une variante
        </button>
      </div>

      {open ? (
        <div className="rounded-2xl border border-[#1e3a5f]/10 bg-white p-4 space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom de la variante (ex. Béton désactivé)"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <div className="grid gap-2 sm:grid-cols-3">
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Référence"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              value={unitSellHt}
              onChange={(e) => setUnitSellHt(e.target.value)}
              placeholder="Prix HT (ex. 85,50)"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            <select
              value={variantKind}
              onChange={(e) =>
                setVariantKind(e.target.value as "TECHNICAL" | "COMMERCIAL" | "CUSTOM")
              }
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="TECHNICAL">Technique</option>
              <option value="COMMERCIAL">Commerciale</option>
              <option value="CUSTOM">Personnalisée</option>
            </select>
          </div>
          <button
            type="button"
            disabled={busy || !name.trim()}
            onClick={() => void create()}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1e3a5f] px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Créer
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {variants.length === 0 ? (
        <p className="text-sm text-slate-500">Aucune variante liée.</p>
      ) : (
        <ul className="divide-y divide-[#1e3a5f]/8 overflow-hidden rounded-2xl border border-[#1e3a5f]/10 bg-white">
          {variants.map((v) => (
            <li key={v.id}>
              <Link
                href={`/dashboard/devis-facturation/bibliotheque/${v.id}?from=${encodeURIComponent(backHref)}`}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#1e3a5f]">{v.name}</p>
                  <p className="text-[11px] text-slate-400">
                    {v.reference || "Sans réf."}
                    {v.variantKind ? ` · ${v.variantKind}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-sm tabular-nums text-slate-600">
                  {v.unitSellHt > 0 ? `${fmt(v.unitSellHt)} € / ${v.saleUnit}` : "—"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
