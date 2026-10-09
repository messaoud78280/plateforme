"use client";

import type { ComponentType } from "react";
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
  Receipt,
  RefreshCw,
  Ruler,
  Settings,
  Sparkles,
  StickyNote,
  Users,
  Wallet,
  CircleDollarSign,
  Package,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { isNavHrefAllowedForDemo } from "@/lib/demo-environment/nav-modules";
import { canAccessDashboardHref } from "@/lib/equipe-acces/dashboard-policy";
import { MessagerieNavBadge } from "@/components/dashboard/MessagerieNavBadge";
import { useATraiterCount } from "@/hooks/useATraiterCount";
import { WorkspaceBrandLink } from "@/components/dashboard/WorkspaceBrandLink";
import {
  SidebarIcon,
  SidebarItem,
  SidebarSection,
  SidebarSectionHeader,
  type SidebarTone,
} from "@/components/dashboard/sidebar/SidebarPrimitives";

type RoleKey = "CLIENT" | "MANAGER" | "AGENT" | "AGENCE";
type FamTone = SidebarTone;

type NavItem = {
  href: string;
  label: string;
  exact?: boolean;
  icon: ComponentType<{ className?: string }>;
  roles: RoleKey[];
  emphasis?: "high" | "low";
};

type NavFamily = {
  id: string;
  label: string;
  tone: FamTone;
  pinned?: boolean;
  items: NavItem[];
};

const FAM_OPEN_KEY = "bework-sidebar-families";

const ALL: RoleKey[] = ["CLIENT", "MANAGER", "AGENT", "AGENCE"];
const INTERNAL: RoleKey[] = ["CLIENT", "MANAGER", "AGENT", "AGENCE"];
const OPS: RoleKey[] = ["MANAGER", "AGENT", "AGENCE"];

function roleKey(role: string | null | undefined): RoleKey | null {
  if (role === "CLIENT") return "CLIENT";
  if (role === "MANAGER") return "MANAGER";
  if (role === "AGENCE") return "AGENCE";
  if (role === "AGENT") return "AGENT";
  return null;
}

function buildFamilies(): NavFamily[] {
  return [
    {
      id: "accueil",
      label: "Espace de travail",
      tone: "navy",
      pinned: true,
      items: [
        {
          href: "/dashboard",
          label: "Espace de travail",
          exact: true,
          icon: Home,
          roles: ALL,
          emphasis: "high",
        },
        { href: "/dashboard/a-traiter", label: "À traiter", icon: AlertCircle, roles: ALL, emphasis: "high" },
      ],
    },
    {
      id: "terrain",
      label: "Chantiers & terrain",
      tone: "cyan",
      items: [
        { href: "/dashboard/projets", label: "Chantiers", icon: FolderKanban, roles: ALL, emphasis: "high" },
        { href: "/dashboard/planning", label: "Planning", icon: CalendarDays, roles: ALL, emphasis: "high" },
        { href: "/dashboard/agenda", label: "Agenda", icon: Calendar, roles: ALL },
        { href: "/dashboard/visites-metres", label: "Visites & métrés", icon: Ruler, roles: ALL, emphasis: "high" },
        {
          href: "/dashboard/devis-facturation",
          label: "Devis & facturation",
          icon: Receipt,
          roles: ALL,
          emphasis: "high",
        },
        { href: "/dashboard/fiches-suivi", label: "Fiches suivi", icon: StickyNote, roles: ["CLIENT", "MANAGER"] },
        { href: "/dashboard/taches", label: "Tâches", icon: ClipboardList, roles: ALL },
        { href: "/dashboard/messages", label: "RDV & contact", icon: CalendarDays, roles: OPS },
      ],
    },
    {
      id: "achats",
      label: "Achats & fournisseurs",
      tone: "watch",
      items: [
        { href: "/dashboard/commandes", label: "Commandes", icon: Briefcase, roles: ["CLIENT"] },
        { href: "/dashboard/depenses", label: "Dépenses", icon: CircleDollarSign, roles: ["CLIENT"] },
        { href: "/dashboard/fournisseurs", label: "Fournisseurs", icon: Building2, roles: ["CLIENT"] },
        {
          href: "/dashboard/catalogue-materiaux",
          label: "Catalogue Matériaux",
          icon: Package,
          roles: ["CLIENT"],
        },
        { href: "/dashboard/livraisons", label: "Livraisons", icon: CalendarDays, roles: ["CLIENT"] },
      ],
    },
    {
      id: "collab",
      label: "Collaboration & documents",
      tone: "violet",
      items: [
        { href: "/dashboard/messagerie", label: "Messagerie", icon: MessageSquare, roles: ALL },
        { href: "/dashboard/documents", label: "Documents", icon: FileText, roles: ALL },
        { href: "/dashboard/equipe", label: "Équipe & partenaires", icon: Users, roles: ALL },
        { href: "/dashboard/contrats-annuels", label: "Contrats annuels", icon: RefreshCw, roles: INTERNAL },
        { href: "/dashboard/agents", label: "Agents", icon: Users, roles: ["MANAGER"] },
      ],
    },
    {
      id: "commercial",
      label: "Gestion commerciale",
      tone: "navy",
      items: [
        {
          href: "/dashboard/leads",
          label: "Leads",
          icon: Users,
          roles: ["CLIENT", "MANAGER"],
          emphasis: "high",
        },
        {
          href: "/dashboard/devis-facturation",
          label: "Devis & Facturation",
          icon: Wallet,
          roles: ALL,
          emphasis: "high",
        },
        {
          href: "/dashboard/devis-facturation/bibliotheque",
          label: "Bibliothèque",
          icon: FileText,
          roles: ["CLIENT", "MANAGER"],
          emphasis: "high",
        },
        { href: "/dashboard/facturation", label: "À facturer", icon: Wallet, roles: ALL },
        {
          href: "/dashboard/devis-facturation/clients",
          label: "Clients",
          icon: Building2,
          roles: ["CLIENT", "MANAGER"],
        },
        { href: "/dashboard/devis", label: "Analyses", icon: FileText, roles: OPS },
      ],
    },
    {
      id: "pilotage",
      label: "Pilotage",
      tone: "ok",
      items: [
        { href: "/dashboard/pilotage-travaux", label: "Pilotage", icon: LayoutDashboard, roles: ALL },
        { href: "/dashboard/rentabilite", label: "Rentabilité", icon: CircleDollarSign, roles: ALL },
        { href: "/dashboard/rapports", label: "Rapports", icon: Briefcase, roles: ["CLIENT", "MANAGER"], emphasis: "low" },
      ],
    },
    {
      id: "outils",
      label: "Outils",
      tone: "magenta",
      items: [
        { href: "/dashboard/assistant-ia", label: "Assistant IA", icon: Sparkles, roles: ALL, emphasis: "low" },
        { href: "/dashboard/demonstrations", label: "Démos", icon: PanelLeft, roles: ["MANAGER", "AGENCE"] },
      ],
    },
    {
      id: "compte",
      label: "Compte",
      tone: "neutral",
      items: [
        { href: "/dashboard/abonnement", label: "Abonnement", icon: Wallet, roles: ["CLIENT"] },
        { href: "/dashboard/parametres", label: "Paramètres", icon: Settings, roles: ALL, emphasis: "low" },
      ],
    },
  ];
}

