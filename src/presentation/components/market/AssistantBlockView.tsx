import type {
  AssistantBlock,
  ExpiringProductBlock,
  RecipeBlock,
} from "@/domain/ai/entities/assistant-blocks";

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function MissingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function ServingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function RecipeCard({ recipe }: { readonly recipe: RecipeBlock }) {
  return (
    <div className="asst-recipe">
      <div className="asst-recipe-head">
        <div>
          <h3>{recipe.title}</h3>
          <div className="asst-recipe-meta">
            {recipe.minutes != null && (
              <span><ClockIcon /> {recipe.minutes} min</span>
            )}
            {recipe.servings != null && (
              <span><ServingsIcon /> {recipe.servings} porciones</span>
            )}
          </div>
        </div>
      </div>

      <ul className="asst-ing-list">
        {recipe.ingredients.map((ingredient, index) => (
          <li className="asst-ing-row" key={`${ingredient.name}-${index}`}>
            <span className="asst-ing-name">
              <span className={`asst-ing-mark ${ingredient.available ? "ok" : "miss"}`}>
                {ingredient.available ? <CheckIcon /> : <MissingIcon />}
              </span>
              {ingredient.name}
              {ingredient.quantity ? ` · ${ingredient.quantity}` : ""}
            </span>
            <span className={`asst-ing-state ${ingredient.available ? "ok" : "miss"}`}>
              {ingredient.available ? "En inventario" : "Falta"}
            </span>
          </li>
        ))}
      </ul>

      {recipe.steps.length > 0 && (
        <details className="asst-steps">
          <summary>Ver receta paso a paso</summary>
          <ol>
            {recipe.steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </details>
      )}
    </div>
  );
}

function dueClass(daysUntilExpiry: number | null): string {
  if (daysUntilExpiry !== null && daysUntilExpiry <= 2) return "urgent";
  return "soon";
}

function dueLabel(daysUntilExpiry: number | null): string {
  if (daysUntilExpiry === null) return "Sin fecha";
  if (daysUntilExpiry < 0) return `Vencido hace ${Math.abs(daysUntilExpiry)}d`;
  if (daysUntilExpiry === 0) return "Vence hoy";
  if (daysUntilExpiry === 1) return "Vence en 1 día";
  return `Vence en ${daysUntilExpiry} días`;
}

function ExpiringList({ items }: { readonly items: readonly ExpiringProductBlock[] }) {
  return (
    <ul className="asst-expiry-list">
      {items.map((item, index) => (
        <li className="asst-expiry-row" key={`${item.name}-${index}`}>
          <span>
            {item.name}
            {item.quantityLabel ? ` · ${item.quantityLabel}` : ""}
          </span>
          <span className={`asst-due ${dueClass(item.daysUntilExpiry)}`}>
            {dueLabel(item.daysUntilExpiry)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function AssistantBlockView({ block }: { readonly block: AssistantBlock }) {
  if (block.type === "recipe") {
    return <RecipeCard recipe={block.recipe} />;
  }
  return <ExpiringList items={block.items} />;
}
