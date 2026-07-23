"use client";

import { useState, useRef, useEffect } from "react";

interface BrandChipProps {
  readonly brandName: string;
  readonly brandPath: string | null;
}

export function BrandChip({ brandName, brandPath }: BrandChipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const isSubBrand = brandPath !== null && brandPath.includes(" → ");

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <span
      ref={ref}
      className={`mkt-brand-chip ${isSubBrand ? "sub" : ""}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => setOpen((v) => !v)}
    >
      {brandName}
      {isSubBrand && (
        <span className={`mkt-brand-chip-arrow ${open ? "open" : ""}`}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6.5 2 3.5 5 6.5 8" />
          </svg>
        </span>
      )}
      {open && isSubBrand && (
        <span className="mkt-brand-tooltip">
          {(brandPath ?? "").split(" → ").map((segment, i, arr) => (
            <span key={`${segment}-${i}`}>
              {i < arr.length - 1 ? (
                <span className="mkt-brand-tooltip-parent">{segment}</span>
              ) : (
                <span className="mkt-brand-tooltip-current">{segment}</span>
              )}
              {i < arr.length - 1 && <span className="mkt-brand-tooltip-sep"> › </span>}
            </span>
          ))}
        </span>
      )}
    </span>
  );
}

export interface BrandPathLookup {
  readonly byId: ReadonlyMap<string, string>;
  readonly byName: ReadonlyMap<string, string>;
}

export function buildBrandPathLookup(
  brands: readonly { readonly id: string; readonly name: string; readonly parentBrandId: string | null }[]
): BrandPathLookup {
  const byId = new Map<string, string>();
  const byName = new Map<string, string>();
  const parentMap = new Map<string, string>();
  const nameMap = new Map<string, string>();

  for (const b of brands) {
    nameMap.set(b.id, b.name);
    if (b.parentBrandId) parentMap.set(b.id, b.parentBrandId);
  }

  function getPath(id: string): string {
    const cached = byId.get(id);
    if (cached) return cached;

    const parts: string[] = [nameMap.get(id) ?? "???"];
    let current = parentMap.get(id);
    const seen = new Set<string>([id]);

    while (current) {
      if (seen.has(current)) break;
      seen.add(current);
      const name = nameMap.get(current);
      if (name) parts.unshift(name);
      current = parentMap.get(current);
    }

    const path = parts.length > 1 ? parts.join(" → ") : "";
    byId.set(id, path);
    return path;
  }

  for (const b of brands) {
    const path = getPath(b.id);
    byName.set(b.name, path);
  }

  return { byId, byName };
}
