interface IATASKLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const sizes = { sm: 32, md: 48, lg: 64 };

export function IATASKLogo({
  className = "",
  size = "md",
  showText = true,
}: IATASKLogoProps) {
  const px = sizes[size];
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        width={px}
        height={px}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        {/* Forme type "tâche" / check moderne */}
        <rect
          x="8"
          y="8"
          width="48"
          height="48"
          rx="12"
          fill="url(#iatask-gradient)"
        />
        <path
          d="M20 32l8 8 16-16"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient
            id="iatask-gradient"
            x1="8"
            y1="8"
            x2="56"
            y2="56"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#2563eb" />
            <stop offset="1" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>
      </svg>
      {showText && (
        <span
          className="font-bold tracking-tight text-[#0f172a]"
          style={{ fontSize: size === "sm" ? "1rem" : size === "md" ? "1.25rem" : "1.5rem" }}
        >
          IATASK
        </span>
      )}
    </div>
  );
}
