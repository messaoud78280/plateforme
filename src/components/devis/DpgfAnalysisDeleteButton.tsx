"use client";

import { deleteDpgfAnalysisSheet } from "@/app/dashboard/devis/analyse-dpgf-actions";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

type Props = {
  id: string;
  codeSheet: string;
  label?: string;
  redirectTo?: string;
  className?: string;
  compact?: boolean;
};

export function DpgfAnalysisDeleteButton({
  id,
  codeSheet,
  label = "Supprimer",
  redirectTo = "/dashboard/devis/analyse-dpgf",
  className,
  compact,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        const ok = window.confirm(
          `Supprimer la fiche ${codeSheet} ?\n\nCette action est définitive. Le contenu pédagogique sera perdu.`,
        );
        if (!ok) return;
        startTransition(async () => {
          const res = await deleteDpgfAnalysisSheet(id);
          if (res.ok) {
            router.push(redirectTo);
            router.refresh();
          } else {
            alert(res.error);
          }
        });
      }}
      className={
        className ??
        (compact
          ? "rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
          : "rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50")
      }
    >
      {pending ? "Suppression…" : label}
    </button>
  );
}
