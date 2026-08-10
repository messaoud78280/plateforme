"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  label?: string;
};

/**
 * CTA activation — aucune IA n’est lancée.
 */
export function AssistantIaActivateButton({
  className,
  label = "Activer cet outil",
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-2.5",
          "bg-[#1e3a5f] text-sm font-semibold text-white transition",
          "hover:bg-[#162d4a] active:scale-[0.98]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/40",
          className,
        )}
      >
        {label}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Assistant IA"
        description="Cette fonction IA peut être activée pour votre organisation."
        size="sm"
        footer={
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#1e3a5f] px-4 text-sm font-semibold text-white hover:bg-[#162d4a]"
          >
            Fermer
          </button>
        }
      >
        <p className="text-sm leading-relaxed text-slate-600">
          Une fois activé, cet outil pourra analyser les documents que vous choisissez et
          proposer des résultats à valider avant toute action.
        </p>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          L’IA propose. Vous gardez la décision.
        </p>
      </Modal>
    </>
  );
}
