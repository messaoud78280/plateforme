"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type PreviewItem = {
  id: string;
  title: string;
  preview: string;
  href: string;
  at: string;
};

const SEEN_KEY = "bework.msg.toast.seen";

/**
 * Toast discret hors Messagerie lorsqu’un nouveau message arrive.
 * Réutilise /api/messagerie/preview — pas de double notification DB.
 */
export function MessagerieToastListener() {
  const pathname = usePathname();
  const onMessagerie = pathname?.startsWith("/dashboard/messagerie");
  const [toast, setToast] = useState<PreviewItem | null>(null);
  const knownRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SEEN_KEY);
      if (raw) knownRef.current = new Set(JSON.parse(raw) as string[]);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (onMessagerie) {
      setToast(null);
      return;
    }

    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/messagerie/preview", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { items?: PreviewItem[] };
        const items = Array.isArray(data.items) ? data.items : [];
        if (items.length === 0) return;

        // Première charge : mémoriser sans toast
        if (knownRef.current.size === 0) {
          for (const it of items) knownRef.current.add(`${it.id}:${it.at}`);
          sessionStorage.setItem(SEEN_KEY, JSON.stringify([...knownRef.current]));
          return;
        }

        const newest = items[0]!;
        const key = `${newest.id}:${newest.at}`;
        if (!knownRef.current.has(key)) {
          knownRef.current.add(key);
          sessionStorage.setItem(SEEN_KEY, JSON.stringify([...knownRef.current].slice(-40)));
          if (!cancelled) setToast(newest);
        }
      } catch {
        // ignore
      }
    }

    void poll();
    const t = window.setInterval(() => void poll(), 20_000);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [onMessagerie, pathname]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 8_000);
    return () => window.clearTimeout(t);
  }, [toast]);

  if (!toast || onMessagerie) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 w-[min(100%-2rem,22rem)] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl lg:bottom-6">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#00a884]">
        Nouveau message
      </p>
      <p className="mt-0.5 text-sm font-bold text-slate-900">{toast.title}</p>
      <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">{toast.preview}</p>
      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setToast(null)}
          className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-50"
        >
          Fermer
        </button>
        <Link
          href={toast.href}
          onClick={() => setToast(null)}
          className="rounded-lg bg-[#1e3a5f] px-3 py-1 text-xs font-bold text-white"
        >
          Ouvrir
        </Link>
      </div>
    </div>
  );
}
