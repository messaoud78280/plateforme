"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import {
  AlertCircle,
  Briefcase,
  Building2,
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  FolderKanban,
  Home,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  PanelLeft,
  Settings,
  Sparkles,
  StickyNote,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { isNavHrefAllowedForDemo } from "@/lib/demo-environment/nav-modules";
import {
  canManageEquipe,
  isHrefAllowedForPersona,
} from "@/lib/equipe-acces/nav-by-persona";
import { MessagerieNavBadge } from "@/components/dashboard/MessagerieNavBadge";

type NavItem = {
  href: string;
  label: string;
  exact?: boolean;
  icon: ComponentType<{ className?: string }>;
};

type NavSection = { id: string; label: string; items: NavItem[] };

function buildSections(role: string | null | undefined): NavSection[] {
  const isClient = role === "CLIENT";
  const isManager = role === "MANAGER";
  const isAgent = role === "AGENT" || role === "AGENCE";

  if (isClient) {
    return [
      {
        id: "principal",
        label: "Principal",
        items: [
          { href: "/dashboard", label: "Accueil", exact: true, icon: Home },
          { href: "/dashboard/a-traiter", label: "À traiter", icon: AlertCircle },
          { href: "/dashboard/messagerie", label: "Messagerie", icon: MessageSquare },
          { href: "/dashboard/projets", label: "Chantiers", icon: FolderKanban },
          { href: "/dashboard/messages", label: "Planning", icon: CalendarDays },
          { href: "/dashboard/agenda", label: "Agenda", icon: Calendar },
          { href: "/dashboard/commandes", label: "Commandes", icon: Briefcase },
          { href: "/dashboard/taches", label: "Tâches", icon: ClipboardList },
          { href: "/dashboard/livraisons", label: "Livraisons", icon: CalendarDays },
          { href: "/dashboard/fiches-suivi", label: "Fiches suivi", icon: StickyNote },
          { href: "/dashboard/fournisseurs", label: "Fournisseurs", icon: Building2 },
        ],
      },
      {
        id: "gestion",
        label: "Gestion",
        items: [
          { href: "/dashboard/documents", label: "Documents", icon: FileText },
          { href: "/dashboard/equipe", label: "Équipe & partenaires", icon: Users },
        ],
      },
      {
        id: "pilotage",
        label: "Pilotage",
        items: [
          { href: "/dashboard/pilotage-travaux", label: "Pilotage", icon: LayoutDashboard },
          { href: "/dashboard/rapports", label: "Rapports", icon: Briefcase },
          { href: "/dashboard/skills", label: "Assistant IA", icon: Sparkles },
        ],
      },
      {
        id: "compte",
        label: "Compte",
        items: [
          { href: "/dashboard/abonnement", label: "Abonnement", icon: Wallet },
          { href: "/dashboard/parametres", label: "Paramètres", icon: Settings },
        ],
      },
    ];
  }

  if (isManager) {
    return [
      {
        id: "principal",
        label: "Principal",
        items: [
          { href: "/dashboard", label: "Accueil", exact: true, icon: Home },
          { href: "/dashboard/a-traiter", label: "À traiter", icon: AlertCircle },
          { href: "/dashboard/messagerie", label: "Messagerie", icon: MessageSquare },
          { href: "/dashboard/projets", label: "Chantiers", icon: FolderKanban },
          { href: "/dashboard/clients", label: "Clients", icon: Building2 },
          { href: "/dashboard/taches", label: "Missions", icon: ClipboardList },
        ],
      },
      {
        id: "ops",
        label: "Opérations",
        items: [
          { href: "/dashboard/agents", label: "Agents", icon: Users },
          { href: "/dashboard/pilotage-travaux", label: "Pilotage", icon: LayoutDashboard },
          { href: "/dashboard/messages", label: "RDV", icon: CalendarDays },
          { href: "/dashboard/agenda", label: "Agenda", icon: Calendar },
          { href: "/dashboard/fiches-suivi", label: "Fiches suivi", icon: StickyNote },
        ],
      },
      {
        id: "outils",
        label: "Outils",
        items: [
          { href: "/dashboard/devis", label: "Analyses", icon: FileText },
          { href: "/dashboard/skills", label: "Skills IA", icon: Sparkles },
          { href: "/dashboard/demonstrations", label: "Démos", icon: PanelLeft },
          { href: "/dashboard/rapports", label: "Rapports", icon: Briefcase },
        ],
      },
      {
        id: "admin",
        label: "Administration",
        items: [{ href: "/dashboard/parametres", label: "Paramètres", icon: Settings }],
      },
    ];
  }

  if (isAgent) {
    return [
      {
        id: "principal",
        label: "Principal",
        items: [
          { href: "/dashboard", label: "Accueil", exact: true, icon: Home },
          { href: "/dashboard/a-traiter", label: "À traiter", icon: AlertCircle },
          { href: "/dashboard/messagerie", label: "Messagerie", icon: MessageSquare },
          { href: "/dashboard/taches", label: "Mes missions", icon: ClipboardList },
          { href: "/dashboard/projets", label: "Chantiers", icon: FolderKanban },
          { href: "/dashboard/agenda", label: "Agenda", icon: Calendar },
          { href: "/dashboard/pilotage-travaux", label: "Pilotage", icon: LayoutDashboard },
        ],
      },
      {
        id: "outils",
        label: "Outils",
        items: [
          ...(role === "AGENCE"
            ? [{ href: "/dashboard/demonstrations", label: "Démos", icon: PanelLeft }]
            : []),
          { href: "/dashboard/messages", label: "RDV", icon: CalendarDays },
          { href: "/dashboard/devis", label: "Analyses", icon: FileText },
          { href: "/dashboard/skills", label: "Skills", icon: Sparkles },
          { href: "/dashboard/parametres", label: "Paramètres", icon: Settings },
        ],
      },
    ];
  }

  return [];
}

