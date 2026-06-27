"use client";

import { useState } from "react";
import { DpgfAnalysisGeneratePanel } from "@/components/devis/DpgfAnalysisGeneratePanel";
import { DpgfAnalysisJsonImportPanel } from "@/components/devis/DpgfAnalysisJsonImportPanel";

type Mode = "line" | "json";

type Props = { aiAvailable?: boolean };

export function DpgfAnalysisInputTabs({ aiAvailable = false }: Props) {
  const [mode, setMode] = useState<Mode>("line");

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-2 shadow-sm">
      <div className="flex flex-wrap gap-2 border-b border-slate-100 px-2 pb-2 pt-1">
        <ModeButton active={mode === "line"} onClick={() => setMode("line")}>
          Analyser une ligne
        </ModeButton>
        <ModeButton active={mode === "json"} onClick={() => setMode("json")}>
          Importer en JSON
        </ModeButton>
      </div>
      <div className="p-2 pt-4">
        {mode === "line" ? (
          <DpgfAnalysisGeneratePanel aiAvailable={aiAvailable} embedded />
        ) : (
          <DpgfAnalysisJsonImportPanel embedded />
        )}
      </div>
    </section>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white shadow-sm"
          : "rounded-lg bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
      }
    >
      {children}
    </button>
  );
}
