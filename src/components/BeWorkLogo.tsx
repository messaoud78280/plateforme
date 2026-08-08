import Image from "next/image";

/** Logo wordmark header BeWork (Be noir + Work bleu) */
const LOGO_PATH = "/BeWork.logo.wordmark.png";
/** Ratio intrinsèque du fichier (évite déformation) */
const LOGO_RATIO = 968 / 209;

interface BeWorkLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  /** Permet d’overrider uniquement la taille de l’image (ex. header) */
  imageClassName?: string;
  showTagline?: boolean;
  /** Ligne principale du sous-titre (ex. positionnement métier) */
  tagline?: string;
  /** Ligne secondaire, plus discrète (ex. promesse IA / zone) */
  taglineSub?: string;
  /** Image prioritaire (ex. premier écran homepage) */
  priority?: boolean;
}

/** Hauteur CSS + largeur layout (évite que Next/Image force 968px et passe sous la nav) */
const sizeBox: Record<
  NonNullable<BeWorkLogoProps["size"]>,
  { heightClass: string; heightPx: number; sizes: string }
> = {
  sm: {
    heightClass: "h-10 sm:h-11",
    heightPx: 44,
    sizes: "200px",
  },
  md: {
    heightClass: "h-12 md:h-14",
    heightPx: 56,
    sizes: "(max-width:768px) 220px, 280px",
  },
  lg: {
    heightClass: "h-14 md:h-16 lg:h-[4.5rem]",
    heightPx: 72,
    sizes: "(max-width:768px) 280px, 360px",
  },
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
  const defaultTagline = "Plateformes intelligentes pour le BTP";
  const box = sizeBox[size];
  const displayHeight = box.heightPx;
  const displayWidth = Math.round(displayHeight * LOGO_RATIO);
  const override = imageClassName.trim();

  return (
    <span className={`inline-flex flex-col ${className}`}>
      <Image
        src={LOGO_PATH}
        alt="BeWork — plateformes intelligentes pour le BTP"
        width={displayWidth}
        height={displayHeight}
        className={`block shrink-0 object-contain object-left ${override || box.heightClass} ${override ? "" : "w-auto"}`}
        sizes={override ? "(max-width:640px) 156px, 200px" : box.sizes}
        quality={100}
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
