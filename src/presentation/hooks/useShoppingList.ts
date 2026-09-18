"use client";

import { useCallback, useSyncExternalStore } from "react";
import { createJsonLocalStore } from "@/infrastructure/storage/json-local-store";
import { parseShoppingList } from "@/shared/types/shopping-item";
import type { ShoppingItem } from "@/shared/types/shopping-item";

const SHOPPING_LIST_STORAGE_KEY = "ryc-shopping-list";

const store = createJsonLocalStore<ShoppingItem[]>({
  key: SHOPPING_LIST_STORAGE_KEY,
  fallback: [],
  parse: parseShoppingList,
});

export function useShoppingList(): {
  readonly items: readonly ShoppingItem[];
  readonly add: (item: ShoppingItem) => void;
  readonly toggle: (id: string) => void;
  readonly remove: (id: string) => void;
  readonly clear: () => void;
} {
  const items = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  );

  const add = useCallback((item: ShoppingItem) => {
    store.write([...store.read(), item]);
  }, []);

  const toggle = useCallback((id: string) => {
    store.write(store.read().map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)));
  }, []);

  const remove = useCallback((id: string) => {
    store.write(store.read().filter((item) => item.id !== id));
  }, []);

  const clear = useCallback(() => {
    store.write([]);
  }, []);

  return { items, add, toggle, remove, clear };
}