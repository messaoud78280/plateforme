/**
 * Calque décoratif type plan de chantier / architecte : cotations, annotations, croquis (inspiration maquette).
 */
const MONO = "ui-monospace, monospace";

export function HomeHeroPlanSketchDecor() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      {/* Cotations & repères — trait bleu-gris façon DAO */}
      <svg
        className="absolute left-1/2 top-0 h-[min(92vh,920px)] w-[min(145%,1480px)] -translate-x-1/2 text-[#2563eb] opacity-[0.2] motion-reduce:opacity-[0.12] sm:opacity-[0.24] md:h-full md:min-h-[640px] md:opacity-[0.26]"
        viewBox="0 0 1200 780"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Repères type chantier / axes */}
        <g stroke="currentColor" strokeWidth="0.55" opacity="0.4">
          <line x1="1120" y1="180" x2="1178" y2="180" />
          <line x1="1150" y1="152" x2="1150" y2="208" />
          <circle cx="1150" cy="180" r="22" strokeDasharray="3 4" fill="none" />
        </g>

        {/* Cotations */}
        <g stroke="currentColor" strokeWidth="0.85" fill="none" opacity="0.92">
          <path d="M120 620 L120 598 M520 620 L520 598 M120 592 L520 592" strokeDasharray="3 2" />
          <path d="M120 598 L120 592 M520 598 L520 592" />
          <text x="318" y="584" fill="#1e40af" style={{ fontFamily: MONO, fontSize: "11px" }} opacity="0.85">
            280
          </text>

          <path d="M720 680 L720 658 M1140 680 L1140 658 M720 652 L1140 652" strokeDasharray="3 2" />
          <path d="M720 658 L720 652 M1140 658 L1140 652" />
          <text x="932" y="644" fill="#1e40af" style={{ fontFamily: MONO, fontSize: "11px" }} opacity="0.85">
            420
          </text>

          <path d="M88 140 L110 140 M88 380 L110 380 M116 134 L116 386" strokeDasharray="3 2" />
          <path d="M110 140 L116 140 M110 380 L116 380" />
          <text x="102" y="268" textAnchor="middle" fill="#1e40af" style={{ fontFamily: MONO, fontSize: "10px" }} transform="rotate(-90 102 268)" opacity="0.85">
            240
          </text>
        </g>

        <g stroke="currentColor" strokeWidth="0.75" fill="none" opacity="0.88">
          <path d="M 210 520 L 250 520 L 250 480" />
          <path d="M 218 520 A 22 22 0 0 1 250 488" />
          <text x="228" y="512" fill="#1e40af" style={{ fontFamily: MONO, fontSize: "9px" }}>
            45°
          </text>
        </g>

        <g opacity="0.82">
          <circle cx="160" cy="520" r="16" stroke="#2563eb" strokeWidth="0.65" fill="none" opacity="0.55" />
          <text x="182" y="524" fill="#2563eb" style={{ fontFamily: MONO, fontSize: "9px" }} opacity="0.7">
            Ø72
          </text>
        </g>

        <g stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 6" opacity="0.38">
          <line x1="600" y1="0" x2="600" y2="780" />
          <line x1="0" y1="390" x2="1200" y2="390" />
        </g>

        <g stroke="currentColor" strokeWidth="0.75" fill="none" opacity="0.68">
          <line x1="640" y1="120" x2="640" y2="560" strokeDasharray="7 6" />
          <path d="M632 120 l8 -5 8 5 M632 560 l8 5 8 -5" strokeWidth="0.65" />
          <text x="652" y="116" fill="#1e40af" style={{ fontFamily: MONO, fontSize: "9px" }}>
            A — A′
          </text>
          <line x1="420" y1="498" x2="760" y2="498" strokeDasharray="4 5" opacity="0.55" />
          <text x="428" y="492" fill="#1e40af" style={{ fontFamily: MONO, fontSize: "8px" }} opacity="0.85">
            FINI SOL BRUT — PF ±0
          </text>
        </g>

        <g fill="none" stroke="currentColor" strokeWidth="0.65" opacity="0.55">
          <path d="M1050 520 L1078 548 L1050 576 L1022 548 Z" strokeDasharray="3 2" />
          <circle cx="1050" cy="548" r="4" opacity="0.75" />
        </g>

        {/* Tracés plan d&apos;exécution — murs + ouverture */}
        <g stroke="currentColor" strokeWidth="0.7" fill="none" opacity="0.5">
          <rect x="780" y="300" width="168" height="112" strokeDasharray="5 4" rx="0.5" />
          <line x1="864" y1="300" x2="864" y2="412" strokeDasharray="4 3" opacity="0.65" />
          <path d="M828 412 h72" strokeWidth="0.55" opacity="0.55" />
          <text x="792" y="292" fill="#1e40af" style={{ fontFamily: MONO, fontSize: "8px" }} opacity="0.72">
            PE-02
          </text>
        </g>
        <g stroke="currentColor" strokeWidth="0.55" opacity="0.38">
          <line x1="260" y1="200" x2="420" y2="200" strokeDasharray="6 5" />
          <line x1="260" y1="200" x2="260" y2="340" strokeDasharray="6 5" />
          <text x="268" y="194" fill="#1e40af" style={{ fontFamily: MONO, fontSize: "8px" }} opacity="0.65">
            axe B
          </text>
        </g>
      </svg>

      {/* Croquis bas-gauche : grue + ossature — effet crayon */}
      <svg
        className="absolute bottom-[-2%] left-[-6%] h-[340px] w-[min(110%,920px)] max-w-none text-[#334155] opacity-[0.14] md:bottom-0 md:left-[-3%] md:h-[400px] md:opacity-[0.16]"
        viewBox="0 0 900 280"
        fill="none"
        preserveAspectRatio="xMinYMax meet"
      >
        <defs>
          <filter id="bework-hero-sketch-blur" x="-8%" y="-8%" width="116%" height="116%">
            <feGaussianBlur stdDeviation="0.45" />
          </filter>
        </defs>
        <g filter="url(#bework-hero-sketch-blur)">
        <path d="M40 228 H860" stroke="currentColor" strokeWidth="1" strokeDasharray="8 6" opacity="0.45" />

        <g stroke="currentColor" strokeWidth="1.05" opacity="0.88">
          <rect x="320" y="92" width="200" height="136" strokeDasharray="5 4" rx="1" />
          <line x1="360" y1="92" x2="360" y2="228" strokeDasharray="3 5" opacity="0.72" />
          <line x1="400" y1="92" x2="400" y2="228" strokeDasharray="3 5" opacity="0.72" />
          <line x1="440" y1="92" x2="440" y2="228" strokeDasharray="3 5" opacity="0.72" />
          <line x1="480" y1="92" x2="480" y2="228" strokeDasharray="3 5" opacity="0.72" />
          <line x1="320" y1="130" x2="520" y2="130" strokeDasharray="4 4" opacity="0.5" />
          <line x1="320" y1="168" x2="520" y2="168" strokeDasharray="4 4" opacity="0.48" />
        </g>

        {/* Grue — côté gauche du croquis */}
        <g stroke="currentColor" strokeWidth="1.1" opacity="0.92">
          <line x1="180" y1="228" x2="180" y2="38" strokeLinecap="round" />
          <line x1="180" y1="48" x2="320" y2="98" strokeDasharray="3 3" />
          <polyline points="180,228 148,252 212,252 180,228" strokeWidth="0.9" opacity="0.78" />
          <line x1="298" y1="98" x2="298" y2="228" strokeDasharray="5 5" opacity="0.48" />
        </g>

        <g stroke="currentColor" strokeWidth="0.75" opacity="0.42">
          <path d="M560 228 V152 M576 228 V148 M592 228 V152 M560 168 h32 M560 190 h32" />
        </g>

        <rect x="308" y="220" width="224" height="12" rx="1" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 3" opacity="0.45" />
        </g>
      </svg>

      {/* Hachures coupe — coin droit */}
      <div
        className="pointer-events-none absolute right-0 top-[10%] h-[44%] w-[40%] max-w-[min(520px,48vw)] opacity-[0.065] md:opacity-[0.085]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 7px,
            rgba(37, 99, 235, 0.5) 7px,
            rgba(37, 99, 235, 0.5) 8px
          )`,
        }}
      />

    </div>
  );
}
