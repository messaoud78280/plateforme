"use client";

import { useCallback, useEffect, useState } from "react";
import { FolderTree, Loader2, Pencil, Plus } from "lucide-react";
import { cn } from "@/lib/cn";

type Fam = {
  id: string;
  name: string;
  sortOrder: number;
  count: number;
  subFamilies: Array<{ id: string; name: string; sortOrder: number; count: number }>;
};

export function LibraryFamiliesManager({
  open,
  onClose,
  onChanged,
}: {
  open: boolean;
  onClose: () => void;
  onChanged?: () => void;
}) {
  const [families, setFamilies] = useState<Fam[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newFamily, setNewFamily] = useState("");
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  const [newSub, setNewSub] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/commercial/library/families");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setFamilies(data.families ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/commercial/library/families", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setFamilies(data.families ?? []);
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[85] flex items-start justify-center p-4 pt-[6vh]">
      <button type="button" className="absolute inset-0 bg-slate-900/40" onClick={onClose} aria-label="Fermer" />
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <FolderTree className="h-4 w-4 text-[#1e3a5f]" />
            <h2 className="text-sm font-bold text-[#1e3a5f]">Familles & sous-familles</h2>
          </div>
          <button type="button" onClick={onClose} className="text-xs font-semibold text-slate-500">
            Fermer
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <input
              value={newFamily}
              onChange={(e) => setNewFamily(e.target.value)}
              placeholder="Nouvelle famille…"
              className="min-w-[200px] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={busy || !newFamily.trim()}
              onClick={() => {
                void post({ action: "createFamily", name: newFamily }).then(() =>
                  setNewFamily(""),
                );
              }}
              className="inline-flex h-10 items-center gap-1 rounded-xl bg-[#1e3a5f] px-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Créer
            </button>
          </div>

          {loading ? (
            <p className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
            </p>
          ) : (
            <ul className="space-y-2">
              {families.map((f) => (
                <li
                  key={f.id}
                  className={cn(
                    "rounded-xl border border-slate-100 p-3",
                    selectedFamily === f.name && "border-[#1e3a5f]/30 bg-[#1e3a5f]/5",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      className="text-left text-sm font-semibold text-[#1e3a5f]"
                      onClick={() =>
                        setSelectedFamily((cur) => (cur === f.name ? null : f.name))
                      }
                    >
                      {f.name}{" "}
                      <span className="font-normal text-slate-400">({f.count})</span>
                    </button>
                    <button
                      type="button"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-white"
                      onClick={() => {
                        const next = window.prompt("Renommer la famille :", f.name);
                        if (!next || next.trim() === f.name) return;
                        void post({
                          action: "renameFamily",
                          from: f.name,
                          to: next.trim(),
                        });
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {f.subFamilies.length > 0 ? (
                    <ul className="mt-2 space-y-1 border-l border-slate-200 pl-3">
                      {f.subFamilies.map((s) => (
                        <li
                          key={s.id}
                          className="flex items-center justify-between gap-2 text-[13px] text-slate-600"
                        >
                          <span>
                            {s.name}{" "}
                            <span className="text-slate-400">({s.count})</span>
                          </span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              className="text-[11px] text-[#1e3a5f]"
                              onClick={() => {
                                const next = window.prompt("Renommer la sous-famille :", s.name);
                                if (!next || next.trim() === s.name) return;
                                void post({
                                  action: "renameSubFamily",
                                  family: f.name,
                                  from: s.name,
                                  to: next.trim(),
                                });
                              }}
                            >
                              Renommer
                            </button>
                            <button
                              type="button"
                              className="text-[11px] text-[#1e3a5f]"
                              onClick={() => {
                                const toFamily = window.prompt(
                                  "Déplacer vers la famille :",
                                  f.name,
                                );
                                if (!toFamily?.trim() || toFamily.trim() === f.name) return;
                                void post({
                                  action: "moveSubFamily",
                                  fromFamily: f.name,
                                  toFamily: toFamily.trim(),
                                  subName: s.name,
                                });
                              }}
                            >
                              Déplacer
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {selectedFamily === f.name ? (
                    <div className="mt-2 flex gap-2">
                      <input
                        value={newSub}
                        onChange={(e) => setNewSub(e.target.value)}
                        placeholder="Nouvelle sous-famille…"
                        className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                      />
                      <button
                        type="button"
                        disabled={busy || !newSub.trim()}
                        onClick={() => {
                          void post({
                            action: "createSubFamily",
                            family: f.name,
                            name: newSub,
                          }).then(() => setNewSub(""));
                        }}
                        className="rounded-lg bg-[#1e3a5f] px-2 py-1.5 text-xs font-semibold text-white"
                      >
                        Ajouter
                      </button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          <p className="text-[11px] text-slate-400">
            Renommer met à jour tous les ouvrages concernés. Utilisez les actions groupées
            du tableau pour affecter plusieurs références d’un coup.
          </p>
        </div>
      </div>
    </div>
  );
}
