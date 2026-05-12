/**
 * Décor « bureau d’études » réparti sur la hauteur du bloc accueil (sous les sections).
 * Reste sous le contenu (z-index bas du parent).
 */
export function HomeBlueprintScrollDecor() {
  const mono = { fontFamily: "ui-monospace, monospace" as const };

  return (
    <div className="absolute inset-0 overflow-hidden text-slate-500" aria-hidden>
      {/* Bande gauche — axes & cotations */}
      <svg
        className="absolute -left-[2%] top-[8%] h-[520px] w-[140px] opacity-[0.11] md:left-0 md:opacity-[0.13]"
        viewBox="0 0 140 520"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
      >
        <line x1="48" y1="20" x2="48" y2="480" stroke="currentColor" strokeWidth="0.8" strokeDasharray="5 8" opacity="0.7" />
        <line x1="28" y1="240" x2="120" y2="240" stroke="currentColor" strokeWidth="0.65" strokeDasharray="4 6" opacity="0.55" />
        <path d="M68 96v72M92 96v72M68 132h24" stroke="currentColor" strokeWidth="0.75" strokeDasharray="3 2" />
        <path d="M68 96 L68 92 M92 96 L92 92 M68 168 L68 172 M92 168 L92 172" stroke="currentColor" strokeWidth="0.65" />
        <text x="92" y="138" fill="currentColor" style={{ ...mono, fontSize: "10px" }}>
          360
        </text>
        <text x="52" y="48" fill="currentColor" style={{ ...mono, fontSize: "8px" }} opacity="0.75">
          RL +12.50
        </text>
      </svg>

      {/* Milieu-page — rosace orientation */}
      <svg
        className="absolute left-[8%] top-[38%] h-[100px] w-[100px] opacity-[0.09] md:left-[12%] md:opacity-[0.11]"
        viewBox="0 0 100 100"
        fill="none"
      >
        <circle cx="50" cy="50" r="28" stroke="currentColor" strokeWidth="0.7" strokeDasharray="3 4" opacity="0.85" />
        <polygon points="50,26 53,44 50,42 47,44" fill="currentColor" opacity="0.55" />
        <text x="50" y="78" textAnchor="middle" fill="currentColor" style={{ ...mono, fontSize: "11px" }}>
          N
        </text>
      </svg>

      {/* Droite — détail type coupe / cadre */}
      <svg
        className="absolute -right-[4%] top-[52%] h-[280px] w-[min(42vw,220px)] opacity-[0.1] md:right-0 md:opacity-[0.12]"
        viewBox="0 0 220 280"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
      >
        <rect x="36" y="48" width="148" height="168" stroke="currentColor" strokeWidth="0.85" strokeDasharray="4 3" rx="2" />
        <path d="M36 188h148" stroke="currentColor" strokeWidth="0.6" strokeDasharray="6 5" opacity="0.65" />
        <line x1="110" y1="48" x2="110" y2="216" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 6" opacity="0.45" />
        <text x="40" y="40" fill="currentColor" style={{ ...mono, fontSize: "8px" }} opacity="0.9">
          COUPE B–B′
        </text>
        <text x="40" y="244" fill="#2563eb" style={{ ...mono, fontSize: "7px" }} opacity="0.55">
          Z. FONDATIONS
        </text>
      </svg>

      {/* Bas du bloc — ossature filaire + légende */}
      <svg
        className="absolute bottom-[6%] left-1/2 h-[180px] w-[min(96%,560px)] -translate-x-1/2 opacity-[0.08] md:opacity-[0.1]"
        viewBox="0 0 560 180"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
      >
        <path d="M40 120h480" stroke="currentColor" strokeWidth="0.75" strokeDasharray="10 7" opacity="0.55" />
        <g stroke="currentColor" strokeWidth="0.9" opacity="0.8">
          <line x1="120" y1="120" x2="120" y2="44" strokeDasharray="4 4" />
          <line x1="180" y1="120" x2="180" y2="44" strokeDasharray="4 4" />
          <line x1="240" y1="120" x2="240" y2="44" strokeDasharray="4 4" />
          <line x1="120" y1="72" x2="280" y2="72" opacity="0.5" strokeDasharray="3 5" />
          <line x1="120" y1="96" x2="280" y2="96" opacity="0.45" strokeDasharray="3 5" />
          <polyline points="280,120 320,52 380,120" strokeDasharray="5 4" opacity="0.65" />
        </g>
        <text x="380" y="152" fill="currentColor" style={{ ...mono, fontSize: "8px" }} opacity="0.75">
          ESQUISSE FAÇADE · PHASE APS
        </text>
      </svg>

      {/* Traits repère coin */}
      <svg
        className="absolute bottom-[18%] left-[4%] h-[72px] w-[72px] opacity-[0.08]"
        viewBox="0 0 72 72"
        fill="none"
      >
        <path d="M8 64 L64 8" stroke="currentColor" strokeWidth="0.75" strokeDasharray="2 3" opacity="0.7" />
        <path d="M12 64 L64 12 M16 64 L64 16" stroke="currentColor" strokeWidth="0.55" opacity="0.45" />
        <text x="10" y="22" fill="currentColor" style={{ ...mono, fontSize: "8px" }}>
          ↘ repère
        </text>
      </svg>
    </div>
  );
}
