import Link from "next/link";
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
import type { AssistantIaTool } from "@/lib/assistant-ia/tools";
import type { AIProviderStatus } from "@/lib/assistant-ia/status";
import { cn } from "@/lib/cn";

const ICONS: Record<AssistantIaTool["icon"], LucideIcon> = {
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
  const Icon = ICONS[tool.icon];

  return (
    <div className="space-y-6" data-testid="assistant-ia-tool-detail">
      <ContextBackButton fallbackHref="/dashboard/assistant-ia" label="Assistant IA" />

      <PageHeader
        eyebrow="Assistant IA BTP"
        title={
          <span className="inline-flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1e3a5f]/[0.06] text-[#1e3a5f]">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            {tool.title}
          </span>
        }
        description={tool.description}
        actions={
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600">
            {status.statusLabel}
          </span>
        }
      />

      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-slate-900">Ce que cet outil pourra faire</h2>
        <ul className="mt-3 space-y-2">
          {tool.capabilities.map((c) => (
            <li key={c} className="flex gap-2 text-sm leading-relaxed text-slate-600">
              <span className="mt-0.5 text-[#1e3a5f]" aria-hidden>
                ✓
              </span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-slate-900">Sources possibles</h2>
        <p className="mt-1 text-xs text-slate-500">
          Sélection explicite des documents — pas de lecture automatique de toute l’entreprise.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
          {tool.sources.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-slate-900">Aperçu du workflow</h2>
        <ol className="mt-3 space-y-2">
          {tool.workflow.map((step, i) => (
            <li key={step} className="flex gap-3 text-sm text-slate-600">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                {i + 1}
              </span>
              <span className="pt-0.5 leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs leading-relaxed text-slate-500">
          Workflow descriptif — aucun traitement IA n’est lancé tant que l’activation n’est pas
          demandée. L’IA proposera ; vous validerez avant toute création métier.
        </p>
      </section>

      <div
        className={cn(
          "rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-5 py-4",
          "text-sm text-slate-600",
        )}
      >
        <p className="font-medium text-slate-800">IA disponible sur activation</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-500">
          Aucune clé API n’est requise pour consulter cet outil. Lorsque vous le souhaitez, nous
          pourrons activer uniquement les fonctions utiles à votre fonctionnement.
        </p>
        <Link
          href="/dashboard/assistant-ia"
          className="mt-3 inline-flex text-sm font-semibold text-[#1e3a5f] hover:underline"
        >
          ← Retour aux outils
        </Link>
      </div>
    </div>
  );
}
