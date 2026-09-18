import { describe, expect, it } from "vitest";
import { ProductUseCases } from "./product-use-cases";
import { ValidationError } from "@/shared/errors";
import type { CreateProduct, Product } from "@/domain/market/entities/product";
import type { IProductRepository } from "@/domain/market/repositories/product-repository";

const SAMPLE_PRODUCT: Product = {
  id: "p1",
  categoryId: "cat",
  unitId: "unit",
  name: "Leche entera",
  brandId: null,
  parentProductId: null,
  presentationQuantity: null,
  stockQuantity: 1,
  minStock: 1,
  minDays: 7,
  notificate: false,
  barcode: null,
  isActive: true,
  createdBy: null,
  createdAt: new Date(),
};

function buildProductRepo(): IProductRepository {
  return {
    findAll: async () => [],
    findAllWithDetails: async () => [],
    findById: async () => null,
    searchByName: async () => [],
    findByBarcode: async () => null,
    findManyWithVisibility: async () => [],
    findManyWithDetailsWithVisibility: async () => [],
    create: async () => SAMPLE_PRODUCT,
    update: async () => null,
    remove: async () => true,
  };
}

const VALID: CreateProduct = {
  name: "Leche entera",
  categoryId: "cat",
  unitId: "unit",
};

describe("ProductUseCases.create", () => {
  it("create a valid product", async () => {
    const useCases = new ProductUseCases(buildProductRepo());
    await expect(useCases.create(VALID)).resolves.toMatchObject({ name: "Leche entera" });
  });

  it("reject an empty product name", async () => {
    const useCases = new ProductUseCases(buildProductRepo());
    await expect(useCases.create({ ...VALID, name: "   " })).rejects.toThrow(ValidationError);
  });

  it("reject a missing category", async () => {
    const useCases = new ProductUseCases(buildProductRepo());
    await expect(useCases.create({ ...VALID, categoryId: "" })).rejects.toThrow(ValidationError);
  });

  it("reject a missing unit", async () => {
    const useCases = new ProductUseCases(buildProductRepo());
    await expect(useCases.create({ ...VALID, unitId: "" })).rejects.toThrow(ValidationError);
  });

  it("reject a stock quantity below 1", async () => {
    const useCases = new ProductUseCases(buildProductRepo());
    await expect(useCases.create({ ...VALID, stockQuantity: 0 })).rejects.toThrow(ValidationError);
  });

  it("reject a min stock below 1", async () => {
    const useCases = new ProductUseCases(buildProductRepo());
    await expect(useCases.create({ ...VALID, minStock: 0 })).rejects.toThrow(ValidationError);
  });

  it("reject a min days below 1", async () => {
    const useCases = new ProductUseCases(buildProductRepo());
    await expect(useCases.create({ ...VALID, minDays: 0 })).rejects.toThrow(ValidationError);
  });
});

describe("ProductUseCases.update", () => {
  it("return null when the product does not exist", async () => {
    const useCases = new ProductUseCases(buildProductRepo());
    await expect(useCases.update("missing", { name: "Otro" })).resolves.toBeNull();
  });
});