function isItemActive(pathname: string, item: NavItem): boolean {
  return item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function readFamilyOpen(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(FAM_OPEN_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
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
  demoLogoUrl,
  productSecondaryLabel,
  contactRoleFallback,
}: {
  role?: string | null;
  userName?: string | null;
  userRoleLabel?: string | null;
  companyName?: string | null;
  isDemo?: boolean;
  demoModules?: string[] | null;
  personType?: string | null;
  permissionProfile?: string | null;
  demoLogoUrl?: string | null;
  /** Issu de PlatformConfig — jamais DEMO_BRAND global. */
  productSecondaryLabel?: string | null;
  contactRoleFallback?: string | null;
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
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [familyOpen, setFamilyOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setFamilyOpen(readFamilyOpen());
  }, []);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

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

  function persistFamilyOpen(next: Record<string, boolean>) {
    setFamilyOpen(next);
    try {
      localStorage.setItem(FAM_OPEN_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  const rk = roleKey(role);
  const families = buildFamilies()
    .map((family) => ({
      ...family,
      items: family.items.filter((item) => {
        if (!rk || !item.roles.includes(rk)) return false;
        if (isDemo && !isNavHrefAllowedForDemo(item.href, demoModules ?? [])) {
          return false;
        }
        if (!canAccessDashboardHref(item.href, personType, permissionProfile)) {
          return false;
        }
        return true;
      }),
    }))
    .filter((f) => f.items.length > 0);

  const initials = (userName ?? "BW")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const demoCompanyLabel = companyName?.trim() || (isDemo ? "Démonstration" : "BeWork");
  const brandLogo = isDemo ? demoLogoUrl || null : null;
  const workspaceLabel =
    companyName?.trim() || (isDemo ? demoCompanyLabel : "Espace de travail");
  const secondaryLabel =
    productSecondaryLabel?.trim() ||
    (isDemo ? "Démonstration BeWork" : "Propulsé par BeWork");
  const roleFallback = contactRoleFallback?.trim() || "";

  const navBody = (
    <>
      <div
        className={cn(
          "flex items-center gap-2.5 px-3 py-3.5",
          collapsed && "justify-center px-2",
        )}
      >
        <WorkspaceBrandLink
          premium
          primaryLabel={workspaceLabel}
          secondaryLabel={secondaryLabel}
          logoUrl={brandLogo}
          collapsed={collapsed}
          className="min-w-0 flex-1"
          onNavigate={() => setMobileOpen(false)}
        />
        {mobileOpen ? (
          <button
            type="button"
            className="ml-auto rounded-xl p-1.5 text-slate-500 hover:bg-white/70 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <nav
        className="flex-1 space-y-1 overflow-y-auto px-2.5 pb-3 pt-1"
        aria-label="Navigation principale"
      >
        {families.map((family, familyIndex) => {
          const hasActive = family.items.some((item) => isItemActive(pathname, item));
          const open = family.pinned || hasActive || familyOpen[family.id] !== false;
          return (
            <SidebarSection key={family.id} first={familyIndex === 0}>
              {!collapsed && family.pinned ? (
                <SidebarSectionHeader label={family.label} tone={family.tone} />
              ) : null}
              {!collapsed && !family.pinned ? (
                <SidebarSectionHeader
                  label={family.label}
                  tone={family.tone}
                  collapsible
                  open={open}
                  locked={hasActive}
                  onToggle={() =>
                    persistFamilyOpen({ ...familyOpen, [family.id]: !open })
                  }
                />
              ) : null}
              {collapsed || open ? (
                <ul className="space-y-1.5">
                  {family.items.map((item) => {
                    const active = isItemActive(pathname, item);
                    const pending = pendingHref === item.href;
                    return (
                      <li key={item.href}>
                        <SidebarItem
                          href={item.href}
                          label={item.label}
                          tone={family.tone}
                          active={active}
                          pending={pending}
                          collapsed={collapsed}
                          emphasis={item.emphasis}
                          title={collapsed ? item.label : undefined}
                          onNavigate={() => {
                            setMobileOpen(false);
                            if (!active) setPendingHref(item.href);
                          }}
                          icon={
                            <SidebarIcon icon={item.icon} active={active}>
                              {collapsed && item.href === "/dashboard/a-traiter" ? (
                                <ATraiterDot />
                              ) : null}
                              {collapsed && item.href === "/dashboard/messagerie" ? (
                                <MessagerieDot />
                              ) : null}
                            </SidebarIcon>
                          }
                          trailing={
                            <>
                              {!collapsed && item.href === "/dashboard/a-traiter" ? (
                                <ATraiterCountBadge />
                              ) : null}
                              {!collapsed && item.href === "/dashboard/messagerie" ? (
                                <MessagerieNavBadge active={active} />
                              ) : null}
                            </>
                          }
                        />
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </SidebarSection>
          );
        })}
      </nav>

      <div className={cn("p-3", collapsed && "px-2")}>
        <div
          className={cn(
            "mb-2 flex items-center gap-2.5 bw-user-card px-2.5 py-2",
            collapsed && "justify-center bg-transparent px-0 border-0 shadow-none",
          )}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bework-navy/10 text-[11px] font-semibold text-bework-navy">
            {initials}
          </span>
          {!collapsed ? (
            <span className="min-w-0">
              <span className="block truncate text-xs font-semibold text-bework-ink">
                {userName ?? "Utilisateur"}
              </span>
              <span className="block truncate text-[11px] text-bework-muted">
                {userRoleLabel ?? (isDemo ? roleFallback : role ?? "")}
              </span>
            </span>
          ) : null}
        </div>
        <div className={cn("flex gap-1", collapsed ? "flex-col" : "items-center")}>
          <button
            type="button"
            onClick={toggleCollapsed}
            className="hidden items-center justify-center rounded-xl border border-bework-navy/15 bg-white/70 p-2 text-bework-muted hover:bg-bework-soft-accent hover:text-bework-navy lg:inline-flex"
            aria-label={collapsed ? "Développer le menu" : "Réduire le menu"}
          >
            {collapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={() =>
              signOut({ callbackUrl: isDemo ? "/connexion/demo" : "/connexion" })
            }
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-xl border border-bework-navy/15 bg-white/70 px-2 py-2 text-[11px] font-semibold text-bework-navy hover:bg-bework-soft-critical hover:border-bework-critical/25 hover:text-bework-critical",
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
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
            aria-label="Fermer le menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[272px] flex-col bw-sidebar-shell shadow-[var(--cc-shadow-hover)]">
            {navBody}
          </aside>
        </div>
      ) : null}

      <aside
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 flex-col bw-sidebar-shell lg:flex",
          collapsed ? "w-[76px]" : "w-[252px]",
        )}
      >
        {navBody}
      </aside>
    </>
  );
}

function ATraiterCountBadge() {
  const { visible, label } = useATraiterCount();
  if (!visible || !label) return null;
  return (
    <span className="ml-auto inline-flex min-w-[1.15rem] items-center justify-center rounded-full bg-bework-watch px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
      {label}
    </span>
  );
}

function ATraiterDot() {
  const { visible } = useATraiterCount();
  if (!visible) return null;
  return (
    <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-bework-watch" aria-hidden />
  );
}

function MessagerieDot() {
  return <MessagerieNavBadge compact />;
}
