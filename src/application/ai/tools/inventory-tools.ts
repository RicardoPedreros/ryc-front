import type { InventoryStock } from "@/domain/market/entities/inventory-movement";
import type { ExpiringProductBlock } from "@/domain/ai/entities/assistant-blocks";
import type { ToolDefinition } from "@/domain/ai/entities/tool";
import type { InventoryUseCases } from "@/application/market/inventory-use-cases";
import type { ProductUseCases } from "@/application/market/product-use-cases";
import type { AssistantTool, AssistantToolContext } from "../assistant-tool";
import { asNumber, asString, type ArgumentRecord } from "../tool-arguments";

const DEFAULT_EXPIRY_DAYS = 7;
const MAX_EXPIRY_DAYS = 365;

interface InventoryToolDependencies {
  readonly inventoryUseCases: InventoryUseCases;
  readonly productUseCases: ProductUseCases;
}

function quantityLabel(item: InventoryStock): string | null {
  if (item.presentationQuantity != null && item.unitSymbol) {
    return `${item.presentationQuantity}${item.unitSymbol}`;
  }
  if (item.unitSymbol) {
    return `${item.currentStock}${item.unitSymbol}`;
  }
  return null;
}

function toStockSummary(item: InventoryStock) {
  return {
    name: item.name,
    brand: item.brand,
    category: item.categoryName,
    quantity: quantityLabel(item),
    stock: item.currentStock,
    minStock: item.minStock,
    expiresInDays: item.daysUntilExpiry,
  };
}

function getStockTool(deps: InventoryToolDependencies): AssistantTool {
  const definition: ToolDefinition = {
    name: "get_stock",
    description:
      "Devuelve los productos del inventario que tienen stock disponible, con su cantidad, categoría y días hasta el vencimiento. Úsala para saber qué hay antes de recomendar recetas o responder sobre disponibilidad.",
    parameters: { type: "object", properties: {}, required: [] },
  };

  return {
    definition,
    async execute(_args: ArgumentRecord, context: AssistantToolContext) {
      const stock = await deps.inventoryUseCases.getStock(context.userId, context.roleCode);
      const available = stock.filter((item) => item.currentStock > 0);
      return {
        result: {
          productCount: available.length,
          products: available.map(toStockSummary),
        },
      };
    },
  };
}

function getExpiringProductsTool(deps: InventoryToolDependencies): AssistantTool {
  const definition: ToolDefinition = {
    name: "get_expiring_products",
    description:
      "Devuelve los productos que vencen dentro de los próximos días (o ya vencidos). Úsala cuando el usuario pregunte qué se vence pronto o qué conviene usar para no tirar comida.",
    parameters: {
      type: "object",
      properties: {
        days: {
          type: "integer",
          description: "Cantidad de días hacia adelante a considerar. Por defecto 7.",
        },
      },
      required: [],
    },
  };

  return {
    definition,
    async execute(args: ArgumentRecord, context: AssistantToolContext) {
      const requested = asNumber(args.days) ?? DEFAULT_EXPIRY_DAYS;
      const days = Math.min(Math.max(Math.trunc(requested), 0), MAX_EXPIRY_DAYS);

      const stock = await deps.inventoryUseCases.getStock(context.userId, context.roleCode);
      const expiring = stock
        .filter(
          (item) =>
            item.notificate &&
            item.daysUntilExpiry !== null &&
            item.daysUntilExpiry <= days,
        )
        .sort(
          (a, b) => (a.daysUntilExpiry ?? 0) - (b.daysUntilExpiry ?? 0),
        );

      const blockItems: ExpiringProductBlock[] = expiring.map((item) => ({
        name: item.name,
        quantityLabel: quantityLabel(item),
        daysUntilExpiry: item.daysUntilExpiry,
      }));

      return {
        result: {
          days,
          count: expiring.length,
          products: expiring.map(toStockSummary),
        },
        ...(blockItems.length > 0
          ? { block: { type: "expiring" as const, items: blockItems } }
          : {}),
      };
    },
  };
}

