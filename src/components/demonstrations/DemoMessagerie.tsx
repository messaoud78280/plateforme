"use client";

import { useState } from "react";

type Thread = {
  id: string;
  name: string;
  role: string;
  preview: string;
  unread?: boolean;
};

type Message = {
  id: string;
  from: "me" | "them";
  text: string;
  time: string;
};

const THREADS: Thread[] = [
  { id: "1", name: "Camille Dupont", role: "Direction", preview: "Peux-tu valider le planning ?", unread: true },
  { id: "2", name: "Équipe atelier", role: "Groupe", preview: "Livraison reportée à jeudi." },
  { id: "3", name: "Samir Benali", role: "Commercial", preview: "Le client a confirmé le RDV." },
  { id: "4", name: "Support interne", role: "Groupe", preview: "Nouvelle procédure documents." },
];

const MESSAGES: Record<string, Message[]> = {
  "1": [
    { id: "m1", from: "them", text: "Bonjour ! As-tu vu le nouveau planning de la semaine ?", time: "09:12" },
    { id: "m2", from: "me", text: "Oui, je regarde ça maintenant.", time: "09:15" },
    { id: "m3", from: "them", text: "Peux-tu valider avant 11 h ? On doit prévenir l’équipe.", time: "09:16" },
  ],
  "2": [
    { id: "m1", from: "them", text: "La livraison de matériel est reportée à jeudi matin.", time: "Hier" },
    { id: "m2", from: "me", text: "Merci, j’ajuste le planning.", time: "Hier" },
  ],
  "3": [
    { id: "m1", from: "them", text: "Le client a confirmé le rendez-vous de vendredi.", time: "08:40" },
    { id: "m2", from: "me", text: "Parfait, je bloque le créneau.", time: "08:44" },
  ],
  "4": [
    { id: "m1", from: "them", text: "Une nouvelle procédure documents est disponible dans l’espace partagé.", time: "Lun." },
  ],
};

/** Démonstration interactive — messagerie interne (données fictives). */
export function DemoMessagerie() {
  const [activeId, setActiveId] = useState("1");
  const [draft, setDraft] = useState("");
  const [extra, setExtra] = useState<Record<string, Message[]>>({});

  const messages = [...(MESSAGES[activeId] ?? []), ...(extra[activeId] ?? [])];
  const active = THREADS.find((t) => t.id === activeId);

  function send() {
    const text = draft.trim();
    if (!text) return;
    const msg: Message = {
      id: `local-${Date.now()}`,
      from: "me",
      text,
      time: "Maintenant",
    };
    setExtra((prev) => ({ ...prev, [activeId]: [...(prev[activeId] ?? []), msg] }));
    setDraft("");
  }

  return (
    <div className="flex min-h-[28rem] flex-col md:min-h-[32rem] md:flex-row">
      <aside className="border-b border-slate-200 md:w-72 md:shrink-0 md:border-b-0 md:border-r">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">Conversations</p>
          <p className="text-xs text-slate-500">Données d&apos;exemple</p>
        </div>
        <ul className="max-h-48 overflow-y-auto md:max-h-none">
          {THREADS.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => setActiveId(t.id)}
                className={`flex w-full flex-col gap-0.5 px-4 py-3 text-left transition hover:bg-[#f8fafc] ${
                  activeId === t.id ? "bg-[#eff6ff]" : ""
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-900">{t.name}</span>
                  {t.unread ? (
                    <span className="h-2 w-2 rounded-full bg-[#1d4ed8]" aria-label="Non lu" />
                  ) : null}
                </span>
                <span className="text-xs text-slate-500">{t.role}</span>
                <span className="truncate text-xs text-slate-600">{t.preview}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">{active?.name}</p>
          <p className="text-xs text-slate-500">{active?.role}</p>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.from === "me"
                    ? "bg-[#1d4ed8] text-white"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                <p>{m.text}</p>
                <p className={`mt-1 text-[10px] ${m.from === "me" ? "text-blue-100" : "text-slate-500"}`}>{m.time}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 border-t border-slate-100 p-3">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
            placeholder="Écrire un message…"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/20"
          />
          <button
            type="button"
            onClick={send}
            className="rounded-xl bg-[#1d4ed8] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1e40af]"
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}
