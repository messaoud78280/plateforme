"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getMessagerieUnread,
  subscribeMessagerieEvents,
  subscribeMessagerieUnread,
} from "@/lib/perf/messagerie-unread-bus";
import { cn } from "@/lib/cn";

type PreviewItem = {
  id: string;
  title: string;
  preview: string;
  href: string;
  unread: number;
};

/** Bloc Accueil Messages — bus realtime existant, pas de nouvelle subscription. */
export function MessagesHomeBanner() {
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<PreviewItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const debounceRef = useRef<number | null>(null);

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

  const scheduleReload = useCallback(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      void load();
    }, 400);
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const unsubUnread = subscribeMessagerieUnread((n) => {
      setTotal(n);
      scheduleReload();
    });
    const unsubEvents = subscribeMessagerieEvents(() => {
      scheduleReload();
    });
    void getMessagerieUnread();
    return () => {
      unsubUnread();
      unsubEvents();
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [scheduleReload]);

  if (!loaded) {
    return (
      <section className="border-b border-slate-200/80 pb-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
          Messages
        </p>
        <div className="mt-3 h-10 animate-pulse rounded-lg bg-slate-100" />
      </section>
    );
  }

  return (
    <section className="border-b border-slate-200/80 pb-4 last:border-b-0 last:pb-0">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
          Messages
          {total > 0 ? (
            <span className="ml-2 tabular-nums text-slate-900">{total}</span>
          ) : null}
        </h2>
        <Link
          href="/dashboard/messagerie"
          className="text-xs font-semibold text-[#1d4ed8] hover:underline"
        >
          Voir
        </Link>
      </div>
      {total <= 0 || items.length === 0 ? (
        <p className="mt-2.5 text-sm text-slate-500">Pas de nouveau message.</p>
      ) : (
        <ul className="mt-2.5 space-y-2">
          {items.slice(0, 3).map((it) => (
            <li key={it.id}>
              <Link
                href={it.href}
                className="block rounded-lg px-2 py-1.5 hover:bg-slate-50"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-slate-900">{it.title}</p>
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
      )}
    </section>
  );
}
