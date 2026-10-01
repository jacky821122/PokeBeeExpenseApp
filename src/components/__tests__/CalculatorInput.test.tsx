// @vitest-environment jsdom
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import CalculatorInput from "../CalculatorInput";

function ControlledCalculator() {
  const [value, setValue] = useState("");
  return <CalculatorInput value={value} onChange={setValue} inputClass="" />;
}

let container: HTMLDivElement;
let root: Root;
let input: HTMLInputElement;

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("matchMedia", vi.fn(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })));
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() => root.render(<ControlledCalculator />));
  input = container.querySelector("input")!;
  act(() => input.focus());
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function tap(key: string, movement = 0) {
  const button = Array.from(container.querySelectorAll("button"))
    .find((element) => element.textContent?.trim() === key);
  if (!button) throw new Error(`Missing calculator key: ${key}`);
  const event = { bubbles: true, cancelable: true, pointerType: "touch", clientX: 10, clientY: 10 };
  act(() => button.dispatchEvent(new PointerEvent("pointerdown", event)));
  act(() => button.dispatchEvent(new PointerEvent("pointerup", { ...event, clientX: 10 + movement })));
}

it("appends 8 then 0 even when the mobile input blurs after the first tap", () => {
  expect(input.readOnly).toBe(true);
  tap("8");
  expect(input.value).toBe("8");
  act(() => input.blur());
  act(() => vi.runAllTimers());
  tap("0");
  expect(input.value).toBe("80");
  act(() => input.focus());
  tap("2");
  expect(input.value).toBe("802");
});

it.each([
  ["4", "42"],
  [".", ".2"],
  ["+", "80+2"],
])("keeps equals behavior for %s without rearming replacement on blur", (key, expected) => {
  tap("8");
  tap("0");
  tap("=");
  expect(input.value).toBe("80");
  act(() => input.focus());
  tap(key);
  act(() => input.blur());
  tap("2");
  expect(input.value).toBe(expected);
});

it("preserves desktop Enter-to-equals and replaces only the first new digit", () => {
  vi.mocked(window.matchMedia).mockReturnValue({ ...window.matchMedia(""), matches: true });
  act(() => root.render(<ControlledCalculator />));
  expect(input.readOnly).toBe(false);
  tap("8");
  tap("0");
  act(() => input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })));
  expect(input.value).toBe("80");
  act(() => input.focus());
  act(() => input.dispatchEvent(new KeyboardEvent("keydown", { key: "4", bubbles: true })));
  expect(input.value).toBe("4");
  act(() => input.blur());
  tap("2");
  expect(input.value).toBe("42");
});

it("preserves the last valid preview and ignores touches that scroll", () => {
  tap("8");
  tap("+");
  expect(container.querySelector("p")?.textContent?.trim()).toBe("= 8");
  tap("2", 20);
  expect(input.value).toBe("8+");
  tap("2");
  expect(container.querySelector("p")?.textContent?.trim()).toBe("= 10");
  tap("C");
  expect(input.value).toBe("");
  expect(container.querySelector("p")?.textContent?.trim()).toBe("=");
});
