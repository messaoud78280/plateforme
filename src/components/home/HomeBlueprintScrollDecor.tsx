/**
 * Décor « bureau d’études » réparti sur la hauteur du bloc accueil (sous les sections).
 * Reste sous le contenu (z-index bas du parent).
 */
export function HomeBlueprintScrollDecor() {
  const mono = { fontFamily: "ui-monospace, monospace" as const };

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden text-slate-500"
      aria-hidden="true"
    >
      {/* Calque planche : marges doubles, hachure de zone, échelle — très lisible mais discret */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.055] md:opacity-[0.07]"
        viewBox="0 0 1200 2600"
        fill="none"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern id="bw-scroll-arch-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <line x1="0" y1="0" x2="0" y2="7" stroke="rgb(148 163 184)" strokeWidth="0.45" />
          </pattern>
        </defs>
        {/* Zone hachurée type « masse » — côté droit, hors colonne texte */}
        <rect
          x="1020"
          y="180"
          width="140"
          height="1200"
          fill="url(#bw-scroll-arch-hatch)"
          className="hidden lg:block opacity-[0.55]"
        />
        {/* Double trait de feuille A0 / planche */}
        <rect x="14" y="14" width="1172" height="2572" stroke="currentColor" strokeWidth="0.55" opacity={0.42} rx="0" />
        <rect
          x="22"
          y="22"
          width="1156"
          height="2556"
          stroke="currentColor"
          strokeWidth="0.4"
          strokeDasharray="8 6"
          opacity={0.32}
        />
        {/* Repères de tirage (ticks) bord haut */}
        <g stroke="currentColor" strokeWidth="0.45" opacity={0.35}>
          {[
            120, 240, 360, 480, 600, 720, 840, 960, 1080,
          ].map((x) => (
            <line key={x} x1={x} y1="8" x2={x} y2="22" />
          ))}
        </g>
        {/* Échelle graphique type plan */}
        <g transform="translate(720 2480)" className="hidden sm:block" opacity={0.55}>
          <line x1="0" y1="0" x2="160" y2="0" stroke="currentColor" strokeWidth="0.75" />
          <line x1="0" y1="-4" x2="0" y2="4" stroke="currentColor" strokeWidth="0.65" />
          <line x1="80" y1="-3" x2="80" y2="3" stroke="currentColor" strokeWidth="0.55" opacity={0.75} />
          <line x1="160" y1="-4" x2="160" y2="4" stroke="currentColor" strokeWidth="0.65" />
          <text x="0" y="-10" fill="currentColor" style={{ ...mono, fontSize: "7.5px" }} opacity={0.85}>
            0
          </text>
          <text x="76" y="-10" textAnchor="middle" fill="currentColor" style={{ ...mono, fontSize: "7.5px" }} opacity={0.8}>
            5 m
          </text>
          <text x="156" y="-10" textAnchor="end" fill="currentColor" style={{ ...mono, fontSize: "7.5px" }} opacity={0.85}>
            10 m
          </text>
        </g>
        {/* Croix de repère chantier */}
        <g transform="translate(88 1280)" opacity={0.4} className="hidden md:block">
          <line x1="-16" y1="0" x2="16" y2="0" stroke="currentColor" strokeWidth="0.55" />
          <line x1="0" y1="-16" x2="0" y2="16" stroke="currentColor" strokeWidth="0.55" />
          <circle r="5" stroke="currentColor" strokeWidth="0.45" fill="none" opacity={0.7} />
        </g>
        {/* Légende pointillée type axe */}
        <path
          d="M 40 620 L 40 920"
          stroke="currentColor"
          strokeWidth="0.5"
          strokeDasharray="4 7"
          opacity={0.28}
          className="hidden lg:block"
        />
        <text x="48" y="780" fill="currentColor" style={{ ...mono, fontSize: "7px" }} opacity={0.45} className="hidden lg:block">
          AXE A — RDC
        </text>
      </svg>
      {/* Bande gauche — axes & cotations */}
      <svg
        className="absolute -left-[2%] top-[8%] h-[520px] w-[140px] opacity-[0.14] md:left-0 md:opacity-[0.17]"
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
        className="absolute left-[8%] top-[38%] h-[100px] w-[100px] opacity-[0.11] md:left-[12%] md:opacity-[0.14]"
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
        className="absolute -right-[4%] top-[52%] h-[280px] w-[min(42vw,220px)] opacity-[0.12] md:right-0 md:opacity-[0.15]"
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
        className="absolute bottom-[6%] left-1/2 h-[180px] w-[min(96%,560px)] -translate-x-1/2 opacity-[0.1] md:opacity-[0.12]"
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
      {/* Rosace N secondaire — coin haut droit type nord plan */}
      <svg
        className="absolute right-[5%] top-[14%] hidden h-[76px] w-[76px] opacity-[0.1] sm:block md:opacity-[0.12]"
        viewBox="0 0 76 76"
        fill="none"
      >
        <circle cx="38" cy="38" r="26" stroke="currentColor" strokeWidth="0.65" strokeDasharray="2 3" opacity={0.75} />
        <polygon points="38,14 41,32 38,30 35,32" fill="currentColor" opacity={0.5} />
        <text x="38" y="64" textAnchor="middle" fill="currentColor" style={{ ...mono, fontSize: "10px" }} opacity={0.75}>
          N
        </text>
        <text x="38" y="26" textAnchor="middle" fill="currentColor" style={{ ...mono, fontSize: "6px" }} opacity={0.5}>
          NORD
        </text>
      </svg>

      {/* Coins de planche — style tampon architecte */}
      <svg
        className="absolute left-0 top-[22%] hidden h-[48px] w-[48px] opacity-[0.09] md:block"
        viewBox="0 0 48 48"
        fill="none"
      >
        <path d="M4 44V8h8M4 44h40v-8" stroke="currentColor" strokeWidth="0.85" opacity={0.65} />
        <path d="M8 40V12h4M8 40h32v-4" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" opacity={0.45} />
      </svg>
      <svg
        className="absolute right-0 top-[48%] hidden h-[48px] w-[48px] opacity-[0.09] md:block"
        viewBox="0 0 48 48"
        fill="none"
      >
        <path d="M44 4v36h-8M44 4H4v8" stroke="currentColor" strokeWidth="0.85" opacity={0.65} />
        <path d="M40 8v28h-4M40 8H8v4" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" opacity={0.45} />
      </svg>

      <svg
        className="absolute bottom-[18%] left-[4%] h-[72px] w-[72px] opacity-[0.1]"
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
