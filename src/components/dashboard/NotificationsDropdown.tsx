"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

type AlertItem = {
  id: string;
  title: string;
  message: string;
  actionUrl: string | null;
  createdAt: string;
};

export function NotificationsDropdown() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/alerts");
        if (res.ok) {
          const data = await res.json();
          setAlerts(Array.isArray(data) ? data : data.alerts || []);
        }
      } catch {
        // ignore
      }
    }
    load();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const count = alerts.length;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
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
          {alerts.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">Aucune notification.</p>
          ) : (
            <ul className="max-h-72 overflow-y-auto">
              {alerts.map((a) => (
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
