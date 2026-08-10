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

function ToolRow({ tool }: { tool: AssistantIaTool }) {
  const Icon = TOOL_ICONS[tool.icon];
  return (
    <Link
      href={`/dashboard/assistant-ia/${tool.id}`}
      className={cn(
        "group flex min-h-[4.5rem] items-center gap-3.5 rounded-2xl border bg-white px-4 py-3.5",
        "transition duration-200 ease-out",
        "hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]",
        "active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/30",
        tool.featured
          ? "border-[#1e3a5f]/20 shadow-[0_1px_3px_rgba(30,58,95,0.06)]"
          : "border-slate-200/90 shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:border-[#1e3a5f]/20",
      )}
    >
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          tool.featured
            ? "bg-[#1e3a5f] text-white"
            : "bg-[#1e3a5f]/[0.06] text-[#1e3a5f]",
        )}
      >
        <Icon className="h-[1.15rem] w-[1.15rem]" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[0.9375rem] font-semibold tracking-tight text-slate-900">
            {tool.title}
          </span>
          {tool.featured && tool.featuredLabel ? (
            <span className="rounded-full bg-[#1e3a5f]/[0.07] px-2 py-0.5 text-[10px] font-medium text-[#1e3a5f]">
              {tool.featuredLabel}
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 block text-[13px] leading-snug text-slate-500 line-clamp-2">
          {tool.description}
        </span>
      </span>
      <span
        className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#1e3a5f]"
        aria-hidden
      >
        →
      </span>
    </Link>
  );
}

export function AssistantIaHub({ status }: { status: AIProviderStatus }) {
  return (
    <div className="mx-auto max-w-3xl space-y-10" data-testid="assistant-ia-hub">
      <PageHeader
        title="Assistant IA BTP"
        description="Des outils intelligents pour analyser vos marchés, préparer vos chantiers et exploiter vos documents."
        actions={
          <span
            className="rounded-full bg-slate-100/90 px-3 py-1 text-[11px] font-medium tracking-wide text-slate-500"
            title="Aucun provider IA connecté"
          >
            {status.statusLabel}
          </span>
        }
      />

      <p className="max-w-xl text-[13px] leading-relaxed text-slate-500">
        Une boîte à outils métier — pas un chatbot générique.{" "}
        <span className="text-slate-600">L’IA propose. Vous gardez la décision.</span>
      </p>

      {ASSISTANT_IA_FAMILIES.map((family) => {
        const tools = toolsByFamily(family.id);
        return (
          <section key={family.id} aria-labelledby={`ia-family-${family.id}`} className="space-y-3">
            <div className="px-0.5">
              <h2
                id={`ia-family-${family.id}`}
                className="text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-500"
              >
                {family.title}
              </h2>
              <p className="mt-0.5 text-[13px] text-slate-400">{family.subtitle}</p>
            </div>
            <ul className="space-y-2">
              {tools.map((tool) => (
                <li key={tool.id}>
                  <ToolRow tool={tool} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
