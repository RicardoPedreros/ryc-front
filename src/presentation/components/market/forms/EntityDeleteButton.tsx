"use client";

import { useState } from "react";
import { useAuth } from "@/presentation/hooks/useAuth";
import { Icon } from "@/presentation/components/ui/Icon";

interface EntityDeleteButtonProps {
  readonly endpoint: string;
  readonly id: string;
  readonly label?: string;
  readonly confirmMessage: string;
  readonly onDeleted: () => void;
}

export function EntityDeleteButton({
  endpoint,
  id,
  label = "Eliminar",
  confirmMessage,
  onDeleted,
}: EntityDeleteButtonProps) {
  const { user, loading } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading || user?.roleCode !== "admin") return null;

  const handleClick = async () => {
    if (deleting) return;
    if (!window.confirm(confirmMessage)) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`${endpoint}?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "No se pudo eliminar");
      }
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="mkt-btn-danger"
        onClick={handleClick}
        disabled={deleting}
        aria-label={deleting ? "Eliminando..." : label}
        title={label}
      >
        <Icon name="trash-2" size={16} />
      </button>
      {error && <p className="mkt-delete-error" role="alert">{error}</p>}
    </>
  );
}