"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { GlobalSearchItem, SearchResultKind } from "@/lib/search/global-search";

const RECENTS_KEY = "bework-search-recents-v1";
const CACHE_TTL_MS = 20_000;

type SearchPayload = {
  query: string;
  items: GlobalSearchItem[];
  actions: GlobalSearchItem[];
  nav: GlobalSearchItem[];
};

type RecentItem = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  kind: SearchResultKind;
};

function kindIcon(kind: SearchResultKind): string {
  switch (kind) {
    case "project":
      return "🏗";
    case "order":
      return "📦";
    case "supplier":
      return "🏭";
    case "user":
      return "👤";
    case "task":
      return "☑";
    case "follow_up":
      return "📋";
    case "document":
      return "📄";
    case "agenda":
      return "📅";
    case "conversation":
      return "💬";
    case "nav":
      return "→";
    case "action":
      return "+";
    default:
      return "·";
  }
}

function kindLabel(kind: SearchResultKind): string {
  switch (kind) {
    case "project":
      return "Chantier";
    case "order":
      return "Commande";
    case "supplier":
      return "Fournisseur";
    case "user":
      return "Contact";
    case "task":
      return "Tâche";
    case "follow_up":
      return "Fiche";
    case "document":
      return "Document";
    case "agenda":
      return "Agenda";
    case "conversation":
      return "Conversation";
    case "nav":
      return "Navigation";
    case "action":
      return "Action";
    default:
      return "";
  }
}

function readRecents(): RecentItem[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentItem[];
    return Array.isArray(parsed) ? parsed.slice(0, 6) : [];
  } catch {
    return [];
  }
}

