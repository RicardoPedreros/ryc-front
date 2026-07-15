"use client";

import { useEffect, useRef, useState } from "react";

interface BarcodeScannerProps {
  readonly onScan: (code: string) => void;
}

export function BarcodeScanner({ onScan }: BarcodeScannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<unknown>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    let mounted = true;

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");

        if (!mounted || !containerRef.current) return;

        const instance = new Html5Qrcode("barcode-reader");
        scannerRef.current = instance;

        await instance.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 280, height: 160 },
            aspectRatio: 1.7778,
          },
          (decodedText: string) => {
            if (!mounted) return;
            onScan(decodedText);
            instance.stop().catch(() => {});
            setIsOpen(false);
          },
          () => {},
        );
      } catch (err: unknown) {
        if (!mounted) return;
        const msg =
          err instanceof Error ? err.message : String(err);
        if (msg.includes("NotAllowedError")) {
          setError("Permiso de cámara denegado. Permití el acceso en tu navegador.");
        } else if (msg.includes("NotFoundError")) {
          setError("No se encontró cámara disponible en este dispositivo.");
        } else {
          setError("No se pudo iniciar la cámara. Probá escribir el código manualmente.");
        }
      }
    };

    startScanner();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        const s = scannerRef.current as { stop: () => Promise<void>; clear: () => void };
        s.stop()
          .then(() => s.clear())
          .catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [isOpen, onScan]);

  const close = () => {
    setIsOpen(false);
    setError(null);
  };

  return (
    <>
      <button
        type="button"
        className="mkt-barcode-scan-btn"
        onClick={() => {
          setError(null);
          setIsOpen(true);
        }}
        title="Escanear código de barras"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7V5a2 2 0 012-2h2" />
          <path d="M17 3h2a2 2 0 012 2v2" />
          <path d="M21 17v2a2 2 0 01-2 2h-2" />
          <path d="M7 21H5a2 2 0 01-2-2v-2" />
          <line x1="7" y1="12" x2="17" y2="12" />
          <line x1="7" y1="8" x2="17" y2="8" />
          <line x1="7" y1="16" x2="17" y2="16" />
        </svg>
      </button>

      {isOpen && (
        <div className="mkt-scanner-overlay" onClick={close}>
          <div className="mkt-scanner-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mkt-scanner-header">
              <h3>Escanear código</h3>
              <button type="button" className="mkt-scanner-close" onClick={close}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="mkt-scanner-body">
              {error ? (
                <div className="mkt-scanner-error">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p>{error}</p>
                  <button type="button" className="mkt-btn-submit" onClick={close} style={{ flex: "none", padding: "0.625rem 1.5rem" }}>
                    Entendido
                  </button>
                </div>
              ) : (
                <>
                  <div ref={containerRef} id="barcode-reader" className="mkt-scanner-reader" />
                  <p className="mkt-scanner-hint">Apuntá a un código de barras dentro del recuadro</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
