import Link from "next/link";
import { ClipboardList, Shield } from "lucide-react";

type Props = {
  projectId: string;
  counts?: { cr: number; ppsps: number };
};

/** Carte d’entrée « Documents de chantier » sur la fiche projet. */
export function SiteDocumentsEntryCard({ projectId, counts }: Props) {
  const href = `/dashboard/projets/${projectId}/documents-chantier`;
  return (
    <section className="rounded-xl border border-[#93c5fd]/40 bg-gradient-to-b from-[#eff6ff]/80 to-white p-6 shadow-sm ring-1 ring-[#2563eb]/10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Documents de chantier</h2>
            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-800">
              Assistant ChatGPT disponible
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Comptes rendus et PPSPS : BeWork prépare le prompt, vous utilisez ChatGPT à part,
            puis vous importez le JSON.
          </p>
        </div>
        <Link
          href={href}
          className="inline-flex items-center gap-2 rounded-xl bg-[#1e3a5f] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#152a45]"
        >
          Ouvrir l’espace
        </Link>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Link
          href={href}
          className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-[#1e3a5f]/30 hover:shadow-sm"
        >
          <p className="flex items-center gap-2 font-semibold text-slate-900">
            <ClipboardList className="size-4 text-[#1e3a5f]" aria-hidden />
            Comptes rendus
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {counts?.cr ?? 0} document{(counts?.cr ?? 0) > 1 ? "s" : ""}
          </p>
        </Link>
        <Link
          href={href}
          className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-[#1e3a5f]/30 hover:shadow-sm"
        >
          <p className="flex items-center gap-2 font-semibold text-slate-900">
            <Shield className="size-4 text-amber-700" aria-hidden />
            PPSPS
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {counts?.ppsps ?? 0} document{(counts?.ppsps ?? 0) > 1 ? "s" : ""}
          </p>
        </Link>
      </div>
    </section>
  );
}
