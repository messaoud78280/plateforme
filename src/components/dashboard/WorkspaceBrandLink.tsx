"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

const WORKSPACE_HOME = "/dashboard";
const WORKSPACE_TITLE = "Retour à l’espace de travail";

export type WorkspaceBrandLinkProps = {
  primaryLabel: string;
  secondaryLabel?: string | null;
  logoUrl?: string | null;
  /** Mode icône seule (sidebar repliée). */
  collapsed?: boolean;
  className?: string;
  onNavigate?: () => void;
  /** Affiche le monogramme si pas de logo. */
  showMonogram?: boolean;
  /** Carte organisation premium (sidebar). */
  premium?: boolean;
};

function initialsFrom(label: string): string {
  return (
    label
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "BW"
  );
}

/**
 * Identité société → point d’ancrage permanent `/dashboard`.
 * Utilisé dans tous les layouts (sidebar principale, shell commercial, header).
 */
export function WorkspaceBrandLink({
  primaryLabel,
  secondaryLabel,
  logoUrl,
  collapsed = false,
  className,
  onNavigate,
  showMonogram = true,
  premium = false,
}: WorkspaceBrandLinkProps) {
  const label = primaryLabel.trim() || "Espace de travail";
  const secondary = secondaryLabel?.trim() || null;
  const initials = initialsFrom(label);

  if (premium) {
    return (
      <Link
        href={WORKSPACE_HOME}
        title={WORKSPACE_TITLE}
        aria-label={WORKSPACE_TITLE}
        onClick={onNavigate}
        className={cn(
          collapsed ? "bw-org-card justify-center px-2 py-2" : "bw-org-card",
          className,
        )}
      >
        {logoUrl && !collapsed ? (
          <span className="relative flex h-9 w-[6.5rem] shrink-0 items-center overflow-hidden rounded-[10px] bg-white/90 ring-1 ring-[color:var(--bw-sidebar-border)]">
            <Image
              src={logoUrl}
              alt=""
              width={104}
              height={36}
              className="h-8 w-auto max-w-[6.25rem] object-contain object-left px-1.5"
              priority
            />
          </span>
        ) : showMonogram ? (
          <span className="bw-org-avatar" aria-hidden>
            {initials}
          </span>
        ) : null}
        {!collapsed ? (
          <span className="min-w-0 flex-1">
            <span className="bw-org-title">{label}</span>
            {secondary ? <span className="bw-org-subtitle">{secondary}</span> : null}
          </span>
        ) : null}
      </Link>
    );
  }

  return (
    <Link
      href={WORKSPACE_HOME}
      title={WORKSPACE_TITLE}
      aria-label={WORKSPACE_TITLE}
      onClick={onNavigate}
      className={cn(
        "group flex min-w-0 items-center gap-2.5 rounded-lg outline-none transition-colors",
        "hover:bg-bework-soft-navy/60 focus-visible:ring-2 focus-visible:ring-bework-navy/25",
        collapsed ? "justify-center p-1.5" : "px-1.5 py-1",
        className,
      )}
    >
      {logoUrl && !collapsed ? (
        <span className="relative flex h-9 w-[7.5rem] shrink-0 items-center overflow-hidden rounded-[var(--cc-radius)] bg-white ring-1 ring-[color:var(--cc-border)]">
          <Image
            src={logoUrl}
            alt=""
            width={120}
            height={36}
            className="h-8 w-auto max-w-[7.25rem] object-contain object-left px-1.5"
            priority
          />
        </span>
      ) : showMonogram ? (
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--cc-radius)] bg-bework-navy text-[11px] font-bold tracking-wide text-white transition-opacity group-hover:opacity-90"
          aria-hidden
        >
          {initials}
        </span>
      ) : null}
      {!collapsed ? (
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-semibold tracking-tight text-bework-navy transition-colors group-hover:text-bework-navy-deep">
            {label}
          </span>
          {secondary ? (
            <span className="block truncate text-[11px] font-medium text-bework-muted">
              {secondary}
            </span>
          ) : null}
        </span>
      ) : null}
    </Link>
  );
}

export { WORKSPACE_HOME, WORKSPACE_TITLE };
