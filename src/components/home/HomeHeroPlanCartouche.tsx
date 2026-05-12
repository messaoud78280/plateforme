/** Cartouche type planche DAO — visible sous le bloc principal du hero */
export function HomeHeroPlanCartouche() {
  return (
    <div
      className="pointer-events-none relative z-[2] mx-auto mt-10 flex w-full max-w-[440px] justify-center px-4 sm:mt-12 md:mt-14"
      aria-hidden
    >
      <div
        className="w-full rounded-md border border-[#2563eb]/25 bg-white/75 px-4 py-2.5 shadow-[0_8px_28px_-14px_rgba(15,23,42,0.14)] backdrop-blur-[2px] ring-1 ring-slate-200/60"
        style={{ fontFamily: "ui-monospace, monospace" }}
      >
        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[9px] uppercase leading-tight tracking-[0.12em] text-slate-600 md:text-[10px] md:tracking-[0.14em]">
          <span className="text-slate-500">Projet</span>
          <span className="font-semibold text-[#1e40af]">BeWork</span>
          <span className="text-slate-500">Échelle</span>
          <span className="text-slate-700">1 : 50</span>
          <span className="text-slate-500">Date</span>
          <span className="text-slate-700">2026</span>
          <span className="text-slate-500">Dessiné par</span>
          <span className="text-slate-700">BW Team</span>
        </div>
        <p className="mt-2 border-t border-slate-200/80 pt-2 text-center text-[8px] tracking-wide text-slate-400 md:text-[9px]">
          Illustration indicative — non contractuelle
        </p>
      </div>
    </div>
  );
}
