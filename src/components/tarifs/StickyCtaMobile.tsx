"use client";

import Link from "next/link";

export function StickyCtaMobile() {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#e0e4ea] bg-white/95 px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] backdrop-blur-sm md:hidden"
      role="banner"
      aria-label="Appel à l'action"
    >
      <Link
        href="/contact"
        className="flex w-full items-center justify-center rounded-lg bg-[#1d4ed8] px-6 py-3 text-center font-semibold text-white shadow-md transition hover:bg-[#1e40af] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:ring-offset-2"
        aria-label="Demander un rendez-vous"
      >
        Demander un RDV
      </Link>
    </div>
  );
}
