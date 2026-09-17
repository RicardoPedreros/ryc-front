import type { InventoryUseCases } from "@/application/market/inventory-use-cases";
import type { ProductUseCases } from "@/application/market/product-use-cases";
import type { AssistantTool } from "./assistant-tool";
import { createInventoryTools } from "./tools/inventory-tools";
import { createRecipeTools } from "./tools/recipe-tool";

export interface AssistantToolDependencies {
  readonly inventoryUseCases: InventoryUseCases;
  readonly productUseCases: ProductUseCases;
}

export function createAssistantTools(
  deps: AssistantToolDependencies,
): readonly AssistantTool[] {
  return [...createInventoryTools(deps), ...createRecipeTools()];
}
