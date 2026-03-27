"use client";

import { useEffect, useRef, useState } from "react";
import { evaluateExpression } from "@/lib/evaluate";

interface CalculatorInputProps {
  value: string;
  onChange: (value: string) => void;
  inputClass: string;
  placeholder?: string;
  required?: boolean;
}

export default function CalculatorInput({
  value,
  onChange,
  inputClass,
  placeholder,
  required,
}: CalculatorInputProps) {
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [replaceOnNextInput, setReplaceOnNextInput] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingReplaceOnBlurRef = useRef<boolean | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastValidResultRef = useRef<number | null>(null);

  const computedValue = evaluateExpression(value);
  if (value === "") {
    lastValidResultRef.current = null;
  } else if (computedValue !== null) {
    lastValidResultRef.current = computedValue;
  }

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handle = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    setIsDesktop(mq.matches);
    mq.addEventListener("change", handle);
    return () => mq.removeEventListener("change", handle);
  }, []);

  function applyCalculatedTotal() {
    const valid = computedValue !== null && computedValue >= 0;
    if (valid) onChange(String(computedValue));
    pendingReplaceOnBlurRef.current = valid;
    setReplaceOnNextInput(valid);
    setCalculatorOpen(false);
    inputRef.current?.blur();
  }

  function appendKey(key: string) {
    if (replaceOnNextInput && /^[0-9.]$/.test(key)) {
      onChange(key);
    } else {
      onChange(`${value}${key}`);
    }
    setReplaceOnNextInput(false);
  }

  function handleCalcKey(key: string) {
    if (key === "C") {
      onChange("");
      setReplaceOnNextInput(false);
      return;
    }
    if (key === "←") {
      onChange(value.slice(0, -1));
      setReplaceOnNextInput(false);
      return;
    }
    if (key === "=") {
      applyCalculatedTotal();
      return;
    }
    appendKey(key);
  }

  return (
    <div ref={areaRef}>
      <div className="mb-1 flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">總價</label>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            if (calculatorOpen) {
              setCalculatorOpen(false);
              inputRef.current?.blur();
            } else {
              setCalculatorOpen(true);
              inputRef.current?.focus();
            }
          }}
          className="rounded-md border border-amber-200 px-2 py-1 text-xs text-gray-600 active:bg-amber-50"
          aria-label={calculatorOpen ? "收合計算機" : "展開計算機"}
        >
          {calculatorOpen ? "▾ 計算機" : "▸ 計算機"}
        </button>
      </div>
      <input
        type="text"
        ref={inputRef}
        inputMode={isDesktop ? "decimal" : "none"}
        readOnly={!isDesktop}
        value={value}
        onChange={(e) => {
          if (isDesktop) onChange(e.target.value);
          setReplaceOnNextInput(false);
        }}
        onFocus={() => setCalculatorOpen(true)}
        onKeyDown={(e) => {
          if (isDesktop && replaceOnNextInput && /^[0-9.]$/.test(e.key)) {
            e.preventDefault();
            onChange(e.key);
            setReplaceOnNextInput(false);
            return;
          }
          if (isDesktop && e.key === "Enter") {
            e.preventDefault();
            applyCalculatedTotal();
          }
        }}
        onBlur={() => {
          const pending = pendingReplaceOnBlurRef.current;
          pendingReplaceOnBlurRef.current = null;
          setReplaceOnNextInput(pending ?? (computedValue !== null && computedValue >= 0));
          setTimeout(() => {
            if (!isDesktop) return;
            const active = document.activeElement;
            if (areaRef.current && active && !areaRef.current.contains(active)) {
              setCalculatorOpen(false);
            }
          }, 0);
        }}
        placeholder={placeholder}
        className={inputClass}
        required={required}
      />
      {calculatorOpen && (
        <>
          <p className="mt-1 h-5 text-right text-sm text-gray-500">
            = {lastValidResultRef.current !== null ? lastValidResultRef.current : ""}
          </p>
          <div
            className="mt-1 gap-1.5"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gridTemplateRows: "repeat(5, auto)",
              gridTemplateAreas: `
                "back clear div mul"
                "n7   n8    n9  minus"
                "n4   n5    n6  plus"
                "n1   n2    n3  plus"
                "dot  n0    eq  eq"
              `,
            }}
          >
            {[
              { key: "←", area: "back" },
              { key: "C", area: "clear" },
              { key: "/", area: "div" },
              { key: "*", area: "mul" },
              { key: "7", area: "n7" },
              { key: "8", area: "n8" },
              { key: "9", area: "n9" },
              { key: "-", area: "minus" },
              { key: "4", area: "n4" },
              { key: "5", area: "n5" },
              { key: "6", area: "n6" },
              { key: "+", area: "plus" },
              { key: "1", area: "n1" },
              { key: "2", area: "n2" },
              { key: "3", area: "n3" },
              { key: ".", area: "dot" },
              { key: "0", area: "n0" },
              { key: "=", area: "eq" },
            ].map(({ key, area }) => (
              <button
                key={key}
                type="button"
                style={{ gridArea: area }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  pointerStartRef.current = { x: e.clientX, y: e.clientY };
                }}
                onPointerUp={(e) => {
                  const start = pointerStartRef.current;
                  pointerStartRef.current = null;
                  if (!start) return;
                  if (Math.abs(e.clientX - start.x) + Math.abs(e.clientY - start.y) > 10) return;
                  handleCalcKey(key);
                }}
                className={`rounded-lg border py-2 text-sm active:bg-amber-50 ${
                  key === "="
                    ? "border-amber-400 bg-amber-100 font-semibold text-amber-800"
                    : "border-amber-200 text-gray-700"
                }`}
              >
                {key === "*" ? "×" : key === "/" ? "÷" : key}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
