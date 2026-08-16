"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  canSafelyUseBrowserHistory,
  contextBackLabelForHref,
  sanitizeInternalReturnTo,
} from "@/lib/navigation/safe-return-to";

type ContextBackButtonProps = {
  /** Libellé affiché (ex. « Retour aux conversations »). */
  label?: string;
  /** Cible sûre si l’historique n’est pas fiable. */
  fallbackHref: string;
  /**
   * returnTo déjà lu côté parent (query) — validé ici.
   * Ne jamais passer une URL externe.
   */
  returnTo?: string | null;
  /** Style compact (défaut true). */
  compact?: boolean;
  /** Priorité sur la navigation : panneau in-app, filtre messagerie, etc. */
  onBack?: () => void;
  onBeforeBack?: () => void;
  className?: string;
};

/**
 * NAVIGATION-RETOUR-V1.1 — Retour contextuel discret.
 * 1) onBack (état local)
 * 2) returnTo interne explicite → push (conserve deep-link conversation)
 * 3) historique navigateur fiable
 * 4) fallbackHref
 * Ne remplace pas Back/Forward natifs (pas de replace()).
 */
export function ContextBackButton({
  label,
  fallbackHref,
  returnTo,
  compact = true,
  onBack,
  onBeforeBack,
  className,
}: ContextBackButtonProps) {
  const router = useRouter();

  const safeFallback = sanitizeInternalReturnTo(fallbackHref, "/dashboard");
  const targetHref = sanitizeInternalReturnTo(returnTo, safeFallback);
  const hasExplicitReturnTo =
    Boolean(returnTo?.trim()) && targetHref !== safeFallback;
  const displayLabel = label ?? contextBackLabelForHref(targetHref);

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    onBeforeBack?.();

    if (onBack) {
      onBack();
      return;
    }

    // returnTo explicite (ex. Messagerie → conversation) : push deep-link
    if (hasExplicitReturnTo) {
      router.push(targetHref);
      return;
    }

    if (canSafelyUseBrowserHistory()) {
      router.back();
      return;
    }

    router.push(targetHref);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={displayLabel}
      className={cn(
        "inline-flex min-h-11 items-center gap-1.5 rounded-lg text-left text-sm font-medium text-bework-muted transition-colors",
        "hover:bg-bework-soft-accent hover:text-bework-navy",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bework-accent/35 focus-visible:ring-offset-2",
        compact ? "px-1.5 py-1.5 -ml-1.5" : "px-2.5 py-2",
        className,
      )}
    >
      <span aria-hidden className="text-base leading-none text-bework-accent/70">
        ←
      </span>
      <span>{displayLabel}</span>
    </button>
  );
}
