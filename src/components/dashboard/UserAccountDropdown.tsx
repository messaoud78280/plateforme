"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { HeaderDropdown } from "@/components/ui/HeaderDropdown";

function getInitials(name: string | null | undefined): string {
  if (!name || !name.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

const baseMenuItems = [
  { label: "Mon profil", href: "/dashboard/parametres", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  { label: "Préférences d’affichage", href: "/dashboard/parametres/preferences", icon: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" },
  { label: "Contrat", href: "/contract", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { label: "Coordonnées de l'entreprise", href: "/dashboard/parametres", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
  { label: "Facturation et paiements", href: "#", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { label: "Produits et services", href: "/dashboard/projets", icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0v.5a2.5 2.5 0 004.065 2.065M12 12a2 2 0 104 0 2 2 0 00-4 0z" },
  { label: "Documents", href: "/dashboard/documents", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { label: "Appareils du réseau", href: "#", icon: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" },
  { label: "Faites une demande", href: "/contact", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
];

const staffDesignSystemItem = {
  label: "Design system",
  href: "/dashboard/design-system",
  icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z",
};

interface UserAccountDropdownProps {
  userName: string | null | undefined;
  /** Rôle NextAuth (menu staff) */
  userRole?: string | null;
  /** Libellé métier affiché (permissionProfile) — source unique côté layout */
  roleLabel?: string | null;
  userCompany?: string | null;
}

export function UserAccountDropdown({
  userName,
  userRole,
  roleLabel: roleLabelProp,
  userCompany,
}: UserAccountDropdownProps) {
  const roleLabel =
    roleLabelProp?.trim() ||
    (userRole === "MANAGER"
      ? "Gérant"
      : userRole === "AGENCE" || userRole === "AGENT"
        ? "Agent"
        : "Client");
  const menuItems =
    userRole === "MANAGER" || userRole === "AGENCE"
      ? [staffDesignSystemItem, ...baseMenuItems]
      : baseMenuItems;

  return (
    <HeaderDropdown
      panelId="user-account-dropdown-panel"
      width={288}
      align="right"
      trigger={({ onClick, expanded, triggerRef }) => (
        <button
          ref={triggerRef}
          type="button"
          onClick={onClick}
          className="flex max-w-[min(100%,14rem)] shrink-0 items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-[#eef0f4] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/50 sm:max-w-none sm:gap-3"
          aria-expanded={expanded}
          aria-haspopup="menu"
          aria-controls="user-account-dropdown-panel"
        >
          <div className="hidden min-w-0 flex-col sm:flex">
            <span className="truncate text-sm font-semibold leading-tight text-black">
              {userName || "Utilisateur"}
            </span>
            <span className="text-xs font-medium text-black">{roleLabel}</span>
          </div>
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#475569] text-sm font-semibold text-white sm:h-10 sm:w-10"
            aria-hidden
          >
            {getInitials(userName)}
          </div>
        </button>
      )}
    >
      <div className="border-b border-[#e0e4ea] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#475569] text-base font-semibold text-white">
            {getInitials(userName)}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-black">{userName || "Utilisateur"}</p>
            <p className="truncate text-sm text-black">{userCompany || "BeWork"}</p>
            <p className="text-xs text-[#94a3b8]">{roleLabel}</p>
          </div>
        </div>
      </div>
      <ul className="max-h-[min(70vh,24rem)] overflow-y-auto py-1">
        {menuItems.map((item) => (
          <li key={item.label} className="border-b border-[#e5e7eb] last:border-b-0">
            <Link
              href={item.href}
              onClick={(e) => {
                if (item.href === "#") e.preventDefault();
              }}
              className="flex items-center gap-3 px-4 py-3 text-sm text-[#374151] transition-colors hover:bg-[#fafafa]"
              role="menuitem"
            >
              <svg
                className="h-5 w-5 shrink-0 text-[#6b7280]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              <span>{item.label}</span>
              <svg
                className="ml-auto h-4 w-4 shrink-0 text-[#9ca3af]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </li>
        ))}
      </ul>
      <div className="border-t border-[#e0e4ea] pt-2">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-[#f8f9fb]"
          role="menuitem"
        >
          <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span>Déconnexion</span>
        </button>
      </div>
    </HeaderDropdown>
  );
}
