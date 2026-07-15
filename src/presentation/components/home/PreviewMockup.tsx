interface MarketItem {
  readonly name: string;
  readonly category: string;
  readonly done: boolean;
}

const MARKET_ITEMS: readonly MarketItem[] = [
  { name: "Leche entera 1L", category: "Lácteos", done: true },
  { name: "Pan integral", category: "Panadería", done: true },
  { name: "Huevos (docena)", category: "Lácteos", done: false },
  { name: "Tomate redondo", category: "Verdulería", done: false },
  { name: "Pechuga de pollo", category: "Carnicería", done: false },
];

const PENDING_COUNT = MARKET_ITEMS.filter((item) => !item.done).length;

export function PreviewMockup() {
  return (
    <section className="preview">
      <div className="preview-card">
        <div className="preview-inner">
          <div className="preview-header">
            <div>
              <h3>Lista del mercado</h3>
              <p>
                {MARKET_ITEMS.length} productos · {PENDING_COUNT} pendientes
              </p>
            </div>
            <span className="sync-badge">Sincronizado</span>
          </div>
          <div className="item-list">
            {MARKET_ITEMS.map((item) => (
              <div
                key={item.name}
                className={`item-row${item.done ? " done" : ""}`}
              >
                <div
                  className={`item-check${item.done ? " checked" : ""}`}
                >
                  {item.done && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                    >
                      <path
                        d="M2.5 6L5 8.5L9.5 3.5"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <span
                  className={`item-name${item.done ? " done" : ""}`}
                >
                  {item.name}
                </span>
                <span className="item-cat">{item.category}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
