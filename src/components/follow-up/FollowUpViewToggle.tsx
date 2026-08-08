import Link from "next/link";
import { cn } from "@/lib/cn";

type Props = {
  view: "liste" | "tableau";
  filter?: string | null;
};

export function FollowUpViewToggle({ view, filter }: Props) {
  const q = filter ? `&filter=${encodeURIComponent(filter)}` : "";
  return (
    <div
      className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold"
      role="group"
      aria-label="Mode d’affichage"
    >
      <Link
        href={`/dashboard/fiches-suivi?view=liste${q}`}
        className={cn(
          "rounded-md px-3 py-1.5 transition",
          view === "liste" ? "bg-white text-[#1e3a5f] shadow-sm" : "text-slate-600 hover:text-slate-900",
        )}
      >
        Liste
      </Link>
      <Link
        href={`/dashboard/fiches-suivi?view=tableau${q}`}
        className={cn(
          "rounded-md px-3 py-1.5 transition",
          view === "tableau" ? "bg-white text-[#1e3a5f] shadow-sm" : "text-slate-600 hover:text-slate-900",
        )}
      >
        Tableau
      </Link>
    </div>
  );
}
