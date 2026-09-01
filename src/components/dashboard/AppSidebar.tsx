"use client";

import type { ComponentType, CSSProperties } from "react";
import Image from "next/image";
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
  ChevronDown,
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
  RefreshCw,
  Ruler,
  Settings,
  Sparkles,
  StickyNote,
  Users,
  Wallet,
  CircleDollarSign,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { isNavHrefAllowedForDemo } from "@/lib/demo-environment/nav-modules";
import { canAccessDashboardHref } from "@/lib/equipe-acces/dashboard-policy";
import { MessagerieNavBadge } from "@/components/dashboard/MessagerieNavBadge";

type RoleKey = "CLIENT" | "MANAGER" | "AGENT" | "AGENCE";
type FamTone = "navy" | "cyan" | "watch" | "violet" | "ok" | "magenta" | "neutral";

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
      label: "Accueil",
      tone: "navy",
      pinned: true,
      items: [
        { href: "/dashboard", label: "Accueil", exact: true, icon: Home, roles: ALL, emphasis: "high" },
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

const FAM_COLOR: Record<FamTone, string> = {
  navy: "var(--cc-navy)",
  cyan: "var(--cc-cyan)",
  watch: "var(--cc-watch)",
  violet: "var(--cc-intel)",
  ok: "var(--cc-ok)",
  magenta: "var(--cc-magenta)",
  neutral: "color-mix(in srgb, var(--cc-navy) 45%, #94a3b8)",
};

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
  const companyInitials = workspaceLabel
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "BW";
  const secondaryLabel =
    productSecondaryLabel?.trim() ||
    (isDemo ? "Démonstration BeWork" : "Propulsé par BeWork");
  const roleFallback = contactRoleFallback?.trim() || "";

  const navBody = (
    <>
      <div
        className={cn(
          "flex items-center gap-3 border-b border-[color:var(--cc-border)] px-3.5 py-4",
          collapsed && "justify-center px-2",
        )}
      >
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5" onClick={() => setMobileOpen(false)}>
          {isDemo && brandLogo && !collapsed ? (
            <span className="relative flex h-9 w-[7.5rem] shrink-0 items-center overflow-hidden rounded-[var(--cc-radius)] bg-white ring-1 ring-[color:var(--cc-border)]">
              <Image
                src={brandLogo}
                alt={workspaceLabel}
                width={120}
                height={36}
                className="h-8 w-auto max-w-[7.25rem] object-contain object-left px-1.5"
                priority
              />
            </span>
          ) : (
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--cc-radius)] bg-bework-navy text-[11px] font-bold tracking-wide text-white"
              title={workspaceLabel}
              aria-hidden
            >
              {companyInitials}
            </span>
          )}
          {!collapsed ? (
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-semibold tracking-tight text-bework-navy">
                {workspaceLabel}
              </span>
              <span className="block truncate text-[11px] font-medium text-bework-muted">
                {secondaryLabel}
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

      <nav className="flex-1 space-y-3 overflow-y-auto px-2 py-3" aria-label="Navigation principale">
        {families.map((family) => {
          const hasActive = family.items.some((item) => isItemActive(pathname, item));
          const open = family.pinned || hasActive || familyOpen[family.id] !== false;
          const color = FAM_COLOR[family.tone];
          return (
            <div
              key={family.id}
              className={cn(
                !family.pinned && "border-t border-[color:var(--cc-navy)]/[0.07] pt-2.5",
              )}
            >
              {!collapsed && !family.pinned ? (
                <button
                  type="button"
                  onClick={() => {
                    if (hasActive) return;
                    persistFamilyOpen({ ...familyOpen, [family.id]: !open });
                  }}
                  className="bw-nav-family mb-1 flex w-full items-center gap-1.5 px-2 py-1 text-left"
                  style={{ "--fam-color": color } as CSSProperties}
                  aria-expanded={open}
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: color }}
                    aria-hidden
                  />
                  <span className="flex-1 text-[11px] font-semibold uppercase tracking-[0.12em]">
                    {family.label}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 opacity-60 transition-transform duration-150",
                      !open && "-rotate-90",
                    )}
                    aria-hidden
                  />
                </button>
              ) : null}
              {!collapsed && family.pinned ? (
                <p
                  className="bw-nav-family mb-1 flex items-center gap-1.5 px-2 py-0.5"
                  style={{ "--fam-color": color } as CSSProperties}
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: color }}
                    aria-hidden
                  />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">
                    {family.label}
                  </span>
                </p>
              ) : null}
              {collapsed || open ? (
                <ul className="space-y-px">
                  {family.items.map((item) => {
                    const Icon = item.icon;
                    const active = isItemActive(pathname, item);
                    const pending = pendingHref === item.href;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          title={collapsed ? item.label : undefined}
                          onClick={() => {
                            setMobileOpen(false);
                            if (!active) setPendingHref(item.href);
                          }}
                          prefetch
                          data-fam={family.tone}
                          className={cn(
                            "bw-nav-item active:scale-[0.98]",
                            collapsed && "justify-center px-2",
                            item.emphasis === "high" && "is-emphasis",
                            item.emphasis === "low" && "font-medium text-slate-600",
                            active && "is-active",
                            pending && !active && "bw-nav-pending",
                          )}
                          aria-current={active ? "page" : undefined}
                          aria-busy={pending || undefined}
                        >
                          <span className="relative inline-flex shrink-0">
                            <Icon className="h-4 w-4 stroke-[1.75]" />
                            {collapsed && item.href === "/dashboard/a-traiter" ? (
                              <ATraiterDot />
                            ) : null}
                            {collapsed && item.href === "/dashboard/messagerie" ? (
                              <MessagerieDot />
                            ) : null}
                          </span>
                          {!collapsed ? <span className="min-w-0 flex-1 truncate">{item.label}</span> : null}
                          {!collapsed && item.href === "/dashboard/a-traiter" ? (
                            <ATraiterCountBadge />
                          ) : null}
                          {!collapsed && item.href === "/dashboard/messagerie" ? (
                            <MessagerieNavBadge active={active} />
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          );
        })}
      </nav>

      <div className={cn("border-t border-[color:var(--cc-border)] p-3", collapsed && "px-2")}>
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
              <span className="block truncate text-xs font-semibold text-bework-ink">{userName ?? "Utilisateur"}</span>
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
            className="hidden items-center justify-center rounded-lg border border-bework-navy/15 bg-bework-soft-navy/60 p-2 text-bework-muted hover:bg-bework-soft-accent hover:text-bework-navy lg:inline-flex"
            aria-label={collapsed ? "Développer le menu" : "Réduire le menu"}
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: isDemo ? "/connexion/demo" : "/connexion" })}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-lg border border-bework-navy/15 bg-bework-soft-navy/50 px-2 py-2 text-[11px] font-semibold text-bework-navy hover:bg-bework-soft-critical hover:border-bework-critical/25 hover:text-bework-critical",
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

function useATraiterCount() {
  const [total, setTotal] = useState(0);
  const [capped, setCapped] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/a-traiter/count", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { total?: number; capped?: boolean };
        if (!cancelled) {
          setTotal(typeof data.total === "number" ? data.total : 0);
          setCapped(Boolean(data.capped));
        }
      } catch {
        /* silencieux */
      }
    }
    void load();
    const timer = window.setInterval(() => void load(), 45_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const visible = total > 0 || capped;
  const label =
    total <= 0 && !capped
      ? null
      : capped
        ? `${total <= 0 ? "200" : total > 99 ? "99" : total}+`
        : total > 99
          ? "99+"
          : String(total);

  return { visible, label };
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
