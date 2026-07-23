/**
 * Grandes courbes métal / chromé avec filet bleu (coins hero), façon maquette premium BTP + IA.
 */
export function HomeHeroMetalCorners() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Coin haut-gauche */}
      <svg
        className="absolute -left-[12%] -top-[10%] h-[min(52vh,440px)] w-[75%] max-w-[780px] opacity-[0.72] md:-left-[8%] md:opacity-[0.68]"
        viewBox="0 0 640 380"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="bework-metal-tl" x1="0%" y1="40%" x2="85%" y2="15%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="40%" stopColor="#f8fafc" />
            <stop offset="72%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
          <filter id="bework-glow-tl" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M -60 340 Q 180 40 620 20"
          stroke="url(#bework-metal-tl)"
          strokeWidth="20"
          strokeLinecap="round"
          opacity="0.72"
        />
        <path
          d="M -60 340 Q 180 40 620 20"
          stroke="#2563eb"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.38"
          filter="url(#bework-glow-tl)"
        />
      </svg>

      {/* Coin bas-droit */}
      <svg
        className="absolute -bottom-[8%] -right-[10%] h-[min(48vh,400px)] w-[72%] max-w-[720px] opacity-[0.7] md:-right-[6%] md:opacity-[0.66]"
        viewBox="0 0 640 380"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="bework-metal-br" x1="100%" y1="65%" x2="15%" y2="35%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="38%" stopColor="#f1f5f9" />
            <stop offset="70%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
        </defs>
        <path
          d="M 700 80 Q 420 320 -40 420"
          stroke="url(#bework-metal-br)"
          strokeWidth="20"
          strokeLinecap="round"
          opacity="0.7"
        />
        <path
          d="M 700 80 Q 420 320 -40 420"
          stroke="#2563eb"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.36"
        />
      </svg>
    </div>
  );
}
