"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertCircle,
  Briefcase,
  Calendar,
  FileText,
  Home,
  Menu,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useMessagerieUnread } from "@/hooks/useMessagerieUnread";
import { isHrefAllowedForPersona } from "@/lib/equipe-acces/nav-by-persona";

type Tab = {
  href: string;
  label: string;
  icon: typeof Home;
  exact?: boolean;
};

const INTERNAL_TABS: Tab[] = [
  { href: "/dashboard", label: "Accueil", icon: Home, exact: true },
  { href: "/dashboard/a-traiter", label: "À traiter", icon: AlertCircle },
  { href: "/dashboard/messagerie", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/agenda", label: "Agenda", icon: Calendar },
];

const SUPPLIER_TABS: Tab[] = [
  { href: "/dashboard", label: "Accueil", icon: Home, exact: true },
  { href: "/dashboard/commandes", label: "Commandes", icon: Briefcase },
  { href: "/dashboard/messagerie", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/documents", label: "Docs", icon: FileText },
];

const CLIENT_TABS: Tab[] = [
  { href: "/dashboard", label: "Accueil", icon: Home, exact: true },
  { href: "/dashboard/projets", label: "Chantiers", icon: Briefcase },
  { href: "/dashboard/messagerie", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/documents", label: "Docs", icon: FileText },
];

/** Barre basse mobile — adaptée au persona (pas de modules internes pour externes). */
export function MobileBottomNav({
  personType,
  permissionProfile,
}: {
  personType?: string | null;
  permissionProfile?: string | null;
}) {
  const pathname = usePathname();
  const msgBadge = useMessagerieUnread();

  const isSupplier =
    personType === "SUPPLIER" || permissionProfile === "FOURNISSEUR";
  const isClient =
    personType === "CLIENT_EXT" || permissionProfile === "CLIENT";

  const tabs = (
    isSupplier ? SUPPLIER_TABS : isClient ? CLIENT_TABS : INTERNAL_TABS
  ).filter((tab) => isHrefAllowedForPersona(tab.href, personType, permissionProfile));

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white/95 px-0.5 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden"
      aria-label="Navigation mobile"
    >
      {tabs.map((tab) => {
        const exact = Boolean(tab.exact);
        const active = exact
          ? pathname === tab.href
          : pathname === tab.href || pathname.startsWith(tab.href + "/");
        const Icon = tab.icon;
        const isMsg = tab.href === "/dashboard/messagerie";
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "relative flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-semibold",
              active ? "text-[#1e3a5f]" : "text-slate-500",
              isMsg && active ? "font-bold" : null,
            )}
            aria-current={active ? "page" : undefined}
            aria-label={
              isMsg && msgBadge > 0
                ? `Messages, ${msgBadge} non lus`
                : tab.label
            }
          >
            <span className="relative inline-flex">
              <Icon
                className={cn("h-5 w-5", isMsg ? "h-[22px] w-[22px]" : null)}
                strokeWidth={isMsg && active ? 2.25 : 2}
                aria-hidden
              />
              {isMsg && msgBadge > 0 ? (
                <span className="absolute -right-2.5 -top-1.5 inline-flex min-w-[1.05rem] items-center justify-center rounded-full bg-[#00a884] px-1 text-[9px] font-bold leading-none text-white">
                  {msgBadge > 99 ? "99+" : msgBadge}
                </span>
              ) : null}
            </span>
            {tab.label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={() => {
          window.dispatchEvent(new Event("bework:open-sidebar"));
        }}
        className="flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-semibold text-slate-500"
        aria-label="Plus de modules"
      >
        <Menu className="h-5 w-5" aria-hidden />
        Plus
      </button>
    </nav>
  );
}
