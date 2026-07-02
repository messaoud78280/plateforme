"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { createBtpDicoTerm, updateBtpDicoTerm } from "@/app/dashboard/devis/dico-btp-actions";
import { BTP_DICO_CATEGORIES, BTP_DICO_CATEGORY_LABELS, BTP_DICO_LEVELS, BTP_DICO_STATUSES } from "@/lib/btp-dico/labels";
import { BTP_DICO_LOTS } from "@/lib/btp-dico/lots";

export type BtpDicoEditorValues = {
  id?: string;
  term: string;
  acronym: string | null;
  lotCode: string | null;
  family: string | null;
  category: string | null;
  shortDefinition: string;
  beginnerExplanation: string | null;
  usageExample: string | null;
  keywords: string[];
  synonyms: string[];
  vigilancePoints: string[];
  linkedDocuments: string[];
  level: string;
  source: string | null;
  status: string;
};

const EMPTY: BtpDicoEditorValues = {
  term: "",
  acronym: null,
  lotCode: null,
  family: null,
  category: null,
  shortDefinition: "",
  beginnerExplanation: null,
  usageExample: null,
  keywords: [],
  synonyms: [],
  vigilancePoints: [],
  linkedDocuments: [],
  level: "débutant",
  source: null,
  status: "à vérifier",
};

export function BtpDicoTermEditor({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: BtpDicoEditorValues;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const v = initial ?? EMPTY;

  const onSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);
      const form = new FormData(e.currentTarget);
      startTransition(async () => {
        const res =
          mode === "create"
            ? await createBtpDicoTerm(form)
            : await updateBtpDicoTerm(initial!.id!, form);
        if (res.ok) {
          router.push(`/dashboard/devis/dico-btp/${res.id}`);
          router.refresh();
        } else {
          setError(res.error);
        }
      });
    },
    [mode, initial, router],
  );

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Card title="Identité du terme">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Terme *" name="term" defaultValue={v.term} required />
          <Field label="Acronyme (développé)" name="acronym" defaultValue={v.acronym ?? ""} />
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Lot</span>
            <select
              name="lotCode"
              defaultValue={v.lotCode ?? ""}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#1e3a5f]"
            >
              <option value="">Sans lot</option>
              {BTP_DICO_LOTS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
          <Field label="Famille" name="family" defaultValue={v.family ?? ""} />
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Catégorie</span>
            <select
              name="category"
              defaultValue={v.category ?? ""}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#1e3a5f]"
            >
              <option value="">—</option>
              {BTP_DICO_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {BTP_DICO_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      <Card title="Définitions">
        <div className="space-y-4">
          <TextArea label="Définition courte *" name="shortDefinition" defaultValue={v.shortDefinition} rows={2} required />
          <TextArea
            label="Explication pédagogique (novice)"
            name="beginnerExplanation"
            defaultValue={v.beginnerExplanation ?? ""}
            rows={4}
          />
          <TextArea
            label="Exemple d'utilisation (chantier / DPGF / CCTP)"
            name="usageExample"
            defaultValue={v.usageExample ?? ""}
            rows={3}
          />
        </div>
      </Card>

      <Card title="Listes (une entrée par ligne)">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextArea label="Mots-clés" name="keywords" defaultValue={v.keywords.join("\n")} rows={4} />
          <TextArea label="Synonymes" name="synonyms" defaultValue={v.synonyms.join("\n")} rows={4} />
          <TextArea label="Points de vigilance" name="vigilancePoints" defaultValue={v.vigilancePoints.join("\n")} rows={4} />
          <TextArea label="Documents liés" name="linkedDocuments" defaultValue={v.linkedDocuments.join("\n")} rows={4} />
        </div>
      </Card>

      <Card title="Classement">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Niveau</span>
            <select
              name="level"
              defaultValue={v.level}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#1e3a5f]"
            >
              {BTP_DICO_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <Field label="Source" name="source" defaultValue={v.source ?? ""} />
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Statut</span>
            <select
              name="status"
              defaultValue={v.status}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#1e3a5f]"
            >
              {BTP_DICO_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-[#1e3a5f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#162d4a] disabled:opacity-50"
        >
          {pending ? "Enregistrement…" : mode === "create" ? "Créer le terme" : "Enregistrer"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={pending}
          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <h2 className="font-heading mb-4 text-sm font-bold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  defaultValue: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-600">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#1e3a5f]"
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  rows,
  required,
}: {
  label: string;
  name: string;
  defaultValue: string;
  rows: number;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-600">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={rows}
        required={required}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-relaxed text-slate-800 outline-none focus:border-[#1e3a5f]"
      />
    </label>
  );
}
