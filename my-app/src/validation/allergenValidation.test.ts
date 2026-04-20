import { describe, test, expect } from "vitest";
import { normalizeAllergens } from "./allergenValidation";

describe("allergen validation", () => {
  test("前後の空白を除去できる", () => {
    expect(normalizeAllergens([" 小麦 ", "乳"])).toEqual(["小麦", "乳"]);
  });

  test("空文字を除去できる", () => {
    expect(normalizeAllergens(["", "  ", "卵"])).toEqual(["卵"]);
  });

  test("重複を除去できる", () => {
    expect(normalizeAllergens(["小麦", "小麦", "乳"])).toEqual(["小麦", "乳"]);
  });

  test("空配列は空配列のまま", () => {
    expect(normalizeAllergens([])).toEqual([]);
  });
});
