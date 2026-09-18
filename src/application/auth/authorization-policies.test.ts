import { describe, expect, it } from "vitest";
import { canModifyRecord, canViewRecord } from "./authorization-policies";

describe("canModifyRecord", () => {
  it("allow admin to modify any record", () => {
    expect(canModifyRecord("creator", "someone", "admin")).toBe(true);
  });

  it("allow the creator to modify their own record", () => {
    expect(canModifyRecord("creator", "creator", "user")).toBe(true);
  });

  it("deny modifying other users' records", () => {
    expect(canModifyRecord("other", "me", "user")).toBe(false);
  });

  it("deny modifying records without a creator", () => {
    expect(canModifyRecord(null, "me", "user")).toBe(false);
  });

  it("deny anonymous users", () => {
    expect(canModifyRecord(null, null, "user")).toBe(false);
  });
});

describe("canViewRecord", () => {
  const adminIds = ["admin-x", "admin-y"];

  it("allow admin to view any record", () => {
    expect(canViewRecord("anyone", { id: "a", roleCode: "admin" }, adminIds)).toBe(true);
  });

  it("allow viewing records without a creator", () => {
    expect(canViewRecord(null, { id: null, roleCode: "user" }, adminIds)).toBe(true);
  });

  it("allow a user to view their own records", () => {
    expect(canViewRecord("me", { id: "me", roleCode: "user" }, adminIds)).toBe(true);
  });

  it("allow viewing records created by a known admin", () => {
    expect(canViewRecord("admin-x", { id: "me", roleCode: "user" }, adminIds)).toBe(true);
  });

  it("deny viewing other users' records", () => {
    expect(canViewRecord("other", { id: "me", roleCode: "user" }, adminIds)).toBe(false);
  });

  it("deny viewing records created by unknown admins", () => {
    expect(canViewRecord("admin-z", { id: "me", roleCode: "user" }, adminIds)).toBe(false);
  });
});