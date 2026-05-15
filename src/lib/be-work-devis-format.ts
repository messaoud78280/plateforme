export function formatEurFr(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);
}

export function formatDateFr(iso: Date | string | null | undefined): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR");
}
