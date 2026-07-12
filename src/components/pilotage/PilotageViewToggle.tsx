"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function PilotageViewToggle({ current }: { current: "cartes" | "tableau" }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  function setView(view: "cartes" | "tableau") {
    const next = new URLSearchParams(sp.toString());
    next.set("vue", view);
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5" role="group" aria-label="Mode d’affichage">
      <button
        type="button"
        onClick={() => setView("cartes")}
        className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
          current === "cartes" ? "bg-[#1e3a5f] text-white" : "text-slate-600 hover:bg-slate-50"
        }`}
      >
        Cartes
      </button>
      <button
        type="button"
        onClick={() => setView("tableau")}
        className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
          current === "tableau" ? "bg-[#1e3a5f] text-white" : "text-slate-600 hover:bg-slate-50"
        }`}
      >
        Tableau
      </button>
    </div>
  );
}
