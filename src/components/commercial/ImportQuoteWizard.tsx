"use client";

import { Fragment, useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatMoneyFr } from "@/lib/commercial/import/french-number";
import type {
  ClientMatchOption,
  ImportedQuoteDraft,
} from "@/lib/commercial/import/types";

type ParseResponse = {
  draft?: ImportedQuoteDraft;
  clientMatches?: ClientMatchOption[];
  duplicate?: { quoteId: string; quoteNumber: string; href: string } | null;
  error?: string;
};

function ConfidenceDot({ c }: { c: "ok" | "warn" | "missing" }) {
  const label = c === "ok" ? "détecté" : c === "warn" ? "à vérifier" : "non trouvé";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-semibold",
        c === "ok" && "text-emerald-700",
        c === "warn" && "text-amber-700",
        c === "missing" && "text-slate-500",
      )}
      title={label}
    >
      {c === "ok" ? "✓" : c === "warn" ? "⚠" : "?"} {label}
    </span>
  );
}

export function ImportQuoteWizard() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<"upload" | "review">("upload");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [draft, setDraft] = useState<ImportedQuoteDraft | null>(null);
  const [matches, setMatches] = useState<ClientMatchOption[]>([]);
  const [duplicate, setDuplicate] = useState<ParseResponse["duplicate"]>(null);
  const [clientMode, setClientMode] = useState<"create" | "existing">("create");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const onFile = useCallback(async (file: File | null) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    setStatus("Lecture du document…");
    try {
      const fd = new FormData();
      fd.set("file", file);
      setStatus("Identification du client et des lignes…");
      const res = await fetch("/api/commercial/quotes/import/parse", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json()) as ParseResponse;
      if (!res.ok || !data.draft) {
        setError(
          data.error ||
            "Nous n’avons pas réussi à identifier correctement ce devis. Vous pouvez réessayer ou créer le devis manuellement.",
        );
        return;
      }
      setDraft(data.draft);
      setMatches(data.clientMatches ?? []);
      setDuplicate(data.duplicate ?? null);
      const best = data.clientMatches?.[0];
      if (best && best.score >= 70) {
        setClientMode("existing");
        setSelectedClientId(best.id);
      } else {
        setClientMode("create");
        setSelectedClientId(null);
      }
      setStep("review");
      setStatus(null);
    } catch {
      setError("Erreur réseau pendant l’analyse.");
    } finally {
      setBusy(false);
    }
  }, []);

  async function commit(force = false) {
    if (!draft) return;
    if (duplicate && !force) return;
    setBusy(true);
    setError(null);
    setStatus("Création du devis brouillon…");
    try {
      const res = await fetch("/api/commercial/quotes/import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft,
          clientExternalOrgId:
            clientMode === "existing" ? selectedClientId : null,
          createClientIfMissing: clientMode === "create",
          forceDuplicate: force,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        href?: string;
        error?: string;
      };
      if (!res.ok || !data.href) {
        setError(data.error || "Impossible de créer le devis.");
        return;
      }
      router.push(data.href);
    } catch {
      setError("Erreur réseau pendant la création.");
    } finally {
      setBusy(false);
      setStatus(null);
    }
  }

  if (step === "upload") {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div
          className={cn(
            "rounded-2xl border-2 border-dashed border-bework-navy/20 bg-white px-6 py-14 text-center shadow-sm transition",
            busy && "opacity-70",
          )}
          onDragOver={(e) => {
            e.preventDefault();
          }}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0] ?? null;
            void onFile(f);
          }}
        >
          <p className="text-[15px] font-semibold text-bework-navy">
            Importer un devis existant
          </p>
          <p className="mt-2 text-[13px] text-slate-500">
            Déposez votre fichier ici ou sélectionnez-le depuis votre ordinateur.
          </p>
          <p className="mt-1 text-[12px] text-slate-400">PDF · Excel · CSV — max 20 Mo</p>
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="mt-6 rounded-xl bg-[#1e3a5f] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            Choisir un fichier
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.xlsx,.xls,.csv,application/pdf"
            className="hidden"
            onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
          />
        </div>
        {status ? <p className="text-center text-[13px] text-slate-600">{status}</p> : null}
        {error ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-950">
            {error}
          </p>
        ) : null}
        <p className="text-center text-[12px] text-slate-500">
          Ou{" "}
          <Link href="/dashboard/devis-facturation/devis/nouveau" className="font-semibold text-bework-accent hover:underline">
            créer un devis manuellement
          </Link>
        </p>
      </div>
    );
  }

  if (!draft) return null;

  const lineCount = draft.sections.reduce((n, s) => n + s.lines.filter((l) => l.kind === "WORK").length, 0);
  const canCreate =
    !busy &&
    !draft.source.scannedPdf &&
    lineCount > 0 &&
    !(Boolean(duplicate) && true);

  async function commitWithGuards(force = false) {
    if (!draft) return;
    if (lineCount === 0) {
      setError(
        "Aucune ligne commerciale fiable — corrigez l’import ou créez le devis manuellement. Une clause juridique ne peut pas devenir un ouvrage.",
      );
      return;
    }
    if (!draft.flags.mathOk) {
      const ok = window.confirm(
        "La somme des lignes HT ne correspond pas au total HT du document. Créer quand même le brouillon pour correction manuelle ?",
      );
      if (!ok) return;
    } else if (draft.flags.discountAmbiguity) {
      const ok = window.confirm(
        "Des taux / remises ligne restent à confirmer. Créer le brouillon quand même ?",
      );
      if (!ok) return;
    }
    await commit(force);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-semibold text-bework-navy">
            Vérifiez votre devis importé
          </h2>
          <p className="mt-0.5 text-[13px] text-slate-500">
            Contrôlez puis créez un brouillon BeWork — rien n’est définitif.
          </p>
        </div>
        <button
          type="button"
          className="text-[13px] font-medium text-slate-500 hover:text-bework-navy"
          onClick={() => {
            setStep("upload");
            setDraft(null);
            setError(null);
          }}
        >
          ← Autre fichier
        </button>
      </div>

      {draft.source.scannedPdf ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-950">
          <p className="font-semibold">Ce document semble être un PDF numérisé.</p>
          <p className="mt-1">
            L’import automatique des documents scannés sera prochainement disponible.
            Vous pouvez conserver le fichier ou saisir le devis manuellement.
          </p>
        </div>
      ) : null}

      {duplicate ? (
        <div className="rounded-xl border border-bework-navy/15 bg-slate-50 px-4 py-3 text-[13px]">
          <p className="font-semibold text-bework-navy">
            Ce document semble avoir déjà été importé.
          </p>
          <p className="mt-1 text-slate-600">
            Devis existant : {duplicate.quoteNumber}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link
              href={duplicate.href}
              className="rounded-lg border border-bework-navy/20 px-3 py-1.5 text-[12px] font-semibold"
            >
              Ouvrir le devis
            </Link>
            <button
              type="button"
              disabled={busy || draft.source.scannedPdf || lineCount === 0}
              onClick={() => void commitWithGuards(true)}
              className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
            >
              Importer quand même
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 sm:col-span-2 lg:col-span-1">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Document</p>
          <p className="mt-0.5 truncate text-[13px] font-semibold text-bework-ink">{draft.source.fileName}</p>
        </div>
        <label className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Référence</span>
          <input
            className="mt-0.5 w-full rounded border border-transparent px-1 text-[14px] font-semibold text-bework-ink hover:border-slate-200 focus:border-bework-accent"
            value={draft.reference ?? ""}
            onChange={(e) =>
              setDraft((d) => (d ? { ...d, reference: e.target.value || null } : d))
            }
          />
        </label>
        <label className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Date</span>
          <input
            type="date"
            className="mt-0.5 w-full rounded border border-transparent px-1 text-[14px] font-semibold text-bework-ink hover:border-slate-200 focus:border-bework-accent"
            value={draft.issueDate ?? ""}
            onChange={(e) =>
              setDraft((d) => (d ? { ...d, issueDate: e.target.value || null } : d))
            }
          />
        </label>
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Lignes</p>
          <p className="mt-0.5 text-[14px] font-semibold text-bework-ink">{lineCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Total HT</p>
          <p className="mt-0.5 text-[14px] font-semibold text-bework-ink">
            {formatMoneyFr(draft.totals.totalHt)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">TVA</p>
          <p className="mt-0.5 text-[14px] font-semibold text-bework-ink">
            {formatMoneyFr(draft.totals.totalVat)}
            {draft.totals.vatRateGuess != null ? (
              <span className="ml-1 text-[11px] font-medium text-slate-500">
                ({draft.totals.vatRateGuess} %)
              </span>
            ) : null}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Total TTC</p>
          <p className="mt-0.5 text-[14px] font-semibold text-bework-ink">
            {formatMoneyFr(draft.totals.totalTtc)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Échéancier</p>
          <p className="mt-0.5 text-[14px] font-semibold text-bework-ink">
            {draft.paymentSchedule?.percents.map((p) => `${p} %`).join(" · ") || "—"}
          </p>
        </div>
      </div>

      <label className="block rounded-xl border border-slate-200 bg-white px-3 py-2.5">
        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Objet</span>
        <input
          className="mt-0.5 w-full rounded border border-transparent px-1 text-[14px] text-bework-ink hover:border-slate-200 focus:border-bework-accent"
          value={draft.subject ?? ""}
          onChange={(e) =>
            setDraft((d) => (d ? { ...d, subject: e.target.value || null } : d))
          }
        />
      </label>

      {!draft.flags.mathOk ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-950">
          <p className="font-semibold">Écart financier détecté</p>
          <p className="mt-1">
            La somme des lignes ne colle pas aux totaux du document. Corrigez avant création, ou
            confirmez explicitement.
          </p>
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[14px] font-semibold text-bework-navy">Client</h3>
          <ConfidenceDot c={draft.customer.confidence} />
        </div>
        <p className="mt-2 text-[14px] font-medium">
          {draft.customer.name ?? "Non détecté"}
        </p>
        <p className="text-[12px] text-slate-500">
          {[draft.customer.addressLine1, draft.customer.postalCode, draft.customer.city]
            .filter(Boolean)
            .join(", ") || "Adresse non détectée"}
        </p>
        <div className="mt-3 space-y-2 text-[13px]">
          <label className="flex items-start gap-2">
            <input
              type="radio"
              name="clientMode"
              checked={clientMode === "create"}
              onChange={() => setClientMode("create")}
              className="mt-1"
            />
            <span>
              Créer un nouveau client
              {draft.customer.name ? ` « ${draft.customer.name} »` : ""}
            </span>
          </label>
          {matches.map((m) => (
            <label key={m.id} className="flex items-start gap-2">
              <input
                type="radio"
                name="clientMode"
                checked={clientMode === "existing" && selectedClientId === m.id}
                onChange={() => {
                  setClientMode("existing");
                  setSelectedClientId(m.id);
                }}
                className="mt-1"
              />
              <span>
                Utiliser : {m.name}
                {m.city ? ` — ${m.city}` : ""}{" "}
                <span className="text-slate-400">({m.reason})</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      {draft.issuer.note ? (
        <p className="text-[12px] text-slate-500">{draft.issuer.note}</p>
      ) : null}

      {draft.warnings.length > 0 ? (
        <ul className="space-y-1 rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-[12px] text-amber-950">
          {draft.warnings.map((w) => (
            <li key={w}>⚠ {w}</li>
          ))}
        </ul>
      ) : null}

      <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-[13px]">
          <thead className="border-b border-slate-100 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2 font-semibold">Désignation</th>
              <th className="px-3 py-2 font-semibold">Qté</th>
              <th className="px-3 py-2 font-semibold">Unité</th>
              <th className="px-3 py-2 font-semibold">PU HT</th>
              <th className="px-3 py-2 font-semibold">Remise</th>
              <th className="px-3 py-2 font-semibold">HT</th>
              <th className="px-3 py-2 font-semibold">État</th>
            </tr>
          </thead>
          <tbody>
            {draft.sections.map((sec) => (
              <Fragment key={sec.id}>
                <tr className="bg-slate-50/80">
                  <td colSpan={7} className="px-3 py-2 text-[12px] font-bold text-bework-navy">
                    <input
                      className="w-full rounded border border-transparent bg-transparent px-1 font-bold hover:border-slate-200 focus:border-bework-accent"
                      value={sec.title}
                      onChange={(e) => {
                        const v = e.target.value;
                        setDraft((d) => {
                          if (!d) return d;
                          return {
                            ...d,
                            sections: d.sections.map((s) =>
                              s.id !== sec.id ? s : { ...s, title: v },
                            ),
                          };
                        });
                      }}
                    />
                  </td>
                </tr>
                {sec.lines.map((line, idx) => (
                  <tr key={line.id} className="border-t border-slate-50">
                    <td className="max-w-[280px] px-3 py-2">
                      <input
                        className="w-full rounded border border-transparent px-1 py-0.5 hover:border-slate-200 focus:border-bework-accent"
                        value={line.designation}
                        onChange={(e) => {
                          const v = e.target.value;
                          setDraft((d) => {
                            if (!d) return d;
                            return {
                              ...d,
                              sections: d.sections.map((s) =>
                                s.id !== sec.id
                                  ? s
                                  : {
                                      ...s,
                                      lines: s.lines.map((l, i) =>
                                        i === idx ? { ...l, designation: v } : l,
                                      ),
                                    },
                              ),
                            };
                          });
                        }}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="any"
                        className="w-16 rounded border border-transparent px-1 py-0.5 hover:border-slate-200"
                        value={line.quantity ?? ""}
                        onChange={(e) => {
                          const v = e.target.value === "" ? null : Number(e.target.value);
                          setDraft((d) => {
                            if (!d) return d;
                            return {
                              ...d,
                              sections: d.sections.map((s) =>
                                s.id !== sec.id
                                  ? s
                                  : {
                                      ...s,
                                      lines: s.lines.map((l, i) =>
                                        i === idx ? { ...l, quantity: v } : l,
                                      ),
                                    },
                              ),
                            };
                          });
                        }}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="w-16 rounded border border-transparent px-1"
                        value={line.unit ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setDraft((d) => {
                            if (!d) return d;
                            return {
                              ...d,
                              sections: d.sections.map((s) =>
                                s.id !== sec.id
                                  ? s
                                  : {
                                      ...s,
                                      lines: s.lines.map((l, i) =>
                                        i === idx ? { ...l, unit: v || null } : l,
                                      ),
                                    },
                              ),
                            };
                          });
                        }}
                      />
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      <input
                        type="number"
                        step="0.01"
                        className="w-24 rounded border border-transparent px-1"
                        value={line.unitSellHt ?? ""}
                        onChange={(e) => {
                          const v = e.target.value === "" ? null : Number(e.target.value);
                          setDraft((d) => {
                            if (!d) return d;
                            return {
                              ...d,
                              sections: d.sections.map((s) =>
                                s.id !== sec.id
                                  ? s
                                  : {
                                      ...s,
                                      lines: s.lines.map((l, i) =>
                                        i === idx ? { ...l, unitSellHt: v } : l,
                                      ),
                                    },
                              ),
                            };
                          });
                        }}
                      />
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      <input
                        type="number"
                        step="0.01"
                        className="w-16 rounded border border-transparent px-1"
                        value={line.discountPercent ?? ""}
                        onChange={(e) => {
                          const v = e.target.value === "" ? null : Number(e.target.value);
                          setDraft((d) => {
                            if (!d) return d;
                            return {
                              ...d,
                              sections: d.sections.map((s) =>
                                s.id !== sec.id
                                  ? s
                                  : {
                                      ...s,
                                      lines: s.lines.map((l, i) =>
                                        i === idx ? { ...l, discountPercent: v } : l,
                                      ),
                                    },
                              ),
                            };
                          });
                        }}
                      />
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      <input
                        type="number"
                        step="0.01"
                        className="w-24 rounded border border-transparent px-1"
                        value={line.lineSellHt ?? ""}
                        onChange={(e) => {
                          const v = e.target.value === "" ? null : Number(e.target.value);
                          setDraft((d) => {
                            if (!d) return d;
                            return {
                              ...d,
                              sections: d.sections.map((s) =>
                                s.id !== sec.id
                                  ? s
                                  : {
                                      ...s,
                                      lines: s.lines.map((l, i) =>
                                        i === idx ? { ...l, lineSellHt: v } : l,
                                      ),
                                    },
                              ),
                            };
                          });
                        }}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <ConfidenceDot c={line.confidence} />
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </section>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-900">
          {error}
        </p>
      ) : null}
      {status ? <p className="text-[13px] text-slate-600">{status}</p> : null}

      <div className="flex flex-wrap items-center justify-end gap-3">
        <Link
          href="/dashboard/devis-facturation/devis"
          className="text-[13px] font-medium text-slate-500 hover:text-bework-navy"
        >
          Annuler
        </Link>
        <button
          type="button"
          disabled={!canCreate || Boolean(duplicate)}
          onClick={() => void commitWithGuards(false)}
          className="rounded-xl bg-[#1e3a5f] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          Créer le devis dans BeWork
        </button>
      </div>
      {lineCount === 0 ? (
        <p className="text-right text-[12px] text-amber-800">
          Création bloquée : aucune ligne commerciale détectée.
        </p>
      ) : null}
      {duplicate ? (
        <p className="text-right text-[12px] text-slate-500">
          Un doublon a été détecté — utilisez « Importer quand même » ci-dessus.
        </p>
      ) : null}
    </div>
  );
}
