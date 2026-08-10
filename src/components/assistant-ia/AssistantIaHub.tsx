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
import { PageHeader } from "@/components/ui/PageHeader";
import {
  ASSISTANT_IA_FAMILIES,
  toolsByFamily,
  type AssistantIaTool,
} from "@/lib/assistant-ia/tools";
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

function ToolCard({ tool }: { tool: AssistantIaTool }) {
  const Icon = ICONS[tool.icon];
  return (
    <article
      className={cn(
        "group flex flex-col rounded-2xl border border-slate-200/90 bg-white p-5",
        "shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition",
        "hover:border-[#1e3a5f]/25 hover:shadow-md",
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1e3a5f]/[0.06] text-[#1e3a5f]">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[0.9375rem] font-semibold tracking-tight text-slate-900">
            {tool.title}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{tool.description}</p>
        </div>
      </div>
      <Link
        href={`/dashboard/assistant-ia/${tool.id}`}
        className={cn(
          "mt-5 inline-flex w-fit items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold",
          "text-[#1e3a5f] ring-1 ring-slate-200/90 transition",
          "hover:bg-[#1e3a5f]/[0.04] group-hover:ring-[#1e3a5f]/20",
        )}
      >
        Découvrir
        <span aria-hidden>→</span>
      </Link>
    </article>
  );
}

export function AssistantIaHub({ status }: { status: AIProviderStatus }) {
  return (
    <div className="space-y-8" data-testid="assistant-ia-hub">
      <PageHeader
        eyebrow="Pilotage"
        title="Assistant IA BTP"
        description="Analysez vos marchés, sécurisez vos chantiers et transformez vos documents en actions."
        actions={
          <span
            className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600"
            title="Aucune clé API requise pour consulter ce catalogue"
          >
            {status.statusLabel}
          </span>
        }
      />

      <p className="max-w-2xl text-sm leading-relaxed text-slate-500">
        Des outils métier pour les marchés privés et le chantier — pas un chatbot générique.
        L’IA propose ; vous validez. Activation possible selon vos besoins.
      </p>

      {ASSISTANT_IA_FAMILIES.map((family) => {
        const tools = toolsByFamily(family.id);
        return (
          <section key={family.id} aria-labelledby={`ia-family-${family.id}`} className="space-y-4">
            <div>
              <h2
                id={`ia-family-${family.id}`}
                className="text-base font-semibold tracking-tight text-slate-900"
              >
                {family.title}
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">{family.subtitle}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
              {tools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
