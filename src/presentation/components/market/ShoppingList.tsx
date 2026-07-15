"use client";

import { useState } from "react";
import type { ShoppingItem } from "./types";

export function ShoppingList() {
  const [items, setItems] = useState<readonly ShoppingItem[]>([]);
  const [inputValue, setInputValue] = useState("");

  const addItem = () => {
    const name = inputValue.trim();
    if (!name) return;
    const newItem: ShoppingItem = {
      id: crypto.randomUUID(),
      name,
      brand: "",
      presentation: "",
      price: "",
      checked: false,
    };
    setItems((prev) => [...prev, newItem]);
    setInputValue("");
  };

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") addItem();
  };

  const pending = items.filter((i) => !i.checked);
  const done = items.filter((i) => i.checked);

  return (
    <div className="mkt-section">
      <div className="mkt-section-header">
        <h2 className="mkt-section-title">Lista de compras</h2>
        {items.length > 0 && (
          <span className="mkt-section-meta">{pending.length} pendientes</span>
        )}
      </div>
      <div className="mkt-card">
        {items.length === 0 && !inputValue && (
          <div className="mkt-empty-state">
            <p>Lista vacía</p>
            <p className="mkt-empty-sub">Agregá productos para armar tu lista de compras</p>
          </div>
        )}

        {pending.map((item) => (
          <div key={item.id} className="mkt-list-item">
            <button
              type="button"
              className="mkt-list-check"
              onClick={() => toggleItem(item.id)}
              aria-label={`Marcar ${item.name}`}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="mkt-list-item-body">
              <span className="mkt-list-item-name">{item.name}</span>
            </div>
            <button
              type="button"
              className="mkt-list-item-remove"
              onClick={() => removeItem(item.id)}
              aria-label={`Eliminar ${item.name}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}

        {done.map((item) => (
          <div key={item.id} className="mkt-list-item done">
            <button
              type="button"
              className="mkt-list-check checked"
              onClick={() => toggleItem(item.id)}
              aria-label={`Desmarcar ${item.name}`}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="mkt-list-item-body">
              <span className="mkt-list-item-name done">{item.name}</span>
            </div>
            <button
              type="button"
              className="mkt-list-item-remove"
              onClick={() => removeItem(item.id)}
              aria-label={`Eliminar ${item.name}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}

        <div className="mkt-add-row">
          <input
            className="mkt-add-row-input"
            type="text"
            placeholder="Agregar producto a la lista..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            type="button"
            className="mkt-add-row-btn"
            onClick={addItem}
            aria-label="Agregar"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
