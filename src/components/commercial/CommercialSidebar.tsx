"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeft,
  Receipt,
  Wallet,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  buildCommercialNav,
  isCommercialNavActive,
  type CommercialNavGroup,
} from "@/lib/commercial/workspace-nav";

const COLLAPSE_KEY = "bework.commercial.sidebarCollapsed";
const OPEN_KEY = "bework.commercial.navOpen";

export function CommercialSidebar({
  personType,
  permissionProfile,
  orgLabel,
}: {
  personType?: string | null;
  permissionProfile?: string | null;
  orgLabel?: string | null;
}) {
  const pathname = usePathname() ?? "";
  const groups = useMemo(
    () => buildCommercialNav({ personType, permissionProfile }),
    [personType, permissionProfile],
  );

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
      const raw = localStorage.getItem(OPEN_KEY);
      if (raw) setOpenGroups(JSON.parse(raw) as Record<string, boolean>);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function persistCollapsed(next: boolean) {
    setCollapsed(next);
    try {
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  }

  function toggleGroup(id: string) {
    setOpenGroups((prev) => {
      const next = { ...prev, [id]: !(prev[id] ?? true) };
      try {
        localStorage.setItem(OPEN_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  function isGroupOpen(g: CommercialNavGroup) {
    if (g.label == null) return true;
    return openGroups[g.id] ?? true;
  }

  const nav = (
    <div className="flex h-full flex-col">
      <div className={cn("border-b border-slate-200/80 px-3 py-4", collapsed && "px-2")}>
        <Link
          href="/dashboard/devis-facturation"
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8]/30"
        >
          <p className="text-[15px] font-semibold tracking-tight text-bework-navy-deep">
            {collapsed ? "BW" : "BeWork"}
          </p>
          {!collapsed ? (
            <p className="mt-0.5 text-[13px] font-medium text-bework-navy/80">
              Devis & Facturation
            </p>
          ) : null}
        </Link>
        {!collapsed && orgLabel ? (
          <p className="mt-2 truncate text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400">
            {orgLabel}
          </p>
        ) : null}
      </div>

      <nav
        className="flex-1 overflow-y-auto px-2 py-3"
        aria-label="Navigation commerciale"
      >
        {groups.map((g) => {
          const open = isGroupOpen(g);
          return (
            <div key={g.id} className="mb-3">
              {g.label && !collapsed ? (
                <button
                  type="button"
                  onClick={() => toggleGroup(g.id)}
                  className="mb-1 flex w-full items-center justify-between px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-bework-navy/45"
                >
                  {g.label}
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform",
                      !open && "-rotate-90",
                    )}
                  />
                </button>
              ) : null}
              {(collapsed || open) && (
                <ul className="space-y-0.5">
                  {g.links.map((l) => {
                    const active = isCommercialNavActive(pathname, l);
                    return (
                      <li key={`${g.id}-${l.href}-${l.label}`}>
                        <Link
                          href={l.href}
                          title={l.label}
                          className={cn(
                            "flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-[background,color] duration-150",
                            collapsed && "justify-center px-2",
                            active
                              ? "bw-nav-active"
                              : "text-slate-600 hover:bg-white/80 hover:text-bework-navy",
                            l.action && !active && "font-semibold text-bework-accent",
                          )}
                          aria-current={active ? "page" : undefined}
                        >
                          {collapsed ? (
                            <NavIcon label={l.label} action={l.action} />
                          ) : (
                            <>
                              {l.action ? (
                                <span className="text-[12px] font-bold">+</span>
                              ) : null}
                              <span className="truncate">{l.label}</span>
                            </>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-slate-200/80 p-2">
        <button
          type="button"
          onClick={() => persistCollapsed(!collapsed)}
          className="hidden w-full items-center justify-center gap-2 rounded-lg px-2.5 py-2 text-[12px] font-medium text-slate-500 hover:bg-slate-50 lg:flex"
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4" />
              Réduire le menu
            </>
          )}
        </button>
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-50 hover:text-[#1e3a5f]",
            collapsed && "justify-center",
          )}
        >
          <ChevronLeft className="h-4 w-4 shrink-0" />
          {!collapsed ? <span>Retour à la plateforme</span> : null}
        </Link>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-4 left-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md lg:hidden"
        aria-label="Ouvrir le menu commercial"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40"
            aria-label="Fermer"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(100%,280px)] flex-col bw-sidebar-shell shadow-xl">
            <div className="flex justify-end p-2">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-2 text-slate-500"
                aria-label="Fermer le menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      ) : null}

      <aside
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 bw-sidebar-shell lg:block",
          collapsed ? "w-[72px]" : "w-[240px]",
        )}
      >
        {nav}
      </aside>
    </>
  );
}

function NavIcon({ label, action }: { label: string; action?: boolean }) {
  if (action) return <span className="text-sm font-bold">+</span>;
  const l = label.toLowerCase();
  if (l.includes("vue") || l.includes("tableau")) {
    return <LayoutDashboard className="h-4 w-4" />;
  }
  if (l.includes("devis")) return <FileText className="h-4 w-4" />;
  if (l.includes("facture") || l.includes("situation") || l.includes("avenant")) {
    return <Receipt className="h-4 w-4" />;
  }
  if (l.includes("encaiss") || l.includes("paiement") || l.includes("impay")) {
    return <Wallet className="h-4 w-4" />;
  }
  if (l.includes("client") || l.includes("fournisseur")) {
    return <Building2 className="h-4 w-4" />;
  }
  return <ChevronRight className="h-4 w-4" />;
}
