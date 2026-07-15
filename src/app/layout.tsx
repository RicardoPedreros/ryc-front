import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RYC — Tu hogar, organizado juntos",
  description:
    "Gestiona las compras del mercado, las tareas del hogar y el presupuesto familiar desde un solo lugar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html
        lang="es"
        className={`${geistSans.variable} ${geistMono.variable}`}
        suppressHydrationWarning
      >
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            (function(){try{var t=localStorage.getItem('ryc-theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t)}else if(window.matchMedia('(prefers-color-scheme:dark)').matches){document.documentElement.setAttribute('data-theme','dark')}}catch(e){}})()
          `,
        }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
