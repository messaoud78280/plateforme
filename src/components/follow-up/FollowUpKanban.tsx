import Link from "next/link";
import type { FollowUpUrgency } from "@prisma/client";
import { POSTIT_COLORS, URGENCY_STYLES } from "@/lib/follow-up/types";
import type { FollowUpCardData } from "@/components/follow-up/FollowUpPostItCard";
import { cn } from "@/lib/cn";

export type KanbanColumn = {
  statusKey: string;
  label: string;
  colorKey: string;
  sortOrder: number;
};

type Sheet = FollowUpCardData & {
  status: string;
  nextActionAt?: string | null;
  nextActionAtLabel?: string | null;
};

type Props = {
  columns: KanbanColumn[];
  sheets: Sheet[];
};

function StepAccent({ colorKey }: { colorKey: string }) {
  const map: Record<string, string> = {
    bleu: "bg-sky-400",
    jaune: "bg-amber-400",
    orange: "bg-orange-400",
    violet: "bg-violet-400",
    vert: "bg-emerald-400",
    rouge: "bg-red-400",
  };
  return <span className={cn("absolute inset-x-0 top-0 h-1 rounded-t-xl", map[colorKey] ?? "bg-slate-300")} />;
}

function KanbanCard({ sheet }: { sheet: Sheet }) {
  const border = POSTIT_COLORS[sheet.colorKey]?.border ?? "border-slate-200";
  const urgencyKey = sheet.urgency as FollowUpUrgency;
  const urgency = URGENCY_STYLES[urgencyKey] ?? URGENCY_STYLES.NORMAL;
  const ref = sheet.osNumber
    ? `OS-${sheet.osNumber}`
    : sheet.orderNumber
      ? sheet.orderNumber
      : null;

  return (
    <Link
      href={`/dashboard/fiches-suivi/${sheet.id}`}
      className={cn(
        "relative block rounded-xl border bg-white p-3 shadow-sm transition hover:border-slate-300 hover:shadow",
        border,
      )}
    >
      <StepAccent colorKey={sheet.colorKey} />
      <p className="mt-1 text-sm font-bold leading-snug text-slate-900 line-clamp-2">{sheet.title}</p>
      {ref ? <p className="mt-1 text-[11px] font-semibold text-slate-500">{ref}</p> : null}
      {sheet.workObject ? (
        <p className="mt-1 text-xs text-slate-600 line-clamp-2">{sheet.workObject}</p>
      ) : null}
      {sheet.nextAction ? (
        <p className="mt-2 text-xs text-slate-700">
          <span className="font-semibold text-slate-500">Prochaine action · </span>
          {sheet.nextAction}
        </p>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-600">
        {sheet.assignee?.name ? <span>{sheet.assignee.name}</span> : null}
        {sheet.nextActionAtLabel ? (
          <span className="font-medium text-slate-700">{sheet.nextActionAtLabel}</span>
        ) : null}
        <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-semibold", urgency.badge)}>
          <span className={cn("h-1.5 w-1.5 rounded-full", urgency.dot)} aria-hidden />
          {sheet.urgencyLabel}
        </span>
      </div>
    </Link>
  );
}

export function FollowUpKanban({ columns, sheets }: Props) {
  const byStatus = new Map<string, Sheet[]>();
  for (const col of columns) byStatus.set(col.statusKey, []);
  const orphans: Sheet[] = [];

  for (const sheet of sheets) {
    const bucket = byStatus.get(sheet.status);
    if (bucket) bucket.push(sheet);
    else orphans.push(sheet);
  }

  const cols =
    orphans.length > 0
      ? [
          ...columns,
          {
            statusKey: "__AUTRES__",
            label: "Autres",
            colorKey: "jaune",
            sortOrder: 9999,
          },
        ]
      : columns;

  if (orphans.length > 0) byStatus.set("__AUTRES__", orphans);

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
      <div className="flex min-w-max gap-3">
        {cols.map((col) => {
          const items = byStatus.get(col.statusKey) ?? [];
          const accent = POSTIT_COLORS[col.colorKey] ?? POSTIT_COLORS.jaune;
          return (
            <section
              key={col.statusKey}
              className="flex w-[280px] shrink-0 flex-col rounded-2xl border border-slate-200 bg-slate-50/80"
              aria-label={`${col.label}, ${items.length} fiche(s)`}
            >
              <header className={cn("rounded-t-2xl border-b px-3 py-2.5", accent.bg, accent.border)}>
                <div className="flex items-center justify-between gap-2">
                  <h3 className={cn("text-xs font-bold uppercase tracking-wide", accent.text)}>
                    {col.label}
                  </h3>
                  <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-bold tabular-nums text-slate-700">
                    {items.length}
                  </span>
                </div>
              </header>
              <ul className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto p-2">
                {items.length === 0 ? (
                  <li className="rounded-lg border border-dashed border-slate-200 bg-white/60 px-3 py-6 text-center text-xs text-slate-400">
                    Aucune fiche
                  </li>
                ) : (
                  items.map((s) => (
                    <li key={s.id}>
                      <KanbanCard sheet={s} />
                    </li>
                  ))
                )}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
