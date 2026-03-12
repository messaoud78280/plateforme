"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

type NotifItem = {
  id: string;
  title: string;
  message: string;
  actionUrl: string | null;
  createdAt: string;
};

export function NotificationsDropdown() {
  const [items, setItems] = useState<NotifItem[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const [alertsRes, notifsRes] = await Promise.all([
        fetch("/api/alerts"),
        fetch("/api/notifications?unread=true"),
      ]);
      const list: NotifItem[] = [];
      if (alertsRes.ok) {
        const data = await alertsRes.json();
        const alerts = Array.isArray(data) ? data : data.alerts || [];
        list.push(...alerts.map((a: NotifItem) => ({ id: a.id, title: a.title, message: a.message, actionUrl: a.actionUrl ?? null, createdAt: a.createdAt })));
      }
      if (notifsRes.ok) {
        const notifs = await notifsRes.json();
        if (Array.isArray(notifs)) {
          list.push(...notifs.map((n: NotifItem) => ({ id: n.id, title: n.title, message: n.message, actionUrl: n.actionUrl ?? null, createdAt: n.createdAt })));
        }
      }
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setItems(list.slice(0, 20));
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleToggle() {
    if (!open) {
      await Promise.all([
        fetch("/api/notifications/read-all", { method: "POST" }),
        fetch("/api/alerts/read-all", { method: "POST" }),
      ]);
      await load();
    }
    setOpen((v) => !v);
  }

  const count = items.length;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={handleToggle}
        className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
        aria-label="Notifications"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-xl border border-slate-200 bg-white py-2 shadow-lg">
          <div className="border-b border-slate-100 px-4 py-2">
            <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">Aucune notification.</p>
          ) : (
            <ul className="max-h-72 overflow-y-auto">
              {items.map((a) => (
                <li key={a.id}>
                  <Link
                    href={a.actionUrl || "#"}
                    onClick={() => setOpen(false)}
                    className="block border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50"
                  >
                    <p className="text-sm font-medium text-slate-800">{a.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">{a.message}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(a.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
