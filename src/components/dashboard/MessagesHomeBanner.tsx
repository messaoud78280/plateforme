"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getMessagerieUnread,
  subscribeMessagerieEvents,
  subscribeMessagerieUnread,
} from "@/lib/perf/messagerie-unread-bus";
import { DashboardSection } from "@/components/dashboard/accueil-ui";

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
  void variant;

  if (!loaded || total <= 0 || previews.length === 0) {
    return null;
  }

  const first = previews[0]!;

  return (
    <DashboardSection
      title="Messages"
      badge={`${total} nouveau${total > 1 ? "x" : ""}`}
      action={{ href: "/dashboard/messagerie", label: "Voir →" }}
    >
      <div data-testid="accueil-messages">
        <Link
          href={first.href}
          className="group flex min-h-[52px] items-center justify-between gap-3 rounded-xl py-1 transition-colors duration-150 hover:bg-slate-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8]/30"
        >
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-semibold text-slate-900">
              {first.title}
            </span>
            {first.preview ? (
              <span className="mt-0.5 block truncate text-[13px] text-slate-500">
                {first.preview}
              </span>
            ) : null}
          </span>
          <span
            aria-hidden
            className="text-[18px] font-light text-slate-300 transition-transform duration-150 group-hover:translate-x-0.5"
          >
            ›
          </span>
        </Link>
        <p className="sr-only">Voir la messagerie →</p>
      </div>
    </DashboardSection>
  );
}
