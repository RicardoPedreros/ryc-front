"use client";

import { useState } from "react";

export type BrandLogoSource = "logo-dev" | "brandfetch";

export function buildBrandLogoUrl(domain: string, source: BrandLogoSource): string {
  return `/api/market/brand-logo?domain=${encodeURIComponent(domain)}&source=${source}`;
}

interface BrandLogoProps {
  readonly src: string;
  readonly label: string;
  readonly size?: number;
  readonly showFallback?: boolean;
  readonly className?: string;
}

type LogoStatus = "loading" | "loaded" | "error";

export function BrandLogo({
  src,
  label,
  size = 16,
  showFallback = false,
  className,
}: BrandLogoProps) {
  const [status, setStatus] = useState<LogoStatus>("loading");
  const [lastSrc, setLastSrc] = useState(src);

  if (lastSrc !== src) {
    setLastSrc(src);
    setStatus("loading");
  }

  if (status === "error" && !showFallback) return null;

  return (
    <span
      className={`mkt-brand-logo${showFallback ? " show-fallback" : ""}${className ? ` ${className}` : ""}`}
      style={{ width: size, height: size }}
    >
      {status === "error" ? (
        <span
          className="mkt-brand-logo-fallback"
          style={{ fontSize: Math.max(8, Math.round(size * 0.45)) }}
        >
          {label.trim().charAt(0).toUpperCase() || "?"}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={label}
          width={size}
          height={size}
          loading="lazy"
          className={status === "loaded" ? "loaded" : "pending"}
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
        />
      )}
    </span>
  );
}