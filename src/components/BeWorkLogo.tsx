import Image from "next/image";

// Logo fourni (inclut déjà la baseline) — filename versionné pour casser tout cache.
const LOGO_PATH = "/BeWork.logo.v2.png";
/** Dimensions intrinsèques du fichier ( évite déformation + layout shift ) */
const LOGO_WIDTH = 1024;
const LOGO_HEIGHT = 341;

interface BeWorkLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  /** Permet d’overrider uniquement la taille de l’image (ex. header plus grand) */
  imageClassName?: string;
  showTagline?: boolean;
  /** Ligne principale du sous-titre (ex. positionnement métier) */
  tagline?: string;
  /** Ligne secondaire, plus discrète (ex. promesse IA / zone) */
  taglineSub?: string;
  /** Image prioritaire (ex. premier écran homepage) */
  priority?: boolean;
}

const imageClassBySize: Record<NonNullable<BeWorkLogoProps["size"]>, string> = {
  sm: "h-11 w-auto max-w-[min(100%,14rem)] sm:h-12 sm:max-w-[min(100%,16rem)] md:h-[3.25rem] md:max-w-[min(100%,18rem)]",
  md: "h-12 w-auto max-w-[min(100%,18rem)] md:h-14 md:max-w-[min(100%,22rem)] lg:h-16 lg:max-w-[min(100%,26rem)]",
  lg: "h-14 w-auto max-w-[min(100%,22rem)] md:h-16 md:max-w-[min(100%,28rem)] lg:h-[4.5rem] lg:max-w-[min(100%,32rem)]",
};

export function BeWorkLogo({
  className = "",
  size = "md",
  imageClassName = "",
  showTagline = false,
  tagline,
  taglineSub,
  priority = false,
}: BeWorkLogoProps) {
  const defaultTagline = "L'assistant administratif à la demande";

  const sizesAttr =
    size === "sm"
      ? "(max-width:768px) 220px, 280px"
      : size === "md"
        ? "(max-width:768px) 260px, 360px"
        : "(max-width:768px) 320px, 420px";

  return (
    <span className={`inline-flex flex-col ${className}`}>
      <Image
        src={LOGO_PATH}
        alt="BeWork"
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        className={`shrink-0 object-contain object-left ${imageClassBySize[size]} ${imageClassName}`}
        sizes={sizesAttr}
        priority={priority}
      />
      {showTagline ? (
        <span className="mt-1 max-w-[calc(100vw-3rem)] self-start py-0.5 sm:mt-1.5 sm:max-w-xl">
          <span className="block text-[11px] font-medium leading-tight tracking-tight text-slate-600 sm:text-xs md:text-[0.8125rem]">
            {tagline ?? defaultTagline}
          </span>
          {taglineSub ? (
            <span className="mt-1 block text-[11px] font-medium leading-snug text-black sm:text-[0.8125rem]">
              {taglineSub}
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
