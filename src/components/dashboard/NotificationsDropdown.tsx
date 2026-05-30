"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { HeaderDropdown } from "@/components/ui/HeaderDropdown";

type InboxItem = {
  id: string;
  source: "notification" | "alert";
  title: string;
  message: string;
  read: boolean;
  actionUrl: string | null;
  createdAt: string;
};

function formatNotifDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotificationsDropdown() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadInbox = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/inbox", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { unreadCount?: number; items?: InboxItem[] };
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

  return (
    <HeaderDropdown
      panelId="notifications-dropdown-panel"
      width={320}
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
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-0.5 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      )}
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
        <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
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
        <ul className="max-h-72 overflow-y-auto">
          {items.map((item) => (
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
      )}
    </HeaderDropdown>
  );
}

function NotifContent({ item }: { item: InboxItem }) {
  return (
    <>
      <p className="text-sm font-medium text-slate-800">{item.title}</p>
      <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">{item.message}</p>
      <p className="mt-1 text-xs text-slate-400">{formatNotifDate(item.createdAt)}</p>
      {!item.read && (
        <span className="mt-1 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
          Non lu
        </span>
      )}
    </>
  );
}
