import { validateOfficialPdfIssuer } from "@/lib/be-work-devis-pdf-presentation";
import type { QuoteProject } from "@prisma/client";

export function QuotePdfIssuerAlert({ project }: { project: QuoteProject }) {
  const check = validateOfficialPdfIssuer(project);
  if (check.ok) return null;

  return (
    <div
      role="alert"
      className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
    >
      <p className="font-semibold">Informations entreprise incomplètes</p>
      <p className="mt-1">{check.message}</p>
      {check.missing.length > 0 ? (
        <ul className="mt-2 list-inside list-disc text-xs">
          {check.missing.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      ) : null}
      <p className="mt-2 text-xs text-amber-800">
        Le devis officiel est émis au nom de votre entreprise de travaux — pas au nom de BeWork. Complétez la section
        ci-dessous avant génération.
      </p>
    </div>
  );
}
