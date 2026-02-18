"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface MessageFormProps {
  projectId: string;
  clientId: string;
  isAgence: boolean;
  sessionUserId: string;
}

export function MessageForm({
  projectId,
  isAgence,
}: MessageFormProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          content: content.trim(),
        }),
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
    <form onSubmit={handleSubmit} className="mt-6">
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
        disabled={loading || !content.trim()}
        className="mt-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Envoi..." : "Envoyer"}
      </button>
    </form>
  );
}