function getLowStockProductsTool(deps: InventoryToolDependencies): AssistantTool {
  const definition: ToolDefinition = {
    name: "get_low_stock_products",
    description:
      "Devuelve los productos cuyo stock está en el mínimo o por debajo. Úsala cuando el usuario pregunte qué le falta o qué debería reponer.",
    parameters: { type: "object", properties: {}, required: [] },
  };

  return {
    definition,
    async execute(_args: ArgumentRecord, context: AssistantToolContext) {
      const stock = await deps.inventoryUseCases.getStock(context.userId, context.roleCode);
      const lowStock = stock.filter(
        (item) => item.notificate && item.currentStock <= item.minStock,
      );
      return {
        result: {
          count: lowStock.length,
          products: lowStock.map(toStockSummary),
        },
      };
    },
  };
}

function getProductLotsTool(deps: InventoryToolDependencies): AssistantTool {
  const definition: ToolDefinition = {
    name: "get_product_lots",
    description:
      "Devuelve los lotes de un producto con su cantidad y fecha de vencimiento. Úsala cuando el usuario quiera saber cuánto y de qué lote queda de un producto puntual.",
    parameters: {
      type: "object",
      properties: {
        productName: {
          type: "string",
          description: "Nombre del producto (o parte del nombre) a consultar.",
        },
      },
      required: ["productName"],
    },
  };

  return {
    definition,
    async execute(args: ArgumentRecord, context: AssistantToolContext) {
      const productName = asString(args.productName)?.trim();
      if (!productName) {
        return { result: { error: "Se requiere el nombre del producto." } };
      }

      const stock = await deps.inventoryUseCases.getStock(context.userId, context.roleCode);
      const match = stock.find((item) =>
        item.name.toLowerCase().includes(productName.toLowerCase()),
      );
      if (!match) {
        return {
          result: { error: `No se encontró un producto que coincida con "${productName}".` },
        };
      }

      const lots = await deps.inventoryUseCases.getStockLots(match.id, context.userId, context.roleCode);
      return {
        result: {
          product: match.name,
          lots: lots.map((lot) => ({
            lot: lot.lot,
            quantity: lot.quantity,
            expiresOn: lot.expirationDate,
            expiresInDays: lot.daysUntilExpiry,
          })),
        },
      };
    },
  };
}

function searchProductsTool(deps: InventoryToolDependencies): AssistantTool {
  const definition: ToolDefinition = {
    name: "search_products",
    description:
      "Busca productos por nombre. Úsala para encontrar el nombre exacto de un producto del catálogo cuando no estés seguro de cómo figura.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Texto a buscar dentro del nombre del producto.",
        },
      },
      required: ["query"],
    },
  };

  return {
    definition,
    async execute(args: ArgumentRecord, context) {
      const query = asString(args.query)?.trim();
      if (!query) {
        return { result: { error: "Se requiere un texto de búsqueda." } };
      }

      const results = await deps.productUseCases.searchByName(
        query,
        context.userId,
        context.roleCode,
      );
      return {
        result: {
          count: results.length,
          products: results.slice(0, 20).map((product) => ({
            name: product.name,
            brand: product.brandName,
            category: product.categoryName,
            unit: product.unitSymbol,
            presentationQuantity: product.presentationQuantity,
          })),
        },
      };
    },
  };
}

function getPendingTemporalProductsTool(deps: InventoryToolDependencies): AssistantTool {
  const definition: ToolDefinition = {
    name: "get_pending_temporal_products",
    description:
      "Devuelve los productos temporales cargados en compras que todavía no fueron asociados a un producto del catálogo. Úsala cuando el usuario pregunte por productos sin identificar o pendientes.",
    parameters: { type: "object", properties: {}, required: [] },
  };

  return {
    definition,
    async execute(_args: ArgumentRecord, context: AssistantToolContext) {
      const pending = await deps.inventoryUseCases.getPendingTemporalProducts(context.userId, context.roleCode);
      return {
        result: {
          count: pending.length,
          products: pending.slice(0, 20).map((item) => ({
            name: item.temporalProductName,
            barcode: item.temporalBarcode,
            movements: item.movementCount,
            totalQuantity: item.totalQuantity,
          })),
        },
      };
    },
  };
}

export function createInventoryTools(deps: InventoryToolDependencies): readonly AssistantTool[] {
  return [
    getStockTool(deps),
    getExpiringProductsTool(deps),
    getLowStockProductsTool(deps),
    getProductLotsTool(deps),
    searchProductsTool(deps),
    getPendingTemporalProductsTool(deps),
  ];
}
