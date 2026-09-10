"use client";

import { useState } from "react";

export default function BrandLogoInput() {
  const [domain, setDomain] = useState("nike.com");

  const encoded = encodeURIComponent(domain);

  return (
    <div>
      <input
        type="text"
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
        placeholder="ej. nike.com"
        className="w-full rounded-md border border-gray-300 px-3 py-2"
      />

      {domain && (
        <>
            <img
                src={`/api/market/brand-logo?domain=${encoded}&source=brandfetch`}
                alt={`Logo de ${domain}`}
                className="mt-4 h-20 w-auto"
            />
            <img
                src={`/api/market/brand-logo?domain=${encoded}&source=logo-dev`}
                alt={`Logo de ${domain}`}
                className="mt-4 h-20 w-auto"
            />
        </>
      )}
    </div>
  );
}
