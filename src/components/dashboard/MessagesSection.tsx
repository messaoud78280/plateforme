"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type MessageItem = {
  id: string;
  content: string;
  read: boolean;
  createdAt: string;
  project: { id: string; title: string };
  sender: { id: string; name: string };
  receiver: { id: string; name: string };
};

type ProjectItem = {
  id: string;
  title: string;
  clientId: string;
  client?: { id: string; name: string };
  assignedToId?: string | null;
  assignedTo?: { id: string; name: string } | null;
};

interface MessagesSectionProps {
  isAgence: boolean;
  sessionUserId: string;
}

type Tab = "nouveaux" | "tous" | "envoyer";

function formatDate(d: string) {
  const date = new Date(d);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function MessagesSection({ isAgence, sessionUserId }: MessagesSectionProps) {
  const router = useRouter();

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [recipients, setRecipients] = useState<{ id: string; name: string; role: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("nouveaux");
  const [filterProject, setFilterProject] = useState<string>("");
  const [sendProject, setSendProject] = useState("");
  const [sendReceiver, setSendReceiver] = useState("");
  const [sendContent, setSendContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [msgRes, projRes] = await Promise.all([
          fetch("/api/messages"),
          fetch("/api/projets"),
        ]);
        if (msgRes.ok) {
          const data = await msgRes.json();
          setMessages(data);
        }
        if (projRes.ok) {
          const projs = await projRes.json();
          setProjects(projs);
          if (!isAgence && projs.length > 0) {
            const managerRes = await fetch("/api/users/gerante");
            const recs: { id: string; name: string; role: string }[] = [];
            if (managerRes.ok) {
              const g = await managerRes.json();
              if (g) recs.push({ ...g, role: "Gérante" });
            }
            const agents = new Map<string, string>();
            projs.forEach((p: ProjectItem) => {
              if (p.assignedTo) agents.set(p.assignedTo.id, p.assignedTo.name);
            });
            agents.forEach((name, id) => recs.push({ id, name, role: "Agent" }));
            setRecipients(recs);
          }
        }
      } catch {
        setError("Erreur lors du chargement.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isAgence]);

  const nouveauxMessages = messages.filter(
    (m) => m.receiver.id === sessionUserId && !m.read
  );
  const tousLesMessages = messages
    .filter((m) => m.receiver.id === sessionUserId || m.sender.id === sessionUserId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const messagesFiltres =
    filterProject
      ? tousLesMessages.filter((m) => m.project.id === filterProject)
      : tousLesMessages;

  const projetsAvecMessages = [...new Set(tousLesMessages.map((m) => m.project.id))];

  async function markAsRead(id: string) {
    try {
      await fetch(`/api/messages/${id}`, { method: "PATCH" });
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, read: true } : m))
      );
      router.refresh();
    } catch {
      // ignore
    }
  }

  const recipientsForProject = !isAgence && sendProject
    ? (() => {
        const p = projects.find((x) => x.id === sendProject);
        const list: { id: string; name: string; role: string }[] = [];
        const gerante = recipients.find((r) => r.role === "Gérante");
        if (gerante) list.push(gerante);
        if (p?.assignedTo)
          list.push({ ...p.assignedTo, role: "Agent en charge" });
        return list;
      })()
    : recipients;

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!sendProject?.trim() || !sendContent?.trim()) return;
    if (!isAgence && recipientsForProject.length > 0 && !sendReceiver?.trim()) {
      setError("Choisissez un destinataire.");
      return;
    }
    setError("");
    setSending(true);
    try {
      const body: { projectId: string; content: string; receiverId?: string } = {
        projectId: sendProject,
        content: sendContent.trim(),
      };
      if (!isAgence && sendReceiver) body.receiverId = sendReceiver;

      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de l'envoi.");
        setSending(false);
        return;
      }
      setSendContent("");
      const refresh = await fetch("/api/messages");
      if (refresh.ok) setMessages(await refresh.json());
      setActiveTab("tous");
      router.refresh();
    } catch {
      setError("Erreur de connexion.");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-slate-500">Chargement des messages...</p>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "nouveaux", label: "Nouveaux", badge: nouveauxMessages.length },
    { id: "tous", label: "Tous les messages" },
    { id: "envoyer", label: "Envoyer" },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* En-tête avec onglets */}
      <div className="border-b border-slate-200">
        <h2 className="px-6 pt-4 text-lg font-semibold text-slate-800">RDV</h2>
        <div className="mt-3 flex gap-1 px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative rounded-t-lg px-4 py-3 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="ml-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-bold text-white">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* Onglet Nouveaux */}
        {activeTab === "nouveaux" && (
          <div>
            {nouveauxMessages.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center text-sm text-slate-500">
                Aucun nouveau message. Tout est à jour.
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  Cliquez sur un message pour le marquer comme lu et accéder au projet.
                </p>
                {nouveauxMessages.map((m) => (
                    <div
                      key={m.id}
                      className="cursor-pointer rounded-xl border-2 border-amber-200 bg-amber-50/80 p-4 transition hover:border-amber-300 hover:bg-amber-50"
                      onClick={() => markAsRead(m.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && markAsRead(m.id)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                            <span className="font-medium text-slate-800">
                              {m.sender.name}
                            </span>
                            <span>•</span>
                            <Link
                              href={`/dashboard/projets/${m.project.id}`}
                              className="font-medium text-blue-600 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {m.project.title}
                            </Link>
                          </div>
                          <p className="mt-2 text-sm text-slate-800">{m.content}</p>
                          <p className="mt-2 text-xs text-slate-400">
                            {formatDate(m.createdAt)}
                          </p>
                        </div>
                        <Link
                          href={`/dashboard/projets/${m.project.id}`}
                          className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Voir le projet
                        </Link>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Onglet Tous les messages */}
        {activeTab === "tous" && (
          <div>
            {tousLesMessages.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center text-sm text-slate-500">
                Aucun message pour le moment. Envoyez un message depuis l'onglet « Envoyer ».
              </p>
            ) : (
              <>
                {projetsAvecMessages.length > 1 && (
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-slate-600">
                      Filtrer par projet
                    </label>
                    <select
                      value={filterProject}
                      onChange={(e) => setFilterProject(e.target.value)}
                      className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Tous les projets</option>
                      {projetsAvecMessages.map((pid) => {
                        const p = messages.find((m) => m.project.id === pid)?.project;
                        return p ? (
                          <option key={pid} value={pid}>
                            {p.title}
                          </option>
                        ) : null;
                      })}
                    </select>
                  </div>
                )}

                <div className="space-y-3">
                  {messagesFiltres.map((m) => {
                    const isFromMe = m.sender.id === sessionUserId;
                    return (
                      <div
                        key={m.id}
                        className={`rounded-xl border p-4 ${
                          isFromMe
                            ? "ml-4 border-blue-200 bg-blue-50/50"
                            : "mr-4 border-slate-200 bg-slate-50/50"
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                          <span className="font-medium text-slate-800">
                            {m.sender.name} → {m.receiver.name}
                          </span>
                          <span>•</span>
                          <Link
                            href={`/dashboard/projets/${m.project.id}`}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            {m.project.title}
                          </Link>
                          {!isAgence && (() => {
                            const p = projects.find((x) => x.id === m.project.id);
                            return p?.assignedTo ? (
                              <span className="text-slate-500">— Référent : {p.assignedTo.name}</span>
                            ) : null;
                          })()}
                          {!m.read && m.receiver.id === sessionUserId && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-800">
                              Non lu
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-slate-800">{m.content}</p>
                        <p className="mt-2 text-xs text-slate-400">
                          {formatDate(m.createdAt)}
                        </p>
                        <Link
                          href={`/dashboard/projets/${m.project.id}`}
                          className="mt-2 inline-block text-xs font-medium text-blue-600 hover:underline"
                        >
                          Voir le projet →
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Onglet Envoyer */}
        {activeTab === "envoyer" && (
          <form onSubmit={handleSend} className="max-w-xl space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Projet
              </label>
              <select
                value={sendProject}
                onChange={(e) => {
                  setSendProject(e.target.value);
                  setSendReceiver("");
                }}
                className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              >
                <option value="">Sélectionnez un projet</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                    {!isAgence && p.assignedTo
                      ? ` — Référent : ${p.assignedTo.name}`
                      : isAgence && p.client
                        ? ` — Client : ${p.client.name}`
                        : ""}
                  </option>
                ))}
              </select>
            </div>

            {!isAgence && recipientsForProject.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Destinataire
                </label>
                <select
                  value={sendReceiver}
                  onChange={(e) => setSendReceiver(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                >
                  <option value="">
                    Choisir : gérante ou agent du dossier
                  </option>
                  {recipientsForProject.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} — {r.role}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Votre message
              </label>
              <textarea
                value={sendContent}
                onChange={(e) => setSendContent(e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Écrivez votre message..."
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={sending || !sendProject || !sendContent.trim()}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {sending ? "Envoi en cours..." : "Envoyer le message"}
            </button>
          </form>
        )}
      </div>

      {isAgence && (
        <div className="border-t border-slate-200 px-6 py-3">
          <Link
            href="/dashboard/messages"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            Demandes de contact et RDV →
          </Link>
        </div>
      )}
    </div>
  );
}
