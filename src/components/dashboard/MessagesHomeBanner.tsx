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

/** Bloc Accueil — max 3 conversations non lues (PERF-V1 preview API). */
export function MessagesHomeBanner() {
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<PreviewItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/messagerie/preview", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { total?: number; items?: PreviewItem[] };
      setTotal(typeof data.total === "number" ? data.total : 0);
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      // ignore
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!loaded) {
    return (
      <section className="rounded-xl border border-slate-200/90 bg-white p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
          Messages
        </p>
        <div className="mt-3 h-12 animate-pulse rounded-lg bg-slate-100" />
      </section>
    );
  }

  if (total <= 0) return null;

  return (
    <section className="rounded-xl border border-slate-200/90 bg-white p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
          Messages
          <span className="ml-2 tabular-nums text-slate-900">{total}</span>
        </h2>
        <Link
          href="/dashboard/messagerie"
          className="text-xs font-semibold text-[#1d4ed8] hover:underline"
        >
          Voir Messagerie
        </Link>
      </div>
      <ul className="mt-3 space-y-2">
        {items.slice(0, 3).map((it) => (
          <li key={it.id}>
            <Link
              href={it.href}
              className="block rounded-lg border border-slate-100 px-3 py-2 hover:border-[#1e3a5f]/25"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-bold text-slate-900">{it.title}</p>
                {it.unread > 0 ? (
                  <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#1e3a5f] px-1.5 text-[10px] font-bold text-white">
                    {it.unread}
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 truncate text-xs text-slate-600">{it.preview}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
