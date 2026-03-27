"use client";

import { useEffect, useRef, useState } from "react";
import { CATEGORIES, UNITS, ITEMS_BY_CATEGORY } from "@/lib/constants";
import { getCachedValues, addCachedValue } from "@/lib/autocomplete";
import type { Expense } from "@/types/expense";

function getTodayString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

interface ComboboxProps {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  placeholder?: string;
  inputClass: string;
}

function Combobox({ value, onChange, options, placeholder, inputClass }: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(value.toLowerCase())
  );
  const showDropdown = open && filtered.length > 0;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className={inputClass}
        autoComplete="off"
      />
      {showDropdown && (
        <ul className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-md">
          {filtered.map((o) => (
            <li
              key={o}
              onMouseDown={(e) => {
                e.preventDefault(); // prevent input blur before click registers
                onChange(o);
                setOpen(false);
              }}
              className="cursor-pointer px-4 py-3 text-base hover:bg-amber-50 active:bg-amber-100"
            >
              {o}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface ExpenseFormProps {
  onSuccess: (expense: Expense) => void;
}

export default function ExpenseForm({ onSuccess }: ExpenseFormProps) {
  const [date, setDate] = useState(getTodayString());
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [item, setItem] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState<string>(UNITS[0]);
  const [totalPrice, setTotalPrice] = useState("");
  const [supplier, setSupplier] = useState("");
  const [purchaser, setPurchaser] = useState("");
  const [note, setNote] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [supplierOptions, setSupplierOptions] = useState<string[]>([]);
  const [purchaserOptions, setPurchaserOptions] = useState<string[]>([]);
  const [itemsByCategory, setItemsByCategory] = useState<Record<string, readonly string[]>>(ITEMS_BY_CATEGORY);

  useEffect(() => {
    setSupplierOptions(getCachedValues("supplier"));
    // Seed purchaser options from localStorage immediately, then merge with server data
    setPurchaserOptions(getCachedValues("purchaser"));
    fetch("/api/purchasers")
      .then((r) => r.ok ? r.json() : [])
      .then((serverNames: string[]) => {
        setPurchaserOptions((local) => {
          const merged = [...serverNames];
          for (const name of local) {
            if (!merged.includes(name)) merged.push(name);
          }
          return merged;
        });
      })
      .catch(() => {}); // Keep localStorage values on failure

    fetch("/api/items")
      .then((r) => r.ok ? r.json() : null)
      .then((data: Record<string, string[]> | null) => {
        if (data && Object.keys(data).length > 0) {
          setItemsByCategory(data);
        }
      })
      .catch(() => {}); // Keep constants fallback on failure
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setToast(null);

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          category,
          item: item.trim(),
          quantity: Number(quantity),
          unit,
          total_price: Number(totalPrice),
          supplier: supplier.trim(),
          purchaser: purchaser.trim(),
          note: note.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "儲存失敗");
      }

      const expense = await res.json();

      // Save supplier/purchaser to autocomplete cache
      if (supplier.trim()) {
        addCachedValue("supplier", supplier.trim());
        setSupplierOptions(getCachedValues("supplier"));
      }
      if (purchaser.trim()) {
        addCachedValue("purchaser", purchaser.trim());
        setPurchaserOptions((prev) => {
          const updated = [purchaser.trim(), ...prev.filter((n) => n !== purchaser.trim())];
          return updated;
        });
      }

      // Reset form but keep category, purchaser, date
      setItem("");
      setQuantity("1");
      setUnit(UNITS[0]);
      setTotalPrice("");
      setSupplier("");
      setNote("");

      setToast("已儲存");
      setTimeout(() => setToast(null), 2000);
      onSuccess(expense);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "儲存失敗");
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "min-w-0 w-full rounded-xl border border-amber-200 bg-amber-50/30 px-4 py-3 text-base focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Date */}
      <div>
        <label className={labelClass}>日期</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={inputClass}
          required
        />
      </div>

      {/* Category */}
      <div>
        <label className={labelClass}>類別</label>
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setItem(""); }}
          className={inputClass}
          required
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Item — combobox with fixed preset options */}
      <div>
        <label className={labelClass}>品項</label>
        <Combobox
          value={item}
          onChange={setItem}
          options={itemsByCategory[category] ?? []}
          placeholder="輸入或選取品項"
          inputClass={inputClass}
        />
      </div>

      {/* Quantity + Unit (side by side) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>數量</label>
          <input
            type="number"
            inputMode="decimal"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="0.01"
            step="any"
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className={labelClass}>單位</label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className={inputClass}
            required
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quantity quick buttons */}
      <div className="grid grid-cols-6 gap-1.5">
        {[
          { label: "+1", action: () => setQuantity((q) => String(Math.max(0, Number(q) + 1))) },
          { label: "-1", action: () => setQuantity((q) => String(Math.max(0, Number(q) - 1))) },
          { label: "+5", action: () => setQuantity((q) => String(Math.max(0, Number(q) + 5))) },
          { label: "-5", action: () => setQuantity((q) => String(Math.max(0, Number(q) - 5))) },
          { label: "5",  action: () => setQuantity("5") },
          { label: "10", action: () => setQuantity("10") },
        ].map(({ label, action }) => (
          <button
            key={label}
            type="button"
            onClick={action}
            className="rounded-lg border border-amber-200 py-2 text-sm text-gray-600 active:bg-amber-50"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Total Price */}
      <div>
        <label className={labelClass}>總價</label>
        <input
          type="number"
          inputMode="decimal"
          value={totalPrice}
          onChange={(e) => setTotalPrice(e.target.value)}
          placeholder="0"
          min="0"
          step="any"
          className={inputClass}
          required
        />
      </div>

      {/* Optional fields */}
      <div>
        <label className={labelClass}>
          來源 <span className="text-gray-400">(選填)</span>
        </label>
        <Combobox
          value={supplier}
          onChange={setSupplier}
          options={supplierOptions}
          placeholder="例：全聯、Costco"
          inputClass={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>
          購買人 <span className="text-gray-400">(選填)</span>
        </label>
        <Combobox
          value={purchaser}
          onChange={setPurchaser}
          options={purchaserOptions}
          placeholder="例：小明"
          inputClass={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>
          備註 <span className="text-gray-400">(選填)</span>
        </label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-amber-500 py-4 text-lg font-semibold text-white active:bg-amber-600 disabled:bg-gray-400"
      >
        {submitting ? "儲存中..." : "送出"}
      </button>

      {/* Toast */}
      {toast && (
        <div
          className={`rounded-lg px-4 py-3 text-center text-sm font-medium ${
            toast === "已儲存"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {toast}
        </div>
      )}
    </form>
  );
}
