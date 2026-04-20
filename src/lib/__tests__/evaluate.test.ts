import { describe, it, expect } from "vitest";
import { evaluateExpression } from "../evaluate";

describe("evaluateExpression", () => {
  // Basic arithmetic
  it("addition", () => expect(evaluateExpression("1+2")).toBe(3));
  it("subtraction", () => expect(evaluateExpression("10-3")).toBe(7));
  it("multiplication", () => expect(evaluateExpression("4*5")).toBe(20));
  it("division", () => expect(evaluateExpression("20/4")).toBe(5));

  // Operator precedence
  it("mul before add", () => expect(evaluateExpression("2+3*4")).toBe(14));
  it("div before sub", () => expect(evaluateExpression("10-6/3")).toBe(8));

  // Parentheses
  it("parentheses override precedence", () => expect(evaluateExpression("(2+3)*4")).toBe(20));
  it("nested parentheses", () => expect(evaluateExpression("((1+2)*3)")).toBe(9));

  // Unary minus
  it("leading negative", () => expect(evaluateExpression("-5+3")).toBe(-2));
  it("negative after operator", () => expect(evaluateExpression("3*-2")).toBe(-6));
  it("negative in parentheses", () => expect(evaluateExpression("(-3)+5")).toBe(2));

  // Decimals
  it("decimal numbers", () => expect(evaluateExpression("1.5+2.5")).toBe(4));
  it("decimal multiplication", () => expect(evaluateExpression("0.1*10")).toBeCloseTo(1));

  // Complex expressions
  it("multi-operator", () => expect(evaluateExpression("10+20*3-5")).toBe(65));
  it("real-world price calc", () => expect(evaluateExpression("60+35*2")).toBe(130));

  // Whitespace
  it("ignores spaces", () => expect(evaluateExpression(" 1 + 2 ")).toBe(3));

  // Edge cases returning null
  it("empty string", () => expect(evaluateExpression("")).toBeNull());
  it("only spaces", () => expect(evaluateExpression("   ")).toBeNull());
  it("division by zero", () => expect(evaluateExpression("1/0")).toBeNull());
  it("invalid characters", () => expect(evaluateExpression("abc")).toBeNull());
  it("unmatched open paren", () => expect(evaluateExpression("(1+2")).toBeNull());
  it("unmatched close paren", () => expect(evaluateExpression("1+2)")).toBeNull());
  it("trailing operator", () => expect(evaluateExpression("1+")).toBeNull());
  it("double operator", () => expect(evaluateExpression("1++2")).toBeNull());
});
