"use client";

type ModalType = "compra" | "producto" | "tienda";

interface QuickActionsProps {
  readonly onOpenModal: (type: ModalType) => void;
}

export function QuickActions({ onOpenModal }: QuickActionsProps) {
  return (
    <div className="mkt-quick-actions">
      <button className="mkt-action-card" onClick={() => onOpenModal("compra")}>
        <div className="mkt-action-icon accent">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
          </svg>
        </div>
        <div className="mkt-action-body">
          <h3>Nueva compra</h3>
          <p>Registrar lo que compraron</p>
        </div>
      </button>
      <button className="mkt-action-card" onClick={() => onOpenModal("producto")}>
        <div className="mkt-action-icon secondary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>
        <div className="mkt-action-body">
          <h3>Agregar producto</h3>
          <p>Añadir a tu catálogo</p>
        </div>
      </button>
      <button className="mkt-action-card" onClick={() => onOpenModal("tienda")}>
        <div className="mkt-action-icon success">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <div className="mkt-action-body">
          <h3>Agregar tienda</h3>
          <p>Registrar un nuevo lugar</p>
        </div>
      </button>
    </div>
  );
}
