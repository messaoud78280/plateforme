"use client";

/** Bandeau discret — environnement de démonstration commerciale. */
export function DemoTenantBanner({
  companyName,
  expiresAt,
}: {
  companyName?: string | null;
  expiresAt?: string | null;
}) {
  const expiry =
    expiresAt &&
    new Date(expiresAt).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <div
      role="status"
      className="border-b border-amber-200/80 bg-amber-50 px-3 py-1.5 text-center text-[11px] font-semibold tracking-wide text-amber-950"
    >
      ENVIRONNEMENT DE DÉMONSTRATION
      {companyName ? ` — ${companyName}` : ""}
      {" · "}données fictives
      {expiry ? ` · valide jusqu’au ${expiry}` : ""}
    </div>
  );
}
