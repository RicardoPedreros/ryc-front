import type {
  AssistantBlock,
  ExpiringProductBlock,
  RecipeBlock,
} from "@/domain/ai/entities/assistant-blocks";
import { Icon } from "@/presentation/components/ui/Icon";

function RecipeCard({ recipe }: { readonly recipe: RecipeBlock }) {
  return (
    <div className="asst-recipe">
      <div className="asst-recipe-head">
        <div>
          <h3>{recipe.title}</h3>
          <div className="asst-recipe-meta">
            {recipe.minutes != null && (
              <span><Icon name="clock" size={13} /> {recipe.minutes} min</span>
            )}
            {recipe.servings != null && (
              <span><Icon name="users" size={13} /> {recipe.servings} porciones</span>
            )}
          </div>
        </div>
      </div>

      <ul className="asst-ing-list">
        {recipe.ingredients.map((ingredient, index) => (
          <li className="asst-ing-row" key={`${ingredient.name}-${index}`}>
            <span className="asst-ing-name">
              <span className={`asst-ing-mark ${ingredient.available ? "ok" : "miss"}`}>
                {ingredient.available ? <Icon name="check" strokeWidth={2.5} size={10} /> : <Icon name="x" strokeWidth={2.5} size={10} />}
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
