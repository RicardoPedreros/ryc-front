"use client";

import { ColorInput } from "./ColorInput";
import { BrandLogo, buildBrandLogoUrl } from "@/presentation/components/market/BrandLogo";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFetch } from "@/presentation/hooks/useFetch";
import type { Brand } from "@/domain/market/entities/brand";

interface BrandFormProps {
  readonly onClose: () => void;
  readonly onCreated: () => void;
}

export function BrandForm({ onClose, onCreated }: BrandFormProps) {
  const { data: brands } = useFetch<readonly Brand[]>("/api/market/brands");
  const parentBrands = (brands ?? []).filter((b) => !b.parentBrandId);
  const [brandColor, setBrandColor] = useState("");
  const [iconValue, setIconValue] = useState("");
  const [logoOptions, setLogoOptions] = useState<readonly { readonly key: string; readonly label: string }[]>([]);
  const [selectedLogoKey, setSelectedLogoKey] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const logoDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchLogoPreviews = useCallback((raw: string) => {
    const domain = raw.trim();
    if (!domain) {
      setLogoOptions([]);
      return;
    }
    setLogoOptions([
      { key: "logodev", label: "" },
      { key: "brandfetch", label: "" },
    ]);
  }, []);

  const handleIconChange = useCallback((v: string) => {
    setIconValue(v);
    setSelectedLogoKey(null);
    setSubmitError(null);
    setLogoOptions([]);
    if (logoDebounceRef.current) clearTimeout(logoDebounceRef.current);
    logoDebounceRef.current = setTimeout(() => fetchLogoPreviews(v), 2000);
  }, [fetchLogoPreviews, setSelectedLogoKey]);

  useEffect(() => () => { if (logoDebounceRef.current) clearTimeout(logoDebounceRef.current); }, []);

  return (
    <>
      <h2>Agregar marca</h2>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setSubmitError(null);
          const form = new FormData(e.currentTarget);
          const name = form.get("name") as string;
          if (!name) return;
          const res = await fetch("/api/market/brands", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              parentBrandId: form.get("parentBrandId") || null,
              icon: selectedLogoKey ? buildBrandLogoUrl(iconValue.trim(), selectedLogoKey === "brandfetch" ? "brandfetch" : "logo-dev") : null,
              color: brandColor || null,
            }),
          });
          if (!res.ok) {
            const data = (await res.json().catch(() => null)) as { error?: string } | null;
            setSubmitError(data?.error ?? "No se pudo crear la marca. Intentalo de nuevo.");
            return;
          }
          onClose();
          onCreated();
        }}
      >
        <div className="mkt-form-group">
          <label className="mkt-form-label">Nombre</label>
          <input name="name" className="mkt-form-input" type="text" placeholder="ej. La Serenísima" required onChange={() => setSubmitError(null)} />
        </div>
        <div className="mkt-form-group">
          <label className="mkt-form-label">Marca padre (opcional)</label>
          <select name="parentBrandId" className="mkt-form-select" defaultValue="">
            <option value="">Sin marca padre</option>
            {parentBrands.map((brand) => (
              <option key={brand.id} value={brand.id}>{brand.name}</option>
            ))}
          </select>
          <span className="mkt-form-hint">Deja vacío para una marca principal. Selecciona una para crear una submarca.</span>
        </div>
        <div className="mkt-form-group">
          <label className="mkt-form-label">Logo / ícono (opcional)</label>
          <input
            className="mkt-form-input"
            type="text"
            placeholder="ej. serenisima"
            value={iconValue}
            onChange={(e) => handleIconChange(e.target.value)}
          />
          <span className="mkt-form-hint">Escribe el dominio de la marca (ej. nike.com, serenisima.com.ar) para ver las opciones de logo.</span>
        </div>
        {logoOptions.length > 0 && (
          <div className="mkt-brand-logo-previews">
            {logoOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                aria-pressed={selectedLogoKey === option.key}
                onClick={() => setSelectedLogoKey((prev) => (prev === option.key ? null : option.key))}
                className={`mkt-brand-logo-option ${selectedLogoKey === option.key ? "selected" : ""}`}
              >
                <BrandLogo
                  src={buildBrandLogoUrl(iconValue.trim(), option.key === "brandfetch" ? "brandfetch" : "logo-dev")}
                  label={`Logo de ${iconValue} (${option.label})`}
                  size={48}
                  showFallback
                  className="mkt-brand-logo-preview"
                />
                <span className="mkt-brand-logo-label">{option.label}</span>
              </button>
            ))}
            <span className="mkt-brand-logo-hint">
              {selectedLogoKey ? "Logo seleccionado. Hacé clic de nuevo para quitarlo." : "Hacé clic sobre el logo para seleccionarlo."}
            </span>
          </div>
        )}
        <div className="mkt-form-group">
          <label className="mkt-form-label">Color (opcional)</label>
          <ColorInput value={brandColor} onChange={setBrandColor} />
        </div>
        {submitError && <p className="mkt-form-error" role="alert">{submitError}</p>}
        <div className="mkt-modal-actions">
          <button type="button" className="mkt-btn-cancel" onClick={onClose}>Cancelar</button>
          <button type="submit" className="mkt-btn-submit">Agregar marca</button>
        </div>
      </form>
    </>
  );
}