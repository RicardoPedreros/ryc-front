"use client";

import { useCallback, useSyncExternalStore } from "react";
import { createJsonLocalStore } from "@/infrastructure/storage/json-local-store";
import type { PurchaseItemDraft } from "@/presentation/components/market/purchase-draft";

const PURCHASE_DRAFT_STORAGE_KEY = "ryc-purchase-draft";

export interface PurchaseDraft {
  readonly items: readonly PurchaseItemDraft[];
  readonly storeId: string;
  readonly purchaseDate: string;
  readonly paymentMethodId: string;
  readonly notes: string;
}

export const EMPTY_PURCHASE_DRAFT: PurchaseDraft = {
  items: [],
  storeId: "",
  purchaseDate: "",
  paymentMethodId: "",
  notes: "",
};

function toNumber(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parsePurchaseItem(raw: unknown): PurchaseItemDraft {
  const item = (raw ?? {}) as Record<string, unknown>;
  return {
    productId: item.productId != null ? String(item.productId) : null,
    temporalProductName: item.temporalProductName != null ? String(item.temporalProductName) : null,
    temporalBarcode: item.temporalBarcode != null ? String(item.temporalBarcode) : null,
    quantity: Math.max(1, toNumber(item.quantity, 1)),
    unitPrice: Math.max(0, toNumber(item.unitPrice, 0)),
    discount: Math.max(0, toNumber(item.discount, 0)),
    expirationDate: item.expirationDate != null ? String(item.expirationDate) : "",
    lot: item.lot != null ? String(item.lot) : "",
  };
}

function parsePurchaseDraft(raw: string): PurchaseDraft {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object") return EMPTY_PURCHASE_DRAFT;
    const draft = parsed as Record<string, unknown>;
    const items = Array.isArray(draft.items) ? draft.items.map(parsePurchaseItem) : [];
    return {
      items,
      storeId: typeof draft.storeId === "string" ? draft.storeId : "",
      purchaseDate: typeof draft.purchaseDate === "string" ? draft.purchaseDate : "",
      paymentMethodId: typeof draft.paymentMethodId === "string" ? draft.paymentMethodId : "",
      notes: typeof draft.notes === "string" ? draft.notes : "",
    };
  } catch {
    return EMPTY_PURCHASE_DRAFT;
  }
}

const store = createJsonLocalStore<PurchaseDraft>({
  key: PURCHASE_DRAFT_STORAGE_KEY,
  fallback: EMPTY_PURCHASE_DRAFT,
  parse: parsePurchaseDraft,
});

export function usePurchaseDraft(): {
  readonly draft: PurchaseDraft;
  readonly update: (patch: Partial<PurchaseDraft>) => void;
  readonly clear: () => void;
} {
  const draft = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );

  const update = useCallback((patch: Partial<PurchaseDraft>) => {
    store.write({ ...store.read(), ...patch });
  }, []);

  const clear = useCallback(() => {
    store.write(EMPTY_PURCHASE_DRAFT);
  }, []);

  return { draft, update, clear };
}

export function clearPurchaseDraft(): void {
  store.write(EMPTY_PURCHASE_DRAFT);
}