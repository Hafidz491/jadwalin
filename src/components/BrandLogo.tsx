import Image from 'next/image';

interface BrandLogoProps {
  /** Icon size in px */
  size?: number;
  /** Show the "Smart Booking" tagline under the wordmark */
  showTagline?: boolean;
  className?: string;
  priority?: boolean;
}

/**
 * Logo Jadwalin untuk latar gelap: ikon asli + wordmark teks terang.
 * (logo.png versi wordmark berwarna navy sehingga tidak terbaca di dark theme.)
 */
export function BrandLogo({ size = 30, showTagline = false, className = '', priority = false }: BrandLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="relative inline-flex shrink-0">
        <span className="absolute inset-0 rounded-full bg-emerald-400/25 blur-md" aria-hidden />
        <Image
          src="/logo-icon.png"
          alt="Jadwalin"
          width={size}
          height={size}
          priority={priority}
          className="relative object-contain"
          style={{ width: size, height: size }}
        />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-[17px] font-semibold tracking-[-0.03em] text-white">
          Jadwalin<span className="text-emerald-400">.</span>
        </span>
        {showTagline && (
          <span className="mt-1 font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-slate-500">
            Smart Booking
          </span>
        )}
      </span>
    </span>
  );
}
