"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/presentation/components/ui/Icon";

interface BarcodeScannerProps {
  readonly onScan: (code: string) => void;
}

export function BarcodeScanner({ onScan }: BarcodeScannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<unknown>(null);
  const stoppedRef = useRef(false);

  const stopScanner = useCallback(async () => {
    if (stoppedRef.current) return;
    if (!scannerRef.current) return;
    stoppedRef.current = true;
    const s = scannerRef.current as {
      stop: () => Promise<void>;
      clear: () => void;
    };
    try {
      await s.stop();
    } catch {
      // ignore — scanner may already be stopped
    }
    try {
      s.clear();
    } catch {
      // ignore
    }
    scannerRef.current = null;
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;

    const startScanner = async () => {
      setIsLoading(true);
      setError(null);
      stoppedRef.current = false;

      try {
        const { Html5Qrcode } = await import("html5-qrcode");

        if (!mounted) return;

        const instance = new Html5Qrcode("barcode-reader");
        scannerRef.current = instance;

        await instance.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 280, height: 150 },
            aspectRatio: 1.7778,
          },
          (decodedText: string) => {
            if (!mounted) return;
            onScan(decodedText);
            setIsOpen(false);
          },
          () => { },
        );

        if (mounted) setIsLoading(false);
      } catch (err: unknown) {
        if (!mounted) return;
        setIsLoading(false);
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("NotAllowedError")) {
          setError(
            "Permiso de cámara denegado. Permití el acceso en tu navegador.",
          );
        } else if (msg.includes("NotFoundError")) {
          setError("No se encontró cámara disponible en este dispositivo.");
        } else {
          setError(
            "No se pudo iniciar la cámara. Prueba escribir el código manualmente.",
          );
        }
      }
    };

    startScanner();

    return () => {
      mounted = false;
      stoppedRef.current = false;
      stopScanner();
    };
  }, [isOpen, onScan, stopScanner]);

  const open = () => {
    setError(null);
    setIsLoading(true);
    stoppedRef.current = false;
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className="mkt-barcode-scan-btn"
        onClick={open}
        title="Escanear código de barras"
      >
        <Icon name="barcode" size={16} />
      </button>

      {isOpen && (
        <div className="mkt-scanner-overlay mkt-scanner-overlay--visible" onClick={close}>
          <div className="mkt-scanner-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mkt-scanner-header">
              <h3>Escanear código</h3>
              <button type="button" className="mkt-scanner-close" onClick={close}>
                <Icon name="x" size={18} />
              </button>
            </div>
            <div className="mkt-scanner-body">
              {error ? (
                <div className="mkt-scanner-error">
                  <Icon name="alert-circle" size={24} />
                  <p>{error}</p>
                  <button
                    type="button"
                    className="mkt-btn-submit"
                    onClick={close}
                    style={{ flex: "none", padding: "0.625rem 1.5rem" }}
                  >
                    Entendido
                  </button>
                </div>
              ) : (
                <>
                  {isLoading && (
                    <div className="mkt-scanner-loading">
                      <div className="mkt-scanner-spinner" />
                      <p>Iniciando cámara...</p>
                    </div>
                  )}
                  <div id="barcode-reader" className="mkt-scanner-reader" />
                  <p className="mkt-scanner-hint">
                    Apuntá a un código de barras dentro del recuadro
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
