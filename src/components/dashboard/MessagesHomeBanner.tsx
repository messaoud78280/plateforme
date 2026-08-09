"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type PreviewItem = {
  id: string;
  title: string;
  preview: string;
  href: string;
  unread: number;
};

/** Bloc Accueil — max 3 conversations non lues. */
export function MessagesHomeBanner() {
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<PreviewItem[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/messagerie/preview", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { total?: number; items?: PreviewItem[] };
      setTotal(typeof data.total === "number" ? data.total : 0);
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (total <= 0) return null;

  return (
    <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/80 via-white to-sky-50/60 px-5 py-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-800/80">
            Messages
          </p>
          <p className="mt-0.5 text-sm font-semibold text-slate-900">
            {total} nouveau{total > 1 ? "x" : ""}
          </p>
        </div>
        <Link
          href="/dashboard/messagerie"
          className="inline-flex rounded-lg bg-[#00a884] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#008f72]"
        >
          Voir la Messagerie
        </Link>
      </div>
      <ul className="mt-3 space-y-2">
        {items.slice(0, 3).map((it) => (
          <li key={it.id}>
            <Link
              href={it.href}
              className="block rounded-xl border border-white/80 bg-white/90 px-3 py-2 hover:border-emerald-200"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-bold text-slate-900">{it.title}</p>
                {it.unread > 0 ? (
                  <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#00a884] px-1.5 text-[10px] font-bold text-white">
                    {it.unread}
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 truncate text-xs text-slate-600">{it.preview}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
