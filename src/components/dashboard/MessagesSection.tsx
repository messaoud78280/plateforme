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

export function MessagesSection({ isAgence, sessionUserId }: MessagesSectionProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [recipients, setRecipients] = useState<{ id: string; name: string; role: string }[]>([]);
  const [loading, setLoading] = useState(true);
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
  const anciensMessages = messages.filter(
    (m) => m.receiver.id === sessionUserId && m.read
  );
  const messagesEnvoyes = messages.filter((m) => m.sender.id === sessionUserId);

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

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-800">Messages</h2>
      <p className="mt-1 text-sm text-slate-600">
        Consultez vos échanges et envoyez des messages.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Nouveaux messages (alertes) */}
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              {nouveauxMessages.length}
            </span>
            Nouveaux messages
          </h3>
          <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-amber-200 bg-amber-50/50 p-3">
            {nouveauxMessages.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun nouveau message.</p>
            ) : (
              nouveauxMessages.map((m) => (
                <div
                  key={m.id}
                  className="cursor-pointer rounded-lg border border-amber-200 bg-white p-3 transition hover:border-amber-300"
                  onClick={() => markAsRead(m.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && markAsRead(m.id)}
                >
                  <p className="text-xs text-slate-500">
                    {m.sender.name} • {m.project.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-800">
                    {m.content}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    {new Date(m.createdAt).toLocaleString("fr-FR")}
                  </p>
                  <Link
                    href={`/dashboard/projets/${m.project.id}`}
                    className="mt-2 inline-block text-xs font-medium text-blue-600 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Voir le projet →
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Anciens messages */}
        <div>
          <h3 className="mb-2 text-sm font-medium text-slate-700">
            Messages consultés
          </h3>
          <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/50 p-3">
            {anciensMessages.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun message consulté.</p>
            ) : (
              anciensMessages.slice(0, 5).map((m) => (
                <div
                  key={m.id}
                  className="rounded-lg border border-slate-200 bg-white p-3"
                >
                  <p className="text-xs text-slate-500">
                    {m.sender.name} → {m.receiver.name} • {m.project.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-700">
                    {m.content}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    {new Date(m.createdAt).toLocaleString("fr-FR")}
                  </p>
                  <Link
                    href={`/dashboard/projets/${m.project.id}`}
                    className="mt-2 inline-block text-xs text-blue-600 hover:underline"
                  >
                    Voir le projet →
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Envoyer un message */}
      <div className="mt-6 border-t border-slate-200 pt-6">
        <h3 className="mb-3 text-sm font-medium text-slate-700">
          Envoyer un message
        </h3>
        <form onSubmit={handleSend} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600">
              Projet
            </label>
            <select
              value={sendProject}
              onChange={(e) => {
                setSendProject(e.target.value);
                setSendReceiver("");
              }}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            >
              <option value="">Sélectionnez un projet</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                  {!isAgence && p.assignedTo
                    ? ` (agent : ${p.assignedTo.name})`
                    : isAgence && p.client
                      ? ` (client : ${p.client.name})`
                      : ""}
                </option>
              ))}
            </select>
          </div>

          {!isAgence && recipientsForProject.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-600">
                Destinataire
              </label>
              <select
                value={sendReceiver}
                onChange={(e) => setSendReceiver(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                <option value="">
                  Choisir : Laure Olivie (gérante) ou l'agent du dossier
                </option>
                {recipientsForProject.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600">
              Message
            </label>
            <textarea
              value={sendContent}
              onChange={(e) => setSendContent(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {sending ? "Envoi..." : "Envoyer"}
          </button>
        </form>
      </div>

      <Link
        href="/dashboard/messages"
        className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline"
      >
        Voir tous les messages →
      </Link>
    </div>
  );
}
