"use client";

import Link from "next/link";
import { useState } from "react";
import {
  DETAIL_MORE_TABS,
  DETAIL_PRIMARY_TABS,
  PILOTAGE_LIST_PATH,
  type DetailTabId,
} from "@/lib/pilotage/constants";

export function PilotageDetailNav({
  pilotageId,
  active,
  badges,
}: {
  pilotageId: string;
  active: DetailTabId;
  badges?: Partial<Record<DetailTabId, number>>;
}) {
  const [moreOpen, setMoreOpen] = useState(
    DETAIL_MORE_TABS.some((t) => t.id === active),
  );
  const href = (id: string) => `${PILOTAGE_LIST_PATH}/${pilotageId}?onglet=${id}`;

  return (
    <nav className="sticky top-2 z-20 rounded-xl border border-bework-navy/10 bg-white/95 p-1.5 shadow-sm backdrop-blur" aria-label="Rubriques chantier">
      <div className="flex flex-wrap gap-1">
        {DETAIL_PRIMARY_TABS.map((t) => {
          const count = badges?.[t.id as DetailTabId];
          const isActive = active === t.id;
          return (
            <Link
              key={t.id}
              href={href(t.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:text-sm ${
                isActive
                  ? "bg-bework-navy text-white shadow-sm"
                  : "text-bework-ink/80 hover:bg-bework-navy-soft hover:text-bework-navy"
              }`}
            >
              {t.label}
              {count && count > 0 ? (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-red-100 text-red-700"
                  }`}
                >
                  {count}
                </span>
              ) : null}
            </Link>
          );
        })}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className={`inline-flex items-center rounded-lg px-3 py-2 text-xs font-semibold sm:text-sm ${
              DETAIL_MORE_TABS.some((t) => t.id === active)
                ? "bg-bework-navy text-white shadow-sm"
                : "text-bework-ink/80 hover:bg-bework-navy-soft hover:text-bework-navy"
            }`}
            aria-expanded={moreOpen}
          >
            Plus
          </button>
          {moreOpen ? (
            <div className="absolute right-0 z-30 mt-1 min-w-[200px] rounded-xl border border-bework-navy/10 bg-white p-1.5 shadow-lg">
              {DETAIL_MORE_TABS.map((t) => (
                <Link
                  key={t.id}
                  href={href(t.id)}
                  className={`block rounded-lg px-3 py-2 text-xs font-semibold ${
                    active === t.id ? "bg-bework-navy-soft text-bework-navy" : "text-bework-ink/80 hover:bg-slate-50"
                  }`}
                  onClick={() => setMoreOpen(false)}
                >
                  {t.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
