"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { roundMoney } from "@/lib/commercial/money";
import type { BeworkQuoteBundleV1 } from "@/lib/commercial/chatgpt-bundle/types";
import type {
  BundleImportPreview,
  BundleImportSelection,
} from "@/lib/commercial/chatgpt-bundle/commit";

function fmtMoney(n: number) {
  return roundMoney(n, 2).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

type ParseError = { path: string; message: string };

type Props = {
  quoteId: string;
  open: boolean;
  hasExistingLines: boolean;
  onClose: () => void;
  onImported: (info: { canUndo: boolean }) => void;
};

type Step = "paste" | "preview";

export function ChatGptBundleImportModal({
  quoteId,
  open,
  hasExistingLines,
  onClose,
  onImported,
}: Props) {
  const [step, setStep] = useState<Step>("paste");
  const [rawText, setRawText] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<ParseError[]>([]);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const [bundle, setBundle] = useState<BeworkQuoteBundleV1 | null>(null);
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [preview, setPreview] = useState<BundleImportPreview | null>(null);

  const [sel, setSel] = useState({
    importClient: true,
    importSite: true,
    importPricing: true,
    importAdvice: true,
    importReservations: true,
    importInternalNotes: true,
    importWorkStages: true,
    importMediaManifest: true,
  });
  const [pricingMode, setPricingMode] = useState<"ADD" | "REPLACE">("ADD");
  const [clientChoice, setClientChoice] = useState<"match" | "new" | "skip">(
    "new",
  );
  const [matchedClientId, setMatchedClientId] = useState<string | null>(null);
  const [primaryEmail, setPrimaryEmail] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [forceDuplicate, setForceDuplicate] = useState(false);
  const [mediaBusyKey, setMediaBusyKey] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, busy]);

  const resetToPaste = useCallback(() => {
    setStep("paste");
    setErrors([]);
    setErrorBanner(null);
    setBundle(null);
    setFingerprint(null);
    setPreview(null);
    setForceDuplicate(false);
  }, []);

  async function analyze() {
    setBusy(true);
    setErrors([]);
    setErrorBanner(null);
    try {
      const res = await fetch(
        `/api/commercial/quotes/${quoteId}/chatgpt-bundle/parse`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rawText }),
        },
      );
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorBanner(data.error || "Le dossier n’a pas pu être interprété.");
        setErrors(Array.isArray(data.errors) ? data.errors : []);
        return;
      }
      const b = data.bundle as BeworkQuoteBundleV1;
      const p = data.preview as BundleImportPreview;
      setBundle(b);
      setFingerprint(data.fingerprint as string);
      setPreview(p);
      setPrimaryEmail(b.client.emails.find((e) => e.role === "primary")?.email ?? b.client.emails[0]?.email ?? null);
      const best = p.clientMatches[0];
      if (best && best.score >= 70) {
        setClientChoice("match");
        setMatchedClientId(best.id);
      } else {
        setClientChoice("new");
        setMatchedClientId(null);
      }
      setProjectId(p.projectMatches[0]?.id ?? null);
      setPricingMode(hasExistingLines ? "ADD" : "ADD");
      setStep("preview");
    } catch {
      setErrorBanner("Le dossier n’a pas pu être interprété.");
    } finally {
      setBusy(false);
    }
  }

  function patchLine(
    si: number,
    li: number,
    patch: Partial<BeworkQuoteBundleV1["sections"][0]["items"][0]>,
  ) {
    setBundle((cur) => {
      if (!cur) return cur;
      const sections = cur.sections.map((sec, i) => {
        if (i !== si) return sec;
        return {
          ...sec,
          items: sec.items.map((it, j) => (j === li ? { ...it, ...patch } : it)),
        };
      });
      return { ...cur, sections };
    });
  }

  const liveTotals = useMemo(() => {
    if (!bundle) return null;
    const defaultVat = bundle.quote.vatSuggestedRate ?? 20;
    let totalHt = 0;
    let totalVat = 0;
    let lineCount = 0;
    for (const sec of bundle.sections) {
      for (const it of sec.items) {
        lineCount += 1;
        const disc = it.discountPercent ?? 0;
        const ht = roundMoney(it.quantity * it.unitPriceHt * (1 - disc / 100), 2);
        const vat = roundMoney(ht * ((it.vatRate ?? defaultVat) / 100), 2);
        totalHt += ht;
        totalVat += vat;
      }
    }
    return {
      lineCount,
      totalHt: roundMoney(totalHt, 2),
      totalTtc: roundMoney(totalHt + totalVat, 2),
    };
  }, [bundle]);

  async function uploadMedia(key: string, file: File) {
    setMediaBusyKey(key);
    try {
      const fd = new FormData();
      fd.set("key", key);
      fd.set("file", file);
      const res = await fetch(
        `/api/commercial/quotes/${quoteId}/chatgpt-bundle/media`,
        { method: "POST", body: fd },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload échoué");
      setBundle((cur) => {
        if (!cur) return cur;
        return {
          ...cur,
          mediaManifest: cur.mediaManifest.map((m) =>
            m.key === key
              ? {
                  ...m,
                  storageKey: data.storageKey as string,
                  fileName: data.fileName as string,
                }
              : m,
          ),
        };
      });
    } catch (e) {
      setErrorBanner(e instanceof Error ? e.message : "Upload échoué");
    } finally {
      setMediaBusyKey(null);
    }
  }

  async function commit() {
    if (!bundle || !fingerprint) return;
    if (preview?.alreadyImported && !forceDuplicate) {
      setErrorBanner(
        "Ce dossier semble avoir déjà été importé. Confirmez « Importer quand même ».",
      );
      return;
    }
    setBusy(true);
    setErrorBanner(null);
    try {
      const selection: BundleImportSelection = {
        ...sel,
        pricingMode,
        clientExternalOrgId:
          sel.importClient && clientChoice === "match" ? matchedClientId : null,
        createClientIfMissing: sel.importClient && clientChoice === "new",
        primaryEmailOverride: primaryEmail,
        projectId: sel.importSite ? projectId : null,
        forceDuplicate,
      };
      const res = await fetch(
        `/api/commercial/quotes/${quoteId}/chatgpt-bundle/commit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bundle,
            originalFingerprint: fingerprint,
            selection,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorBanner(data.error || "Échec de l’import");
        return;
      }
      onImported({ canUndo: Boolean(data.createdLineIds?.length) });
      onClose();
    } catch {
      setErrorBanner("Échec de l’import");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Fermer"
        className="fixed inset-0 z-40 bg-slate-900/35"
        onClick={() => !busy && onClose()}
      />
      <div className="fixed left-1/2 top-[4vh] z-50 flex max-h-[92vh] w-[min(100%-1.5rem,42rem)] -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-bold text-[#1e3a5f]">
                Importer un dossier depuis ChatGPT
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Collez le bloc généré après votre analyse de chantier. BeWork
                détectera le client, le chantier, le chiffrage et les
                informations techniques.
              </p>
            </div>
            <button
              type="button"
              onClick={() => !busy && onClose()}
              className="text-sm text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {errorBanner ? (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
              {errorBanner}
              {errors.length > 0 ? (
                <ul className="mt-1 list-disc pl-4">
                  {errors.slice(0, 6).map((e, i) => (
                    <li key={`${e.path}-${i}`}>
                      {e.path !== "root" ? (
                        <span className="font-mono text-[10px]">{e.path}</span>
                      ) : null}{" "}
                      {e.message}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {step === "paste" ? (
            <div className="space-y-3">
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={14}
                placeholder="Collez ici le bloc BeWork généré par ChatGPT…"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3 font-mono text-xs leading-relaxed text-slate-800 outline-none ring-[#1e3a5f] focus:bg-white focus:ring-2"
              />
              <button
                type="button"
                onClick={() => setHelpOpen((v) => !v)}
                className="text-[11px] text-slate-500 underline-offset-2 hover:underline"
              >
                Comment demander le bon format à ChatGPT ?
              </button>
              {helpOpen ? (
                <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  Après votre échange, demandez :{" "}
                  <span className="font-semibold text-[#1e3a5f]">
                    Génère le bloc BeWork.
                  </span>
                </p>
              ) : null}
            </div>
          ) : preview && bundle ? (
            <div className="space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Dossier détecté
              </p>

              {preview.alreadyImported ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  Ce dossier semble avoir déjà été importé.
                  <label className="mt-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={forceDuplicate}
                      onChange={(e) => setForceDuplicate(e.target.checked)}
                    />
                    Importer quand même
                  </label>
                </div>
              ) : null}

              {preview.warnings.length > 0 ? (
                <div className="rounded-lg border border-amber-100 bg-amber-50/70 px-3 py-2 text-xs text-amber-950">
                  <p className="font-semibold">À vérifier avant envoi</p>
                  <ul className="mt-1 space-y-0.5">
                    {preview.warnings.slice(0, 8).map((w) => (
                      <li key={w}>{w.startsWith("⚠") ? w : `⚠ ${w}`}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <CategoryCard
                title="Client"
                checked={sel.importClient}
                onToggle={(v) => setSel((s) => ({ ...s, importClient: v }))}
              >
                <p className="font-semibold text-slate-900">{preview.clientName}</p>
                {preview.clientPhone ? (
                  <p className="text-slate-600">{preview.clientPhone}</p>
                ) : null}
                {preview.clientEmails.map((em) => (
                  <p key={em} className="text-slate-600">
                    {em}
                  </p>
                ))}
                {preview.clientAddress ? (
                  <p className="text-slate-600">{preview.clientAddress}</p>
                ) : null}

                {preview.clientEmails.length > 1 ? (
                  <div className="mt-2">
                    <p className="text-[10px] font-bold uppercase text-slate-400">
                      Email principal
                    </p>
                    <select
                      value={primaryEmail ?? ""}
                      onChange={(e) => setPrimaryEmail(e.target.value || null)}
                      className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs"
                    >
                      {preview.clientEmails.map((em) => (
                        <option key={em} value={em}>
                          Utiliser comme email principal — {em}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                {preview.clientMatches.length > 0 ? (
                  <div className="mt-2 rounded-md border border-slate-200 bg-white px-2 py-2">
                    <p className="text-[11px] font-semibold text-[#1e3a5f]">
                      Client existant détecté
                    </p>
                    <p className="text-xs text-slate-700">
                      {preview.clientMatches[0]!.name}{" "}
                      <span className="text-slate-400">
                        ({preview.clientMatches[0]!.reason})
                      </span>
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setClientChoice("match");
                          setMatchedClientId(preview.clientMatches[0]!.id);
                        }}
                        className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${
                          clientChoice === "match"
                            ? "bg-[#1e3a5f] text-white"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        Utiliser ce client
                      </button>
                      <button
                        type="button"
                        onClick={() => setClientChoice("new")}
                        className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${
                          clientChoice === "new"
                            ? "bg-[#1e3a5f] text-white"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        Créer un nouveau client
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-[11px] text-slate-500">
                    Aucun doublon détecté — un nouveau client pourra être créé.
                  </p>
                )}
              </CategoryCard>

              <CategoryCard
                title="Chantier"
                checked={sel.importSite}
                onToggle={(v) => setSel((s) => ({ ...s, importSite: v }))}
              >
                <p className="text-slate-700">{preview.siteLabel || "—"}</p>
                {preview.projectMatches.length > 0 ? (
                  <div className="mt-2">
                    <p className="text-[10px] font-bold uppercase text-slate-400">
                      Chantier existant ?
                    </p>
                    <select
                      value={projectId ?? ""}
                      onChange={(e) => setProjectId(e.target.value || null)}
                      className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs"
                    >
                      <option value="">Créer / adresse seule (pas de rattachement)</option>
                      {preview.projectMatches.map((p) => (
                        <option key={p.id} value={p.id}>
                          Rattacher — {p.title}
                          {p.city ? ` (${p.city})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
              </CategoryCard>

              <CategoryCard
                title="Chiffrage"
                checked={sel.importPricing}
                onToggle={(v) => setSel((s) => ({ ...s, importPricing: v }))}
              >
                <p className="text-slate-700">
                  {liveTotals?.lineCount ?? preview.lineCount} lignes · Total HT
                  recalculé :{" "}
                  <span className="font-semibold">
                    {fmtMoney(liveTotals?.totalHt ?? preview.totalHt)} €
                  </span>
                </p>
                {preview.vatSuggestedRate != null ? (
                  <p className="mt-1 text-[11px] text-amber-800">
                    TVA proposée : {preview.vatSuggestedRate} %
                    {preview.vatRequiresConfirmation ? " — à confirmer" : ""}
                  </p>
                ) : null}
                {hasExistingLines && sel.importPricing ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPricingMode("ADD")}
                      className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${
                        pricingMode === "ADD"
                          ? "bg-[#1e3a5f] text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      Ajouter au devis actuel
                    </button>
                    <button
                      type="button"
                      onClick={() => setPricingMode("REPLACE")}
                      className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${
                        pricingMode === "REPLACE"
                          ? "bg-[#1e3a5f] text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      Remplacer le chiffrage
                    </button>
                  </div>
                ) : null}

                <div className="mt-3 space-y-3">
                  {bundle.sections.map((sec, si) => (
                    <div key={`${sec.title}-${si}`}>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        {sec.title}
                      </p>
                      <ul className="mt-1 space-y-2">
                        {sec.items.map((it, li) => (
                          <li
                            key={`${si}-${li}`}
                            className="rounded-lg border border-slate-100 bg-slate-50/80 p-2"
                          >
                            <input
                              value={it.designation}
                              onChange={(e) =>
                                patchLine(si, li, {
                                  designation: e.target.value,
                                })
                              }
                              className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs font-medium"
                            />
                            <textarea
                              value={it.description ?? ""}
                              onChange={(e) =>
                                patchLine(si, li, {
                                  description: e.target.value || null,
                                })
                              }
                              rows={2}
                              placeholder="Description technique"
                              className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-600"
                            />
                            <div className="mt-1 grid grid-cols-4 gap-1">
                              <input
                                type="number"
                                step="any"
                                value={it.quantity}
                                onChange={(e) =>
                                  patchLine(si, li, {
                                    quantity: Number(e.target.value) || 0,
                                  })
                                }
                                className="rounded border border-slate-200 px-1.5 py-1 text-[11px]"
                                title="Quantité"
                              />
                              <input
                                value={it.unit}
                                onChange={(e) =>
                                  patchLine(si, li, { unit: e.target.value })
                                }
                                className="rounded border border-slate-200 px-1.5 py-1 text-[11px]"
                                title="Unité"
                              />
                              <input
                                type="number"
                                step="any"
                                value={it.unitPriceHt}
                                onChange={(e) =>
                                  patchLine(si, li, {
                                    unitPriceHt: Number(e.target.value) || 0,
                                  })
                                }
                                className="rounded border border-slate-200 px-1.5 py-1 text-[11px]"
                                title="PU HT"
                              />
                              <input
                                type="number"
                                step="any"
                                value={it.vatRate ?? bundle.quote.vatSuggestedRate ?? 20}
                                onChange={(e) =>
                                  patchLine(si, li, {
                                    vatRate: Number(e.target.value) || 0,
                                  })
                                }
                                className="rounded border border-slate-200 px-1.5 py-1 text-[11px]"
                                title="TVA %"
                              />
                            </div>
                            <p className="mt-1 text-right text-[11px] font-semibold text-slate-700">
                              {fmtMoney(
                                it.quantity *
                                  it.unitPriceHt *
                                  (1 - (it.discountPercent ?? 0) / 100),
                              )}{" "}
                              € HT
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CategoryCard>

              <CategoryCard
                title={`Conseils · ${preview.adviceCount}`}
                checked={sel.importAdvice}
                onToggle={(v) => setSel((s) => ({ ...s, importAdvice: v }))}
              >
                <ul className="space-y-1 text-xs text-slate-600">
                  {bundle.clientAdvice.map((a, i) => (
                    <li key={i}>{a.title ? `${a.title} — ${a.content}` : a.content}</li>
                  ))}
                  {bundle.quote.description ? (
                    <li className="italic">{bundle.quote.description}</li>
                  ) : null}
                </ul>
              </CategoryCard>

              <CategoryCard
                title={`Réserves · ${preview.reservationsCount}`}
                checked={sel.importReservations}
                onToggle={(v) =>
                  setSel((s) => ({ ...s, importReservations: v }))
                }
              >
                <ul className="space-y-1 text-xs text-slate-600">
                  {bundle.reservations.map((r, i) => (
                    <li key={i}>{r.content}</li>
                  ))}
                </ul>
              </CategoryCard>

              <CategoryCard
                title={`Notes internes · ${preview.internalNotesCount}`}
                checked={sel.importInternalNotes}
                onToggle={(v) =>
                  setSel((s) => ({ ...s, importInternalNotes: v }))
                }
              >
                <p className="text-[11px] text-slate-500">
                  Strictement internes — jamais sur le PDF client.
                </p>
                <ul className="mt-1 space-y-1 text-xs text-slate-600">
                  {bundle.internalNotes.map((n, i) => (
                    <li key={i}>{n.content}</li>
                  ))}
                </ul>
              </CategoryCard>

              <CategoryCard
                title={`Étapes du projet · ${preview.workStagesCount}`}
                checked={sel.importWorkStages}
                onToggle={(v) =>
                  setSel((s) => ({ ...s, importWorkStages: v }))
                }
              >
                <ol className="space-y-1 text-xs text-slate-700">
                  {bundle.workStages.map((s) => (
                    <li key={s.order}>
                      <span className="font-semibold">
                        {String(s.order).padStart(2, "0")}
                      </span>{" "}
                      {s.title}
                    </li>
                  ))}
                </ol>
              </CategoryCard>

              <CategoryCard
                title={`Visuels · ${preview.mediaCount}`}
                checked={sel.importMediaManifest}
                onToggle={(v) =>
                  setSel((s) => ({ ...s, importMediaManifest: v }))
                }
              >
                <div className="space-y-2">
                  {bundle.mediaManifest.map((m) => (
                    <div
                      key={m.key}
                      className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const f = e.dataTransfer.files?.[0];
                        if (f) void uploadMedia(m.key, f);
                      }}
                    >
                      <p className="text-xs font-semibold text-slate-800">
                        {m.label}
                      </p>
                      {m.type === "ai_preview" ? (
                        <p className="mt-0.5 text-[10px] text-slate-500">
                          {m.disclaimer ||
                            "Illustration non contractuelle — aperçu indicatif."}
                        </p>
                      ) : null}
                      {m.fileName ? (
                        <p className="mt-1 text-[11px] text-emerald-700">
                          Associé : {m.fileName}
                        </p>
                      ) : (
                        <label className="mt-2 inline-flex cursor-pointer rounded-md bg-white px-2.5 py-1 text-[11px] font-semibold text-[#1e3a5f] ring-1 ring-slate-200">
                          {mediaBusyKey === m.key
                            ? "Envoi…"
                            : "Déposer une image"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={mediaBusyKey === m.key}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) void uploadMedia(m.key, f);
                            }}
                          />
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </CategoryCard>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-5 py-3">
          {step === "preview" ? (
            <button
              type="button"
              disabled={busy}
              onClick={resetToPaste}
              className="text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              ← Modifier le collage
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Annuler
            </button>
            {step === "paste" ? (
              <button
                type="button"
                disabled={busy || !rawText.trim()}
                onClick={() => void analyze()}
                className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {busy ? "Analyse…" : "Analyser le dossier"}
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => void commit()}
                className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {busy ? "Import…" : "Importer le dossier"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function CategoryCard({
  title,
  checked,
  onToggle,
  children,
}: {
  title: string;
  checked: boolean;
  onToggle: (v: boolean) => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3">
      <label className="mb-2 flex items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onToggle(e.target.checked)}
          className="rounded border-slate-300"
        />
        <span className="text-xs font-bold uppercase tracking-wide text-[#1e3a5f]">
          {title}
        </span>
      </label>
      {checked ? <div className="text-xs">{children}</div> : (
        <p className="text-[11px] text-slate-400">Non importé</p>
      )}
    </section>
  );
}
