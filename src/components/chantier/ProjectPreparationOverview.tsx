"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarRange,
  ClipboardList,
  FileText,
  FolderKanban,
  Map,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Modal } from "@/components/ui/Modal";
import {
  codeFromScopeName,
  formatUnscopedHumanMessage,
  type CardStatusLabel,
  type ProjectWorkspace,
  type ScopeWorkspace,
  type UnscopedItem,
  type WorkspaceCard,
  type WorkspaceCardKind,
} from "@/lib/chantier/project-workspace";

const STATUS_TONE: Record<CardStatusLabel, string> = {
  "À jour": "bg-emerald-50 text-emerald-800 border-emerald-200/80",
  "À vérifier": "bg-amber-50 text-amber-900 border-amber-200/80",
  "À préparer": "bg-slate-100 text-slate-600 border-slate-200",
  "En cours": "bg-sky-50 text-sky-900 border-sky-200/80",
  "Action requise": "bg-amber-50 text-amber-900 border-amber-200/80",
  "Non démarré": "bg-slate-50 text-slate-500 border-slate-200",
};

const KIND_ICON: Record<WorkspaceCardKind, typeof Map> = {
  plan: Map,
  metre: ClipboardList,
  devis: FileText,
  planning: CalendarRange,
  suivi: FolderKanban,
};

