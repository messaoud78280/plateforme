"use client";

/**
 * Raccourci header WeTransfer (HEADER-UI).
 */
export function OutilsCommunication() {
  return (
    <div className="flex shrink-0 items-center">
      <a
        href="https://wetransfer.com"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-[#0099ff] sm:px-2.5"
        title="Ouvrir WeTransfer pour envoyer des fichiers"
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <span className="hidden sm:inline">WeTransfer</span>
      </a>
    </div>
  );
}
