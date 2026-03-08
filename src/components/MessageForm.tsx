"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface MessageFormProps {
  projectId: string;
  clientId: string;
  client?: { id: string; name: string };
  isAgence: boolean;
  sessionUserId: string;
}

export function MessageForm({
  projectId,
  clientId,
  client,
  isAgence,
  sessionUserId,
}: MessageFormProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [receiverId, setReceiverId] = useState("");
  const [gerante, setGerante] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (isAgence) {
      fetch("/api/users/gerante")
        .then((r) => (r.ok ? r.json() : null))
        .then(setGerante);
    }
  }, [isAgence]);

  const recipients: { id: string; name: string; role: string }[] = [];
  if (client) recipients.push({ ...client, role: "Client" });
  if (gerante && gerante.id !== sessionUserId)
    recipients.push({ ...gerante, role: "Gérante" });

  const showRecipientSelect = isAgence && recipients.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    if (showRecipientSelect && !receiverId) return;

    setLoading(true);
    try {
      const body: { projectId: string; content: string; receiverId?: string } = {
        projectId,
        content: content.trim(),
      };
      if (receiverId) body.receiverId = receiverId;

      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Erreur");
      setContent("");
      router.refresh();
    } catch {
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      {showRecipientSelect && (
        <div>
          <label className="block text-sm font-medium text-slate-700">Destinataire</label>
          <select
            value={receiverId}
            onChange={(e) => setReceiverId(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Choisir : client ou gérante</option>
            {recipients.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} — {r.role}
              </option>
            ))}
          </select>
        </div>
      )}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Écrivez votre message..."
        rows={3}
        className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading || !content.trim() || (showRecipientSelect && !receiverId)}
        className="mt-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Envoi..." : "Envoyer"}
      </button>
    </form>
  );
}