export function AppSidebar({
  role,
  userName,
  userRoleLabel,
  companyName,
  isDemo,
  demoModules,
  personType,
  permissionProfile,
}: {
  role?: string | null;
  userName?: string | null;
  userRoleLabel?: string | null;
  companyName?: string | null;
  isDemo?: boolean;
  demoModules?: string[] | null;
  personType?: string | null;
  permissionProfile?: string | null;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("bework-sidebar-collapsed") === "1";
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  function toggleCollapsed() {
    setCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem("bework-sidebar-collapsed", next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const sections = buildSections(role)
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (isDemo && !isNavHrefAllowedForDemo(item.href, demoModules ?? [])) {
          return false;
        }
        if (role === "CLIENT") {
          if (
            item.href === "/dashboard/equipe" &&
            !canManageEquipe(personType, permissionProfile)
          ) {
            return false;
          }
          if (!isHrefAllowedForPersona(item.href, personType, permissionProfile)) {
            return false;
          }
          if (
            item.href === "/dashboard/livraisons" &&
            personType !== "SUPPLIER" &&
            permissionProfile !== "FOURNISSEUR"
          ) {
            return false;
          }
        }
        return true;
      }),
    }))
    .filter((s) => s.items.length > 0);

  const initials = (userName ?? "BW")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const navBody = (
    <>
      <div
        className={cn(
          "flex items-center gap-3 border-b border-slate-200/70 px-3.5 py-4",
          collapsed && "justify-center px-2",
        )}
      >
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5" onClick={() => setMobileOpen(false)}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-bework-navy to-[#0f2744] text-[11px] font-extrabold tracking-wide text-white shadow-sm">
            BW
          </span>
          {!collapsed ? (
            <span className="min-w-0">
              <span className="block truncate text-sm font-extrabold tracking-tight text-bework-navy">BeWork</span>
              <span className="block truncate text-[11px] font-medium text-bework-muted">
                {companyName ?? (isDemo ? "Démonstration" : "Plateforme interne")}
              </span>
            </span>
          ) : null}
        </Link>
        {mobileOpen ? (
          <button
            type="button"
            className="ml-auto rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-2 py-4" aria-label="Navigation principale">
        {sections.map((section) => (
          <div key={section.id}>
            {!collapsed ? (
              <p className="mb-1.5 px-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-bework-muted">
                {section.label}
              </p>
            ) : null}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={item.label}
                      onClick={() => setMobileOpen(false)}
                      prefetch
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-semibold transition-colors duration-75 active:scale-[0.98]",
                        collapsed && "justify-center px-2",
                        active
                          ? "bg-bework-navy text-white shadow-sm"
                          : "text-bework-ink/75 hover:bg-white hover:text-bework-navy hover:shadow-sm",
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", active ? "opacity-95" : "opacity-70")} />
                      {!collapsed ? <span className="truncate">{item.label}</span> : null}
                      {!collapsed && item.href === "/dashboard/messagerie" ? (
                        <MessagerieNavBadge active={active} />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className={cn("border-t border-slate-200/70 p-3", collapsed && "px-2")}>
        <div
          className={cn(
            "mb-2 flex items-center gap-2.5 rounded-xl border border-slate-100 bg-white px-2.5 py-2 shadow-sm",
            collapsed && "justify-center border-0 bg-transparent px-0 shadow-none",
          )}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bework-navy/10 text-[11px] font-bold text-bework-navy">
            {initials}
          </span>
          {!collapsed ? (
            <span className="min-w-0">
              <span className="block truncate text-xs font-bold text-bework-ink">{userName ?? "Utilisateur"}</span>
              <span className="block truncate text-[10px] text-bework-muted">
                {isDemo ? "Direction · Démo" : userRoleLabel ?? role ?? ""}
              </span>
            </span>
          ) : null}
        </div>
        <div className={cn("flex gap-1", collapsed ? "flex-col" : "items-center")}>
          <button
            type="button"
            onClick={toggleCollapsed}
            className="hidden items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-bework-muted hover:text-bework-navy lg:inline-flex"
            aria-label={collapsed ? "Développer le menu" : "Réduire le menu"}
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: isDemo ? "/connexion/demo" : "/connexion" })}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-2 text-[11px] font-semibold text-bework-ink hover:bg-slate-50",
              !collapsed && "flex-1",
            )}
            aria-label="Déconnexion"
          >
            <LogOut className="h-3.5 w-3.5" />
            {!collapsed ? "Déconnexion" : null}
          </button>
        </div>
      </div>
    </>
  );

  useEffect(() => {
    function onOpen() {
      setMobileOpen(true);
    }
    window.addEventListener("bework:open-sidebar", onOpen);
    return () => window.removeEventListener("bework:open-sidebar", onOpen);
  }, []);

  return (
    <>
      {/* FAB remplacé par barre basse MobileBottomNav (Plus) */}

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
            aria-label="Fermer le menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[272px] flex-col bg-[#f8fafc] shadow-2xl">
            {navBody}
          </aside>
        </div>
      ) : null}

      <aside
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-slate-200/80 bg-[#f8fafc] lg:flex",
          collapsed ? "w-[76px]" : "w-[260px]",
        )}
      >
        {navBody}
      </aside>
    </>
  );
}
