"use client";

import { useState } from "react";
import { BookOpen, ChevronDown, Copy } from "lucide-react";
import {
  CCTP_COMMON_ERRORS,
  CCTP_DEFINITION,
  CCTP_FINAL_CHECKLIST,
  CCTP_NORMS_STANDARD_PHRASE,
  CCTP_OUVRAGE_EXAMPLE,
  CCTP_PURPOSES,
  CCTP_SIX_STEPS,
  CCTP_STRUCTURE_SECTIONS,
  formatOuvrageTemplateMarkdown,
} from "@/content/cctp-methodology";

export function SkillCctpMethodologyPanel() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(formatOuvrageTemplateMarkdown());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="rounded-xl border border-[#1e3a5f]/15 bg-gradient-to-br from-[#f4f7fb] to-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-[#0f2744]">
          <BookOpen className="size-4 text-[#1d4ed8]" aria-hidden />
          Guide express — Établir un CCTP
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-slate-500 transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="max-h-[min(60vh,520px)] space-y-5 overflow-y-auto border-t border-[#1e3a5f]/10 px-4 py-4 text-sm text-slate-700">
          <section>
            <h3 className="font-semibold text-slate-900">{CCTP_DEFINITION.title}</h3>
            <p className="mt-1 leading-relaxed">{CCTP_DEFINITION.body}</p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-900">À quoi sert un CCTP ?</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {CCTP_PURPOSES.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-slate-900">Structure type d&apos;un lot</h3>
            <ol className="mt-2 list-decimal space-y-0.5 pl-5">
              {CCTP_STRUCTURE_SECTIONS.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </section>

          <section>
            <h3 className="font-semibold text-slate-900">Méthode en 6 étapes</h3>
            <ol className="mt-2 space-y-2">
              {CCTP_SIX_STEPS.map((s) => (
                <li key={s.step}>
                  <span className="font-medium text-[#1d4ed8]">Étape {s.step}</span> — {s.title}
                  <p className="text-xs text-slate-600">{s.detail}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-slate-900">Modèle fiche ouvrage (14 rubriques)</h3>
              <button
                type="button"
                onClick={() => void copyTemplate()}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <Copy className="size-3" aria-hidden />
                {copied ? "Copié" : "Copier le modèle"}
              </button>
            </div>
            <p className="mt-2 font-medium">{CCTP_OUVRAGE_EXAMPLE.title}</p>
            <p className="mt-1 text-xs text-slate-600">
              <strong>Localisation :</strong> {CCTP_OUVRAGE_EXAMPLE.localization}
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-900">Phrase type — normes</h3>
            <p className="mt-1 rounded-lg bg-slate-50 p-2 text-xs italic leading-relaxed">
              {CCTP_NORMS_STANDARD_PHRASE}
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-900">Checklist avant finalisation</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
              {CCTP_FINAL_CHECKLIST.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-slate-900">Erreurs fréquentes</h3>
            <ul className="mt-2 space-y-2 text-xs">
              {CCTP_COMMON_ERRORS.slice(0, 3).map((e) => (
                <li key={e.title} className="rounded-lg border border-amber-100 bg-amber-50/50 p-2">
                  <strong>{e.title}</strong>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </div>
  );
}
