"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  EMPTY_SUPPLIER_FORM,
  SupplierFormDrawer,
} from "@/components/suppliers/SupplierFormDrawer";
import { cn } from "@/lib/cn";

export type SupplierListItem = {
  id: string;
  name: string;
  tradeName: string | null;
  activity: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  siret: string | null;
  status: string;
  contactsCount: number;
  openOrdersCount: number;
  awaitingConfirmCount: number;
};

export function SuppliersWorkspace({
  initialSuppliers,
}: {
  initialSuppliers: SupplierListItem[];
}) {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [q, setQ] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return suppliers;
    return suppliers.filter((s) => {
      const hay = [
        s.name,
        s.tradeName,
        s.activity,
        s.city,
        s.phone,
        s.email,
        s.siret,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [suppliers, q]);

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2800);
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 px-4 pb-10 pt-2 sm:px-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          eyebrow="Partenaires"
          title="Fournisseurs"
          description="Référentiel fournisseurs — disponibles immédiatement pour commandes et dépenses."
        />
        <div className="flex flex-wrap items-center gap-2 self-start">
          <Link
            href="/dashboard/commandes/nouvelle"
            className="btn-cc-secondary !min-h-10 !text-[13px]"
          >
            Nouvelle commande
          </Link>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="btn-cc-primary !min-h-10 !text-[13px]"
          >
            + Nouveau fournisseur
          </button>
        </div>
      </header>

      <div className="rounded-2xl border border-bework-navy/10 bg-white/90 p-3 shadow-sm">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher (nom, ville, contact, email, téléphone, SIRET)…"
          className="bw-search w-full"
          aria-label="Rechercher un fournisseur"
        />
      </div>

      {suppliers.length === 0 ? (
        <EmptyState
          title="Aucun fournisseur"
          description="Ajoutez votre premier fournisseur au référentiel."
          actionLabel="+ Nouveau fournisseur"
          onAction={() => setCreateOpen(true)}
        />
      ) : filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-bework-muted">
          Aucun fournisseur ne correspond à votre recherche.
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((s) => {
            const openBits = [
              s.openOrdersCount > 0
                ? `${s.openOrdersCount} commande${s.openOrdersCount > 1 ? "s" : ""} en cours`
                : null,
              s.awaitingConfirmCount > 0
                ? `${s.awaitingConfirmCount} confirmation${
                    s.awaitingConfirmCount > 1 ? "s" : ""
                  } attendue${s.awaitingConfirmCount > 1 ? "s" : ""}`
                : null,
            ].filter(Boolean);

            return (
              <li key={s.id}>
                <Link
                  href={`/dashboard/fournisseurs/${s.id}`}
                  className="group relative flex flex-wrap items-center justify-between gap-3 overflow-hidden rounded-xl border border-bework-navy/10 bg-white px-4 py-3.5 shadow-sm transition-[background,box-shadow,transform] duration-150 hover:-translate-y-px hover:bg-bework-navy-soft/40 hover:shadow-[var(--cc-shadow-hover)]"
                >
                  <span
                    className="absolute inset-y-0 left-0 w-[3px] bg-bework-cyan"
                    aria-hidden
                  />
                  <span className="min-w-0 pl-1">
                    <span className="block text-[15px] font-semibold tracking-tight text-bework-ink">
                      {s.tradeName || s.name}
                    </span>
                    <span className="mt-0.5 block text-[13px] text-bework-muted">
                      {s.activity || "Fournisseur"}
                      {s.city ? ` · ${s.city}` : ""}
                      {" · "}
                      {s.contactsCount} contact{s.contactsCount > 1 ? "s" : ""}
                    </span>
                    {openBits.length > 0 ? (
                      <span className="mt-1.5 block text-[12px] font-medium text-bework-navy">
                        {openBits.join(" · ")}
                      </span>
                    ) : (
                      <span className="mt-1.5 block text-[12px] text-slate-400">
                        Aucune commande ouverte
                      </span>
                    )}
                  </span>
                  <span
                    className={cn(
                      "badge-cc shrink-0",
                      s.status === "ACTIVE" ? "badge-cc-ok" : "badge-cc-neutral",
                    )}
                  >
                    {s.status === "ACTIVE" ? "Actif" : "Inactif"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <SupplierFormDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        mode="create"
        initial={EMPTY_SUPPLIER_FORM}
        onSaved={(created) => {
          setSuppliers((prev) => {
            if (prev.some((p) => p.id === created.id)) return prev;
            return [
              {
                id: created.id,
                name: created.name,
                tradeName: null,
                activity: null,
                city: null,
                phone: null,
                email: null,
                siret: null,
                status: "ACTIVE",
                contactsCount: 0,
                openOrdersCount: 0,
                awaitingConfirmCount: 0,
              },
              ...prev,
            ].sort((a, b) =>
              (a.tradeName || a.name).localeCompare(b.tradeName || b.name, "fr"),
            );
          });
          showToast("Fournisseur ajouté");
          router.refresh();
        }}
      />

      {toast ? (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[90] -translate-x-1/2 rounded-full bg-bework-navy-deep px-4 py-2 text-sm font-medium text-white shadow-lg"
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}
