"use client";

import { useState, useEffect } from "react";

interface TestResult {
  readonly step: string;
  readonly status: "ok" | "error";
  readonly detail: string;
  readonly duration?: number;
}

interface TestResponse {
  readonly ok: boolean;
  readonly results: readonly TestResult[];
}

export default function TestDbPage() {
  const [data, setData] = useState<TestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch("/api/test-db");
      const json: TestResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al conectar con la API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void (async () => {
      await runTest();
    })();
  }, []);

  return (
    <main style={{ fontFamily: "monospace", padding: "2rem", maxWidth: "800px" }}>
      <h1 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>Test DB Connection</h1>
      <p style={{ fontSize: "0.875rem", color: "var(--fg-muted)", marginBottom: "1.5rem" }}>
        Validación de conexión a Neon PostgreSQL
      </p>

      <button
        onClick={runTest}
        disabled={loading}
        style={{
          padding: "0.5rem 1rem",
          marginBottom: "1.5rem",
          cursor: loading ? "wait" : "pointer",
        }}
      >
        {loading ? "Ejecutando..." : "Re-ejecutar"}
      </button>

      {error && (
        <div style={{ color: "var(--danger)", marginBottom: "1rem" }}>
          Error de red: {error}
        </div>
      )}

      {data && (
        <div>
          <div style={{ marginBottom: "1rem", fontWeight: 700 }}>
            Estado general: {data.ok ? "OK" : "FALLÓ"}
          </div>

          {data.results.map((result, i) => (
            <div
              key={i}
              style={{
                marginBottom: "0.75rem",
                padding: "0.75rem",
                border: "1px solid var(--border)",
                borderRadius: "4px",
              }}
            >
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <span
                  style={{
                    display: "inline-block",
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: result.status === "ok" ? "var(--success)" : "var(--danger)",
                  }}
                />
                <strong>{result.step}</strong>
                {result.duration != null && (
                  <span style={{ color: "var(--fg-subtle)", fontSize: "0.75rem" }}>
                    ({result.duration}ms)
                  </span>
                )}
              </div>
              <pre
                style={{
                  marginTop: "0.5rem",
                  fontSize: "0.8125rem",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                }}
              >
                {result.detail}
              </pre>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
