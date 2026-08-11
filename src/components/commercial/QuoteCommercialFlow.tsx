/**
 * Progression informative (pas un super-statut).
 */
export function QuoteCommercialFlow({
  status,
  hasProject,
  hasInvoice,
  hasPayment,
}: {
  status: string;
  hasProject: boolean;
  hasInvoice?: boolean;
  hasPayment?: boolean;
}) {
  const accepted = status === "ACCEPTED";
  const steps = [
    { key: "devis", label: "Devis", done: true },
    { key: "accepte", label: "Accepté", done: accepted },
    { key: "chantier", label: "Chantier", done: accepted && hasProject },
    { key: "facturation", label: "Facturation", done: Boolean(hasInvoice) },
    { key: "encaissement", label: "Encaissement", done: Boolean(hasPayment) },
  ];

  return (
    <nav
      aria-label="Chaîne commerciale"
      className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[11px] sm:text-xs"
    >
      {steps.map((s, i) => (
        <span key={s.key} className="inline-flex items-center gap-1.5">
          {i > 0 ? <span className="text-slate-300">→</span> : null}
          <span
            className={
              s.done
                ? "font-bold text-[#1e3a5f]"
                : "font-medium text-slate-400"
            }
          >
            {s.label}
          </span>
        </span>
      ))}
    </nav>
  );
}
