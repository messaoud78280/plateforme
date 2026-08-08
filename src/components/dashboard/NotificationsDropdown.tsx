"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { HeaderDropdown } from "@/components/ui/HeaderDropdown";
import { FollowUpInlineActions } from "@/components/follow-up/FollowUpInlineActions";

type InboxItem = {
  id: string;
  source: "notification" | "alert";
  title: string;
  message: string;
  read: boolean;
  actionUrl: string | null;
  createdAt: string;
  type?: string;
};

type PriorityBucket = "CRITIQUE" | "URGENT" | "IMPORTANT" | "INFORMATION";

function formatNotifDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function bucketFor(item: InboxItem): PriorityBucket {
  const t = (item.type ?? "").toUpperCase();
  const title = item.title.toUpperCase();
  if (t.includes("CRITICAL") || t.includes("CRITIQUE") || title.includes("CRITIQUE")) {
    return "CRITIQUE";
  }
  if (
    t.includes("URGENT") ||
    t.includes("FOLLOWUP_URGENT") ||
    title.includes("URGENT") ||
    title.includes("RETARD")
  ) {
    return "URGENT";
  }
  if (
    t.includes("FOLLOWUP") ||
    t.includes("DEADLINE") ||
    t.includes("MISSING") ||
    title.includes("RAPPEL") ||
    title.includes("IMPORTANT")
  ) {
    return "IMPORTANT";
  }
  return "INFORMATION";
}

const BUCKET_ORDER: PriorityBucket[] = ["CRITIQUE", "URGENT", "IMPORTANT", "INFORMATION"];
const BUCKET_STYLE: Record<PriorityBucket, string> = {
  CRITIQUE: "text-red-950",
  URGENT: "text-red-700",
  IMPORTANT: "text-orange-700",
  INFORMATION: "text-slate-600",
};

export function NotificationsDropdown() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadInbox = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/inbox", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as {
        unreadCount?: number;
        items?: InboxItem[];
      };
      setUnreadCount(data.unreadCount ?? 0);
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadInbox();
    const interval = setInterval(loadInbox, 60_000);
    return () => clearInterval(interval);
  }, [loadInbox]);

  const grouped = useMemo(() => {
    const map = new Map<PriorityBucket, InboxItem[]>();
    for (const b of BUCKET_ORDER) map.set(b, []);
    for (const item of items) {
      map.get(bucketFor(item))!.push(item);
    }
    return BUCKET_ORDER.map((b) => ({ bucket: b, items: map.get(b)! })).filter(
      (g) => g.items.length > 0,
    );
  }, [items]);

  const actionCount = useMemo(
    () =>
      items.filter((i) => {
        if (i.read) return false;
        const b = bucketFor(i);
        return b === "CRITIQUE" || b === "URGENT" || b === "IMPORTANT";
      }).length,
    [items],
  );

  async function markOneRead(item: InboxItem) {
    const url =
      item.source === "alert"
        ? `/api/alerts/${item.id}`
        : `/api/notifications/${item.id}`;
    const res = await fetch(url, { method: "PATCH" });
    if (res.ok) await loadInbox();
  }

  async function markAllRead() {
    setLoading(true);
    try {
      await Promise.all([
        fetch("/api/notifications/read-all", { method: "POST" }),
        fetch("/api/alerts/read-all", { method: "POST" }),
      ]);
      await loadInbox();
    } finally {
      setLoading(false);
    }
  }

  const badge = actionCount > 0 ? actionCount : unreadCount;

  return (
    <HeaderDropdown
      panelId="notifications-dropdown-panel"
      width={360}
      align="right"
      trigger={({ onClick, expanded, triggerRef }) => (
        <button
          ref={triggerRef}
          type="button"
          onClick={() => {
            onClick();
            if (!expanded) void loadInbox();
          }}
          className="relative shrink-0 rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
          aria-label="Notifications"
          aria-expanded={expanded}
          aria-haspopup="menu"
          aria-controls="notifications-dropdown-panel"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {badge > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-0.5 text-[10px] font-bold text-white">
              {badge > 9 ? "9+" : badge}
            </span>
          )}
        </button>
      )}
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
        <h3 className="text-sm font-semibold text-slate-800">Centre de notifications</h3>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => void markAllRead()}
            disabled={loading}
            className="text-xs font-medium text-[#1d4ed8] hover:text-[#1e40af] disabled:opacity-50"
          >
            Tout marquer comme lu
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-slate-500">
          Aucune notification pour le moment.
        </p>
      ) : (
        <div className="max-h-96 overflow-y-auto">
          {grouped.map((group) => (
            <div key={group.bucket}>
              <p
                className={`sticky top-0 border-b border-slate-50 bg-slate-50/95 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider ${BUCKET_STYLE[group.bucket]}`}
              >
                {group.bucket}
              </p>
              <ul>
                {group.items.map((item) => (
                  <li
                    key={`${item.source}-${item.id}`}
                    className={`border-b border-slate-50 ${!item.read ? "bg-blue-50/40" : ""}`}
                  >
                    <div className="flex gap-2 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        {item.actionUrl ? (
                          <Link
                            href={item.actionUrl}
                            className="block text-left transition hover:opacity-90"
                          >
                            <NotifContent item={item} />
                          </Link>
                        ) : (
                          <NotifContent item={item} />
                        )}
                        {item.actionUrl ? (
                          <Link
                            href={item.actionUrl}
                            className="mt-1 inline-block text-[11px] font-semibold text-[#1e3a5f]"
                          >
                            Voir la fiche →
                          </Link>
                        ) : null}
                        {item.actionUrl?.includes("/dashboard/fiches-suivi/") ? (
                          <div className="mt-1">
                            <FollowUpInlineActions
                              sheetId={item.actionUrl.split("/").pop() || ""}
                              compact
                            />
                          </div>
                        ) : null}
                      </div>
                      {!item.read && (
                        <button
                          type="button"
                          onClick={() => void markOneRead(item)}
                          className="shrink-0 self-start text-[10px] font-medium text-slate-500 hover:text-[#1d4ed8]"
                          title="Marquer comme lu"
                        >
                          Lu
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      <div className="border-t border-slate-100 px-4 py-2">
        <Link href="/dashboard/a-traiter" className="text-xs font-semibold text-[#1e3a5f] hover:underline">
          Ouvrir « À traiter »
        </Link>
      </div>
    </HeaderDropdown>
  );
}

function NotifContent({ item }: { item: InboxItem }) {
  return (
    <>
      <p className="text-sm font-medium text-slate-800">{item.title}</p>
      <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">{item.message}</p>
      <p className="mt-1 text-xs text-slate-400">{formatNotifDate(item.createdAt)}</p>
    </>
  );
}
