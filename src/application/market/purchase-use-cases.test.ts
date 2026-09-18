import { describe, expect, it } from "vitest";
import { PurchaseUseCases } from "./purchase-use-cases";
import { NotFoundError, ValidationError } from "@/shared/errors";
import type { Purchase } from "@/domain/market/entities/purchase";
import type { InventoryMovement } from "@/domain/market/entities/inventory-movement";
import type { CreatePurchaseMovementItem } from "@/domain/market/repositories/inventory-repository";
import type { IPurchaseRepository } from "@/domain/market/repositories/purchase-repository";
import type { IInventoryRepository } from "@/domain/market/repositories/inventory-repository";
import type { IMovementTypeRepository } from "@/domain/market/repositories/movement-type-repository";

const SAMPLE_PURCHASE: Purchase = {
  id: "pu1",
  storeId: null,
  purchaseDate: "2026-09-17",
  paymentMethodId: null,
  notes: null,
  createdBy: null,
  createdAt: new Date(),
};

interface Repos {
  readonly purchaseRepo: IPurchaseRepository;
  readonly inventoryRepo: IInventoryRepository;
  readonly movementTypeRepo: IMovementTypeRepository;
  readonly createdPurchaseMovements: CreatePurchaseMovementItem[];
}

function buildRepos(options: { readonly purchaseTypeId?: string | null } = {}): Repos {
  const createdPurchaseMovements: CreatePurchaseMovementItem[] = [];
  const inventoryRepo: IInventoryRepository = {
    findAllMovements: async () => [],
    findMovementsByProductId: async () => [],
    findMovementsByPurchaseId: async () => [],
    getStock: async () => [],
    getStockLots: async () => [],
    findAdjustableProducts: async () => [],
    createMovement: async () => ({} as InventoryMovement),
    createBatchMovements: async () => [],
    createPurchaseMovements: async (_purchaseId, items) => {
      createdPurchaseMovements.push(...items);
      return [];
    },
    findPendingTemporalProducts: async () => [],
    completeTemporalMovements: async () => 0,
  };
  const movementTypeRepo: IMovementTypeRepository = {
    findAll: async () => [],
    findByCode: async (code) =>
      options.purchaseTypeId === undefined
        ? { id: "mt1", code, name: code, stockMultiplier: 1, createdAt: new Date() }
        : options.purchaseTypeId === null
          ? null
          : { id: "mt1", code, name: code, stockMultiplier: 1, createdAt: new Date() },
  };
  const purchaseRepo: IPurchaseRepository = {
    findAll: async () => [],
    findAllWithDetails: async () => [],
    findById: async () => null,
    findMovementsByPurchaseId: async () => [],
    findMovementsByPurchaseIds: async () => [],
    findMovementsWithProductByPurchaseIds: async () => [],
    findManyWithVisibility: async () => [],
    findManyWithDetailsWithVisibility: async () => [],
    create: async () => SAMPLE_PURCHASE,
    update: async () => null,
    remove: async () => true,
  };
  return { purchaseRepo, inventoryRepo, movementTypeRepo, createdPurchaseMovements };
}

describe("PurchaseUseCases.create", () => {
  it("reject a purchase without a date", async () => {
    const repos = buildRepos();
    const useCases = new PurchaseUseCases(repos.purchaseRepo, repos.inventoryRepo, repos.movementTypeRepo);
    await expect(useCases.create({ purchaseDate: "" })).rejects.toThrow(ValidationError);
  });

  it("create a valid purchase without items", async () => {
    const repos = buildRepos();
    const useCases = new PurchaseUseCases(repos.purchaseRepo, repos.inventoryRepo, repos.movementTypeRepo);
    await expect(useCases.create({ purchaseDate: "2026-09-17" })).resolves.toMatchObject({ id: "pu1" });
  });

  it("reject an item without product, name or barcode", async () => {
    const repos = buildRepos();
    const useCases = new PurchaseUseCases(repos.purchaseRepo, repos.inventoryRepo, repos.movementTypeRepo);
    const purchase = { purchaseDate: "2026-09-17" };
    const items = [{ productId: null, quantity: 2, unitPrice: 10 }];
    await expect(useCases.create(purchase, items)).rejects.toThrow(ValidationError);
  });

  it("reject when the PURCHASE movement type is missing", async () => {
    const repos = buildRepos({ purchaseTypeId: null });
    const useCases = new PurchaseUseCases(repos.purchaseRepo, repos.inventoryRepo, repos.movementTypeRepo);
    const purchase = { purchaseDate: "2026-09-17" };
    const items = [{ productId: "p1", quantity: 2, unitPrice: 10 }];
    await expect(useCases.create(purchase, items)).rejects.toThrow(NotFoundError);
  });

  it("create purchase movements for each item", async () => {
    const repos = buildRepos();
    const useCases = new PurchaseUseCases(repos.purchaseRepo, repos.inventoryRepo, repos.movementTypeRepo);
    await useCases.create(
      { purchaseDate: "2026-09-17", createdBy: "u1" },
      [{ productId: "p1", quantity: 2, unitPrice: 10, lot: "L1" }],
    );
    expect(repos.createdPurchaseMovements).toHaveLength(1);
    expect(repos.createdPurchaseMovements[0]).toMatchObject({
      productId: "p1",
      movementTypeId: "mt1",
      quantity: 2,
      unitPrice: 10,
      lot: "L1",
      createdBy: "u1",
    });
  });
});