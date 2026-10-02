"use client";

import type { ComponentType, CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export type SidebarTone =
  | "navy"
  | "cyan"
  | "watch"
  | "violet"
  | "ok"
  | "magenta"
  | "neutral";

export const SIDEBAR_TONE_COLOR: Record<SidebarTone, string> = {
  navy: "var(--cc-navy)",
  cyan: "var(--cc-cyan)",
  watch: "var(--cc-watch)",
  violet: "var(--cc-intel)",
  ok: "var(--cc-ok)",
  magenta: "var(--cc-magenta)",
  neutral: "color-mix(in srgb, var(--cc-navy) 45%, #94a3b8)",
};

/** Grande zone de navigation (rubrique + items). */
export function SidebarSection({
  children,
  className,
  first = false,
}: {
  children: ReactNode;
  className?: string;
  first?: boolean;
}) {
  return (
    <div className={cn(!first && "bw-nav-section", className)}>
      {children}
    </div>
  );
}

/** En-tête de grande rubrique (collapsible ou pinned). */
export function SidebarSectionHeader({
  label,
  tone,
  open,
  collapsible,
  onToggle,
  /** Si true, le chevron reste mais le clic est désactivé (rubrique avec item actif). */
  locked,
}: {
  label: string;
  tone: SidebarTone;
  open?: boolean;
  collapsible?: boolean;
  onToggle?: () => void;
  locked?: boolean;
}) {
  const color = SIDEBAR_TONE_COLOR[tone];
  const style = { "--fam-color": color } as CSSProperties;

  if (!collapsible) {
    return (
      <p className="bw-nav-family mb-1.5 flex items-center gap-2 px-2.5 py-1" style={style}>
        <span className="bw-nav-family-dot" aria-hidden />
        <span className="bw-nav-family-label">{label}</span>
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (locked) return;
        onToggle?.();
      }}
      className={cn(
        "bw-nav-family mb-1.5 flex w-full items-center gap-2 px-2.5 py-1.5 text-left",
        locked && "cursor-default",
      )}
      style={style}
      aria-expanded={open}
    >
      <span className="bw-nav-family-dot" aria-hidden />
      <span className="bw-nav-family-label flex-1">{label}</span>
      <ChevronDown
        className={cn(
          "bw-nav-family-chevron h-3.5 w-3.5 shrink-0",
          !open && "is-closed",
        )}
        aria-hidden
      />
    </button>
  );
}

/** Capsule d’icône pour entrée de menu. */
export function SidebarIcon({
  icon: Icon,
  active,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  active?: boolean;
  children?: ReactNode;
}) {
  return (
    <span className={cn("bw-nav-icon", active && "is-active")} aria-hidden={!children}>
      <Icon className="h-[15px] w-[15px] stroke-[1.75]" />
      {children}
    </span>
  );
}

/** Entrée de navigation (lien) — variantes default / hover / active via CSS. */
export function SidebarItem({
  href,
  label,
  tone,
  active,
  pending,
  collapsed,
  emphasis,
  title,
  onNavigate,
  icon,
  trailing,
}: {
  href: string;
  label: string;
  tone: SidebarTone;
  active?: boolean;
  pending?: boolean;
  collapsed?: boolean;
  emphasis?: "high" | "low";
  title?: string;
  onNavigate?: () => void;
  icon: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <Link
      href={href}
      title={title}
      onClick={onNavigate}
      prefetch
      data-fam={tone}
      className={cn(
        "bw-nav-item",
        collapsed && "justify-center px-2",
        emphasis === "high" && "is-emphasis",
        emphasis === "low" && "font-medium text-slate-600",
        active && "is-active",
        pending && !active && "bw-nav-pending",
      )}
      aria-current={active ? "page" : undefined}
      aria-busy={pending || undefined}
    >
      {icon}
      {!collapsed ? <span className="min-w-0 flex-1 truncate">{label}</span> : null}
      {trailing}
    </Link>
  );
}
