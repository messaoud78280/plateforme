/** Fond grille + halos — même langage que le hero. */
export function BwAtmosphere({
  variant = "default",
}: {
  variant?: "default" | "soft" | "violet" | "peach";
}) {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          backgroundColor: "#f7f8fb",
          backgroundImage:
            "linear-gradient(rgba(15,23,42,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {variant === "violet" ? (
          <>
            <div className="absolute -right-20 top-0 h-80 w-80 rounded-full bg-[#c4b5fd]/35 blur-[100px]" />
            <div className="absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-[#93c5fd]/25 blur-[90px]" />
          </>
        ) : variant === "peach" ? (
          <>
            <div className="absolute left-[10%] top-10 h-72 w-72 rounded-full bg-[#fdba74]/25 blur-[100px]" />
            <div className="absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-[#93c5fd]/30 blur-[90px]" />
          </>
        ) : variant === "soft" ? (
          <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-[#93c5fd]/20 blur-[110px]" />
        ) : (
          <>
            <div className="absolute -left-20 top-8 h-72 w-72 rounded-full bg-[#93c5fd]/30 blur-[100px]" />
            <div className="absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-[#c4b5fd]/30 blur-[100px]" />
            <div className="absolute bottom-8 left-[35%] h-48 w-48 rounded-full bg-[#fdba74]/20 blur-[80px]" />
          </>
        )}
      </div>
    </>
  );
}
