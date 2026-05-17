/**
 * Badge IA hero — boule 3D « sortie d’écran », typo IA cinéma, sous-titre BTP discret.
 */
export function HomeHeroIaPlanBadge() {
  return (
    <div className="bework-ia-cinema-scene relative h-[min(320px,82vw)] w-[min(320px,82vw)] max-w-[320px] shrink-0" aria-hidden>
      <div
        className="bework-ia-cinema-halo pointer-events-none absolute left-1/2 top-[48%] h-[14rem] w-[14rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(56,189,248,0.4) 0%, rgba(99,102,241,0.15) 38%, transparent 68%)",
        }}
      />

      <div
        className="pointer-events-none absolute left-1/2 top-[72%] z-0 h-[1.75rem] w-[62%] -translate-x-1/2 rounded-[100%]"
        style={{
          background: "radial-gradient(ellipse, rgba(15,23,42,0.45) 0%, transparent 72%)",
          filter: "blur(10px)",
          transform: "translateX(-50%) scaleY(0.55)",
        }}
      />

      <div className="bework-ia-sphere-pop absolute left-1/2 top-[48%] z-20 -translate-x-1/2 -translate-y-1/2">
        <div className="bework-ia-sphere relative flex h-[11.25rem] w-[11.25rem] flex-col items-center justify-center overflow-hidden rounded-full sm:h-[12rem] sm:w-[12rem]">
          <div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 28% 22%, #7dd3fc 0%, #2563eb 22%, #1e3a8a 48%, #0f172a 72%, #020617 100%)",
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 78% 82%, transparent 58%, rgba(34,211,238,0.22) 72%, rgba(167,139,250,0.12) 88%, transparent 100%)",
            }}
          />
          <div
            className="pointer-events-none absolute left-[12%] top-[8%] h-[38%] w-[44%] rounded-full"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.15) 45%, transparent 70%)",
              filter: "blur(1px)",
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle at 50% 95%, rgba(0,0,0,0.55) 0%, transparent 48%)",
            }}
          />

          <div className="relative z-[3] flex flex-col items-center justify-center px-3 text-center">
            <p className="bework-ia-cinema-title font-heading leading-none tracking-tight">IA</p>
            <p className="mt-2 max-w-[8.5rem] text-[8.5px] font-medium uppercase leading-[1.35] tracking-[0.14em] text-sky-100/85 sm:text-[9px]">
              Au service des pros du BTP
            </p>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute left-1/2 top-[48%] z-10 h-[13rem] w-[13rem] -translate-x-1/2 -translate-y-1/2">
        <div className="bework-ia-flare absolute left-[6%] top-[18%] h-1 w-1 rounded-full bg-white/80 blur-[1px]" />
        <div
          className="bework-ia-flare absolute right-[10%] top-[28%] h-0.5 w-0.5 rounded-full bg-cyan-200/90 blur-[0.5px]"
          style={{ animationDelay: "0.8s" }}
        />
        <div
          className="bework-ia-flare absolute bottom-[22%] right-[14%] h-1.5 w-1.5 rounded-full bg-violet-200/70 blur-[1px]"
          style={{ animationDelay: "1.4s" }}
        />
      </div>
    </div>
  );
}
