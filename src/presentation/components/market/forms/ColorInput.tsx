"use client";

import { Icon } from "@/presentation/components/ui/Icon";

interface ColorInputProps {
  readonly value: string;
  readonly onChange: (v: string) => void;
}

export function ColorInput({ value, onChange }: ColorInputProps) {
  return (
    <div className="mkt-color-field">
      <input
        type="color"
        value={value || "#000000"}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Seleccionar color"
      />
      <span className="mkt-color-code">{value ? value.toUpperCase() : "Sin color"}</span>
      {value && (
        <button
          type="button"
          className="mkt-color-clear"
          onClick={() => onChange("")}
          title="Quitar color"
        >
          <Icon name="x" size={14} />
        </button>
      )}
    </div>
  );
}