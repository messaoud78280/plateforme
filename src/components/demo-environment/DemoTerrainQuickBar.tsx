"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Action = "photo" | "termine" | "reserve" | "blocage";

const BUTTONS: { action: Action | null; href?: string; label: string }[] = [
  { action: null, href: "/dashboard/messagerie?view=chantiers", label: "Message" },
  { action: "photo", label: "Photo" },
  { action: "termine", label: "Terminé" },
  { action: "reserve", label: "Réserve" },
  { action: "blocage", label: "Blocage" },
];

export function DemoTerrainQuickBar({ projectId }: { projectId?: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState<Action | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState("");

  async function submit(action: Action) {
    setBusy(true);
    setFlash("");
    try {
      const res = await fetch("/api/demo/terrain-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note, projectId: projectId ?? undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFlash(data.error ?? "Erreur");
        setBusy(false);
        return;
      }
      setFlash("Enregistré — Direction notifiée.");
      setOpen(null);
      setNote("");
      router.refresh();
      if (typeof data.redirect === "string" && action === "photo") {
        window.location.href = data.redirect;
        return;
      }
    } catch {
      setFlash("Erreur de connexion");
    }
    setBusy(false);
  }

  return (
    <>
      {flash ? (
        <p className="fixed bottom-16 left-2 right-2 z-50 mx-auto max-w-lg rounded-lg bg-emerald-700 px-3 py-2 text-center text-xs font-medium text-white lg:hidden">
          {flash}
        </p>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 lg:hidden">
          <div className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl">
            <h3 className="text-sm font-bold text-[#1e3a5f]">
              {open === "photo"
                ? "Ajouter une photo / doc"
                : open === "termine"
                  ? "Marquer terminé"
                  : open === "reserve"
                    ? "Signaler une réserve"
                    : "Signaler un blocage"}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Constat terrain — Direction est alertée. À valider avant engagement contractuel.
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Note courte (optionnel)"
              className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void submit(open)}
                className="flex-1 rounded-lg bg-[#1e3a5f] py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy ? "…" : "Enregistrer"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setOpen(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-2 py-2 shadow-lg backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-lg justify-between gap-1">
          {BUTTONS.map((a) =>
            a.href ? (
              <Link
                key={a.label}
                href={a.href}
                className="flex-1 rounded-lg bg-[#1e3a5f] px-1 py-2 text-center text-[10px] font-semibold text-white"
              >
                {a.label}
              </Link>
            ) : (
              <button
                key={a.label}
                type="button"
                onClick={() => setOpen(a.action)}
                className="flex-1 rounded-lg bg-[#1e3a5f] px-1 py-2 text-center text-[10px] font-semibold text-white"
              >
                {a.label}
              </button>
            )
          )}
        </div>
      </div>
    </>
  );
}
