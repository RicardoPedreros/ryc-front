"use client";

import { useState } from "react";
import Switch from "@mui/material/Switch";
import Stack from "@mui/material/Stack";
import { useFetch } from "@/presentation/hooks/useFetch";
import { BarcodeScanner } from "@/presentation/components/market/BarcodeScanner";
import type { PendingTemporalProduct } from "@/domain/market/entities/inventory-movement";
import type { Category } from "@/domain/market/entities/category";
import type { Unit } from "@/domain/market/entities/unit";
import type { Brand } from "@/domain/market/entities/brand";

function pendingDisplayName(p: PendingTemporalProduct): string {
  if (p.temporalProductName) return p.temporalProductName;
  if (p.temporalBarcode) return `Código ${p.temporalBarcode}`;
  return "Producto pendiente";
}

function formatQuantity(quantity: number): string {
  return Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(2).replace(/\.?0+$/, "");
}

export function PendingTemporalProductsSection({ onCompleted }: { readonly onCompleted?: () => void }) {
  const { data: pendings, loading, refetch } = useFetch<readonly PendingTemporalProduct[]>("/api/market/inventory/pending-products");
  const [completing, setCompleting] = useState<PendingTemporalProduct | null>(null);

  if (loading || !pendings || pendings.length === 0) return null;

  return (
    <div className="mkt-section">
      <div className="mkt-section-header">
        <h2 className="mkt-section-title">Productos pendientes</h2>
        <span className="mkt-section-meta">{pendings.length}</span>
      </div>
      <div className="mkt-card">
        <p className="mkt-pending-section-hint">
          Registraste productos en compras sin tenerlos en el catálogo. Completalos para sumarlos al inventario.
        </p>
        {pendings.map((pending) => (
          <div key={`${pending.temporalProductName ?? ""}|${pending.temporalBarcode ?? ""}`} className="mkt-pending-row">
            <div className="mkt-pending-body">
              <span className="mkt-pending-name">{pendingDisplayName(pending)}</span>
              <span className="mkt-pending-meta">
                {pending.movementCount} movimiento{pending.movementCount !== 1 ? "s" : ""}
                {" · "}
                {formatQuantity(pending.totalQuantity)} unidad{pending.totalQuantity !== 1 ? "es" : ""}
              </span>
            </div>
            <button type="button" className="mkt-btn-submit mkt-pending-complete-btn" onClick={() => setCompleting(pending)}>
              Completar
            </button>
          </div>
        ))}
      </div>

      {completing && (
        <CompletePendingProduct
          pending={completing}
          onClose={() => setCompleting(null)}
          onCompleted={() => {
            setCompleting(null);
            refetch();
            onCompleted?.();
          }}
        />
      )}
    </div>
  );
}

