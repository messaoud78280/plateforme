import Image from "next/image";
import { BEWORK_BRAND_SIGNATURE } from "@/lib/seo-keywords";

/** Logo wordmark BeWork + baseline « Apprendre aujourd’hui / Créer demain » */
const LOGO_PATH = "/BeWork.logo.brand.png";
/** Ratio intrinsèque du fichier (évite déformation) */
const LOGO_RATIO = 1024 / 334;

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
    heightClass: "h-16 sm:h-[4.75rem]",
    heightPx: 76,
    sizes: "270px",
  },
  md: {
    heightClass: "h-[5.4rem] md:h-24",
    heightPx: 97,
    sizes: "(max-width:768px) 320px, 400px",
  },
  lg: {
    heightClass: "h-24 md:h-[6.75rem] lg:h-[8.1rem]",
    heightPx: 130,
    sizes: "(max-width:768px) 400px, 510px",
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
  const defaultTagline = BEWORK_BRAND_SIGNATURE;
  const box = sizeBox[size];
  const displayHeight = box.heightPx;
  const displayWidth = Math.round(displayHeight * LOGO_RATIO);
  const override = imageClassName.trim();

  return (
    <span className={`inline-flex flex-col ${className}`}>
      <Image
        src={LOGO_PATH}
        alt="BeWork — Apprendre aujourd’hui, créer demain"
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
