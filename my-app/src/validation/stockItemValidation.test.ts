import { validateQuantity, validateUnitPrice, validateExpiresAt } from "./stockItemValidation";
import { describe, test, expect } from "vitest";

describe("stockItem validation", () => {
  // quantity
  test("quantity が 1 以上ならOK", () => {
    expect(validateQuantity(1)).toBe(true);
  });

  test("quantity が 0 ならNG", () => {
    expect(validateQuantity(0)).toBe(false);
  });

  // unitPrice
  test("unitPrice が 0 以上ならOK", () => {
    expect(validateUnitPrice(0)).toBe(true);
  });

  test("unitPrice が負ならNG", () => {
    expect(validateUnitPrice(-1)).toBe(false);
  });

  // expiresAt
  test("未来日ならOK", () => {
    expect(validateExpiresAt("2099-01-01")).toBe(true);
  });

  test("過去日ならNG", () => {
    expect(validateExpiresAt("2020-01-01")).toBe(false);
  });

  test("今日の日付はNG", () => {
    const today = new Date().toISOString().split("T")[0];
    expect(validateExpiresAt(today)).toBe(false);
  });
});
