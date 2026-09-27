"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ClipboardList, FileText, Shield } from "lucide-react";

type DocKind = "COMPTE_RENDU" | "NOTICE" | "PPSPS";

type DocItem = {
  id: string;
  kind: DocKind;
  number: string;
  versionNumber: number;
  status: string;
  title: string;
  visitDate: string | null;
  updatedAt: string;
};

type Props = {
  projectId: string;
  canWrite: boolean;
  initialItems: DocItem[];
};

function statusLabel(s: string) {
  if (s === "FINALIZED") return "Finalisé";
  if (s === "ARCHIVED") return "Archivé";
  return "Brouillon";
}

function DocList({
  items,
  base,
  empty,
}: {
  items: DocItem[];
  base: string;
  empty: string;
}) {
  if (items.length === 0) {
    return <p className="mt-3 text-sm text-slate-500">{empty}</p>;
  }
  return (
    <ul className="mt-3 divide-y divide-slate-100">
      {items.map((d) => (
        <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
          <div>
            <p className="font-semibold text-slate-900">
              {d.number}
              {d.kind === "PPSPS" ? ` · Version ${d.versionNumber}` : ""} · {d.title}
            </p>
            <p className="text-xs text-slate-500">
              {new Date(d.updatedAt).toLocaleDateString("fr-FR")} · {statusLabel(d.status)}
            </p>
          </div>
          <Link
            href={`${base}/${d.id}`}
            className="text-sm font-semibold text-[#1d4ed8] hover:underline"
          >
            Ouvrir
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function SiteDocumentsHub({ projectId, canWrite, initialItems }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const crs = items.filter((i) => i.kind === "COMPTE_RENDU");
  const notices = items.filter((i) => i.kind === "NOTICE");
  const ppsps = items.filter((i) => i.kind === "PPSPS");
  const base = `/dashboard/projets/${projectId}/documents-chantier`;

  async function create(kind: DocKind, title?: string) {
    setBusy(kind);
    setError(null);
    try {
      const res = await fetch(`/api/projets/${projectId}/site-documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, ...(title ? { title } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Création impossible");
      router.push(`${base}/${data.document.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Documents de chantier</h1>
          <p className="mt-1 text-sm text-slate-600">
            Comptes rendus, notices explicatives et PPSPS — assistés ChatGPT (copie /
            collage, aucune API IA).
          </p>
        </div>
        <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-800">
          Assistant ChatGPT disponible
        </span>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-[#1e3a5f]/5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-[#eff6ff] p-2.5 text-[#1e3a5f]">
              <ClipboardList className="size-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-slate-900">Compte rendu</h2>
              <p className="mt-1 text-sm text-slate-600">
                Avancement, décisions, observations et prochaines interventions.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {canWrite ? (
                  <button
                    type="button"
                    disabled={busy === "COMPTE_RENDU"}
                    onClick={() => void create("COMPTE_RENDU")}
                    className="rounded-xl bg-[#1e3a5f] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#152a45] disabled:opacity-60"
                  >
                    {busy === "COMPTE_RENDU" ? "Création…" : "+ Nouveau CR"}
                  </button>
                ) : null}
                <a
                  href="#liste-cr"
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-[#1e3a5f] hover:bg-slate-50"
                >
                  Voir
                </a>
              </div>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-[#1e3a5f]/5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-800">
              <FileText className="size-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-slate-900">Notice explicative</h2>
              <p className="mt-1 text-sm text-slate-600">
                Expliquer le déroulement du chantier au client (document distinct du CR).
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {canWrite ? (
                  <button
                    type="button"
                    disabled={busy === "NOTICE"}
                    onClick={() =>
                      void create("NOTICE", "Notice explicative du chantier")
                    }
                    className="rounded-xl bg-[#1e3a5f] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#152a45] disabled:opacity-60"
                  >
                    {busy === "NOTICE" ? "Création…" : "+ Nouvelle notice"}
                  </button>
                ) : null}
                <a
                  href="#liste-notice"
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-[#1e3a5f] hover:bg-slate-50"
                >
                  Voir
                </a>
              </div>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-[#1e3a5f]/5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-amber-50 p-2.5 text-amber-800">
              <Shield className="size-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-slate-900">PPSPS</h2>
              <p className="mt-1 text-sm text-slate-600">
                Structurez les informations de prévention chantier.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {canWrite ? (
                  <button
                    type="button"
                    disabled={busy === "PPSPS"}
                    onClick={() => void create("PPSPS")}
                    className="rounded-xl bg-[#1e3a5f] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#152a45] disabled:opacity-60"
                  >
                    {busy === "PPSPS" ? "Création…" : "+ Nouveau PPSPS"}
                  </button>
                ) : null}
                <a
                  href="#liste-ppsps"
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-[#1e3a5f] hover:bg-slate-50"
                >
                  Voir
                </a>
              </div>
            </div>
          </div>
        </article>
      </div>

      <section id="liste-cr" className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">
          Comptes rendus
        </h3>
        <DocList items={crs} base={base} empty="Aucun compte rendu pour l’instant." />
      </section>

      <section id="liste-notice" className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">
          Notices explicatives
        </h3>
        <DocList
          items={notices}
          base={base}
          empty="Aucune notice explicative pour l’instant."
        />
      </section>

      <section id="liste-ppsps" className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">PPSPS</h3>
        <DocList items={ppsps} base={base} empty="Aucun PPSPS pour l’instant." />
      </section>

      <span className="hidden">{items.length}</span>
    </div>
  );
}
