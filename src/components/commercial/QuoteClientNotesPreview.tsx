"use client";

import { parseClientNotes } from "@/lib/commercial/client-notes-structure";

/** Aperçu structuré (miroir PDF) des notes client — sans marqueurs ===. */
export function QuoteClientNotesPreview({ notes }: { notes: string }) {
  const parsed = parseClientNotes(notes);
  const empty =
    !parsed.intro &&
    !parsed.adviceParagraphs.length &&
    !parsed.stages.length &&
    !parsed.reserves.length;
  if (empty) return null;

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-700">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#1e3a5f]">
        Aperçu client (comme sur le PDF)
      </p>
      {parsed.intro ? (
        <section>
          <h4 className="font-bold text-[#1e3a5f]">Objet des travaux</h4>
          <p className="mt-1 whitespace-pre-wrap leading-relaxed text-slate-600">
            {parsed.intro}
          </p>
        </section>
      ) : null}
      {parsed.adviceParagraphs.length ? (
        <section>
          <h4 className="font-bold text-[#1e3a5f]">Notre préconisation</h4>
          <div className="mt-1 space-y-2 leading-relaxed text-slate-600">
            {parsed.adviceParagraphs.map((p, i) => (
              <p key={i} className="whitespace-pre-wrap">
                {p}
              </p>
            ))}
          </div>
        </section>
      ) : null}
      {parsed.stages.length ? (
        <section>
          <h4 className="font-bold text-[#1e3a5f]">
            Déroulement prévisionnel des travaux
          </h4>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {parsed.stages.map((s) => (
              <li
                key={`${s.order}-${s.title}`}
                className="rounded-lg border border-slate-200 bg-white p-2"
              >
                <p className="font-bold text-[#1e3a5f]">
                  {s.order} — {s.title}
                </p>
                {s.description ? (
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                    {s.description}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {parsed.reserves.length ? (
        <section>
          <h4 className="font-bold text-[#1e3a5f]">Réserves techniques</h4>
          <ul className="mt-1 list-disc space-y-1 pl-4 leading-relaxed text-slate-600">
            {parsed.reserves.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
