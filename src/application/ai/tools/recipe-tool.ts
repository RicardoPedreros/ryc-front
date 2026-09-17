import type { RecipeBlock, RecipeIngredientBlock } from "@/domain/ai/entities/assistant-blocks";
import type { ToolDefinition } from "@/domain/ai/entities/tool";
import type { AssistantTool } from "../assistant-tool";
import { asArray, asBoolean, asNumber, asRecord, asString, type ArgumentRecord } from "../tool-arguments";

function parseIngredients(value: unknown): readonly RecipeIngredientBlock[] {
  return asArray(value).map((raw) => {
    const item = asRecord(raw);
    return {
      name: asString(item.name) ?? "Ingrediente",
      quantity: asString(item.quantity),
      available: asBoolean(item.available) ?? false,
    };
  });
}

function parseSteps(value: unknown): readonly string[] {
  return asArray(value)
    .map((step) => asString(step))
    .filter((step): step is string => step !== null && step.trim().length > 0);
}

function toRecipe(args: ArgumentRecord): RecipeBlock {
  return {
    title: asString(args.title)?.trim() || "Receta sugerida",
    minutes: asNumber(args.minutes),
    servings: asNumber(args.servings),
    ingredients: parseIngredients(args.ingredients),
    steps: parseSteps(args.steps),
  };
}

export function createRecipeTools(): readonly AssistantTool[] {
  const definition: ToolDefinition = {
    name: "propose_recipe",
    description:
      "Muestra una receta al usuario en formato de tarjeta. Usala cuando sugieras una receta concreta. Marcá cada ingrediente con available=true solo si ya está en el inventario (consultanlo antes con get_stock) y false si falta.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Nombre de la receta." },
        minutes: { type: "integer", description: "Tiempo estimado de preparación en minutos." },
        servings: { type: "integer", description: "Cantidad de porciones." },
        ingredients: {
          type: "array",
          description: "Ingredientes de la receta.",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Nombre del ingrediente." },
              quantity: { type: "string", description: "Cantidad con unidad, por ejemplo '500 g'." },
              available: {
                type: "boolean",
                description: "true si el ingrediente está en el inventario, false si falta.",
              },
            },
            required: ["name", "available"],
          },
        },
        steps: {
          type: "array",
          description: "Pasos de la preparación, en orden.",
          items: { type: "string" },
        },
      },
      required: ["title", "ingredients"],
    },
  };

  return [
    {
      definition,
      async execute(args: ArgumentRecord) {
        const recipe = toRecipe(args);
        return {
          result: { ok: true, title: recipe.title },
          block: { type: "recipe" as const, recipe },
        };
      },
    },
  ];
}
