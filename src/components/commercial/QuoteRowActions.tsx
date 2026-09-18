"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { HeaderDropdown } from "@/components/ui/HeaderDropdown";
import { DeleteQuoteDialog } from "@/components/commercial/DeleteQuoteDialog";
import { cn } from "@/lib/cn";

type Props = {
  quoteId: string;
  quoteNumber: string;
  clientLabel: string;
  href: string;
  /** Appelé après suppression réussie (retirer la ligne localement). */
  onDeleted?: (quoteId: string, number: string) => void;
  className?: string;
};

/**
 * Menu « … » réutilisable — Ouvrir / Supprimer un devis.
 * stopPropagation pour ne pas ouvrir la ligne parente.
 */
export function QuoteRowActions({
  quoteId,
  quoteNumber,
  clientLabel,
  href,
  onDeleted,
  className,
}: Props) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const closeConfirm = useCallback(() => {
    if (pending) return;
    setConfirmOpen(false);
    setError(null);
  }, [pending]);

  const confirmDelete = useCallback(async () => {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/commercial/quotes/${quoteId}`, {
        method: "DELETE",
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
        number?: string;
        message?: string;
      } | null;

      if (!res.ok) {
        setError(
          data?.error?.trim() ||
            "Impossible de supprimer ce devis. Veuillez réessayer.",
        );
        return;
      }

      const number = data?.number ?? quoteNumber;
      setConfirmOpen(false);
      onDeleted?.(quoteId, number);
      router.refresh();
    } catch {
      setError("Impossible de supprimer ce devis. Veuillez réessayer.");
    } finally {
      setPending(false);
    }
  }, [pending, quoteId, quoteNumber, onDeleted, router]);

  return (
    <>
      <div
        className={cn("relative shrink-0", className)}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <HeaderDropdown
          align="right"
          width={220}
          zIndex={60}
          panelClassName="rounded-xl border border-bework-navy/10 bg-white py-1.5 shadow-[0_12px_32px_rgba(15,23,42,0.14)]"
          trigger={({ onClick, expanded, triggerRef }) => (
            <button
              ref={triggerRef}
              type="button"
              aria-label={`Actions du devis ${quoteNumber}`}
              aria-expanded={expanded}
              aria-haspopup="menu"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClick();
              }}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg text-bework-muted/50 transition",
                "hover:bg-bework-navy/6 hover:text-bework-navy",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bework-navy",
                "group-hover:text-bework-muted",
                expanded && "bg-bework-navy/8 text-bework-navy",
              )}
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden />
            </button>
          )}
        >
          <Link
            href={href}
            className="block px-3.5 py-2 text-[13px] font-medium text-bework-ink transition hover:bg-bework-soft-navy/50"
            role="menuitem"
          >
            Ouvrir le devis
          </Link>
          <button
            type="button"
            role="menuitem"
            className="flex w-full px-3.5 py-2 text-left text-[13px] font-medium text-red-600 transition hover:bg-red-50"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setError(null);
              setConfirmOpen(true);
            }}
          >
            Supprimer le devis
          </button>
        </HeaderDropdown>
      </div>

      <DeleteQuoteDialog
        open={confirmOpen}
        quoteNumber={quoteNumber}
        clientLabel={clientLabel}
        pending={pending}
        error={error}
        onCancel={closeConfirm}
        onConfirm={() => void confirmDelete()}
      />
    </>
  );
}
