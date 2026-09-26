import Link from "next/link";
import type { PortfolioSummary } from "@/lib/chantier/portfolio";
import { cn } from "@/lib/cn";

type Kpi = {
  key: string;
  value: number;
  label: string;
  hint: string;
  href?: string;
  icon: "folder" | "clock" | "hammer" | "shield";
  tone: "blue" | "amber" | "green" | "violet" | "rose";
};

const TONE: Record<
  Kpi["tone"],
  { iconWrap: string; icon: string }
> = {
  blue: {
    iconWrap: "bg-[#eef4ff]",
    icon: "text-[#3b6cf0]",
  },
  amber: {
    iconWrap: "bg-[#fff4e8]",
    icon: "text-[#d97706]",
  },
  green: {
    iconWrap: "bg-[#e8f8f1]",
    icon: "text-[#059669]",
  },
  violet: {
    iconWrap: "bg-[#f3effe]",
    icon: "text-[#7c5cfc]",
  },
  rose: {
    iconWrap: "bg-[#fdeceb]",
    icon: "text-[#e11d48]",
  },
};

function KpiIcon({ kind }: { kind: Kpi["icon"] }) {
  const common = "h-[18px] w-[18px]";
  if (kind === "folder") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M3.5 7.5A2 2 0 0 1 5.5 5.5h4l1.5 2H18.5a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-9Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (kind === "clock") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M12 8v4.25L14.75 14"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (kind === "hammer") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M14.5 4.5 19 9l-2.2 1.1-3.4-3.4L14.5 4.5Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="m11.8 8.3-7.3 7.3a1.6 1.6 0 0 0 0 2.3l1.6 1.6a1.6 1.6 0 0 0 2.3 0l7.3-7.3"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3.5 19.5 7v5.2c0 4.1-2.9 7.7-7.5 8.8-4.6-1.1-7.5-4.7-7.5-8.8V7L12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="m9.2 12.1 1.9 1.9 3.7-3.8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChantiersPortfolioKpis({ summary }: { summary: PortfolioSummary }) {
  const prep = summary.etude + summary.enAttente;
  const totalSafe = Math.max(summary.total, 1);
  const items: Kpi[] = [
    {
      key: "total",
      value: summary.total,
      label: "Chantiers",
      hint:
        summary.etude > 0
          ? `${summary.etude} étude${summary.etude > 1 ? "s" : ""} en cours`
          : `${summary.total} au total`,
      icon: "folder",
      tone: "blue",
    },
    {
      key: "prep",
      value: prep,
      label: "En préparation",
      hint:
        totalSafe > 0
          ? `${Math.round((prep / totalSafe) * 100)} % des chantiers`
          : "Aucun",
      icon: "clock",
      tone: "amber",
    },
    {
      key: "cours",
      value: summary.enCours,
      label: "En réalisation",
      hint:
        summary.reception > 0
          ? `${summary.reception} en réception`
          : "Chantiers actifs",
      icon: "hammer",
      tone: "green",
    },
    {
      key: "watch",
      value: summary.withAttention,
      label: "À surveiller",
      hint:
        summary.missingPieces > 0
          ? `${summary.missingPieces} pièce${summary.missingPieces > 1 ? "s" : ""} manquante${summary.missingPieces > 1 ? "s" : ""}`
          : summary.withAttention > 0
            ? "Actions à traiter"
            : "Aucune alerte",
      href: summary.missingPieces > 0 ? "/dashboard/projets/manquants" : undefined,
      icon: "shield",
      tone: summary.withAttention > 0 ? "rose" : "violet",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const tone = TONE[item.tone];
        const body = (
          <>
            <div className="min-w-0">
              <p className="text-[1.75rem] font-bold tracking-tight text-slate-900 tabular-nums leading-none">
                {item.value}
              </p>
              <p className="mt-1.5 text-[13px] font-semibold text-slate-800">{item.label}</p>
              <p className="mt-0.5 text-[12px] text-slate-500">{item.hint}</p>
            </div>
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                tone.iconWrap,
                tone.icon,
              )}
            >
              <KpiIcon kind={item.icon} />
            </span>
          </>
        );
        const className =
          "flex items-start justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-300/90 hover:shadow-[0_4px_14px_rgba(15,23,42,0.05)]";
        return item.href ? (
          <Link key={item.key} href={item.href} className={className}>
            {body}
          </Link>
        ) : (
          <div key={item.key} className={className}>
            {body}
          </div>
        );
      })}
    </div>
  );
}