function CompletePendingProduct({
  pending,
  onClose,
  onCompleted,
}: {
  readonly pending: PendingTemporalProduct;
  readonly onClose: () => void;
  readonly onCompleted: () => void;
}) {
  const { data: categories } = useFetch<readonly Category[]>("/api/market/categories");
  const { data: units } = useFetch<readonly Unit[]>("/api/market/units");
  const { data: brands } = useFetch<readonly Brand[]>("/api/market/brands");
  const [notificate, setNotificate] = useState(true);
  const [customAlarms, setCustomAlarms] = useState(false);
  const [barcode, setBarcode] = useState(pending.temporalBarcode ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parentBrands = (brands ?? []).filter((b) => !b.parentBrandId);
  const childrenMap = new Map<string, Brand[]>();
  for (const b of brands ?? []) {
    if (b.parentBrandId) {
      if (!childrenMap.has(b.parentBrandId)) childrenMap.set(b.parentBrandId, []);
      childrenMap.get(b.parentBrandId)!.push(b);
    }
  }

  const brandOptions: { readonly brand: Brand; readonly depth: number }[] = [];
  function collectBrandOptions(parentId: string | null, depth: number) {
    const list = parentId === null ? parentBrands : (childrenMap.get(parentId) ?? []);
    const sorted = [...list].sort((a, b) => a.name.localeCompare(b.name));
    for (const b of sorted) {
      brandOptions.push({ brand: b, depth });
      collectBrandOptions(b.id, depth + 1);
    }
  }
  collectBrandOptions(null, 0);

  return (
    <div className="mkt-modal-overlay visible" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="mkt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mkt-modal-handle" />
        <h2>Completar producto</h2>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            const form = new FormData(e.currentTarget);
            const categoryId = form.get("categoryId") as string;
            const unitId = form.get("unitId") as string;
            if (!categoryId || !unitId) return;

            setSubmitting(true);
            try {
              const createdRes = await fetch("/api/market/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: (form.get("name") as string).trim(),
                  brandId: form.get("brandId") || null,
                  categoryId,
                  unitId,
                  presentationQuantity: form.get("presentationQuantity") ? Number(form.get("presentationQuantity")) : null,
                  stockQuantity: 1,
                  minStock: customAlarms ? Number(form.get("minStock")) || 1 : 1,
                  minDays: customAlarms ? Number(form.get("minDays")) || 7 : 7,
                  notificate,
                  barcode: barcode || null,
                }),
              });
              if (!createdRes.ok) {
                const data = (await createdRes.json().catch(() => null)) as { error?: string } | null;
                throw new Error(data?.error ?? "No se pudo crear el producto");
              }
              const created = (await createdRes.json()) as { id: string };

              const linkRes = await fetch("/api/market/inventory/pending-products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  productId: created.id,
                  temporalProductName: pending.temporalProductName,
                  temporalBarcode: pending.temporalBarcode,
                }),
              });
              if (!linkRes.ok) {
                const data = (await linkRes.json().catch(() => null)) as { error?: string } | null;
                throw new Error(data?.error ?? "No se pudieron vincular los movimientos");
              }

              onCompleted();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Ocurrió un error");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <div className="mkt-form-group">
            <label className="mkt-form-label">Nombre</label>
            <input
              name="name"
              className="mkt-form-input"
              type="text"
              defaultValue={pending.temporalProductName ?? ""}
              placeholder="ej. Leche entera"
              required
            />
          </div>
          <div className="mkt-form-row">
            <div className="mkt-form-group">
              <label className="mkt-form-label">Marca (opcional)</label>
              <select name="brandId" className="mkt-form-select" defaultValue="">
                <option value="" disabled>Seleccionar...</option>
                {brandOptions.map(({ brand, depth }) => (
                  <option key={brand.id} value={brand.id}>
                    {"  ".repeat(depth)}{depth > 0 ? "└ " : ""}{brand.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mkt-form-group">
              <label className="mkt-form-label">Categoría</label>
              <select name="categoryId" className="mkt-form-select" defaultValue="" required>
                <option value="" disabled>Seleccionar...</option>
                {[...(categories ?? [])].sort((a, b) => a.name.localeCompare(b.name)).map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mkt-form-row">
            <div className="mkt-form-group">
              <label className="mkt-form-label">Unidad</label>
              <select name="unitId" className="mkt-form-select" defaultValue="" required>
                <option value="" disabled>Seleccionar...</option>
                {[...(units ?? [])].sort((a, b) => a.name.localeCompare(b.name)).map((unit) => (
                  <option key={unit.id} value={unit.id}>{unit.name}</option>
                ))}
              </select>
            </div>
            <div className="mkt-form-group">
              <label className="mkt-form-label">Presentación</label>
              <input name="presentationQuantity" className="mkt-form-input" type="number" step="0.01" placeholder="ej. 1, 0.5" />
            </div>
          </div>
          <div className="mkt-form-group">
            <label className="mkt-form-label">Código de barras (opcional)</label>
            <div className="mkt-form-input-wrap">
              <input
                name="barcode"
                className="mkt-form-input"
                type="text"
                placeholder="Escanear o escribir..."
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
              />
              <BarcodeScanner onScan={(code) => setBarcode(code)} />
            </div>
          </div>

          <div className="mkt-alarms-section">
            <label className="mkt-alarms-toggle">
              <input type="checkbox" checked={customAlarms} onChange={(e) => setCustomAlarms(e.target.checked)} />
              <span className="mkt-pack-toggle-control">
                <span className="mkt-pack-toggle-thumb" />
              </span>
              <span className="mkt-alarms-toggle-text">Personalizar alarmas</span>
            </label>
            {customAlarms && (
              <div className="mkt-alarms-detail">
                <div className="mkt-form-row">
                  <div className="mkt-form-group">
                    <label className="mkt-form-label-sm">Stock mínimo</label>
                    <input name="minStock" className="mkt-form-input" type="number" min="1" step="1" defaultValue={1} />
                  </div>
                  <div className="mkt-form-group">
                    <label className="mkt-form-label-sm">Días mínimos</label>
                    <input name="minDays" className="mkt-form-input" type="number" min="1" step="1" defaultValue={7} />
                  </div>
                </div>
              </div>
            )}
          </div>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 1 }}>
            <Switch checked={notificate} onChange={(e) => setNotificate(e.target.checked)} size="small" />
            <span style={{ fontSize: "0.8125rem", color: "var(--fg)" }}>Notificar si el stock está bajo o por vencer</span>
          </Stack>

          {error && <p className="mkt-form-error" role="alert">{error}</p>}
          <div className="mkt-modal-actions">
            <button type="button" className="mkt-btn-cancel" onClick={onClose} disabled={submitting}>Cancelar</button>
            <button type="submit" className="mkt-btn-submit" disabled={submitting}>
              {submitting ? "Guardando..." : "Completar producto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}