export function ProjectPreparationOverview({
  workspace,
  canEdit = true,
}: {
  workspace: ProjectWorkspace;
  canEdit?: boolean;
}) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [classifyOpen, setClassifyOpen] = useState(false);
  const [createPrefill, setCreatePrefill] = useState("");

  const unscopedMsg = formatUnscopedHumanMessage(workspace.unscoped);
  const hasUnscoped = workspace.unscoped.items.length > 0;
  const totalReady = workspace.scopes.reduce((n, s) => n + s.progress.ready, 0);
  const totalSteps = workspace.scopes.reduce((n, s) => n + s.progress.total, 0);

  function openCreate(prefill?: string) {
    setCreatePrefill(prefill ?? "");
    setCreateOpen(true);
  }

  return (
    <section
      className={cn(
        "rounded-2xl border border-[#1e3a5f]/15 bg-white",
        "px-4 py-5 sm:px-6 sm:py-6",
        "shadow-[0_1px_2px_rgba(30,58,95,0.04)]",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold tracking-tight text-[#1e3a5f] sm:text-[18px]">
            Préparation & conduite de chantier
          </h2>
          <p className="mt-1 text-[13px] text-slate-600">
            Plans, métrés, devis, planning et suivi réunis au même endroit.
          </p>
        </div>
        {canEdit && workspace.scopes.length > 0 ? (
          <button
            type="button"
            onClick={() => openCreate()}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#1e3a5f]/20 bg-white px-3 py-2 text-[12.5px] font-semibold text-[#1e3a5f] transition hover:border-[#1e3a5f]/40 hover:bg-[#1e3a5f]/[0.03]"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Créer un périmètre
          </button>
        ) : null}
      </div>

      {workspace.scopes.length > 0 ? (
        <PreparationProgress
          ready={totalReady}
          total={totalSteps}
          scopes={workspace.scopes}
        />
      ) : null}

      {hasUnscoped ? (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-amber-200/80 bg-amber-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[13px] font-semibold text-amber-950">
              {workspace.unscoped.quotes === 1 &&
              workspace.unscoped.studies === 0 &&
              workspace.unscoped.schedulePlans === 0
                ? "1 devis à organiser"
                : workspace.unscoped.quotes > 1 &&
                    workspace.unscoped.studies === 0 &&
                    workspace.unscoped.schedulePlans === 0
                  ? `${workspace.unscoped.quotes} devis à organiser`
                  : `${workspace.unscoped.items.length} élément${workspace.unscoped.items.length > 1 ? "s" : ""} à organiser`}
            </p>
            {unscopedMsg ? (
              <p className="mt-0.5 text-[12.5px] text-amber-900/85">{unscopedMsg}</p>
            ) : null}
          </div>
          {canEdit ? (
            <button
              type="button"
              onClick={() => setClassifyOpen(true)}
              className="shrink-0 rounded-lg bg-[#1e3a5f] px-3.5 py-2 text-[12.5px] font-semibold text-white hover:bg-[#152a45]"
            >
              Classer {workspace.unscoped.items.length === 1 ? "maintenant" : "les éléments"}
            </button>
          ) : null}
        </div>
      ) : null}

      {workspace.scopes.length === 0 ? (
        <EmptyPreparationState
          canEdit={canEdit}
          hasUnscoped={hasUnscoped}
          onCreate={() =>
            openCreate(workspace.unscoped.items[0]?.suggestedScopeName ?? "")
          }
          onClassify={() => setClassifyOpen(true)}
        />
      ) : (
        <div className="mt-5 space-y-4">
          {workspace.scopes.map((scope) => (
            <ScopeBlock key={scope.id} scope={scope} />
          ))}
        </div>
      )}

      <CreateScopeModal
        open={createOpen}
        projectId={workspace.projectId}
        prefillName={createPrefill}
        onClose={() => setCreateOpen(false)}
        onDone={() => {
          setCreateOpen(false);
          router.refresh();
        }}
      />

      <ClassifyItemsModal
        open={classifyOpen}
        projectId={workspace.projectId}
        scopes={workspace.scopes}
        items={workspace.unscoped.items}
        onClose={() => setClassifyOpen(false)}
        onDone={() => {
          setClassifyOpen(false);
          router.refresh();
        }}
      />
    </section>
  );
}

function PreparationProgress({
  ready,
  total,
  scopes,
}: {
  ready: number;
  total: number;
  scopes: ScopeWorkspace[];
}) {
  const steps = useMemo(() => {
    if (scopes.length !== 1) return null;
    return scopes[0]!.cards.map((c) => ({
      label: c.label,
      ready: c.ready,
    }));
  }, [scopes]);

  return (
    <div className="mt-4 rounded-xl border border-slate-200/80 bg-slate-50/70 px-3.5 py-3">
      <p className="text-[12.5px] font-semibold text-slate-800">
        Préparation :{" "}
        <span className="tabular-nums text-[#1e3a5f]">
          {ready} / {total}
        </span>{" "}
        étape{total > 1 ? "s" : ""} structurée{total > 1 ? "s" : ""}
      </p>
      {steps ? (
        <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5">
          {steps.map((s) => (
            <li
              key={s.label}
              className={cn(
                "inline-flex items-center gap-1.5 text-[12px] font-medium",
                s.ready ? "text-emerald-800" : "text-slate-500",
              )}
            >
              <span aria-hidden>{s.ready ? "✓" : "○"}</span>
              {s.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function EmptyPreparationState({
  canEdit,
  hasUnscoped,
  onCreate,
  onClassify,
}: {
  canEdit: boolean;
  hasUnscoped: boolean;
  onCreate: () => void;
  onClassify: () => void;
}) {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-[#1e3a5f]/20 bg-[rgba(30,58,95,0.02)] px-5 py-8 text-center sm:px-8">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#1e3a5f]/70">
        Préparation du chantier
      </p>
      <p className="mt-2 text-[16px] font-semibold text-[#1e3a5f]">
        Aucun lot de travaux n’est encore défini.
      </p>
      <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-slate-600">
        Organisez ce chantier par périmètre pour regrouper les plans, métrés, devis et
        plannings.
      </p>
      {canEdit ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[#1e3a5f] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#152a45]"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Créer un périmètre
          </button>
          {hasUnscoped ? (
            <button
              type="button"
              onClick={onClassify}
              className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              Classer les éléments existants
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ScopeBlock({ scope }: { scope: ScopeWorkspace }) {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-slate-50/40 p-3.5 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-400">
            {scope.code}
          </p>
          <Link
            href={scope.href}
            className="text-[15px] font-semibold text-[#1e3a5f] hover:underline"
          >
            {scope.name}
          </Link>
          <p className="mt-0.5 text-[11.5px] text-slate-500">
            {scope.progress.ready}/{scope.progress.total} étapes prêtes
          </p>
        </div>
        <Link
          href={scope.href}
          className="rounded-lg border border-[#1e3a5f]/15 bg-white px-3 py-1.5 text-[12px] font-semibold text-[#1e3a5f] transition hover:border-[#1e3a5f]/35"
        >
          Ouvrir
        </Link>
      </div>

      {scope.alerts.filter((a) => a.level === "warning").length ? (
        <ul className="mt-2 space-y-1">
          {scope.alerts
            .filter((a) => a.level === "warning")
            .map((a) => (
              <li
                key={a.message}
                className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-[12px] text-amber-950"
              >
                {a.message}
              </li>
            ))}
        </ul>
      ) : null}

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {scope.cards.map((card) => (
          <PrepCard key={card.kind} card={card} />
        ))}
      </div>
    </div>
  );
}

function PrepCard({ card }: { card: WorkspaceCard }) {
  const Icon = KIND_ICON[card.kind];
  const interactive = !!card.href;
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#1e3a5f]/[0.06] text-[#1e3a5f]">
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
            STATUS_TONE[card.statusLabel],
          )}
          title={card.syncHint ?? undefined}
        >
          {card.statusLabel}
        </span>
      </div>
      <p className="mt-2.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-slate-400">
        {card.label}
      </p>
      <p className="mt-0.5 text-[13px] font-semibold leading-snug text-slate-900 line-clamp-2">
        {card.title}
      </p>
      {card.detail ? (
        <p className="mt-1 text-[11.5px] leading-snug text-slate-500 line-clamp-2">
          {card.detail}
        </p>
      ) : null}
      <span
        className={cn(
          "mt-3 inline-flex text-[12px] font-semibold",
          card.ready ? "text-[#1d4ed8]" : "text-[#1e3a5f]",
        )}
      >
        {card.actionLabel}
        {interactive ? " →" : ""}
      </span>
    </>
  );

  const cls = cn(
    "rounded-xl border border-slate-200/90 bg-white p-3",
    "transition duration-150",
    "motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-[#1e3a5f]/30 motion-safe:hover:shadow-sm",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e3a5f]",
    !card.ready && "border-dashed bg-slate-50/60",
  );

  if (card.href) {
    return (
      <Link href={card.href} className={cls}>
        {body}
      </Link>
    );
  }
  return <div className={cn(cls, "opacity-90")}>{body}</div>;
}

function CreateScopeModal({
  open,
  projectId,
  prefillName,
  onClose,
  onDone,
}: {
  open: boolean;
  projectId: string;
  prefillName: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [name, setName] = useState(prefillName);
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(prefillName);
    setCode(prefillName ? codeFromScopeName(prefillName) : "");
    setDescription("");
    setError(null);
  }, [open, prefillName]);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/projets/${projectId}/scopes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim() || undefined,
          description: description.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Création impossible");
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Créer un périmètre"
      description="Ex. Fondations, Installation électrique, VRD, Maçonnerie…"
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-2 text-[13px] font-medium text-slate-700"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={busy || !name.trim()}
            onClick={() => void submit()}
            className="rounded-lg bg-[#1e3a5f] px-3.5 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Création…" : "Créer"}
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        <label className="block text-[12.5px] font-medium text-slate-700">
          Nom du périmètre
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!code || code === codeFromScopeName(name)) {
                setCode(codeFromScopeName(e.target.value));
              }
            }}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[14px] outline-none focus:border-[#1e3a5f]/40"
            placeholder="Fondations"
            autoFocus
          />
        </label>
        <label className="block text-[12.5px] font-medium text-slate-700">
          Code (facultatif)
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[14px] outline-none focus:border-[#1e3a5f]/40"
            placeholder="FOND"
          />
        </label>
        <label className="block text-[12.5px] font-medium text-slate-700">
          Description (facultatif)
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[14px] outline-none focus:border-[#1e3a5f]/40"
            placeholder="Lot fondations superficielles…"
          />
        </label>
        {error ? <p className="text-[12.5px] text-red-700">{error}</p> : null}
      </div>
    </Modal>
  );
}

function ClassifyItemsModal({
  open,
  projectId,
  scopes,
  items,
  onClose,
  onDone,
}: {
  open: boolean;
  projectId: string;
  scopes: ScopeWorkspace[];
  items: UnscopedItem[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [mode, setMode] = useState<"existing" | "create">(
    scopes.length > 0 ? "existing" : "create",
  );
  const [scopeId, setScopeId] = useState(scopes[0]?.id ?? "");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [referenceQuoteId, setReferenceQuoteId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedQuotes = items.filter(
    (i) => i.kind === "quote" && selected.has(`${i.kind}:${i.id}`),
  );

  useEffect(() => {
    if (!open) return;
    setSelected(new Set(items.map((i) => `${i.kind}:${i.id}`)));
    setMode(scopes.length > 0 ? "existing" : "create");
    setScopeId(scopes[0]?.id ?? "");
    const suggestion =
      items.find((i) => i.suggestedScopeName)?.suggestedScopeName ?? "";
    setName(suggestion);
    setCode(suggestion ? codeFromScopeName(suggestion) : "");
    const firstQuote = items.find((i) => i.kind === "quote");
    setReferenceQuoteId(firstQuote?.id ?? "");
    setError(null);
  }, [open, items, scopes]);

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const payloadItems = items
        .filter((i) => selected.has(`${i.kind}:${i.id}`))
        .map((i) => ({ kind: i.kind, id: i.id }));
      if (payloadItems.length === 0) {
        throw new Error("Sélectionnez au moins un élément");
      }
      const refId =
        referenceQuoteId &&
        payloadItems.some((i) => i.kind === "quote" && i.id === referenceQuoteId)
          ? referenceQuoteId
          : undefined;
      const res = await fetch(`/api/projets/${projectId}/scopes/classify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "create"
            ? {
                createScope: {
                  name: name.trim(),
                  code: code.trim() || undefined,
                },
                items: payloadItems,
                referenceQuoteId: refId,
              }
            : { scopeId, items: payloadItems, referenceQuoteId: refId },
        ),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Classement impossible");
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Classer les éléments"
      description="Rattachez explicitement les devis, métrés ou plannings à un lot de travaux."
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-2 text-[13px] font-medium text-slate-700"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={busy || selected.size === 0}
            onClick={() => void submit()}
            className="rounded-lg bg-[#1e3a5f] px-3.5 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Enregistrement…" : "Classer"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          {items.map((item) => {
            const key = `${item.kind}:${item.id}`;
            const kindLabel =
              item.kind === "quote"
                ? "Devis"
                : item.kind === "study"
                  ? "Métré"
                  : "Planning";
            return (
              <li key={key}>
                <label className="flex cursor-pointer items-start gap-3 px-3 py-2.5 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={selected.has(key)}
                    onChange={() => toggle(key)}
                    className="mt-1"
                  />
                  <span className="min-w-0">
                    <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      {kindLabel}
                    </span>
                    <span className="block text-[13.5px] font-semibold text-slate-900">
                      {item.label}
                    </span>
                    {item.detail ? (
                      <span className="block text-[12px] text-slate-500">{item.detail}</span>
                    ) : null}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-wrap gap-2">
          {scopes.length > 0 ? (
            <button
              type="button"
              onClick={() => setMode("existing")}
              className={cn(
                "rounded-full px-3 py-1.5 text-[12px] font-semibold",
                mode === "existing"
                  ? "bg-[#1e3a5f] text-white"
                  : "border border-slate-200 text-slate-700",
              )}
            >
              Lot existant
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setMode("create")}
            className={cn(
              "rounded-full px-3 py-1.5 text-[12px] font-semibold",
              mode === "create"
                ? "bg-[#1e3a5f] text-white"
                : "border border-slate-200 text-slate-700",
            )}
          >
            Nouveau lot
          </button>
        </div>

        {mode === "existing" && scopes.length > 0 ? (
          <label className="block text-[12.5px] font-medium text-slate-700">
            Périmètre
            <select
              value={scopeId}
              onChange={(e) => setScopeId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[14px]"
            >
              {scopes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-[12.5px] font-medium text-slate-700 sm:col-span-2">
              Nom du nouveau lot
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setCode(codeFromScopeName(e.target.value));
                }}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[14px]"
                placeholder="Installation électrique"
              />
            </label>
            <label className="block text-[12.5px] font-medium text-slate-700">
              Code
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[14px]"
              />
            </label>
          </div>
        )}

        {selectedQuotes.length > 0 ? (
          <label className="block text-[12.5px] font-medium text-slate-700">
            Devis de référence (facultatif)
            <select
              value={
                selectedQuotes.some((q) => q.id === referenceQuoteId)
                  ? referenceQuoteId
                  : selectedQuotes[0]?.id ?? ""
              }
              onChange={(e) => setReferenceQuoteId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[14px]"
            >
              {selectedQuotes.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.label}
                  {q.detail ? ` — ${q.detail}` : ""}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-[11.5px] font-normal text-slate-500">
              Les autres devis restent rattachés au même lot.
            </span>
          </label>
        ) : null}

        {error ? <p className="text-[12.5px] text-red-700">{error}</p> : null}
      </div>
    </Modal>
  );
}
