import Image from "next/image";

interface LogoProps {
  iconSize?: number;
  textClassName?: string;
  className?: string;
}

export default function Logo({
  iconSize = 40,
  textClassName = "text-lg",
  className = "",
}: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Image
        src="/drivary-icon-512.png"
        alt="Drivary Car"
        width={iconSize}
        height={iconSize}
        className="rounded-md object-contain"
        style={{ width: iconSize, height: iconSize }}
        priority
      />
      <span
        className={`font-display font-extrabold leading-none text-white ${textClassName}`}
      >
        DRIVARY <span className="text-[var(--color-red-primary)]">CAR</span>
      </span>
    </div>
  );
}
