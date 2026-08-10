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

type Variant = "card" | "aside";

/** Bloc Accueil Messages — bus realtime existant, pas de nouvelle subscription. */
export function MessagesHomeBanner({ variant = "aside" }: { variant?: Variant }) {
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

  const previews = items.slice(0, 3);
  const isCard = variant === "card";

  if (!loaded) {
    return (
      <section
        className={cn(
          isCard
            ? "rounded-2xl border border-[#1e3a5f]/15 bg-white p-4 shadow-sm sm:p-5"
            : "border-b border-slate-200/80 pb-4",
        )}
        aria-busy
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
          Messages
        </p>
        <div className="mt-3 h-10 animate-pulse rounded-lg bg-slate-100" />
      </section>
    );
  }

  return (
    <section
      className={cn(
        isCard
          ? "rounded-2xl border border-[#1e3a5f]/15 bg-white p-4 shadow-sm sm:p-5"
          : "border-b border-slate-200/80 pb-4 last:border-b-0 last:pb-0",
      )}
      data-testid="accueil-messages"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2
          className={cn(
            isCard
              ? "text-sm font-extrabold uppercase tracking-[0.12em] text-[#1e3a5f]"
              : "text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500",
          )}
        >
          Messages
          {total > 0 ? (
            <span className="ml-2.5 tabular-nums text-slate-900">
              {total} nouveau{total > 1 ? "x" : ""}
            </span>
          ) : null}
        </h2>
        <Link
          href="/dashboard/messagerie"
          className="text-xs font-semibold text-[#1d4ed8] hover:underline"
        >
          Voir la messagerie →
        </Link>
      </div>
      {total <= 0 || previews.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">Pas de nouveau message.</p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {previews.map((it) => (
            <li key={it.id}>
              <Link
                href={it.href}
                className="flex min-h-[44px] items-center justify-between gap-2 rounded-xl px-2.5 py-2 hover:bg-slate-50"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-semibold text-slate-900">
                    {it.title}
                  </span>
                  {it.preview ? (
                    <span className="mt-0.5 block truncate text-[13px] text-slate-600">
                      {it.preview}
                    </span>
                  ) : null}
                </span>
                {it.unread > 0 ? (
                  <span className="inline-flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-[#1e3a5f] px-1.5 text-[10px] font-bold text-white">
                    {it.unread}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
