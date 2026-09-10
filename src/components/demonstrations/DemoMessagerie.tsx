"use client";

import { useMemo, useState } from "react";

type Thread = {
  id: string;
  name: string;
  role: string;
  preview: string;
  time: string;
  unread: number;
  initials: string;
  color: string;
  pinned?: boolean;
};

type Message = {
  id: string;
  from: "me" | "them";
  text: string;
  time: string;
  attachment?: { name: string; size: string };
};

const THREADS: Thread[] = [
  {
    id: "1",
    name: "Sophie Martin",
    role: "Coach indépendante",
    preview: "Le rendez-vous de jeudi est confirmé.",
    time: "10:42",
    unread: 2,
    initials: "SM",
    color: "#7c3aed",
    pinned: true,
  },
  {
    id: "2",
    name: "Atelier Nova",
    role: "Équipe projet",
    preview: "Je viens de déposer les documents.",
    time: "09:18",
    unread: 1,
    initials: "AN",
    color: "#2563eb",
  },
  {
    id: "3",
    name: "Thomas Leroy",
    role: "Commercial",
    preview: "Est-ce que nous pouvons décaler à 14 h ?",
    time: "Hier",
    unread: 0,
    initials: "TL",
    color: "#0d9488",
  },
  {
    id: "4",
    name: "Nadia Benali",
    role: "Maison Rivage",
    preview: "Merci pour le suivi, c’est parfait.",
    time: "Hier",
    unread: 0,
    initials: "NB",
    color: "#ea580c",
  },
  {
    id: "5",
    name: "Claire Dubois",
    role: "Agence Lumière",
    preview: "Proposition envoyée — en attente de retour.",
    time: "Lun.",
    unread: 0,
    initials: "CD",
    color: "#4f46e5",
  },
];

const MESSAGES: Record<string, Message[]> = {
  "1": [
    {
      id: "m1",
      from: "them",
      text: "Bonjour ! Est-ce que le créneau de jeudi 10 h 30 convient toujours ?",
      time: "10:12",
    },
    {
      id: "m2",
      from: "me",
      text: "Oui, je confirme. Je bloque le rendez-vous dans l’agenda.",
      time: "10:18",
    },
    {
      id: "m3",
      from: "them",
      text: "Parfait. Je prépare les points à aborder.",
      time: "10:21",
      attachment: { name: "brief-session.pdf", size: "240 Ko" },
    },
    {
      id: "m4",
      from: "them",
      text: "Le rendez-vous de jeudi est confirmé.",
      time: "10:42",
    },
  ],
  "2": [
    {
      id: "m1",
      from: "them",
      text: "Bonjour, les plans mis à jour sont prêts.",
      time: "08:55",
    },
    {
      id: "m2",
      from: "me",
      text: "Super, vous pouvez les déposer dans l’espace partagé ?",
      time: "09:02",
    },
    {
      id: "m3",
      from: "them",
      text: "Je viens de déposer les documents.",
      time: "09:18",
      attachment: { name: "plans-horizon-v2.pdf", size: "1,2 Mo" },
    },
  ],
  "3": [
    {
      id: "m1",
      from: "them",
      text: "Bonjour, mon matin est un peu chargé.",
      time: "Hier · 16:40",
    },
    {
      id: "m2",
      from: "them",
      text: "Est-ce que nous pouvons décaler à 14 h ?",
      time: "Hier · 16:41",
    },
    {
      id: "m3",
      from: "me",
      text: "Oui, 14 h me convient. Je mets à jour le créneau.",
      time: "Hier · 17:05",
    },
  ],
  "4": [
    {
      id: "m1",
      from: "me",
      text: "Bonjour Nadia, le suivi de votre dossier est à jour.",
      time: "Hier · 11:20",
    },
    {
      id: "m2",
      from: "them",
      text: "Merci pour le suivi, c’est parfait.",
      time: "Hier · 11:48",
    },
  ],
  "5": [
    {
      id: "m1",
      from: "them",
      text: "La proposition commerciale a bien été envoyée au client.",
      time: "Lun. · 15:10",
    },
    {
      id: "m2",
      from: "me",
      text: "Parfait, on attend le retour avant la fin de semaine.",
      time: "Lun. · 15:22",
    },
    {
      id: "m3",
      from: "them",
      text: "Proposition envoyée — en attente de retour.",
      time: "Lun. · 15:23",
    },
  ],
};

const CHAT_BG = {
  backgroundColor: "#efeae2",
  backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'>
      <g fill='none' stroke='#c9c3b8' stroke-width='1.2' opacity='0.4'>
        <path d='M20 30c8-4 16 4 12 12M50 80c6 0 10 6 6 12M120 40c0 8 10 10 14 4'/>
        <circle cx='90' cy='50' r='6'/><circle cx='150' cy='160' r='5'/>
      </g>
    </svg>`,
  )}")`,
} as const;

