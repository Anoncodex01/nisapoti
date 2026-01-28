"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface AuthLogoProps {
  className?: string;
  height?: number;
}

export default function AuthLogo({ className = "w-full flex flex-col items-center mt-10 mb-6", height = 48 }: AuthLogoProps) {
  // Prefer the higher-resolution asset logo; fallback to /logo.png if needed
  const version = process.env.NEXT_PUBLIC_ASSET_VERSION || 'v4';
  const [src, setSrc] = useState<string>(`/assets/images/logos/logo.png?${version}`);

  return (
    <div className={className}>
      <Link href="/">
        {/* Use intrinsic width/height tuned for sharpness on DPR screens */}
        <Image
          src={src}
          alt="Nisapoti"
          width={Math.round(height * 3.2)}
          height={height}
          className="w-auto object-contain"
          priority
          quality={100}
          decoding="async"
          loading="eager"
          onError={() => {
            // Swap source on error, try the alternate asset path
            setSrc(`/logo.png?${version}`);
          }}
        />
      </Link>
    </div>
  );
}
