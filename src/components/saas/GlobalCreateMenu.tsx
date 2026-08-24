"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { canAccessDashboardHref } from "@/lib/equipe-acces/dashboard-policy";
import { cn } from "@/lib/cn";

type CreateAction = {
  label: string;
  href: string;
  /** Route utilisée pour le contrôle d’accès (si différente de href). */
  accessHref?: string;
};

const CREATE_ACTIONS: CreateAction[] = [
  { label: "Client", href: "/dashboard/clients", accessHref: "/dashboard/clients" },
  { label: "Chantier", href: "/dashboard/projets", accessHref: "/dashboard/projets" },
  { label: "Devis", href: "/dashboard/devis-facturation", accessHref: "/dashboard/devis-facturation" },
  { label: "Tâche", href: "/dashboard/taches?nouvelle=1", accessHref: "/dashboard/taches" },
  { label: "Document", href: "/dashboard/documents", accessHref: "/dashboard/documents" },
  { label: "Commande", href: "/dashboard/commandes", accessHref: "/dashboard/commandes" },
  { label: "Événement", href: "/dashboard/agenda?new=1", accessHref: "/dashboard/agenda" },
];

/** Menu global « + Créer » — actions réelles, filtrées par rôle. */
export function GlobalCreateMenu({
  personType,
  permissionProfile,
}: {
  personType?: string | null;
  permissionProfile?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const items = CREATE_ACTIONS.filter((a) =>
    canAccessDashboardHref(a.accessHref ?? a.href, personType, permissionProfile),
  );

  if (items.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="btn-cc-primary !text-xs sm:!text-sm"
      >
        + Créer
      </button>
      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute right-0 z-40 mt-1.5 min-w-[11.5rem] rounded-xl border border-slate-200/80 bg-white py-1",
            "shadow-[0_8px_24px_rgba(15,23,42,0.08)]",
          )}
        >
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              role="menuitem"
              className="block px-3.5 py-2 text-[13px] text-slate-700 transition-colors hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              {it.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
