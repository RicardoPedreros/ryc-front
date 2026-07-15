export interface ShoppingItem {
  readonly id: string;
  readonly productId: string | null;
  readonly name: string;
  readonly brand: string;
  readonly presentationQuantity: number | null;
  readonly unitSymbol: string | null;
  readonly checked: boolean;
  readonly quantity: number;
}
