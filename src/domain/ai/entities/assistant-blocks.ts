export interface RecipeIngredientBlock {
  readonly name: string;
  readonly quantity: string | null;
  readonly available: boolean;
}

export interface RecipeBlock {
  readonly title: string;
  readonly minutes: number | null;
  readonly servings: number | null;
  readonly ingredients: readonly RecipeIngredientBlock[];
  readonly steps: readonly string[];
}

export interface ExpiringProductBlock {
  readonly name: string;
  readonly quantityLabel: string | null;
  readonly daysUntilExpiry: number | null;
}

export type AssistantBlock =
  | { readonly type: "recipe"; readonly recipe: RecipeBlock }
  | { readonly type: "expiring"; readonly items: readonly ExpiringProductBlock[] };
