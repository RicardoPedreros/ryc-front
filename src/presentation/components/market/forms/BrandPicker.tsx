"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ModalShell } from "@/presentation/components/market/ModalShell";
import type { Brand } from "@/domain/market/entities/brand";

interface BrandPickerProps {
  readonly brands: readonly Brand[];
  readonly initialBrandId?: string | null;
  readonly onOpenBrandForm?: (name: string) => void;
}

export function BrandPicker({ brands, initialBrandId = null, onOpenBrandForm }: BrandPickerProps) {
  const [query, setQuery] = useState(() => {
    const initial = initialBrandId ? brands.find((b) => b.id === initialBrandId) : undefined;
    return initial?.name ?? "";
  });
  const [selectedId, setSelectedId] = useState<string | null>(initialBrandId);
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingName, setPendingName] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  const options = useMemo(() => {
    const result: { readonly brand: Brand; readonly depth: number }[] = [];
    const parentBrands = brands.filter((b) => !b.parentBrandId);
    const childrenMap = new Map<string, Brand[]>();
    for (const b of brands) {
      if (b.parentBrandId) {
        if (!childrenMap.has(b.parentBrandId)) childrenMap.set(b.parentBrandId, []);
        childrenMap.get(b.parentBrandId)!.push(b);
      }
    }
    function collect(parentId: string | null, depth: number) {
      const list = parentId === null ? parentBrands : (childrenMap.get(parentId) ?? []);
      const sorted = [...list].sort((a, b) => a.name.localeCompare(b.name));
      for (const b of sorted) {
        result.push({ brand: b, depth });
        collect(b.id, depth + 1);
      }
    }
    collect(null, 0);
    return result;
  }, [brands]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? options.filter((o) => o.brand.name.toLowerCase().includes(q))
    : options;
  const showAdd = q.length > 0 && filtered.length === 0 && onOpenBrandForm != null;

  const selectBrand = useCallback((brand: Brand) => {
    setSelectedId(brand.id);
    setQuery(brand.name);
    setOpen(false);
  }, []);

  const openConfirm = useCallback(() => {
    setPendingName(query.trim());
    setOpen(false);
    setConfirmOpen(true);
  }, [query]);

  const cancelConfirm = useCallback(() => setConfirmOpen(false), []);

  const continueConfirm = useCallback(() => {
    const name = pendingName.trim();
    setConfirmOpen(false);
    if (name && onOpenBrandForm) onOpenBrandForm(name);
  }, [pendingName, onOpenBrandForm]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "Enter" && open) {
      const first = filtered[0];
      if (first) {
        e.preventDefault();
        selectBrand(first.brand);
      } else if (showAdd) {
        e.preventDefault();
        openConfirm();
      }
    }
  };

  return (
    <>
      <div className="mkt-search-input-wrap" ref={wrapRef}>
        <input type="hidden" name="brandId" value={selectedId ?? ""} />
        <input
          className="mkt-search-input-field"
          type="text"
          placeholder="Buscar o escribir una marca..."
          value={query}
          onChange={(e) => {
            const v = e.target.value;
            setQuery(v);
            const selectedBrand = options.find((o) => o.brand.id === selectedId)?.brand;
            if (selectedBrand && selectedBrand.name !== v) setSelectedId(null);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {open && (
          <div className="mkt-search-dropdown">
            {filtered.map(({ brand, depth }) => (
              <button
                key={brand.id}
                type="button"
                className={`mkt-search-result${brand.id === selectedId ? " mkt-search-result-selected" : ""}`}
                onClick={() => selectBrand(brand)}
              >
                <span className="mkt-search-result-body">
                  <span className="mkt-search-result-name">
                    {"  ".repeat(depth)}{depth > 0 ? "└ " : ""}{brand.name}
                    {brand.id === selectedId && <span className="mkt-search-result-badge">Seleccionada</span>}
                  </span>
                </span>
              </button>
            ))}
            {showAdd && (
              <div className="mkt-search-add-temporal-wrap">
                <span className="mkt-search-no-results">No se encontró la marca &ldquo;{query.trim()}&rdquo;</span>
                <button type="button" className="mkt-search-add-temporal" onClick={openConfirm}>
                  Agregar &ldquo;{query.trim()}&rdquo; como nueva marca
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <ModalShell open={confirmOpen} onClose={cancelConfirm}>
        <h2>Crear nueva marca</h2>
        <p className="mkt-confirm-msg">
          Se cerrará el formulario de producto y se abrirá el de marca para crear &ldquo;{pendingName.trim()}&rdquo;.
          Los datos que hayas completado en el producto se perderán.
        </p>
        <p className="mkt-confirm-msg mkt-confirm-msg-muted">
          Sugerencia: podés guardar el producto sin marca ahora, crear la marca y luego editar el producto para asignarle la marca.
        </p>
        <div className="mkt-modal-actions">
          <button type="button" className="mkt-btn-cancel" onClick={cancelConfirm}>Cancelar</button>
          <button type="button" className="mkt-btn-submit" onClick={continueConfirm}>Continuar</button>
        </div>
      </ModalShell>
    </>
  );
}