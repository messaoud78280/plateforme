"use client";

import { useState } from "react";

interface ComparatifRevealProps {
  children: React.ReactNode;
}

export function ComparatifReveal({ children }: ComparatifRevealProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-14">
      <p className="text-center">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-2 rounded-lg border-2 border-[#1d4ed8] bg-transparent px-6 py-3 font-semibold text-[#1d4ed8] transition-all hover:bg-[#eff6ff]"
          aria-expanded={open}
        >
          {open ? "Masquer le tableau comparatif" : "Voir le tableau comparatif"}
          <svg
            className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </p>
      {open && <div className="mt-8">{children}</div>}
    </div>
  );
}