/** Démo messagerie — inspirée de la messagerie plateforme, données fictives. */
export function DemoMessagerie() {
  const [activeId, setActiveId] = useState("1");
  const [draft, setDraft] = useState("");
  const [extra, setExtra] = useState<Record<string, Message[]>>({});
  const [readMap, setReadMap] = useState<Record<string, boolean>>({});

  const threads = useMemo(
    () =>
      THREADS.map((t) => ({
        ...t,
        unread: readMap[t.id] ? 0 : t.unread,
      })),
    [readMap],
  );

  const active = threads.find((t) => t.id === activeId);
  const messages = [...(MESSAGES[activeId] ?? []), ...(extra[activeId] ?? [])];

  function openThread(id: string) {
    setActiveId(id);
    setReadMap((prev) => ({ ...prev, [id]: true }));
  }

  function send() {
    const text = draft.trim();
    if (!text) return;
    setExtra((prev) => ({
      ...prev,
      [activeId]: [
        ...(prev[activeId] ?? []),
        { id: `local-${Date.now()}`, from: "me", text, time: "Maintenant" },
      ],
    }));
    setDraft("");
  }

  return (
    <div className="flex min-h-[32rem] flex-col overflow-hidden md:min-h-[36rem] md:flex-row">
      <aside className="flex max-h-56 flex-col border-b border-[#d1d7db] bg-[#f0f2f5] md:max-h-none md:w-[18.5rem] md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between border-b border-[#e9edef] bg-white px-4 py-3">
          <div>
            <p className="text-sm font-bold text-[#111b21]">Messages</p>
            <p className="text-[11px] text-[#667781]">Données d’exemple</p>
          </div>
          <span className="rounded-full bg-[#dcf8c6] px-2 py-0.5 text-[10px] font-bold text-[#008069]">
            En ligne
          </span>
        </div>
        <ul className="flex-1 overflow-y-auto">
          {threads.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => openThread(t.id)}
                className={`flex w-full items-start gap-3 px-3 py-3 text-left transition hover:bg-white/80 ${
                  activeId === t.id ? "bg-white" : ""
                }`}
              >
                <span
                  className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: t.color }}
                >
                  {t.initials}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-[#111b21]">
                      {t.name}
                      {t.pinned ? (
                        <span className="ml-1 text-[10px] text-[#8696a0]" aria-label="Épinglé">
                          📌
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-[10px] text-[#8696a0]">{t.time}</span>
                  </span>
                  <span className="mt-0.5 flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-[#667781]">{t.preview}</span>
                    {t.unread > 0 ? (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#25d366] px-1 text-[10px] font-bold text-white">
                        {t.unread}
                      </span>
                    ) : null}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col bg-white">
        <div className="flex items-center gap-3 border-b border-[#e9edef] bg-[#f0f2f5] px-4 py-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: active?.color ?? "#2563eb" }}
          >
            {active?.initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[#111b21]">{active?.name}</p>
            <p className="truncate text-[11px] text-[#667781]">{active?.role}</p>
          </div>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto px-3 py-4 sm:px-5" style={CHAT_BG}>
          <p className="mx-auto mb-3 max-w-xs rounded-lg bg-[#fff5c4]/90 px-3 py-1.5 text-center text-[11px] text-[#54656f] shadow-sm">
            Conversation fictive — démonstration BeWork
          </p>
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[88%] rounded-xl px-3 py-2 text-sm leading-relaxed shadow-sm sm:max-w-[75%] ${
                  m.from === "me"
                    ? "rounded-tr-sm bg-[#d9fdd3] text-[#111b21]"
                    : "rounded-tl-sm bg-white text-[#111b21]"
                }`}
              >
                <p>{m.text}</p>
                {m.attachment ? (
                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-black/5 bg-black/[0.03] px-2.5 py-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#eff6ff] text-xs font-bold text-[#2563eb]">
                      PDF
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold">{m.attachment.name}</span>
                      <span className="text-[10px] text-[#667781]">{m.attachment.size}</span>
                    </span>
                  </div>
                ) : null}
                <p className="mt-1 text-right text-[10px] text-[#667781]">{m.time}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 border-t border-[#e9edef] bg-[#f0f2f5] p-3">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
            placeholder="Écrire un message…"
            className="min-w-0 flex-1 rounded-full border border-transparent bg-white px-4 py-2.5 text-sm shadow-sm focus:border-[#00a884] focus:outline-none focus:ring-2 focus:ring-[#00a884]/20"
          />
          <button
            type="button"
            onClick={send}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00a884] text-white shadow-sm transition hover:bg-[#008069]"
            aria-label="Envoyer"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
