import { NextRequest, NextResponse } from "next/server";

const ALLOWED_SOURCES = ["logo-dev", "brandfetch"] as const;
type AllowedSource = (typeof ALLOWED_SOURCES)[number];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain")?.trim();
  const source = searchParams.get("source")?.trim() as AllowedSource | null;

  if (!domain || !source) {
    return NextResponse.json({ error: "domain and source are required" }, { status: 400 });
  }

  if (!ALLOWED_SOURCES.includes(source)) {
    return NextResponse.json({ error: `Invalid source. Allowed: ${ALLOWED_SOURCES.join(", ")}` }, { status: 400 });
  }

  let targetUrl: string;

  switch (source) {
    case "logo-dev": {
      const token = process.env.LOGO_DEV_TOKEN;
      if (!token) {
        return NextResponse.json({ error: "LOGO_DEV_TOKEN not configured" }, { status: 500 });
      }
      targetUrl = `https://img.logo.dev/${encodeURIComponent(domain)}?token=${token}&format=png&cacheBust=${Date.now()}`;
      break;
    }
    case "brandfetch": {
      const clientId = process.env.BRANDFETCH_CLIENT_ID;
      if (!clientId) {
        return NextResponse.json({ error: "BRANDFETCH_CLIENT_ID not configured" }, { status: 500 });
      }
      targetUrl = `https://cdn.brandfetch.io/${encodeURIComponent(domain)}/icon.png?c=${clientId}&cacheBust=${Date.now()}`;
      break;
    }
  }

  try {
    const res = await fetch(targetUrl, {
      cache: "no-store",
      redirect: "manual",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
        "Accept":
          "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
    });


    if (!res.ok) {
      return new NextResponse(null, { status: res.status });
    }

    const contentType = res.headers.get("content-type") ?? "image/png";
    const body = await res.arrayBuffer();
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=3600",
      },
    });

  } catch {
    return NextResponse.json({ error: "Failed to fetch logo" }, { status: 502 });
  }
}
