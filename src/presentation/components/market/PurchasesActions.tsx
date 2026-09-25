"use client";

import { useState } from "react";
import { Icon } from "@/presentation/components/ui/Icon";
import { PurchaseModals } from "./PurchaseModals";
import { ShoppingList } from "./ShoppingList";

type ActiveModal = "compra" | "lista" | null;

export function PurchasesActions() {
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  return (
    <>
      <div className="mkt-section">
        <div className="mkt-section-header">
          <h2 className="mkt-section-title">Acciones</h2>
        </div>
        <div className="mkt-quick-actions">
          <button type="button" className="mkt-action-card" onClick={() => setActiveModal("compra")}>
            <div className="mkt-action-icon accent">
              <Icon name="shopping-cart" size={20} />
            </div>
            <div className="mkt-action-body">
              <h3>Registrar compra</h3>
              <p>Agrega los productos comprados, con precios y fechas</p>
            </div>
          </button>
          <button type="button" className="mkt-action-card" onClick={() => setActiveModal("lista")}>
            <div className="mkt-action-icon secondary">
              <Icon name="list" size={20} />
            </div>
            <div className="mkt-action-body">
              <h3>Lista de compras</h3>
              <p>Anota lo que necesitas y márcalo al conseguirlo</p>
            </div>
          </button>
        </div>
      </div>

      <PurchaseModals open={activeModal === "compra"} onClose={() => setActiveModal(null)} />
      <ShoppingList open={activeModal === "lista"} onClose={() => setActiveModal(null)} />
    </>
  );
}