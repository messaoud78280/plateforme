"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { MessageSquare } from "lucide-react";
import { HeaderDropdown } from "@/components/ui/HeaderDropdown";
import { cn } from "@/lib/cn";
import { useMessagerieUnread } from "@/hooks/useMessagerieUnread";

type PreviewItem = {
  id: string;
  title: string;
  preview: string;
  at: string;
  href: string;
  unread: number;
};

function formatAt(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

/** Raccourci header 💬 — badge via poll partagé ; aperçu au clic uniquement. */
export function MessagerieHeaderShortcut() {
  const total = useMessagerieUnread();
  const [items, setItems] = useState<PreviewItem[]>([]);

  const loadPreview = useCallback(async () => {
    try {
      const res = await fetch("/api/messagerie/preview", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { items?: PreviewItem[] };
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      // silencieux
    }
  }, []);

  return (
    <HeaderDropdown
      panelId="messagerie-header-preview"
      width={340}
      align="right"
      trigger={({ onClick, expanded, triggerRef }) => (
        <button
          ref={triggerRef}
          type="button"
          onClick={() => {
            onClick();
            if (!expanded) void loadPreview();
          }}
          className="relative shrink-0 rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
          aria-label={total > 0 ? `Messagerie, ${total} non lus` : "Messagerie"}
          title="Messagerie"
          data-header-slot="messagerie"
          aria-expanded={expanded}
        >
          <MessageSquare className="h-5 w-5" aria-hidden />
          {total > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-[#00a884] px-1 text-[10px] font-bold text-white">
              {total > 99 ? "99+" : total}
            </span>
          ) : null}
        </button>
      )}
    >
      <div className="px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Messages non lus
        </p>
        <p className="mt-0.5 text-sm font-semibold text-slate-900">
          {total > 0
            ? `${total} conversation${total > 1 ? "s" : ""}`
            : "Aucun message non lu"}
        </p>
      </div>
      {items.length > 0 ? (
        <ul className="max-h-72 overflow-y-auto border-t border-slate-100">
          {items.map((it) => (
            <li key={it.id}>
              <Link href={it.href} className="block px-3 py-2.5 hover:bg-slate-50">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-bold text-slate-900">{it.title}</p>
                  <span className="shrink-0 text-[11px] font-semibold text-[#00a884]">
                    {formatAt(it.at)}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-600">{it.preview}</p>
                {it.unread > 1 ? (
                  <span
                    className={cn(
                      "mt-1 inline-flex rounded-full bg-[#00a884] px-1.5 py-0.5 text-[10px] font-bold text-white",
                    )}
                  >
                    {it.unread}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="border-t border-slate-100 px-3 py-2">
        <Link
          href="/dashboard/messagerie"
          className="block rounded-lg bg-[#1e3a5f] px-3 py-2 text-center text-xs font-bold text-white hover:bg-[#0f2744]"
        >
          Voir tous les messages
        </Link>
      </div>
    </HeaderDropdown>
  );
}
