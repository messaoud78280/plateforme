"use client";

import { useState, useEffect } from "react";
import { NouvelleDemandeModal } from "./NouvelleDemandeModal";

type Props = {
  /** Ouvrir la modal au montage (ex. depuis /dashboard?open=demande) */
  initialOpen?: boolean;
  /** Style du bouton: "primary" = CTA mis en avant, "nav" = lien discret */
  variant?: "primary" | "nav";
};

export function NouvelleDemandeTrigger({ initialOpen = false, variant = "primary" }: Props) {
  const [open, setOpen] = useState(initialOpen);

  useEffect(() => {
    if (initialOpen) setOpen(true);
  }, [initialOpen]);

  return (
    <>
      {variant === "primary" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg bg-[#1d4ed8] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1e40af] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:ring-offset-2"
        >
          Nouvelle demande
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg px-3 py-2 text-sm font-medium text-black hover:bg-[#eef0f4] hover:text-black"
        >
          Nouvelle demande
        </button>
      )}
      <NouvelleDemandeModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
