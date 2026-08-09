"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
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

function kindLabel(item: InboxItem): "ESCALADE" | "RAPPEL" | "ALERTE" | null {
  const t = (item.type ?? "").toUpperCase();
  const title = (item.title ?? "").toUpperCase();
  if (t.includes("ESCALATION") || title.startsWith("ESCALADE")) return "ESCALADE";
  if (t.includes("REMINDER") || title.startsWith("RAPPEL")) return "RAPPEL";
  if (
    t.includes("FOLLOWUP_ATTENTION") ||
    t.includes("FOLLOWUP_URGENT") ||
    t.includes("FOLLOWUP_CRITICAL") ||
    t.includes("PURCHASE_ORDER_ATTENTION") ||
    t.includes("PURCHASE_ORDER_URGENT") ||
    t.includes("PURCHASE_ORDER_CRITICAL")
  ) {
    return "ALERTE";
  }
  return null;
}

function bucketFor(item: InboxItem): PriorityBucket {
  const t = (item.type ?? "").toUpperCase();
  const title = item.title.toUpperCase();
  if (
    t.includes("ESCALATION") ||
    t.includes("CRITICAL") ||
    t.includes("CRITIQUE") ||
    title.includes("CRITIQUE") ||
    title.startsWith("ESCALADE")
  ) {
    return "CRITIQUE";
  }
  if (
    t.includes("URGENT") ||
    t.includes("FOLLOWUP_URGENT") ||
    title.startsWith("URGENT") ||
    title.includes("RETARD")
  ) {
    return "URGENT";
  }
  if (
    t.includes("FOLLOWUP_ATTENTION") ||
    t.includes("FOLLOWUP_REMINDER") ||
    t.includes("FOLLOWUP") ||
    t.includes("PURCHASE_ORDER") ||
    t.includes("DEADLINE") ||
    t.includes("MISSING") ||
    title.startsWith("IMPORTANT") ||
    title.startsWith("RAPPEL") ||
    title.includes("RAPPEL")
  ) {
    return "IMPORTANT";
  }
  return "INFORMATION";
}

function dayBucket(iso: string): "Aujourd’hui" | "Hier" | "Plus ancien" {
  const d = new Date(iso);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  const diff = Math.round((start.getTime() - day.getTime()) / 86400000);
  if (diff <= 0) return "Aujourd’hui";
  if (diff === 1) return "Hier";
  return "Plus ancien";
}

const BUCKET_ORDER: PriorityBucket[] = ["CRITIQUE", "URGENT", "IMPORTANT", "INFORMATION"];
const BUCKET_STYLE: Record<PriorityBucket, string> = {
  CRITIQUE: "text-red-950",
  URGENT: "text-red-700",
  IMPORTANT: "text-orange-700",
  INFORMATION: "text-slate-600",
};

const PERSONA_CHANGED = "bework:persona-changed";

