"use client";

import { CommercialSidebar } from "@/components/commercial/CommercialSidebar";
import { CommercialWorkspaceHeader } from "@/components/commercial/CommercialWorkspaceHeader";

/**
 * Shell Commercial plein écran : sidebar gauche + contenu.
 */
export function CommercialWorkspaceShell({
  children,
  personType,
  permissionProfile,
  orgLabel,
}: {
  children: React.ReactNode;
  personType?: string | null;
  permissionProfile?: string | null;
  orgLabel?: string | null;
}) {
  return (
    <div className="flex min-h-dvh bg-[color:var(--cc-surface-muted)]">
      <CommercialSidebar
        personType={personType}
        permissionProfile={permissionProfile}
        orgLabel={orgLabel}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <CommercialWorkspaceHeader />
        <main
          id="contenu-principal"
          tabIndex={-1}
          className="cc-enter w-full min-w-0 flex-1 px-3 py-4 pb-20 sm:px-5 sm:py-5 lg:px-6"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
