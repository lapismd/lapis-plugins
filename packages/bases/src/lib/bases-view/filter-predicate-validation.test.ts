import { describe, expect, it } from "vitest";
import { resolveFilterDraft, validateFilterPredicate } from "./filter-parser";

describe("Bases dialect filter drafts", () => {
  it.each([
    "[1,2,3].filter(value > 1).length > 0",
    "[].isEmpty()",
    'date("2025-01-02").time() == "00:00:00"',
    'formula["a"].isTruthy()',
  ])(
    "accepts %s without requiring evaluated formula definitions",
    (expression) => {
      const result = validateFilterPredicate(expression);
      expect(result.valid).toBe(true);
      expect(resolveFilterDraft("price > 0", expression).applied).toBe(
        expression
      );
    }
  );
  it.each([
    "price > 0 ORDER BY price",
    "price === 1",
    "price >",
    "[1,2].filter(",
  ])("rejects %s and retains the applied draft", (expression) => {
    expect(validateFilterPredicate(expression).valid).toBe(false);
    expect(resolveFilterDraft("price > 0", expression).applied).toBe(
      "price > 0"
    );
  });
});