export function NotificationsDropdown({ userId }: { userId?: string }) {
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

  const loadUnreadOnly = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/unread-count", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { unreadCount?: number };
      setUnreadCount(typeof data.unreadCount === "number" ? data.unreadCount : 0);
    } catch {
      // ignore
    }
  }, []);

  const resetForPersona = useCallback(() => {
    setItems([]);
    setUnreadCount(0);
    void loadUnreadOnly();
  }, [loadUnreadOnly]);

  useEffect(() => {
    void loadUnreadOnly();
    const interval = setInterval(() => void loadUnreadOnly(), 60_000);
    return () => clearInterval(interval);
  }, [loadUnreadOnly, userId]);

  useEffect(() => {
    const onPersona = () => resetForPersona();
    window.addEventListener(PERSONA_CHANGED, onPersona);
    return () => window.removeEventListener(PERSONA_CHANGED, onPersona);
  }, [resetForPersona]);

  const grouped = useMemo(() => {
    const dayOrder = ["Aujourd’hui", "Hier", "Plus ancien"] as const;
    const byDay = new Map<string, InboxItem[]>();
    for (const d of dayOrder) byDay.set(d, []);
    for (const item of items) {
      byDay.get(dayBucket(item.createdAt))!.push(item);
    }
    return dayOrder
      .map((day) => {
        const dayItems = byDay.get(day) ?? [];
        const byPriority = new Map<PriorityBucket, InboxItem[]>();
        for (const b of BUCKET_ORDER) byPriority.set(b, []);
        for (const item of dayItems) {
          byPriority.get(bucketFor(item))!.push(item);
        }
        const priorityGroups = BUCKET_ORDER.map((b) => ({
          bucket: b,
          items: byPriority.get(b)!,
        })).filter((g) => g.items.length > 0);
        return { day, priorityGroups };
      })
      .filter((g) => g.priorityGroups.length > 0);
  }, [items]);

  async function markOneRead(item: InboxItem) {
    if (item.read) return;
    // Optimistic UI
    setItems((prev) => prev.map((i) => (i.id === item.id && i.source === item.source ? { ...i, read: true } : i)));
    setUnreadCount((c) => Math.max(0, c - 1));
    const url =
      item.source === "alert"
        ? `/api/alerts/${item.id}`
        : `/api/notifications/${item.id}`;
    const res = await fetch(url, { method: "PATCH" });
    if (!res.ok) await loadInbox();
  }

  async function markAllRead() {
    setLoading(true);
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
    setUnreadCount(0);
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

  // Badge = exactement le nombre de non lues (persona active via session)
  const badge = unreadCount;

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
            // Ouvrir ≠ lire : charge seulement l’inbox
            if (!expanded) void loadInbox();
          }}
          className="relative shrink-0 rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
          aria-label={
            badge > 0
              ? `Notifications métier, ${badge} non lues`
              : "Notifications métier"
          }
          title="Notifications métier"
          data-header-slot="notifications"
          aria-expanded={expanded}
          aria-haspopup="menu"
          aria-controls="notifications-dropdown-panel"
        >
          <Bell className="h-5 w-5" aria-hidden />
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
          {grouped.map((dayGroup) => (
            <div key={dayGroup.day}>
              <p className="sticky top-0 z-[1] border-b border-slate-100 bg-white px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {dayGroup.day}
              </p>
              {dayGroup.priorityGroups.map((group) => (
                <div key={`${dayGroup.day}-${group.bucket}`}>
                  <p
                    className={`border-b border-slate-50 bg-slate-50/95 px-4 py-1 text-[10px] font-bold uppercase tracking-wider ${BUCKET_STYLE[group.bucket]}`}
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
                          {!item.read ? (
                            <span
                              className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#1d4ed8]"
                              title="Non lu"
                              aria-hidden
                            />
                          ) : (
                            <span className="mt-1.5 h-2 w-2 shrink-0" aria-hidden />
                          )}
                          <div className="min-w-0 flex-1">
                            {item.actionUrl ? (
                              <Link
                                href={item.actionUrl}
                                onClick={() => void markOneRead(item)}
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
                                onClick={() => void markOneRead(item)}
                                className="mt-1 inline-block text-[11px] font-semibold text-[#1e3a5f]"
                              >
                                Voir →
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
                          <div className="shrink-0 self-start text-right">
                            {!item.read ? (
                              <button
                                type="button"
                                onClick={() => void markOneRead(item)}
                                className="text-[10px] font-medium text-[#1d4ed8] hover:underline"
                                title="Marquer comme lu"
                              >
                                Marquer comme lu
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400">Lu</span>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
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
  const kind = kindLabel(item);
  const kindStyle =
    kind === "ESCALADE"
      ? "bg-red-100 text-red-800"
      : kind === "RAPPEL"
        ? "bg-amber-100 text-amber-900"
        : kind === "ALERTE"
          ? "bg-orange-100 text-orange-900"
          : null;
  return (
    <>
      <div className="mb-1 flex flex-wrap items-center gap-1.5">
        {kind && kindStyle ? (
          <span
            className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${kindStyle}`}
          >
            {kind}
          </span>
        ) : null}
        {!item.read ? (
          <span className="inline-block rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800">
            Nouveau
          </span>
        ) : null}
      </div>
      <p className={`text-sm ${!item.read ? "font-semibold text-slate-900" : "font-medium text-slate-800"}`}>
        {item.title}
      </p>
      <p className="mt-0.5 line-clamp-2 whitespace-pre-line text-xs text-slate-600">{item.message}</p>
      <p className="mt-1 text-xs text-slate-400">{formatNotifDate(item.createdAt)}</p>
    </>
  );
}
