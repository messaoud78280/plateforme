/**
 * Badge IA hero — boule 3D translucide, typo IA cinéma, sous-titre BTP.
 */
export function HomeHeroIaPlanBadge() {
  return (
    <div className="bework-ia-cinema-scene relative h-[min(224px,57vw)] w-[min(224px,57vw)] max-w-[224px] shrink-0" aria-hidden>
      <div
        className="bework-ia-cinema-halo pointer-events-none absolute left-1/2 top-[48%] h-[9.8rem] w-[9.8rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(56,189,248,0.28) 0%, rgba(99,102,241,0.1) 38%, transparent 68%)",
        }}
      />

      <div
        className="pointer-events-none absolute left-1/2 top-[72%] z-0 h-[1.2rem] w-[62%] -translate-x-1/2 rounded-[100%]"
        style={{
          background: "radial-gradient(ellipse, rgba(15,23,42,0.32) 0%, transparent 72%)",
          filter: "blur(8px)",
          transform: "translateX(-50%) scaleY(0.55)",
        }}
      />

      <div className="bework-ia-sphere-pop absolute left-1/2 top-[48%] z-20 -translate-x-1/2 -translate-y-1/2">
        <div className="bework-ia-sphere relative flex h-[7.875rem] w-[7.875rem] flex-col items-center justify-center overflow-hidden rounded-full sm:h-[8.4rem] sm:w-[8.4rem]">
          <div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 28% 22%, rgba(125,211,252,0.72) 0%, rgba(37,99,235,0.55) 22%, rgba(30,58,138,0.48) 48%, rgba(15,23,42,0.42) 72%, rgba(2,6,23,0.38) 100%)",
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 78% 82%, transparent 58%, rgba(34,211,238,0.14) 72%, rgba(167,139,250,0.08) 88%, transparent 100%)",
            }}
          />
          <div
            className="pointer-events-none absolute left-[12%] top-[8%] h-[38%] w-[44%] rounded-full"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.1) 45%, transparent 70%)",
              filter: "blur(1px)",
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle at 50% 95%, rgba(0,0,0,0.35) 0%, transparent 48%)",
            }}
          />

          <div className="relative z-[3] flex flex-col items-center justify-center px-2 text-center">
            <p className="bework-ia-cinema-title font-heading leading-none tracking-tight">IA</p>
            <p className="mt-1.5 max-w-[6rem] text-[8px] font-bold uppercase leading-[1.35] tracking-[0.12em] text-sky-50 sm:text-[8.5px]">
              Au service des pros du BTP
            </p>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute left-1/2 top-[48%] z-10 h-[9.1rem] w-[9.1rem] -translate-x-1/2 -translate-y-1/2">
        <div className="bework-ia-flare absolute left-[6%] top-[18%] h-1 w-1 rounded-full bg-white/60 blur-[1px]" />
        <div
          className="bework-ia-flare absolute right-[10%] top-[28%] h-0.5 w-0.5 rounded-full bg-cyan-200/70 blur-[0.5px]"
          style={{ animationDelay: "0.8s" }}
        />
        <div
          className="bework-ia-flare absolute bottom-[22%] right-[14%] h-1.5 w-1.5 rounded-full bg-violet-200/50 blur-[1px]"
          style={{ animationDelay: "1.4s" }}
        />
      </div>
    </div>
  );
}
