"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertCircle,
  Calendar,
  Home,
  Menu,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useMessagerieUnread } from "@/hooks/useMessagerieUnread";

const TABS = [
  { href: "/dashboard", label: "Accueil", icon: Home, exact: true },
  { href: "/dashboard/a-traiter", label: "À traiter", icon: AlertCircle },
  { href: "/dashboard/messagerie", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/agenda", label: "Agenda", icon: Calendar },
] as const;

/** Barre basse mobile — Messagerie en un tap. */
export function MobileBottomNav() {
  const pathname = usePathname();
  const msgBadge = useMessagerieUnread();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden"
      aria-label="Navigation mobile"
    >
      {TABS.map((tab) => {
        const exact = "exact" in tab && tab.exact;
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
              "relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold",
              active ? "text-bework-navy" : "text-slate-500",
            )}
          >
            <Icon className="h-5 w-5" />
            {tab.label}
            {isMsg && msgBadge > 0 ? (
              <span className="absolute right-[18%] top-1 inline-flex min-w-[1rem] items-center justify-center rounded-full bg-[#00a884] px-1 text-[9px] font-bold text-white">
                {msgBadge > 99 ? "99+" : msgBadge}
              </span>
            ) : null}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={() => {
          window.dispatchEvent(new Event("bework:open-sidebar"));
        }}
        className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold text-slate-500"
      >
        <Menu className="h-5 w-5" />
        Plus
      </button>
    </nav>
  );
}
