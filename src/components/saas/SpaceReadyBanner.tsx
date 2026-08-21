"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_PREFIX = "bework-space-ready-seen:";

/** Affiché une seule fois quand l’espace atteint 100 % (localStorage). */
export function SpaceReadyBanner({ organizationId }: { organizationId: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const key = `${STORAGE_PREFIX}${organizationId}`;
      if (localStorage.getItem(key) === "1") return;
      setVisible(true);
      localStorage.setItem(key, "1");
    } catch {
      /* ignore */
    }
  }, [organizationId]);

  if (!visible) return null;

  return (
    <section
      role="status"
      className="rounded-2xl border border-bework-ok/25 bg-bework-soft-ok/40 px-4 py-3 shadow-[var(--cc-shadow)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[14px] font-semibold text-bework-navy">
            Votre espace BeWork est prêt.
          </p>
          <p className="mt-0.5 text-[12px] text-slate-600">
            Vous pouvez piloter vos chantiers depuis ce tableau de bord.
          </p>
        </div>
        <Link
          href="/dashboard/parametres"
          className="text-[12px] font-semibold text-bework-accent hover:underline"
        >
          Configuration de votre espace
        </Link>
      </div>
    </section>
  );
}
