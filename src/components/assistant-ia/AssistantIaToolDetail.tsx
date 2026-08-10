import {
  ClipboardList,
  FileSearch,
  FolderOpen,
  GitCompare,
  ListChecks,
  PackageCheck,
  PenLine,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import { ContextBackButton } from "@/components/ui/ContextBackButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { AssistantIaActivateButton } from "@/components/assistant-ia/AssistantIaActivateButton";
import type { AssistantIaTool } from "@/lib/assistant-ia/tools";
import type { AIProviderStatus } from "@/lib/assistant-ia/status";
import { cn } from "@/lib/cn";

const TOOL_ICONS: Record<AssistantIaTool["icon"], LucideIcon> = {
  FileSearch,
  ListChecks,
  ShieldAlert,
  GitCompare,
  FolderOpen,
  ClipboardList,
  PackageCheck,
  PenLine,
};

export function AssistantIaToolDetail({
  tool,
  status,
}: {
  tool: AssistantIaTool;
  status: AIProviderStatus;
}) {
  const Icon = TOOL_ICONS[tool.icon];
  const isMarchePrive = tool.id === "analyser-marche-prive";
  const extractTitle = isMarchePrive
    ? "Ce que BeWork pourra extraire"
    : "Ce que cet outil pourra faire";

  return (
    <div className="mx-auto max-w-3xl space-y-7" data-testid="assistant-ia-tool-detail">
      <ContextBackButton fallbackHref="/dashboard/assistant-ia" label="Assistant IA" />

      <PageHeader
        title={
          <span className="inline-flex flex-wrap items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1e3a5f]/[0.06] text-[#1e3a5f]">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            {tool.title}
          </span>
        }
        description={
          isMarchePrive
            ? "Sélectionnez les pièces du marché que vous souhaitez analyser."
            : tool.description
        }
        actions={
          <span className="rounded-full bg-slate-100/90 px-3 py-1 text-[11px] font-medium text-slate-500">
            {status.statusLabel}
          </span>
        }
      />

      {tool.id === "risques-marche" ? (
        <p className="rounded-xl bg-slate-50 px-4 py-3 text-[13px] leading-relaxed text-slate-500">
          Affichage en <span className="font-medium text-slate-700">points à examiner</span> —
          assistance BeWork, pas un avis juridique définitif.
        </p>
      ) : null}

      <section
        className={cn(
          "rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6",
          "shadow-[0_1px_2px_rgba(15,23,42,0.03)]",
        )}
      >
        <h2 className="text-sm font-semibold tracking-tight text-slate-900">{extractTitle}</h2>
        <ul className="mt-3 space-y-2.5">
          {tool.capabilities.map((c) => (
            <li key={c} className="flex gap-2.5 text-sm leading-relaxed text-slate-600">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1e3a5f]/50" aria-hidden />
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <h2 className="text-sm font-semibold tracking-tight text-slate-900">Sources</h2>
        <p className="mt-1 text-xs text-slate-500">
          Exemples pour marchés privés et chantier — sélection explicite, aucune lecture automatique
          de toute l’entreprise.
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {tool.sources.map((s) => (
            <li
              key={s}
              className="rounded-full border border-slate-200/90 bg-slate-50 px-3 py-1 text-[12px] text-slate-600"
            >
              {s}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <h2 className="text-sm font-semibold tracking-tight text-slate-900">Comment ça marchera</h2>
        <ol className="mt-4 space-y-3">
          {tool.workflow.map((step, i) => (
            <li key={step} className="flex gap-3 text-sm text-slate-600">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1e3a5f]/[0.07] text-xs font-semibold text-[#1e3a5f]">
                {i + 1}
              </span>
              <span className="pt-1 leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-5 sm:p-6">
        <h2 className="text-sm font-semibold tracking-tight text-slate-800">
          Pourra devenir dans BeWork
        </h2>
        <p className="mt-1 text-xs text-slate-500">Aperçu — aucune création réelle pour l’instant.</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {tool.futureActions.map((a) => (
            <li
              key={a}
              className="rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 text-[12px] font-medium text-slate-600"
            >
              {a}
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] leading-relaxed text-slate-500">
          L’IA propose. Vous gardez la décision.
        </p>
        <AssistantIaActivateButton />
      </div>
    </div>
  );
}
