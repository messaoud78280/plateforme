/**
 * Badge « IA » façon croquis / planche d’architecte : cotations, Ø, traits techniques — ~×2 vs ancienne pastille.
 */
export function HomeHeroIaPlanBadge() {
  const mono = "ui-monospace, monospace, monospace";

  return (
    <div className="relative h-[min(280px,72vw)] w-[min(280px,72vw)] shrink-0 max-w-[280px]" aria-hidden>
      <svg className="absolute inset-0 h-full w-full text-[#2563eb]" viewBox="0 0 280 280" fill="none">
        <defs>
          <filter id="bework-ia-badge-sketch" x="-15%" y="-15%" width="130%" height="130%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.35" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>

        {/* Grand cercle fantôme — repère chantier */}
        <circle
          cx="140"
          cy="148"
          r="118"
          stroke="currentColor"
          strokeWidth="0.65"
          strokeDasharray="6 5"
          opacity="0.22"
          filter="url(#bework-ia-badge-sketch)"
        />

        {/* Cotation horizontale Ø */}
        <g opacity="0.88">
          <path d="M 52 52 L 228 52" stroke="currentColor" strokeWidth="0.85" strokeDasharray="3 2" />
          <path d="M 52 48 L 52 56 M 228 48 L 228 56" stroke="currentColor" strokeWidth="0.75" />
          <text x="140" y="42" textAnchor="middle" fill="#1e40af" style={{ fontFamily: mono, fontSize: "11px", fontWeight: 600 }}>
            Ø 152.00
          </text>
        </g>

        {/* Cotation verticale R */}
        <g opacity="0.82">
          <path d="M 44 82 L 44 214" stroke="currentColor" strokeWidth="0.75" strokeDasharray="4 3" />
          <path d="M 40 82 L 48 82 M 40 214 L 48 214" stroke="currentColor" strokeWidth="0.7" />
          <text
            x="30"
            y="152"
            textAnchor="middle"
            fill="#1e40af"
            style={{ fontFamily: mono, fontSize: "10px", fontWeight: 600 }}
            transform="rotate(-90 30 152)"
          >
            R = 76
          </text>
        </g>

        {/* Angle 90° — coin bas-droite */}
        <g stroke="currentColor" strokeWidth="0.7" opacity="0.55">
          <path d="M 238 206 L 238 228 L 216 228" />
          <path d="M 228 228 A 14 14 0 0 1 238 214" fill="none" />
          <text x="244" y="222" fill="#64748b" style={{ fontFamily: mono, fontSize: "9px" }}>
            90°
          </text>
        </g>

        {/* Axes légers */}
        <line x1="140" y1="54" x2="140" y2="242" stroke="currentColor" strokeWidth="0.45" strokeDasharray="5 9" opacity="0.18" />
        <line x1="56" y1="148" x2="224" y2="148" stroke="currentColor" strokeWidth="0.45" strokeDasharray="5 9" opacity="0.15" />

        {/* Cercles concentriques type DAO */}
        <circle cx="140" cy="148" r="92" stroke="currentColor" strokeWidth="0.55" strokeDasharray="2 4" opacity="0.35" />
        <circle cx="140" cy="148" r="84" stroke="#64748b" strokeWidth="0.5" strokeDasharray="8 6" opacity="0.25" />
      </svg>

      {/* Disque central — lisibilité renforcée */}
      <div className="absolute left-1/2 top-[53%] flex h-[9.5rem] w-[9.5rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-2 border-dashed border-[#93c5fd]/95 bg-gradient-to-b from-slate-900 via-[#0f172a] to-black px-4 text-center shadow-[0_0_0_1px_rgba(37,99,235,0.5),0_0_42px_-8px_rgba(37,99,235,0.55),0_22px_48px_-14px_rgba(15,23,42,0.55)] ring-[3px] ring-white/25 ring-offset-[3px] ring-offset-[rgba(248,250,252,0.85)]">
        {/* Léger voile blueprint */}
        <div
          className="pointer-events-none absolute inset-[10px] rounded-full opacity-[0.12]"
          style={{
            backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 5px, rgba(147, 197, 253, 0.9) 5px, rgba(147, 197, 253, 0.9) 6px)`,
          }}
        />
        <span
          className="relative z-[1] text-[10px] font-bold uppercase leading-[1.22] tracking-[0.1em] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] sm:text-[11px] sm:tracking-[0.11em]"
          style={{ fontFamily: mono }}
        >
          IA au service des pros du BTP
        </span>
      </div>
    </div>
  );
}