function pushRecent(item: Pick<GlobalSearchItem, "id" | "title" | "subtitle" | "href" | "kind">) {
  try {
    const prev = readRecents().filter((r) => r.href !== item.href);
    const next: RecentItem[] = [
      {
        id: item.id,
        title: item.title,
        subtitle: item.subtitle,
        href: item.href,
        kind: item.kind,
      },
      ...prev,
    ].slice(0, 6);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function isMac() {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
}

export function GlobalSearchTrigger() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        const tag = (e.target as HTMLElement | null)?.tagName;
        // Toujours intercepter Cmd/Ctrl+K dans le dashboard
        if (tag === "TEXTAREA" && !e.metaKey && !e.ctrlKey) return;
        e.preventDefault();
        setOpen(true);
      }
    }
    function onOpenSearch() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("bework:open-global-search", onOpenSearch);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("bework:open-global-search", onOpenSearch);
    };
  }, []);

  const hint = isMac() ? "⌘K" : "Ctrl+K";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 text-slate-600 hover:border-slate-300 hover:bg-white hover:text-[#1e3a5f]"
        aria-label="Rechercher dans BeWork"
        title={`Rechercher (${hint})`}
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="hidden text-xs font-medium text-slate-500 lg:inline">
          Rechercher…
        </span>
        <kbd className="hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 sm:inline">
          {hint}
        </kbd>
      </button>
      {open ? <GlobalSearchPalette onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function GlobalSearchPalette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SearchPayload | null>(null);
  const [active, setActive] = useState(0);
  const [recents, setRecents] = useState<RecentItem[]>([]);
  const cacheRef = useRef<Map<string, { at: number; data: SearchPayload }>>(new Map());
  const abortRef = useRef<AbortController | null>(null);
  const seqRef = useRef(0);

  useEffect(() => {
    setRecents(readRecents());
    const t = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    const cacheKey = trimmed.toLowerCase();
    const cached = cacheRef.current.get(cacheKey);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      setData(cached.data);
      setLoading(false);
      setActive(0);
      return;
    }

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    const seq = ++seqRef.current;
    setLoading(true);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
        signal: ac.signal,
        cache: "no-store",
      });
      if (!res.ok) return;
      const json = (await res.json()) as SearchPayload;
      if (seq !== seqRef.current) return;
      cacheRef.current.set(cacheKey, { at: Date.now(), data: json });
      setData(json);
      setActive(0);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
    } finally {
      if (seq === seqRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void runSearch(query);
    }, query.trim().length === 0 ? 0 : 180);
    return () => window.clearTimeout(t);
  }, [query, runSearch]);

  const flat = useMemo(() => {
    const q = query.trim();
    if (q.length < 2) {
      const acts = data?.actions ?? [];
      const navs = data?.nav ?? [];
      const recentAsItems: GlobalSearchItem[] = recents.map((r) => ({
        id: `recent:${r.id}`,
        kind: r.kind,
        title: r.title,
        subtitle: r.subtitle || "Récent",
        meta: null,
        href: r.href,
        score: 0,
      }));
      return [
        ...acts.map((a) => ({ section: "Actions rapides" as const, item: a })),
        ...navs.slice(0, 6).map((n) => ({ section: "Aller à" as const, item: n })),
        ...recentAsItems.map((r) => ({ section: "Récents" as const, item: r })),
      ];
    }

    const items = data?.items ?? [];
    const acts = data?.actions ?? [];
    const navs = data?.nav ?? [];
    const top = items.slice(0, 8);
    const rest = items.slice(8);
    return [
      ...top.map((item) => ({ section: "Meilleurs résultats" as const, item })),
      ...acts.map((item) => ({ section: "Actions" as const, item })),
      ...navs.map((item) => ({ section: "Aller à" as const, item })),
      ...rest.map((item) => ({ section: kindLabel(item.kind) || "Autres" as const, item })),
    ];
  }, [query, data, recents]);

  const go = useCallback(
    (item: GlobalSearchItem) => {
      pushRecent(item);
      onClose();
      router.push(item.href);
    },
    [onClose, router],
  );

  useEffect(() => {
    if (active >= flat.length) setActive(0);
  }, [flat.length, active]);

  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(flat.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const row = flat[active];
      if (row) go(row.item);
    }
  }

  let lastSection = "";

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center sm:pt-[12vh]">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
        aria-label="Fermer la recherche"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Recherche BeWork"
        className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[min(72vh,640px)] sm:w-[min(640px,92vw)] sm:rounded-2xl sm:border sm:border-slate-200"
      >
        <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-3 sm:px-4">
          <Search className="h-5 w-5 shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Rechercher dans BeWork…"
            className="min-w-0 flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400 sm:text-sm"
            aria-controls={listId}
            aria-autocomplete="list"
            autoComplete="off"
            spellCheck={false}
          />
          {loading ? (
            <span className="text-[10px] font-semibold uppercase text-slate-400">…</span>
          ) : (
            <kbd className="hidden rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 sm:inline">
              esc
            </kbd>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 sm:hidden"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div id={listId} role="listbox" className="flex-1 overflow-y-auto overscroll-contain px-2 py-2">
          {query.trim().length === 1 ? (
            <p className="px-3 py-6 text-center text-sm text-slate-500">
              Tapez au moins 2 caractères…
            </p>
          ) : flat.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-slate-500">
              {query.trim().length >= 2 ? "Aucun résultat." : "Tapez pour rechercher."}
            </p>
          ) : (
            <ul className="space-y-0.5">
              {flat.map((row, index) => {
                const showSection = row.section !== lastSection;
                lastSection = row.section;
                const selected = index === active;
                return (
                  <li key={`${row.item.id}-${index}`}>
                    {showSection ? (
                      <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                        {row.section}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => go(row.item)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition",
                        selected ? "bg-[#1e3a5f]/[0.08]" : "hover:bg-slate-50",
                      )}
                    >
                      <span className="mt-0.5 w-6 shrink-0 text-center text-base" aria-hidden>
                        {kindIcon(row.item.kind)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-900">
                          {row.item.title}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-slate-500">
                          {row.item.subtitle}
                          {row.item.meta ? ` · ${row.item.meta}` : ""}
                        </span>
                      </span>
                      <span className="mt-0.5 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        {kindLabel(row.item.kind)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="hidden items-center justify-between border-t border-slate-100 px-4 py-2 text-[11px] text-slate-400 sm:flex">
          <span>↑↓ naviguer · Entrée ouvrir · Esc fermer</span>
          <span>Recherche métier BeWork</span>
        </div>
      </div>
    </div>
  );
}
